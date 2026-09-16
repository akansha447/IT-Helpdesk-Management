import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Urgent'];

const CreateTicket = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', category: '', priority: 'Medium' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/categories').then(({ data }) => {
      setCategories(data);
      if (data.length > 0) setForm((f) => ({ ...f, category: data[0]._id }));
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { data } = await api.post('/tickets', form);
      navigate(`/tickets/${data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create the ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold text-ink-950">Raise a new ticket</h1>
      <p className="mb-6 text-sm text-slate-500">
        Describe the issue clearly — the more detail, the faster it gets resolved.
      </p>

      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
        {error && (
          <div className="mb-4 rounded-lg bg-coral-400/10 px-3 py-2 text-sm text-coral-500">{error}</div>
        )}

        <label className="mb-4 block">
          <span className="mb-1.5 block text-sm font-medium text-ink-800">Title</span>
          <input
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Cannot connect to office VPN"
            className="focus-ring w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </label>

        <label className="mb-4 block">
          <span className="mb-1.5 block text-sm font-medium text-ink-800">Description</span>
          <textarea
            required
            rows={5}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="What happened, when it started, and anything you've already tried…"
            className="focus-ring w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </label>

        <div className="mb-6 grid grid-cols-2 gap-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-800">Category</span>
            <select
              required
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="focus-ring w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-800">Priority</span>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="focus-ring w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="focus-ring rounded-lg px-4 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || categories.length === 0}
            className="focus-ring rounded-lg bg-teal-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-600 disabled:opacity-60"
          >
            {submitting ? 'Submitting…' : 'Submit ticket'}
          </button>
        </div>
        {categories.length === 0 && (
          <p className="mt-3 text-xs text-coral-500">
            No categories exist yet. Ask an admin to add one first.
          </p>
        )}
      </form>
    </div>
  );
};

export default CreateTicket;
