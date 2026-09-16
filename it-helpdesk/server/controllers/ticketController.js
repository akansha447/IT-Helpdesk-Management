const Ticket = require('../models/Ticket');
const Category = require('../models/Category');
const Comment = require('../models/Comment');

const POPULATE_FIELDS = [
  { path: 'category', select: 'name baseSlaHours' },
  { path: 'createdBy', select: 'name email' },
  { path: 'assignedTo', select: 'name email' },
];

// @desc  Create a ticket
// @route POST /api/tickets
// @access employee, agent, admin
const createTicket = async (req, res, next) => {
  try {
    const { title, description, category, priority } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ message: 'Title, description and category are required' });
    }

    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    const dueAt = Ticket.computeDueDate(categoryDoc.baseSlaHours, priority || 'Medium');

    const ticket = await Ticket.create({
      title,
      description,
      category,
      priority: priority || 'Medium',
      createdBy: req.user._id,
      dueAt,
      activity: [{ message: `Ticket created by ${req.user.name}`, actor: req.user._id }],
    });

    await ticket.populate(POPULATE_FIELDS);
    res.status(201).json(ticket);
  } catch (error) {
    next(error);
  }
};

// @desc  List tickets (scoped by role, with optional filters)
// @route GET /api/tickets?status=&priority=&category=&assignedTo=&overdue=true&search=
// @access employee (own only), agent/admin (all)
const getTickets = async (req, res, next) => {
  try {
    const { status, priority, category, assignedTo, overdue, search } = req.query;
    const filter = {};

    if (req.user.role === 'employee') {
      filter.createdBy = req.user._id;
    }

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;
    if (assignedTo) filter.assignedTo = assignedTo === 'unassigned' ? null : assignedTo;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { ticketNumber: { $regex: search, $options: 'i' } },
      ];
    }

    let tickets = await Ticket.find(filter).populate(POPULATE_FIELDS).sort({ createdAt: -1 });

    if (overdue === 'true') {
      tickets = tickets.filter((t) => t.isOverdue);
    }

    res.json(tickets);
  } catch (error) {
    next(error);
  }
};

// @desc  Get single ticket by id
// @route GET /api/tickets/:id
const getTicketById = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id).populate(POPULATE_FIELDS);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    if (
      req.user.role === 'employee' &&
      String(ticket.createdBy._id) !== String(req.user._id)
    ) {
      return res.status(403).json({ message: 'Forbidden: not your ticket' });
    }

    res.json(ticket);
  } catch (error) {
    next(error);
  }
};

// @desc  Update ticket (status, priority, assignment, category)
// @route PUT /api/tickets/:id
// @access agent, admin (employees may only edit title/description of their own Open tickets)
const updateTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const { title, description, category, priority, status, assignedTo } = req.body;
    const logs = [];

    if (req.user.role === 'employee') {
      if (String(ticket.createdBy) !== String(req.user._id)) {
        return res.status(403).json({ message: 'Forbidden: not your ticket' });
      }
      if (ticket.status !== 'Open') {
        return res.status(400).json({ message: 'You can only edit tickets that are still Open' });
      }
      if (title !== undefined) ticket.title = title;
      if (description !== undefined) ticket.description = description;
      logs.push(`Ticket edited by ${req.user.name}`);
    } else {
      // agent / admin
      if (priority !== undefined && priority !== ticket.priority) {
        ticket.priority = priority;
        const categoryDoc = await Category.findById(ticket.category);
        ticket.dueAt = Ticket.computeDueDate(categoryDoc.baseSlaHours, priority, ticket.createdAt);
        logs.push(`Priority changed to ${priority} by ${req.user.name}`);
      }
      if (category !== undefined && String(category) !== String(ticket.category)) {
        ticket.category = category;
        logs.push(`Category changed by ${req.user.name}`);
      }
      if (assignedTo !== undefined) {
        ticket.assignedTo = assignedTo || null;
        logs.push(
          assignedTo
            ? `Ticket assigned by ${req.user.name}`
            : `Ticket unassigned by ${req.user.name}`
        );
      }
      if (status !== undefined && status !== ticket.status) {
        ticket.status = status;
        if (status === 'Resolved') ticket.resolvedAt = new Date();
        if (status === 'Closed') ticket.closedAt = new Date();
        logs.push(`Status changed to "${status}" by ${req.user.name}`);
      }
      if (title !== undefined) ticket.title = title;
      if (description !== undefined) ticket.description = description;
    }

    logs.forEach((message) => ticket.activity.push({ message, actor: req.user._id }));

    await ticket.save();
    await ticket.populate(POPULATE_FIELDS);
    res.json(ticket);
  } catch (error) {
    next(error);
  }
};

// @desc  Delete a ticket
// @route DELETE /api/tickets/:id
// @access admin
const deleteTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    await Comment.deleteMany({ ticket: ticket._id });
    await ticket.deleteOne();
    res.json({ message: 'Ticket removed' });
  } catch (error) {
    next(error);
  }
};

module.exports = { createTicket, getTickets, getTicketById, updateTicket, deleteTicket };
