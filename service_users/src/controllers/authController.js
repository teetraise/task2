const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

// @desc    Register new user
// @route   POST /v1/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { email, password, name, role, phone, company } = req.validatedData;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'User with this email already exists'
        }
      });
    }

    // Create user
    const user = await User.create({
      email,
      password,
      name,
      role: role || 'client',
      phone,
      company
    });

    // Generate token
    const token = generateToken(user._id);

    logger.info({
      requestId: req.id,
      userId: user._id,
      email: user.email
    }, 'User registered successfully');

    res.status(201).json({
      success: true,
      data: {
        user: user.toJSON(),
        token
      }
    });
  } catch (error) {
    logger.error({ err: error, requestId: req.id }, 'Registration error');
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error creating user'
      }
    });
  }
};

// @desc    Login user
// @route   POST /v1/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.validatedData;

    // Find user and include password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials'
        }
      });
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials'
        }
      });
    }

    // Generate token
    const token = generateToken(user._id);

    logger.info({
      requestId: req.id,
      userId: user._id,
      email: user.email
    }, 'User logged in successfully');

    res.status(200).json({
      success: true,
      data: {
        user: user.toJSON(),
        token
      }
    });
  } catch (error) {
    logger.error({ err: error, requestId: req.id }, 'Login error');
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error logging in'
      }
    });
  }
};

// @desc    Get current user profile
// @route   GET /v1/auth/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

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
    logger.error({ err: error, requestId: req.id }, 'Get profile error');
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error fetching profile'
      }
    });
  }
};

// @desc    Update user profile
// @route   PUT /v1/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, company } = req.validatedData;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, phone, company },
      { new: true, runValidators: true }
    );

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
      userId: user._id
    }, 'Profile updated successfully');

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error({ err: error, requestId: req.id }, 'Update profile error');
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error updating profile'
      }
    });
  }
};
