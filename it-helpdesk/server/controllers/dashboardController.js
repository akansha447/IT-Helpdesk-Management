const Ticket = require('../models/Ticket');

// @desc  Aggregate stats for the dashboard
// @route GET /api/dashboard
const getDashboardStats = async (req, res, next) => {
  try {
    const scopeFilter = req.user.role === 'employee'
      ? { createdBy: req.user._id }
      : req.user.role === 'manager'
        ? (req.user.departmentId ? { departmentId: req.user.departmentId } : { _id: null })
        : {};

    const [statusAgg, priorityAgg, tickets, recentTickets] = await Promise.all([
      Ticket.aggregate([{ $match: scopeFilter }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Ticket.aggregate([{ $match: scopeFilter }, { $group: { _id: '$priority', count: { $sum: 1 } } }]),
      Ticket.find(scopeFilter).select('status dueAt priority resolvedAt createdAt'),
      Ticket.find(scopeFilter)
        .populate('category', 'name')
        .populate('createdBy', 'name')
        .populate('assignedTo', 'name')
        .sort({ createdAt: -1 })
        .limit(8),
    ]);

    const byStatus = { Open: 0, 'In Progress': 0, 'On Hold': 0, Resolved: 0, Closed: 0 };
    statusAgg.forEach((s) => (byStatus[s._id] = s.count));

    const byPriority = { Low: 0, Medium: 0, High: 0, Urgent: 0 };
    priorityAgg.forEach((p) => (byPriority[p._id] = p.count));

    const now = new Date();
    const overdueCount = tickets.filter(
      (t) => t.dueAt && !['Resolved', 'Closed'].includes(t.status) && new Date(t.dueAt) < now
    ).length;

    const resolvedWithTimes = tickets.filter((t) => t.resolvedAt);
    const avgResolutionHours =
      resolvedWithTimes.length > 0
        ? resolvedWithTimes.reduce((sum, t) => {
            return sum + (new Date(t.resolvedAt) - new Date(t.createdAt)) / (1000 * 60 * 60);
          }, 0) / resolvedWithTimes.length
        : 0;

    res.json({
      totalTickets: tickets.length,
      byStatus,
      byPriority,
      overdueCount,
      avgResolutionHours: Math.round(avgResolutionHours * 10) / 10,
      recentTickets,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardStats };
