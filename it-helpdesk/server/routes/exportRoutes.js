const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { exportTickets, exportChangeRequests } = require('../controllers/exportController');

router.get('/tickets', protect, exportTickets);
router.get('/change-requests', protect, exportChangeRequests);

module.exports = router;
