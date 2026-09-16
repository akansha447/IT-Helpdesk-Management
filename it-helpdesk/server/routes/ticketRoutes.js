const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  deleteTicket,
} = require('../controllers/ticketController');
const commentRoutes = require('./commentRoutes');
const { authorize } = require('../middleware/auth');

router.use('/:ticketId/comments', commentRoutes);

router.route('/').get(protect, getTickets).post(protect, createTicket);
router
  .route('/:id')
  .get(protect, getTicketById)
  .put(protect, updateTicket)
  .delete(protect, authorize('admin'), deleteTicket);

module.exports = router;
