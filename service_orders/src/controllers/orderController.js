const Order = require('../models/Order');
const logger = require('../utils/logger');
const { canAccessOrder } = require('../middleware/checkRole');

exports.createOrder = async (req, res) => {
  try {
    const { title, description, priority, dueDate } = req.validatedData;

    const order = await Order.create({
      userId: req.user.id,
      title,
      description,
      priority: priority || 'medium',
      dueDate,
      status: 'created'
    });

    logger.info({
      requestId: req.id,
      event: 'order.created',
      orderId: order._id,
      userId: order.userId
    }, 'Order created');

    res.status(201).json({
      success: true,
      data: order
    });
  } catch (error) {
    logger.error({ err: error, requestId: req.id }, 'Create order error');
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error creating order'
      }
    });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.user.role === 'client' || req.user.role === 'engineer') {
      filter.userId = req.user.id;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.priority) {
      filter.priority = req.query.priority;
    }

    const sortField = req.query.sort || 'createdAt';
    const sortOrder = req.query.order === 'asc' ? 1 : -1;
    const sort = { [sortField]: sortOrder };

    const orders = await Order.find(filter)
      .skip(skip)
      .limit(limit)
      .sort(sort);

    const total = await Order.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error({ err: error, requestId: req.id }, 'Get orders error');
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error fetching orders'
      }
    });
  }
};

exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Order not found'
        }
      });
    }

    if (!canAccessOrder(order, req.user.id, req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied'
        }
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    logger.error({ err: error, requestId: req.id }, 'Get order error');
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error fetching order'
      }
    });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.validatedData;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Order not found'
        }
      });
    }

    const oldStatus = order.status;
    order.status = status;
    await order.save();

    logger.info({
      requestId: req.id,
      event: 'order.status_updated',
      orderId: order._id,
      oldStatus,
      newStatus: status,
      updatedBy: req.user.id
    }, 'Order status updated');

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    logger.error({ err: error, requestId: req.id }, 'Update order status error');
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error updating order status'
      }
    });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Order not found'
        }
      });
    }

    if (req.user.role !== 'admin') {
      if (order.userId !== req.user.id || order.status !== 'created') {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Can only cancel own orders in created status'
          }
        });
      }
    }

    order.status = 'cancelled';
    await order.save();

    logger.info({
      requestId: req.id,
      event: 'order.cancelled',
      orderId: order._id,
      cancelledBy: req.user.id
    }, 'Order cancelled');

    res.status(200).json({
      success: true,
      data: {
        message: 'Order cancelled successfully'
      }
    });
  } catch (error) {
    logger.error({ err: error, requestId: req.id }, 'Delete order error');
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error cancelling order'
      }
    });
  }
};
