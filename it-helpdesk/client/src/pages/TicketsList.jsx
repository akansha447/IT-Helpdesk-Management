import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, PlusCircle, AlertTriangle, Download } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import { format } from 'date-fns';

const STATUS_OPTIONS = ['Open', 'In Progress', 'On Hold', 'Resolved', 'Closed'];
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Urgent'];

const TicketsList = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: searchParams.get('status') || '', priority: '', search: '', overdue: searchParams.get('overdue') || '' });
  const [exportSettings, setExportSettings] = useState({ range: 'all', format: 'excel', status: '' });

  const fetchTickets = async () => {
    setLoading(true);
    const params = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params[key] = value;
    });
    const { data } = await api.get('/tickets', { params });
    setTickets(data);
    setLoading(false);
  };

  useEffect(() => {
    const timeout = setTimeout(fetchTickets, 250);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const downloadTickets = async () => {
    const params = { ...exportSettings, status: exportSettings.status || filters.status || '' };
    const response = await api.get('/export/tickets', { params, responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `tickets-${Date.now()}.${exportSettings.format === 'pdf' ? 'pdf' : 'xlsx'}`;
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadAttachment = async (event, ticket) => {
    event.stopPropagation();
    const response = await api.get(`/tickets/${ticket._id}/attachment`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(response.data);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = ticket.attachment?.originalName || ticket.attachmentName || 'ticket-attachment';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-950">Tickets</h1>
          <p className="mt-1 text-sm text-slate-500">
            {user.role === 'employee' ? 'Tickets you have raised or are assigned to' : 'All tickets in the queue'}
          </p>
        </div>
        <Link
          to="/tickets/new"
          className="focus-ring flex items-center gap-2 rounded-lg bg-teal-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-600"
        >
          <PlusCircle size={17} />
          New ticket
        </Link>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            placeholder="Search title or ticket number…"
            className="focus-ring w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="focus-ring rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink-800"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={filters.priority}
          onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
          className="focus-ring rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink-800"
        >
          <option value="">All priorities</option>
          {PRIORITY_OPTIONS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <button
          onClick={() => setFilters({ ...filters, overdue: filters.overdue ? '' : 'true' })}
          className={`focus-ring flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
            filters.overdue
              ? 'border-coral-300 bg-coral-400/10 text-coral-500'
              : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
          }`}
        >
          <AlertTriangle size={14} />
          Overdue only
        </button>
        <div className="ml-auto flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-1.5">
          <select value={exportSettings.range} onChange={(e) => setExportSettings({ ...exportSettings, range: e.target.value })} className="rounded-md bg-transparent px-2 py-1 text-xs">
            <option value="all">All</option>
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="date">Date</option>
          </select>
          <select value={exportSettings.format} onChange={(e) => setExportSettings({ ...exportSettings, format: e.target.value })} className="rounded-md bg-transparent px-2 py-1 text-xs">
            <option value="excel">Excel</option>
            <option value="pdf">PDF</option>
          </select>
          <button onClick={downloadTickets} className="flex items-center gap-1 rounded-md bg-teal-500 px-2.5 py-1.5 text-xs font-semibold text-white">
            <Download size={12} /> Download
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-soft scrollbar-thin">
        <table className="w-full min-w-[1650px] text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
              <th className="sticky left-0 z-10 bg-slate-50 px-5 py-3">Ticket no</th>
              {user.role === 'admin' && <><th className="px-5 py-3">Client</th><th className="px-5 py-3">Department</th><th className="px-5 py-3">Severity</th><th className="px-5 py-3">Pickup</th><th className="px-5 py-3">Completion</th></>}
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3">Priority</th>
              <th className="px-5 py-3">Status</th>
              {user.role !== 'employee' && <th className="px-5 py-3">Assigned to</th>}
              <th className="px-5 py-3">Document</th>
              <th className="px-5 py-3">Created</th>
              {user.role === 'admin' && <><th className="px-5 py-3">Response</th><th className="px-5 py-3">Record time</th><th className="px-5 py-3">SLA status</th><th className="px-5 py-3">Compliance</th><th className="px-5 py-3">Breach</th><th className="px-5 py-3">Action</th></>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan={user.role === 'admin' ? 18 : 7} className="px-5 py-10 text-center text-slate-400">
                  Loading tickets…
                </td>
              </tr>
            )}
            {!loading && tickets.length === 0 && (
              <tr>
                <td colSpan={user.role === 'admin' ? 18 : 7} className="px-5 py-10 text-center text-slate-400">
                  No tickets match these filters.
                </td>
              </tr>
            )}
            {!loading &&
              tickets.map((ticket) => (
                <tr
                  key={ticket._id}
                  onClick={() => (window.location.href = `/tickets/${ticket._id}`)}
                  className="group cursor-pointer transition-colors hover:bg-slate-50"
                >
                  <td className="sticky left-0 z-[1] bg-white px-5 py-3.5 group-hover:bg-slate-50">
                    <Link to={`/tickets/${ticket._id}`} className="block">
                      <p className="font-mono text-xs text-slate-400">{ticket.ticketNumber}</p>
                      <p className="font-medium text-ink-900">{ticket.title}</p>
                    </Link>
                  </td>
                  {user.role === 'admin' && <><td className="px-5 py-3.5">{ticket.createdBy?.name}</td><td className="px-5 py-3.5">{ticket.departmentId?.name || '—'}</td><td className="px-5 py-3.5">{ticket.severity || '—'}</td><td className="px-5 py-3.5">{ticket.pickupAt ? format(new Date(ticket.pickupAt), 'MMM d, HH:mm') : '—'}</td><td className="px-5 py-3.5">{ticket.resolvedAt ? format(new Date(ticket.resolvedAt), 'MMM d, HH:mm') : '—'}</td></>}
                  <td className="px-5 py-3.5 text-slate-600">{ticket.category?.name}</td>
                  <td className="px-5 py-3.5">
                    <PriorityBadge priority={ticket.priority} />
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={ticket.status} />
                      {ticket.isOverdue && <AlertTriangle size={14} className="text-coral-500" />}
                    </div>
                  </td>
                  {user.role !== 'employee' && (
                    <td className="px-5 py-3.5 text-slate-600">
                      {ticket.assignedTo?.name || (
                        <span className="text-slate-400">Unassigned</span>
                      )}
                    </td>
                  )}
                  <td className="px-5 py-3.5">
                    {ticket.attachment?.storedName ? <button type="button" title="Download document" onClick={(event) => downloadAttachment(event, ticket)} className="font-medium text-teal-600 hover:text-teal-700">Download</button> : ticket.attachmentName ? <span className="text-xs text-slate-400">Filename only</span> : <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">
                    {formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true })}
                  </td>
                  {user.role === 'admin' && <><td className="px-5 py-3.5">{ticket.pickupAt ? `${Math.max(0, Math.round((new Date(ticket.pickupAt) - new Date(ticket.createdAt)) / 60000))}m` : '—'}</td><td className="px-5 py-3.5">{ticket.resolutionHours ? `${ticket.resolutionHours}h` : '—'}</td><td className="px-5 py-3.5">{ticket.isOverdue ? 'Breached' : 'Within SLA'}</td><td className="px-5 py-3.5">{ticket.isOverdue ? 'No' : 'Yes'}</td><td className="px-5 py-3.5">{ticket.isOverdue ? 'Yes' : 'No'}</td><td className="px-5 py-3.5"><Link to={`/tickets/${ticket._id}`} className="font-medium text-teal-600 hover:text-teal-700">View</Link></td></>}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TicketsList;
