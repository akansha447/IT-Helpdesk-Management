const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getUsers,
  getAgents,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/userController');

router.get('/agents', protect, authorize('admin', 'manager', 'agent'), getAgents);
router.get('/', protect, authorize('admin', 'manager'), getUsers);
router.post('/', protect, authorize('admin'), createUser);
router.put('/:id', protect, authorize('admin', 'manager'), updateUser);
router.delete('/:id', protect, authorize('admin', 'manager'), deleteUser);

module.exports = router;
