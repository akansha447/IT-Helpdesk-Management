const Comment = require('../models/Comment');
const Ticket = require('../models/Ticket');

// @desc  List comments for a ticket (internal notes hidden from employees)
// @route GET /api/tickets/:ticketId/comments
const getComments = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.ticketId);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    if (req.user.role === 'employee' && String(ticket.createdBy) !== String(req.user._id) && String(ticket.assignedTo) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Forbidden: not your ticket' });
    }
    if (req.user.role === 'manager' && (!req.user.departmentId || (String(ticket.departmentId) !== String(req.user.departmentId) && String(ticket.assignedTo) !== String(req.user._id)))) {
      return res.status(403).json({ message: 'Managers can only access comments in their department' });
    }

    const filter = { ticket: req.params.ticketId };
    if (req.user.role === 'employee') {
      filter.isInternal = false;
    }

    const comments = await Comment.find(filter)
      .populate('author', 'name role')
      .sort({ createdAt: 1 });

    res.json(comments);
  } catch (error) {
    next(error);
  }
};

// @desc  Add a comment to a ticket
// @route POST /api/tickets/:ticketId/comments
const addComment = async (req, res, next) => {
  try {
    const { message, isInternal } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Comment message is required' });
    }

    const ticket = await Ticket.findById(req.params.ticketId);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    if (req.user.role === 'employee' && String(ticket.createdBy) !== String(req.user._id) && String(ticket.assignedTo) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Forbidden: not your ticket' });
    }
    if (req.user.role === 'manager' && (!req.user.departmentId || (String(ticket.departmentId) !== String(req.user.departmentId) && String(ticket.assignedTo) !== String(req.user._id)))) {
      return res.status(403).json({ message: 'Managers can only comment on tickets in their department' });
    }

    // Only agents/admins can post internal-only notes
    const internalFlag = req.user.role !== 'employee' && !!isInternal;

    const comment = await Comment.create({
      ticket: ticket._id,
      author: req.user._id,
      message: message.trim(),
      isInternal: internalFlag,
    });

    ticket.activity.push({
      message: `${req.user.name} added ${internalFlag ? 'an internal note' : 'a comment'}`,
      actor: req.user._id,
    });
    await ticket.save();

    await comment.populate('author', 'name role');
    res.status(201).json(comment);
  } catch (error) {
    next(error);
  }
};

module.exports = { getComments, addComment };
