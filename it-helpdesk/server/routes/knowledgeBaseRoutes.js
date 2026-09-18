const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const KnowledgeBase = require('../models/KnowledgeBase');
const Ticket = require('../models/Ticket');

router.get('/', protect, async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role === 'employee') {
      filter.createdBy = req.user._id;
    }
    if (req.user.role === 'manager') {
      filter.departmentId = req.user.departmentId || null;
    }

    const records = await KnowledgeBase.find(filter)
      .populate('createdBy', 'name role')
      .populate('departmentId', 'name')
      .sort({ createdAt: -1 });

    const ticketScope = req.user.role === 'employee'
      ? { createdBy: req.user._id, status: { $in: ['Resolved', 'Closed'] } }
      : req.user.role === 'manager'
        ? { departmentId: req.user.departmentId || null, status: { $in: ['Resolved', 'Closed'] } }
        : { status: { $in: ['Resolved', 'Closed'] } };

    const completedTickets = await Ticket.find(ticketScope)
      .populate('createdBy', 'name')
      .populate('assignedTo', 'name')
      .populate('category', 'name')
      .sort({ updatedAt: -1 })
      .limit(20);

    const generatedEntries = completedTickets.map((ticket) => ({
      _id: `ticket-${ticket._id}`,
      generated: true,
      title: `${ticket.ticketNumber} - ${ticket.title}`,
      summary: `Resolved on ${ticket.resolvedAt ? new Date(ticket.resolvedAt).toLocaleDateString() : 'recently'} with follow-up on ${ticket.category?.name || 'the issue'}.`,
      content: [
        `Status: ${ticket.status}`,
        `Priority: ${ticket.priority}`,
        `Assigned to: ${ticket.assignedTo?.name || 'Unassigned'}`,
        `Created by: ${ticket.createdBy?.name || 'User'}`,
        'Resolution activity:',
        ...(ticket.activity || []).slice(-6).map((entry) => `- ${entry.message}`),
      ].join('\n'),
      category: 'Resolved Ticket History',
      createdBy: ticket.assignedTo || ticket.createdBy,
      tags: ['resolved', 'helpdesk', ticket.status.toLowerCase()],
      createdAt: ticket.updatedAt || ticket.resolvedAt || ticket.createdAt,
      isGenerated: true,
    }));

    res.json([...generatedEntries, ...records.map((record) => ({ ...record.toObject(), isGenerated: false }))]);
  } catch (error) {
    next(error);
  }
});

router.post('/', protect, authorize('admin', 'manager', 'agent'), async (req, res, next) => {
  try {
    const { title, summary, content, category, departmentId, tags } = req.body;
    if (!title || !summary) {
      return res.status(400).json({ message: 'Title and summary are required' });
    }

    const payload = {
      title,
      summary,
      content: content || '',
      category: category || 'General',
      departmentId: req.user.role === 'manager' ? (req.user.departmentId || departmentId || null) : departmentId || null,
      createdBy: req.user._id,
      tags: Array.isArray(tags) ? tags : [],
      isPublished: true,
    };

    const record = await KnowledgeBase.create(payload);
    res.status(201).json(await record.populate('createdBy', 'name role'));
  } catch (error) {
    next(error);
  }
});

router.put('/:id', protect, async (req, res, next) => {
  try {
    const record = await KnowledgeBase.findById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Knowledge base entry not found' });

    if (req.user.role !== 'admin' && String(record.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You can only edit your own knowledge base entries' });
    }

    Object.assign(record, req.body);
    await record.save();
    res.json(record);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', protect, async (req, res, next) => {
  try {
    const record = await KnowledgeBase.findById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Knowledge base entry not found' });

    if (req.user.role !== 'admin' && String(record.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You can only delete your own knowledge base entries' });
    }

    await record.deleteOne();
    res.json({ message: 'Knowledge base entry removed' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
