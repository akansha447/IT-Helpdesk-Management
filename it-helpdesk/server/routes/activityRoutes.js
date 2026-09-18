const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const Ticket = require('../models/Ticket');

const getPeriodCutoff = (period) => {
  const now = new Date();
  if (period === 'day') return new Date(now.getTime() - 24 * 60 * 60 * 1000);
  if (period === 'week') return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  if (period === 'month') return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  return null;
};

router.get('/', protect, async (req, res, next) => {
  try {
    const { period = 'all', userId = '', mode = 'all' } = req.query;
    const cutoff = getPeriodCutoff(period);

    let users = [];
    if (req.user.role === 'admin') {
      users = await User.find(userId ? { _id: userId } : {}).populate('departmentId', 'name');
    } else if (req.user.role === 'manager') {
      users = await User.find({ departmentId: req.user.departmentId || null, ...(userId ? { _id: userId } : {}) }).populate('departmentId', 'name');
    } else {
      users = await User.find({ _id: req.user._id });
    }

    if (mode === 'mine' && req.user.role !== 'employee') {
      users = users.filter((u) => String(u._id) === String(req.user._id));
    }

    const logEntries = [];
    for (const user of users) {
      const relevantLogs = (user.activityLog || []).map((entry) => ({
        ...entry.toObject ? entry.toObject() : entry,
        user: user.name,
        role: user.role,
      }));
      logEntries.push(...relevantLogs.filter((entry) => !cutoff || new Date(entry.createdAt) >= cutoff));
    }

    if (req.user.role !== 'employee') {
      const ticketScope = req.user.role === 'manager'
        ? { departmentId: req.user.departmentId }
        : {};
      const tickets = await Ticket.find(ticketScope).populate('createdBy', 'name').populate('assignedTo', 'name').populate('activity.actor', 'name role');
      for (const ticket of tickets) {
        const ticketLogs = (ticket.activity || []).map((entry) => ({
          action: 'ticket_activity',
          description: entry.message,
          entityType: 'ticket',
          entityId: ticket._id,
          entityName: ticket.title,
          user: entry.actor && entry.actor.name ? entry.actor.name : 'System',
          role: entry.actor && entry.actor.role ? entry.actor.role : 'ticket',
          createdAt: entry.createdAt,
        }));
        logEntries.push(...ticketLogs.filter((entry) => !cutoff || new Date(entry.createdAt) >= cutoff));
      }
    }

    logEntries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const durations = [];
    for (const user of users) {
      const logs = (user.activityLog || []).filter((entry) => ['login', 'logout'].includes(entry.action)).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      for (let i = 0; i < logs.length - 1; i += 2) {
        if (logs[i].action === 'login' && logs[i + 1].action === 'logout') {
          durations.push({
            user: user.name,
            minutes: Math.max(0, (new Date(logs[i + 1].createdAt) - new Date(logs[i].createdAt)) / 60000),
          });
        }
      }
    }

    const activeTicket = req.user.role === 'employee'
      ? await Ticket.findOne({ createdBy: req.user._id, status: { $in: ['Open', 'In Progress', 'On Hold'] } }).sort({ updatedAt: -1 })
      : null;

    res.json({
      entries: logEntries.slice(0, 200),
      summary: {
        totalSessions: durations.length,
        totalMinutes: Math.round(durations.reduce((sum, item) => sum + item.minutes, 0)),
        activeUsers: users.filter((u) => (u.activityLog || []).some((entry) => entry.action === 'login' && !u.activityLog.some((x) => x.action === 'logout' && new Date(x.createdAt) > new Date(entry.createdAt)))).length,
        currentTicket: activeTicket ? { id: activeTicket._id, title: activeTicket.title, status: activeTicket.status } : null,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
