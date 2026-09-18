const XLSX = require('xlsx');
const jsPDF = require('jspdf');
const Ticket = require('../models/Ticket');
const ChangeRequest = require('../models/ChangeRequest');

const getScopedFilter = (user) => {
  if (user.role === 'employee') return { createdBy: user._id };
  if (user.role === 'manager') {
    if (!user.departmentId) return { _id: null };
    return { departmentId: user.departmentId };
  }
  return {};
};

const exportTickets = async (req, res, next) => {
  try {
    const { range = 'all', format = 'excel', status = '' } = req.query;
    const filter = getScopedFilter(req.user);
    if (status) filter.status = status;

    const start = new Date();
    if (range !== 'all') {
      if (range === 'day') start.setDate(start.getDate() - 1);
      else if (range === 'week') start.setDate(start.getDate() - 7);
      else if (range === 'month') start.setMonth(start.getMonth() - 1);
      else if (range === 'date') {
        const specific = req.query.date || new Date().toISOString();
        start.setTime(new Date(specific).getTime());
      }
      filter.createdAt = { $gte: start };
    }

    const tickets = await Ticket.find(filter)
      .populate('category', 'name')
      .populate('createdBy', 'name')
      .populate('assignedTo', 'name')
      .sort({ createdAt: -1 });

    const rows = tickets.map((ticket) => ({
      'Ticket Number': ticket.ticketNumber,
      Title: ticket.title,
      Status: ticket.status,
      Priority: ticket.priority,
      Category: ticket.category?.name || '',
      Assigned: ticket.assignedTo?.name || 'Unassigned',
      Creator: ticket.createdBy?.name || '',
      Created: ticket.createdAt ? new Date(ticket.createdAt).toISOString() : '',
      Due: ticket.dueAt ? new Date(ticket.dueAt).toISOString() : '',
      Resolved: ticket.resolvedAt ? new Date(ticket.resolvedAt).toISOString() : '',
    }));

    if (format === 'pdf') {
      const doc = new jsPDF();
      doc.setFontSize(12);
      doc.text('DeskLine Ticket Export', 14, 14);
      let y = 28;
      rows.forEach((row, index) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.text(`${index + 1}. ${row['Ticket Number']} | ${row.Title} | ${row.Status} | ${row.Priority}`, 14, y);
        y += 8;
      });
      if (rows.length === 0) {
        doc.text('No tickets found for the selected filters.', 14, 28);
      }
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=tickets-report.pdf');
      res.send(Buffer.from(doc.output('arraybuffer')));
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(rows.map((row) => ({
      'Ticket Number': row['Ticket Number'],
      Title: row.Title,
      Status: row.Status,
      Priority: row.Priority,
      Category: row.Category,
      Assigned: row.Assigned,
      Creator: row.Creator,
      Created: row.Created,
      Due: row.Due,
      Resolved: row.Resolved,
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tickets');
    const xlsxBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=tickets-report.xlsx');
    res.send(xlsxBuffer);
  } catch (error) {
    next(error);
  }
};

const exportChangeRequests = async (req, res, next) => {
  try {
    const { range = 'all', format = 'excel', status = '' } = req.query;
    const filter = req.user.role === 'employee' ? { createdBy: req.user._id } : req.user.role === 'manager' ? { relatedTicket: { $in: await Ticket.find({ departmentId: req.user.departmentId || null }).distinct('_id') } } : {};
    if (status) filter.status = status;

    const start = new Date();
    if (range !== 'all') {
      if (range === 'day') start.setDate(start.getDate() - 1);
      else if (range === 'week') start.setDate(start.getDate() - 7);
      else if (range === 'month') start.setMonth(start.getMonth() - 1);
      else if (range === 'date') {
        const specific = req.query.date || new Date().toISOString();
        start.setTime(new Date(specific).getTime());
      }
      filter.createdAt = { $gte: start };
    }

    const records = await ChangeRequest.find(filter)
      .populate('relatedTicket', 'ticketNumber title')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    const rows = records.map((record) => ({
      'CR Number': record.crNumber,
      'Related Ticket': record.relatedTicket?.ticketNumber || '',
      'Title': record.relatedTicket?.title || '',
      'Status': record.status,
      'Priority': record.priority,
      'Change Type': record.changeType,
      'Created By': record.createdBy?.name || '',
      'Created': record.createdAt ? new Date(record.createdAt).toISOString() : '',
    }));

    if (format === 'pdf') {
      const doc = new jsPDF();
      doc.setFontSize(12);
      doc.text('DeskLine Change Request Export', 14, 14);
      let y = 28;
      rows.forEach((row, index) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.text(`${index + 1}. ${row['CR Number']} | ${row['Related Ticket']} | ${row.Status}`, 14, y);
        y += 8;
      });
      if (rows.length === 0) {
        doc.text('No change requests found for the selected filters.', 14, 28);
      }
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=change-requests-report.pdf');
      res.send(Buffer.from(doc.output('arraybuffer')));
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(rows.map((row) => ({
      'CR Number': row['CR Number'],
      'Related Ticket': row['Related Ticket'],
      Title: row.Title,
      Status: row.Status,
      Priority: row.Priority,
      'Change Type': row['Change Type'],
      'Created By': row['Created By'],
      Created: row.Created,
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Change Requests');
    const xlsxBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=change-requests-report.xlsx');
    res.send(xlsxBuffer);
  } catch (error) {
    next(error);
  }
};

module.exports = { exportTickets, exportChangeRequests };
