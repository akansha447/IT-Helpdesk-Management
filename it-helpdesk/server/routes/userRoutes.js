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

router.get('/agents', protect, authorize('admin', 'agent'), getAgents);
router.get('/', protect, authorize('admin'), getUsers);
router.post('/', protect, authorize('admin'), createUser);
router.put('/:id', protect, authorize('admin'), updateUser);
router.delete('/:id', protect, authorize('admin'), deleteUser);

module.exports = router;
