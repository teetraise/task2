const User = require('../models/User');
const logger = require('../utils/logger');

// @desc    Get all users (with pagination and filters)
// @route   GET /v1/users
// @access  Private (Admin only)
exports.getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    if (req.query.role) {
      filter.role = req.query.role;
    }
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Get users with pagination
    const users = await User.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error({ err: error, requestId: req.id }, 'Get users error');
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error fetching users'
      }
    });
  }
};

// @desc    Get single user by ID
// @route   GET /v1/users/:id
// @access  Private (own profile or admin)
exports.getUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Check if user can access this profile
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied'
        }
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error({ err: error, requestId: req.id }, 'Get user error');
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error fetching user'
      }
    });
  }
};

// @desc    Delete user
// @route   DELETE /v1/users/:id
// @access  Private (Admin only)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    logger.info({
      requestId: req.id,
      userId: user._id,
      deletedBy: req.user.id
    }, 'User deleted');

    res.status(200).json({
      success: true,
      data: {
        message: 'User deleted successfully'
      }
    });
  } catch (error) {
    logger.error({ err: error, requestId: req.id }, 'Delete user error');
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error deleting user'
      }
    });
  }
};
