const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getChangeRequests, createChangeRequest, updateChangeRequest } = require('../controllers/changeRequestController');

router.get('/', protect, getChangeRequests);
router.post('/', protect, createChangeRequest);
router.put('/:id', protect, authorize('admin', 'manager', 'agent'), updateChangeRequest);
module.exports = router;