const express = require('express');
const router = express.Router();
const XLSX = require('xlsx');
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

const getUsersForScope = async (user, userId) => {
  if (user.role === 'admin') {
    return User.find(userId ? { _id: userId } : {}).populate('departmentId', 'name');
  }
  if (user.role === 'manager') {
    return User.find({ departmentId: user.departmentId || null, ...(userId ? { _id: userId } : {}) })
      .populate('departmentId', 'name');
  }
  return User.find({ _id: user._id });
};

const buildActivityReport = async (user, query) => {
    const { period = 'all', userId = '', mode = 'all' } = query;
    const cutoff = getPeriodCutoff(period);

    let users = await getUsersForScope(user, userId);
    if (mode === 'mine') {
      users = users.filter((u) => String(u._id) === String(user._id));
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

    const visibleUserIds = new Set(users.map((visibleUser) => String(visibleUser._id)));
    const ticketScope = user.role === 'employee'
      ? { $or: [{ createdBy: user._id }, { assignedTo: user._id }] }
      : user.role === 'manager'
        ? { departmentId: user.departmentId || null }
        : {};
    const tickets = await Ticket.find(ticketScope).populate('createdBy', 'name').populate('assignedTo', 'name').populate('activity.actor', 'name role');
    for (const ticket of tickets) {
        const ticketOwnerId = String(ticket.createdBy?._id || ticket.createdBy || '');
        const ticketAssigneeId = String(ticket.assignedTo?._id || ticket.assignedTo || '');
        const selectedUserOwnsTicket = visibleUserIds.has(ticketOwnerId) || visibleUserIds.has(ticketAssigneeId);
        const ticketIsRelevant = !userId || selectedUserOwnsTicket || user.role === 'employee';
        if (!ticketIsRelevant) continue;

        const ticketLogs = (ticket.activity || []).filter((entry) => {
          if (userId || user.role === 'employee') return true;
          if (!entry.actor) return true;
          return user.role !== 'employee' || visibleUserIds.has(String(entry.actor._id || entry.actor));
        }).map((entry) => ({
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

    logEntries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const durations = [];
    for (const user of users) {
      const logs = (user.activityLog || [])
        .filter((entry) => ['login', 'logout'].includes(entry.action))
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      for (let i = 0; i < logs.length; i += 1) {
        if (logs[i].action === 'login') {
          const logout = logs.slice(i + 1).find((entry) => entry.action === 'logout');
          const start = new Date(logs[i].createdAt);
          const end = logout ? new Date(logout.createdAt) : new Date();
          if (cutoff && end < cutoff) continue;
          durations.push({
            user: user.name,
            loginAt: start,
            logoutAt: logout ? end : null,
            minutes: Math.max(0, (end - start) / 60000),
          });
          if (logout) i = logs.indexOf(logout);
        }
      }
    }

    const activeTicketScope = user.role === 'employee'
      ? { $or: [{ createdBy: user._id }, { assignedTo: user._id }] }
      : user.role === 'manager'
        ? { departmentId: user.departmentId || null }
        : {};
    const activeTickets = await Ticket.find({ ...activeTicketScope, status: { $in: ['Open', 'In Progress', 'On Hold'] } })
      .populate('assignedTo', 'name')
      .sort({ updatedAt: -1 });
    const currentTickets = activeTickets
      .filter((ticket) => !userId || String(ticket.assignedTo?._id || ticket.createdBy) === String(userId))
      .map((ticket) => ({
        id: ticket._id,
        ticketNumber: ticket.ticketNumber,
        title: ticket.title,
        status: ticket.status,
        assignedTo: ticket.assignedTo?.name || 'Unassigned',
      }));

    return {
      entries: logEntries.slice(0, 200),
      summary: {
        totalSessions: durations.length,
        totalMinutes: Math.round(durations.reduce((sum, item) => sum + item.minutes, 0)),
        activeUsers: durations.filter((session) => !session.logoutAt).length,
        currentTicket: currentTickets[0] || null,
      },
      currentTickets,
      sessions: durations,
    };
};

router.get('/', protect, async (req, res, next) => {
  try {
    res.json(await buildActivityReport(req.user, req.query));
  } catch (error) {
    next(error);
  }
});

router.get('/export', protect, async (req, res, next) => {
  try {
    const report = await buildActivityReport(req.user, req.query);
    const rows = report.entries.map((entry) => ({
      User: entry.user || 'System',
      Role: entry.role || '',
      Action: entry.action || '',
      Description: entry.description || '',
      Ticket: entry.entityName || '',
      'Date and time': entry.createdAt ? new Date(entry.createdAt).toISOString() : '',
      'Logout time': '',
    }));
    report.sessions.forEach((session) => rows.push({
      User: session.user,
      Role: '',
      Action: session.logoutAt ? 'session' : 'active_session',
      Description: `${Math.round(session.minutes)} minutes tracked`,
      Ticket: '',
      'Date and time': session.loginAt.toISOString(),
      'Logout time': session.logoutAt ? session.logoutAt.toISOString() : 'Still logged in',
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Audit Log');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=deskline-audit-log.xlsx');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
