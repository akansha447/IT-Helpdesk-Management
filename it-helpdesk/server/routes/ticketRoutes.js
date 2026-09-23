const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createTicket,
  getTickets,
  getTicketById,
  downloadTicketAttachment,
  uploadTicketAttachment,
  updateTicket,
  deleteTicket,
} = require('../controllers/ticketController');
const commentRoutes = require('./commentRoutes');
const { authorize } = require('../middleware/auth');
const { uploadTicketAttachment: uploadTicketFile } = require('../middleware/upload');

router.use('/:ticketId/comments', commentRoutes);

router.route('/').get(protect, getTickets).post(protect, uploadTicketFile.single('attachment'), createTicket);
router.get('/:id/attachment', protect, downloadTicketAttachment);
router.put('/:id/attachment', protect, uploadTicketFile.single('attachment'), uploadTicketAttachment);
router
  .route('/:id')
  .get(protect, getTicketById)
  .put(protect, updateTicket)
  .delete(protect, authorize('admin'), deleteTicket);

module.exports = router;
