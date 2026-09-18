const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const KnowledgeBase = require('../models/KnowledgeBase');
const Ticket = require('../models/Ticket');
const Comment = require('../models/Comment');

router.get('/', protect, async (req, res, next) => {
  try {
    const { q = '', status = 'all' } = req.query;
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

    const normalizedQuery = q.trim().toLowerCase();
    const matchesSearch = (value) => !normalizedQuery || String(value || '').toLowerCase().includes(normalizedQuery);
    const visibleRecords = records.filter((record) => (
      matchesSearch(record.title)
      || matchesSearch(record.summary)
      || matchesSearch(record.content)
      || matchesSearch(record.category)
      || (record.tags || []).some((tag) => matchesSearch(tag))
    ));

    const ticketScope = req.user.role === 'employee'
      ? { createdBy: req.user._id, status: { $in: ['Resolved', 'Closed'] } }
      : req.user.role === 'manager'
        ? { departmentId: req.user.departmentId || null, status: { $in: ['Resolved', 'Closed'] } }
        : { status: { $in: ['Resolved', 'Closed'] } };

    const completedTickets = await Ticket.find({
      ...ticketScope,
      ...(status === 'all' ? {} : { status }),
    })
      .populate('createdBy', 'name')
      .populate('assignedTo', 'name')
      .populate('category', 'name')
      .sort({ updatedAt: -1 })
      .limit(100);

    const comments = await Comment.find({ ticket: { $in: completedTickets.map((ticket) => ticket._id) } })
      .populate('author', 'name role')
      .sort({ createdAt: 1 });
    const commentsByTicket = comments.reduce((result, comment) => {
      const key = String(comment.ticket);
      if (!result[key]) result[key] = [];
      if (req.user.role !== 'employee' || !comment.isInternal) result[key].push(comment);
      return result;
    }, {});

    const generatedEntries = completedTickets.filter((ticket) => {
      const ticketComments = commentsByTicket[String(ticket._id)] || [];
      return matchesSearch(ticket.ticketNumber)
        || matchesSearch(ticket.title)
        || matchesSearch(ticket.description)
        || matchesSearch(ticket.category?.name)
        || (ticket.activity || []).some((entry) => matchesSearch(entry.message))
        || ticketComments.some((comment) => matchesSearch(comment.message));
    }).map((ticket) => ({
      _id: `ticket-${ticket._id}`,
      generated: true,
      ticketId: ticket._id,
      title: `${ticket.ticketNumber} - ${ticket.title}`,
      summary: `Closed/resolved on ${ticket.resolvedAt || ticket.closedAt ? new Date(ticket.resolvedAt || ticket.closedAt).toLocaleDateString() : 'recently'} in ${ticket.category?.name || 'the helpdesk'}.`,
      content: [
        `Status: ${ticket.status}`,
        `Priority: ${ticket.priority}`,
        `Problem reported: ${ticket.description}`,
        `Assigned to: ${ticket.assignedTo?.name || 'Unassigned'}`,
        `Created by: ${ticket.createdBy?.name || 'User'}`,
        `Resolution time: ${ticket.resolutionHours || 0} hours`,
        '',
        'What the helpdesk did:',
        ...(ticket.activity || []).slice(-6).map((entry) => `- ${entry.message}`),
        '',
        'Solution and follow-up notes:',
        ...(commentsByTicket[String(ticket._id)] || []).map((comment) => `- ${comment.author?.name || 'Helpdesk'}: ${comment.message}`),
      ].join('\n'),
      category: 'Resolved Ticket History',
      createdBy: ticket.assignedTo || ticket.createdBy,
      tags: ['resolved', 'helpdesk', ticket.status.toLowerCase()],
      createdAt: ticket.updatedAt || ticket.resolvedAt || ticket.createdAt,
      isGenerated: true,
    }));

    res.json([...generatedEntries, ...visibleRecords.map((record) => ({ ...record.toObject(), isGenerated: false }))]);
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
