import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { ArrowLeft, AlertTriangle, Lock, Send, Trash2 } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';

const STATUS_OPTIONS = ['Open', 'In Progress', 'On Hold', 'Resolved', 'Closed'];
const PRIORITY_OPTIONS = ['P1', 'P2', 'P3'];

const TicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [posting, setPosting] = useState(false);
  const [tab, setTab] = useState('comments');

  const isStaff = user.role === 'admin' || user.role === 'manager' || user.role === 'agent';

  const load = useCallback(async () => {
    const [ticketRes, commentsRes] = await Promise.all([
      api.get(`/tickets/${id}`),
      api.get(`/tickets/${id}/comments`),
    ]);
    setTicket(ticketRes.data);
    setComments(commentsRes.data);
    if (isStaff) {
      const agentsRes = await api.get('/users/agents');
      setAgents(agentsRes.data);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const patchTicket = async (payload) => {
    const { data } = await api.put(`/tickets/${id}`, payload);
    setTicket(data);
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setPosting(true);
    try {
      await api.post(`/tickets/${id}/comments`, { message, isInternal });
      setMessage('');
      setIsInternal(false);
      await load();
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this ticket permanently? This cannot be undone.')) return;
    await api.delete(`/tickets/${id}`);
    navigate('/tickets');
  };

  if (loading) return <div className="text-sm text-slate-500">Loading ticket…</div>;
  if (!ticket) return <div className="text-sm text-slate-500">Ticket not found.</div>;

  return (
    <div>
      <button
        onClick={() => navigate('/tickets')}
        className="focus-ring mb-4 flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-ink-800"
      >
        <ArrowLeft size={15} />
        Back to tickets
      </button>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
            <div className="mb-3 flex items-center gap-2">
              <span className="font-mono text-xs text-slate-400">{ticket.ticketNumber}</span>
              {ticket.isOverdue && (
                <span className="flex items-center gap-1 text-xs font-medium text-coral-500">
                  <AlertTriangle size={13} />
                  SLA breached
                </span>
              )}
            </div>
            <h1 className="mb-3 text-xl font-bold text-ink-950">{ticket.title}</h1>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                {ticket.category?.name}
              </span>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-800">
              {ticket.description}
            </p>
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-soft">
            <div className="flex border-b border-slate-100 px-6">
              <button
                onClick={() => setTab('comments')}
                className={`focus-ring border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
                  tab === 'comments'
                    ? 'border-teal-500 text-teal-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Comments
              </button>
              <button
                onClick={() => setTab('activity')}
                className={`focus-ring border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
                  tab === 'activity'
                    ? 'border-teal-500 text-teal-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Activity log
              </button>
            </div>

            {tab === 'comments' && (
              <div className="p-6">
                <div className="mb-5 space-y-4">
                  {comments.length === 0 && (
                    <p className="text-sm text-slate-400">No comments yet.</p>
                  )}
                  {comments.map((c) => (
                    <div
                      key={c._id}
                      className={`rounded-lg border p-3.5 ${
                        c.isInternal ? 'border-amber-300 bg-amber-400/5' : 'border-slate-100 bg-slate-50'
                      }`}
                    >
                      <div className="mb-1.5 flex items-center gap-2 text-xs">
                        <span className="font-semibold text-ink-800">{c.author?.name}</span>
                        <span className="text-slate-400">
                          {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                        </span>
                        {c.isInternal && (
                          <span className="flex items-center gap-1 font-medium text-amber-500">
                            <Lock size={11} /> Internal note
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-ink-800">{c.message}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={handlePostComment}>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    placeholder="Write a comment…"
                    className="focus-ring w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                  <div className="mt-2 flex items-center justify-between">
                    {isStaff ? (
                      <label className="flex items-center gap-2 text-xs text-slate-500">
                        <input
                          type="checkbox"
                          checked={isInternal}
                          onChange={(e) => setIsInternal(e.target.checked)}
                          className="rounded border-slate-300 text-teal-500 focus:ring-teal-400"
                        />
                        Internal note (hidden from requester)
                      </label>
                    ) : (
                      <span />
                    )}
                    <button
                      type="submit"
                      disabled={posting || !message.trim()}
                      className="focus-ring flex items-center gap-1.5 rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600 disabled:opacity-60"
                    >
                      <Send size={14} />
                      Post
                    </button>
                  </div>
                </form>
              </div>
            )}

            {tab === 'activity' && (
              <div className="p-6">
                <ol className="space-y-4 border-l border-slate-200 pl-4">
                  {[...ticket.activity].reverse().map((entry, idx) => (
                    <li key={idx} className="relative">
                      <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-teal-500" />
                      <p className="text-sm text-ink-800">{entry.message}</p>
                      <p className="text-xs text-slate-400">
                        {format(new Date(entry.createdAt), 'MMM d, yyyy · h:mm a')}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
            <h2 className="mb-4 text-sm font-semibold text-ink-800">Details</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Requested by</dt>
                <dd className="font-medium text-ink-800">{ticket.createdBy?.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Created</dt>
                <dd className="text-ink-800">{format(new Date(ticket.createdAt), 'MMM d, yyyy')}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Due by</dt>
                <dd className={ticket.isOverdue ? 'font-medium text-coral-500' : 'text-ink-800'}>
                  {ticket.dueAt ? format(new Date(ticket.dueAt), 'MMM d, yyyy · h:mm a') : '—'}
                </dd>
              </div>
            </dl>
          </div>

          {isStaff && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
              <h2 className="mb-4 text-sm font-semibold text-ink-800">Manage ticket</h2>
              <label className="mb-3 block">
                <span className="mb-1.5 block text-xs font-medium text-slate-500">Status</span>
                <select
                  value={ticket.status}
                  onChange={(e) => patchTicket({ status: e.target.value })}
                  className="focus-ring w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="mb-3 block">
                <span className="mb-1.5 block text-xs font-medium text-slate-500">Priority</span>
                <select
                  value={ticket.priority}
                  onChange={(e) => patchTicket({ priority: e.target.value })}
                  className="focus-ring w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  {PRIORITY_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </label>
              <label className="mb-2 block">
                <span className="mb-1.5 block text-xs font-medium text-slate-500">Assigned to</span>
                <select
                  value={ticket.assignedTo?._id || ''}
                  onChange={(e) => patchTicket({ assignedTo: e.target.value || null })}
                  className="focus-ring w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="">Unassigned</option>
                  {agents.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </label>

              {user.role === 'admin' && (
                <button
                  onClick={handleDelete}
                  className="focus-ring mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-coral-300 py-2 text-sm font-medium text-coral-500 hover:bg-coral-400/10"
                >
                  <Trash2 size={14} />
                  Delete ticket
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketDetail;
