import { useEffect, useState } from 'react';
import { ShieldCheck, UserRound, Ticket as TicketIcon } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const ActivityLog = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState({ totalSessions: 0, totalMinutes: 0, activeUsers: 0, currentTicket: null });
  const [filters, setFilters] = useState({ period: 'all', userId: 'all', mode: 'all' });
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await api.get('/users');
      setUsers(data);
    };
    load();
  }, []);

  useEffect(() => {
    const load = async () => {
      const params = new URLSearchParams();
      if (filters.period !== 'all') params.set('period', filters.period);
      if (filters.userId !== 'all') params.set('userId', filters.userId);
      if (filters.mode !== 'all') params.set('mode', filters.mode);
      const { data } = await api.get(`/activity?${params.toString()}`);
      setEntries(data.entries || []);
      setSummary(data.summary || { totalSessions: 0, totalMinutes: 0, activeUsers: 0, currentTicket: null });
    };
    load();
  }, [filters]);

  const iconFor = (entry) => {
    if (entry.action === 'login') return <ShieldCheck size={16} className="text-teal-600" />;
    if (entry.action === 'logout') return <ShieldCheck size={16} className="text-coral-500" />;
    if (entry.entityType === 'ticket' || entry.action === 'ticket_activity') return <TicketIcon size={16} className="text-amber-600" />;
    return <UserRound size={16} className="text-slate-600" />;
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink-950">Team Activity</h1>
        <p className="mt-1 text-sm text-slate-500">
          {user.role === 'admin' ? 'Full audit log for all users and ticket changes.' : user.role === 'manager' ? 'Activity of your department members.' : 'Your personal activity history.'}
        </p>
      </div>

      <div className="mb-5 flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-soft">
        <select value={filters.period} onChange={(e) => setFilters({ ...filters, period: e.target.value })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
          <option value="all">All time</option>
          <option value="day">Last 24 hours</option>
          <option value="week">Last 7 days</option>
          <option value="month">Last 30 days</option>
        </select>
        {(user.role === 'admin' || user.role === 'manager') && (
          <select value={filters.userId} onChange={(e) => setFilters({ ...filters, userId: e.target.value })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="all">All users</option>
            {users.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
          </select>
        )}
        <select value={filters.mode} onChange={(e) => setFilters({ ...filters, mode: e.target.value })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
          <option value="all">All activity</option>
          <option value="mine">My activity</option>
        </select>
      </div>

      <div className="mb-5 grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
          <p className="text-xs uppercase tracking-wide text-slate-500">Sessions</p>
          <p className="mt-2 text-2xl font-bold text-ink-900">{summary.totalSessions}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
          <p className="text-xs uppercase tracking-wide text-slate-500">Active users</p>
          <p className="mt-2 text-2xl font-bold text-ink-900">{summary.activeUsers}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
          <p className="text-xs uppercase tracking-wide text-slate-500">Time tracked</p>
          <p className="mt-2 text-2xl font-bold text-ink-900">{summary.totalMinutes}m</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
          <p className="text-xs uppercase tracking-wide text-slate-500">Current ticket</p>
          <p className="mt-2 text-sm font-semibold text-ink-900">{summary.currentTicket ? summary.currentTicket.title : 'None'}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
        <div className="grid gap-3 p-4">
          {entries.length === 0 && <p className="text-sm text-slate-400">No activity found for the selected filters.</p>}
          {entries.map((entry, index) => (
            <div key={`${entry.createdAt}-${index}`} className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
              <div className="mt-0.5 rounded-md bg-white p-1.5">{iconFor(entry)}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-ink-900">{entry.description || entry.action}</p>
                  <span className="text-[11px] text-slate-500">{new Date(entry.createdAt).toLocaleString()}</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-2 text-[11px] uppercase tracking-wide text-slate-500">
                  <span>{entry.user || 'System'}</span>
                  {entry.role && <span>• {entry.role}</span>}
                  {entry.entityName && <span>• {entry.entityName}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ActivityLog;
