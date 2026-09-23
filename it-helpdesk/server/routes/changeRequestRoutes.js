const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getChangeRequests, createChangeRequest, updateChangeRequest, decideChangeRequest, updateImplementation, completePostImplementation } = require('../controllers/changeRequestController');

router.get('/', protect, getChangeRequests);
router.post('/', protect, createChangeRequest);
router.put('/:id', protect, authorize('admin', 'manager', 'agent', 'employee'), updateChangeRequest);
router.put('/:id/decision', protect, authorize('admin', 'manager'), decideChangeRequest);
router.put('/:id/implementation', protect, authorize('admin', 'manager', 'agent'), updateImplementation);
router.put('/:id/post-implementation', protect, authorize('admin', 'manager'), completePostImplementation);
module.exports = router;