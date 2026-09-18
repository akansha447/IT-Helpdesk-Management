const ChangeRequest = require('../models/ChangeRequest');
const Ticket = require('../models/Ticket');

const getChangeRequests = async (req, res, next) => {
  try {
    let filter = req.user.role === 'employee' ? { createdBy: req.user._id } : {};
    if (req.user.role === 'manager') {
      if (!req.user.departmentId) return res.json([]);
      const tickets = await Ticket.find({ departmentId: req.user.departmentId }).select('_id');
      filter = { relatedTicket: { $in: tickets.map((ticket) => ticket._id) } };
    }
    const records = await ChangeRequest.find(filter)
      .populate('relatedTicket', 'ticketNumber title')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    res.json(records);
  } catch (error) { next(error); }
};

const createChangeRequest = async (req, res, next) => {
  try {
    const required = ['relatedTicket', 'changeType', 'description', 'businessJustification'];
    if (required.some((key) => !req.body[key])) return res.status(400).json({ message: 'Related ticket, change type, description and business justification are required' });
    const ticket = await Ticket.findById(req.body.relatedTicket);
    if (!ticket) return res.status(400).json({ message: 'Related ticket not found' });
    if (req.user.role === 'employee' && String(ticket.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You can only use your own tickets' });
    }
    if (req.user.role === 'manager' && String(ticket.departmentId) !== String(req.user.departmentId)) {
      return res.status(403).json({ message: 'Managers can only use tickets in their department' });
    }
    const record = await ChangeRequest.create({ ...req.body, requesterName: req.user.name, createdBy: req.user._id });
    res.status(201).json(await record.populate([{ path: 'relatedTicket', select: 'ticketNumber title' }, { path: 'createdBy', select: 'name' }]));
  } catch (error) { next(error); }
};

const updateChangeRequest = async (req, res, next) => {
  try {
    const existing = await ChangeRequest.findById(req.params.id).populate('relatedTicket', 'departmentId');
    if (!existing) return res.status(404).json({ message: 'Change request not found' });
    if (req.user.role === 'manager' && (!req.user.departmentId || String(existing.relatedTicket?.departmentId) !== String(req.user.departmentId))) {
      return res.status(403).json({ message: 'Managers can only manage change requests in their department' });
    }
    const record = await ChangeRequest.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json(record);
  } catch (error) { next(error); }
};

module.exports = { getChangeRequests, createChangeRequest, updateChangeRequest };