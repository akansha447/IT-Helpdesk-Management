import { useEffect, useState } from 'react';
import { BookOpen, Plus, Trash2, Pencil, Search, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const EMPTY = { title: '', summary: '', content: '', category: 'General', tags: '' };

const KnowledgeBase = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  const load = async (query = search, selectedStatus = status) => {
    const { data } = await api.get('/knowledge-base', { params: { q: query, status: selectedStatus } });
    setItems(data);
  };

  useEffect(() => { load(); }, []);

  const submitSearch = (event) => {
    event.preventDefault();
    load();
  };

  const submit = async (e) => {
    e.preventDefault();
    const payload = { ...form, tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean) };
    if (editingId) {
      await api.put(`/knowledge-base/${editingId}`, payload);
    } else {
      await api.post('/knowledge-base', payload);
    }
    setForm(EMPTY);
    setEditingId(null);
    setShowForm(false);
    load();
  };

  const remove = async (id) => {
    await api.delete(`/knowledge-base/${id}`);
    load();
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-950">Knowledge Base</h1>
          <p className="mt-1 text-sm text-slate-500">Shared guidance, procedures, and quick-reference articles.</p>
        </div>
        {['admin', 'manager', 'agent'].includes(user.role) && (
          <button onClick={() => setShowForm((v) => !v)} className="flex items-center gap-2 rounded-lg bg-teal-500 px-4 py-2.5 text-sm font-semibold text-white">
            <Plus size={17} /> Add article
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={submit} className="mb-6 grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-soft md:grid-cols-2">
          <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Article title" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Category" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="Tags (comma separated)" className="rounded-lg border border-slate-200 px-3 py-2 text-sm md:col-span-2" />
          <textarea required value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} placeholder="Short summary" rows="2" className="rounded-lg border border-slate-200 px-3 py-2 text-sm md:col-span-2" />
          <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Article content" rows="5" className="rounded-lg border border-slate-200 px-3 py-2 text-sm md:col-span-2" />
          <div className="md:col-span-2 flex gap-2">
            <button type="submit" className="rounded-lg bg-ink-950 px-4 py-2 text-sm font-semibold text-white">Save</button>
            <button type="button" onClick={() => { setShowForm(false); setEditingId(null); setForm(EMPTY); }} className="rounded-lg border border-slate-200 px-4 py-2 text-sm">Cancel</button>
          </div>
        </form>
      )}

      <form onSubmit={submitSearch} className="mb-6 flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
        <div className="relative min-w-[240px] flex-1">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search ticket number, problem, solution, or comment..." className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm" />
        </div>
        <select value={status} onChange={(e) => { setStatus(e.target.value); load(search, e.target.value); }} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
          <option value="all">All closed tickets</option>
          <option value="Closed">Closed only</option>
          <option value="Resolved">Resolved only</option>
        </select>
        <button type="submit" className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white"><Search size={16} /> Search</button>
      </form>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <div key={item._id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-teal-600" />
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{item.category || 'General'}</span>
              </div>
              {!item.isGenerated && (user.role === 'admin' || String(item.createdBy?._id || item.createdBy) === String(user._id)) && (
                <div className="flex gap-2">
                  <button onClick={() => { setEditingId(item._id); setShowForm(true); setForm({ title: item.title, summary: item.summary, content: item.content || '', category: item.category || 'General', tags: (item.tags || []).join(', ') }); }} className="text-slate-500 hover:text-teal-600"><Pencil size={15} /></button>
                  <button onClick={() => remove(item._id)} className="text-slate-500 hover:text-coral-500"><Trash2 size={15} /></button>
                </div>
              )}
            </div>
            <h2 className="text-lg font-semibold text-ink-900">{item.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{item.summary}</p>
            {item.content && (
              <div className="mt-4">
                <button type="button" onClick={() => setExpandedId(expandedId === item._id ? null : item._id)} className="flex items-center gap-2 text-sm font-semibold text-teal-700">
                  {expandedId === item._id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  {expandedId === item._id ? 'Hide full solution' : 'View full solution'}
                </button>
                {expandedId === item._id && <p className="mt-3 whitespace-pre-line border-l-2 border-teal-200 pl-3 text-sm leading-6 text-slate-700">{item.content}</p>}
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {(item.tags || []).map((tag) => (
                <span key={tag} className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-slate-600">{tag}</span>
              ))}
            </div>
            <div className="mt-4 text-xs text-slate-500">{item.isGenerated ? 'Ticket history / resolved workflow' : `Created by ${item.createdBy?.name || 'System'}`}</div>
          </div>
        ))}
      </div>
      {items.length === 0 && <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">No closed ticket solutions found for this search.</div>}
    </div>
  );
};

export default KnowledgeBase;
