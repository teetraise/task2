const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
  deleteOrder
} = require('../controllers/orderController');
const { extractUser } = require('../middleware/auth');
const { isManagerOrAdmin } = require('../middleware/checkRole');
const { validateCreateOrder, validateUpdateStatus } = require('../middleware/validation');

router.use(extractUser);

router.post('/', validateCreateOrder, createOrder);
router.get('/', getOrders);
router.get('/:id', getOrder);
router.put('/:id/status', isManagerOrAdmin, validateUpdateStatus, updateOrderStatus);
router.delete('/:id', deleteOrder);

module.exports = router;
