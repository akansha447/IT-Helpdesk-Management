const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getCabAuthorizers, createCabAuthorizer, updateCabAuthorizer, toggleCabAuthorizer } = require('../controllers/cabAuthorizerController');

router.get('/', protect, getCabAuthorizers);
router.post('/', protect, authorize('admin'), createCabAuthorizer);
router.put('/:id', protect, authorize('admin'), updateCabAuthorizer);
router.put('/:id/toggle', protect, authorize('admin'), toggleCabAuthorizer);

module.exports = router;