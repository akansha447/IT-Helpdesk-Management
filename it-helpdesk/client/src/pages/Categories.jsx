import { useEffect, useState } from 'react';
import { FolderPlus, Trash2 } from 'lucide-react';
import api from '../api/axios';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', baseSlaHours: 24 });
  const [error, setError] = useState('');

  const load = async () => {
    const { data } = await api.get('/categories');
    setCategories(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/categories', form);
      setForm({ name: '', description: '', baseSlaHours: 24 });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create category.');
    }
  };

  const handleSlaChange = async (id, baseSlaHours) => {
    await api.put(`/categories/${id}`, { baseSlaHours: Number(baseSlaHours) });
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category? Existing tickets will keep their reference.')) return;
    await api.delete(`/categories/${id}`);
    load();
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-950">Categories</h1>
          <p className="mt-1 text-sm text-slate-500">
            Base SLA hours are for Medium priority; Urgent/High/Low apply a multiplier automatically.
          </p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="focus-ring flex items-center gap-2 rounded-lg bg-teal-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-600"
        >
          <FolderPlus size={17} />
          Add category
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-6 grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-soft sm:grid-cols-4"
        >
          {error && <p className="col-span-full text-sm text-coral-500">{error}</p>}
          <input
            required
            placeholder="Category name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="focus-ring rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="focus-ring rounded-lg border border-slate-200 px-3 py-2 text-sm sm:col-span-2"
          />
          <input
            type="number"
            min={1}
            placeholder="Base SLA hours"
            value={form.baseSlaHours}
            onChange={(e) => setForm({ ...form, baseSlaHours: e.target.value })}
            className="focus-ring rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="focus-ring col-span-full rounded-lg bg-ink-950 px-3 py-2 text-sm font-semibold text-white hover:bg-ink-800 sm:col-span-1"
          >
            Create
          </button>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Description</th>
              <th className="px-5 py-3">Base SLA (hrs)</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!loading &&
              categories.map((c) => (
                <tr key={c._id}>
                  <td className="px-5 py-3.5 font-medium text-ink-900">{c.name}</td>
                  <td className="px-5 py-3.5 text-slate-600">{c.description || '—'}</td>
                  <td className="px-5 py-3.5">
                    <input
                      type="number"
                      min={1}
                      defaultValue={c.baseSlaHours}
                      onBlur={(e) => handleSlaChange(c._id, e.target.value)}
                      className="focus-ring w-20 rounded-lg border border-slate-200 px-2 py-1 text-sm"
                    />
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => handleDelete(c._id)}
                      className="focus-ring rounded-md p-1.5 text-slate-400 hover:bg-coral-400/10 hover:text-coral-500"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            {!loading && categories.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-slate-400">
                  No categories yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Categories;
