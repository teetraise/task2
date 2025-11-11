const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUser,
  deleteUser
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/checkRole');

router.get('/', protect, isAdmin, getUsers);
router.get('/:id', protect, getUser);
router.delete('/:id', protect, isAdmin, deleteUser);

module.exports = router;
