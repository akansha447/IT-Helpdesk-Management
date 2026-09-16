const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    ticket: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true, trim: true },
    // Internal notes are visible to agents/admins only, not to the employee who raised the ticket.
    isInternal: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Comment', commentSchema);
