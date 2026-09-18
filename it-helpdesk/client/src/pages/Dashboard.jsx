import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';

const STATUS_COLORS = {
  Open: '#0E7C86',
  'In Progress': '#E8A33D',
  'On Hold': '#8792A2',
  Resolved: '#16213A',
  Closed: '#DFE3E9',
};

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/dashboard')
      .then(({ data }) => setStats(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-sm text-slate-500">Loading dashboard…</div>;
  }

  if (!stats) {
    return <div className="text-sm text-slate-500">Couldn't load dashboard data.</div>;
  }

  const statusData = Object.entries(stats.byStatus).map(([status, count]) => ({ status, count }));
  const priorityData = Object.entries(stats.byPriority)
    .filter(([, count]) => count > 0)
    .map(([priority, count]) => ({ name: priority, value: count }));

  const priorityColors = { Low: '#8792A2', Medium: '#0E7C86', High: '#E8A33D', Urgent: '#C64F3A' };

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-ink-950">
          {user.role === 'employee' ? 'Your tickets, at a glance' : 'Helpdesk overview'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {user.role === 'employee'
            ? "Here's where things stand with the tickets you've raised."
            : 'Live status across every open ticket in the queue.'}
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/tickets" className="block rounded-xl focus-ring">
          <StatCard label="Total tickets" value={stats.totalTickets} icon={BarChart3} accent="ink" className="h-full transition-transform hover:-translate-y-0.5" />
        </Link>
        <Link to="/tickets?status=Open" className="block rounded-xl focus-ring">
          <StatCard label="Open" value={stats.byStatus.Open} sublabel="Awaiting first response" icon={Clock} accent="teal" className="h-full transition-transform hover:-translate-y-0.5" />
        </Link>
        <Link to="/tickets?overdue=true" className="block rounded-xl focus-ring">
          <StatCard label="Overdue (SLA breach)" value={stats.overdueCount} sublabel="Past their due date" icon={AlertTriangle} accent="coral" className="h-full transition-transform hover:-translate-y-0.5" />
        </Link>
        <Link to="/tickets?status=Resolved" className="block rounded-xl focus-ring">
          <StatCard label="Avg. resolution time" value={`${stats.avgResolutionHours}h`} sublabel="View resolved tickets" icon={CheckCircle2} accent="amber" className="h-full transition-transform hover:-translate-y-0.5" />
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-ink-800">Tickets by status</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={statusData} margin={{ left: -20 }}>
              <CartesianGrid vertical={false} stroke="#EEF0F3" />
              <XAxis
                dataKey="status"
                tick={{ fontSize: 12, fill: '#697386' }}
                axisLine={{ stroke: '#DFE3E9' }}
                tickLine={false}
              />
              <YAxis tick={{ fontSize: 12, fill: '#697386' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: '#F6F7F9' }}
                contentStyle={{ borderRadius: 8, borderColor: '#DFE3E9', fontSize: 13 }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {statusData.map((entry) => (
                  <Cell key={entry.status} fill={STATUS_COLORS[entry.status]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="mb-4 text-sm font-semibold text-ink-800">Tickets by priority</h2>
          {priorityData.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">No tickets yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={priorityData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                  {priorityData.map((entry) => (
                    <Cell key={entry.name} fill={priorityColors[entry.name]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, borderColor: '#DFE3E9', fontSize: 13 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            {priorityData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-1.5 text-xs text-slate-500">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: priorityColors[entry.name] }}
                />
                {entry.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-soft">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-ink-800">Recent tickets</h2>
          <Link to="/tickets" className="text-sm font-medium text-teal-600 hover:text-teal-700">
            View all
          </Link>
        </div>
        <div className="divide-y divide-slate-100">
          {stats.recentTickets.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-slate-400">
              No tickets yet — raise your first one to get started.
            </p>
          )}
          {stats.recentTickets.map((ticket) => (
            <Link
              key={ticket._id}
              to={`/tickets/${ticket._id}`}
              className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-slate-50"
            >
              <div className="min-w-0 flex-1">
                <p className="font-mono text-xs text-slate-400">{ticket.ticketNumber}</p>
                <p className="truncate text-sm font-medium text-ink-900">{ticket.title}</p>
              </div>
              <PriorityBadge priority={ticket.priority} />
              <StatusBadge status={ticket.status} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
