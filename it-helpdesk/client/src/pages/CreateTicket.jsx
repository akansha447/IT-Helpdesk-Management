import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const PRIORITY_OPTIONS = ['P1', 'P2', 'P3'];
const SEVERITY_OPTIONS = ['Low', 'Medium', 'High'];

const CreateTicket = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [attachment, setAttachment] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', category: '', departmentId: '', severity: 'Medium', priority: 'P2', resolutionHours: 8, problemType: '', branchSite: '', attachmentName: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const requests = [api.get('/categories')];
    if (user?.role === 'admin') requests.push(api.get('/departments'));
    Promise.all(requests).then(([categoryResponse, departmentResponse]) => {
      setCategories(categoryResponse.data);
      if (categoryResponse.data.length > 0) setForm((f) => ({ ...f, category: categoryResponse.data[0]._id }));
      if (departmentResponse) setDepartments(departmentResponse.data.filter((department) => department.isActive));
    });
  }, [user?.role]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => payload.append(key, value ?? ''));
      if (attachment) payload.append('attachment', attachment);
      const { data } = await api.post('/tickets', payload);
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
          {user?.role === 'admin' && <label className="block"><span className="mb-1.5 block text-sm font-medium text-ink-800">Department</span><select required value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })} className="focus-ring w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"><option value="">Select department</option>{departments.map((department) => <option key={department._id} value={department._id}>{department.name}</option>)}</select>{departments.length === 0 && <span className="mt-1 block text-xs text-coral-500">Create an active department first.</span>}</label>}
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-800">Severity level</span>
            <select
              value={form.severity}
              onChange={(e) => setForm({ ...form, severity: e.target.value })}
              className="focus-ring w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              {SEVERITY_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className="block"><span className="mb-1.5 block text-sm font-medium text-ink-800">Priority level</span><select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="focus-ring w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">{PRIORITY_OPTIONS.map((p) => <option key={p}>{p}</option>)}</select></label>
          <label className="block"><span className="mb-1.5 block text-sm font-medium text-ink-800">Resolution time (hours)</span><input required type="number" min="1" value={form.resolutionHours} onChange={(e) => setForm({ ...form, resolutionHours: e.target.value })} className="focus-ring w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>
          <label className="block"><span className="mb-1.5 block text-sm font-medium text-ink-800">Type of problem</span><input required value={form.problemType} onChange={(e) => setForm({ ...form, problemType: e.target.value })} className="focus-ring w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>
          <label className="block"><span className="mb-1.5 block text-sm font-medium text-ink-800">Branch / site</span><input required value={form.branchSite} onChange={(e) => setForm({ ...form, branchSite: e.target.value })} className="focus-ring w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>
          <label className="col-span-2 block"><span className="mb-1.5 block text-sm font-medium text-ink-800">Add attachment</span><input type="file" onChange={(e) => setAttachment(e.target.files[0] || null)} className="w-full text-sm" /><span className="mt-1 block text-xs text-slate-400">Maximum file size: 10 MB</span></label>
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
