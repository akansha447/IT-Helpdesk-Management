import { useEffect, useState } from 'react';
import { Check, Pencil, UserPlus, X } from 'lucide-react';
import api from '../api/axios';

const INITIAL_FORM = { name: '', mobile: '', email: '', username: '', password: '' };

const CabCreate = () => {
  const [form, setForm] = useState(INITIAL_FORM);
  const [authorizers, setAuthorizers] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const loadAuthorizers = async () => {
    const response = await api.get('/cab-authorizers');
    setAuthorizers(response.data);
  };

  useEffect(() => {
    loadAuthorizers().catch(() => setError('Could not load CAB authorizers.'));
  }, []);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      await api.post('/cab-authorizers', form);
      setForm(INITIAL_FORM);
      setMessage('CAB authorizer created successfully.');
      await loadAuthorizers();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create CAB authorizer.');
    }
  };

  const toggleStatus = async (id) => {
    setError('');
    try {
      await api.put(`/cab-authorizers/${id}/toggle`);
      await loadAuthorizers();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update authorizer status.');
    }
  };

  const startEdit = (authorizer) => {
    setError('');
    setEditingId(authorizer._id);
    setEditForm({ name: authorizer.name, mobile: authorizer.mobile, email: authorizer.email, username: authorizer.username, password: '' });
  };

  const saveEdit = async (id) => {
    setError('');
    setMessage('');
    try {
      await api.put(`/cab-authorizers/${id}`, editForm);
      setEditingId(null);
      setMessage('CAB authorizer details updated successfully.');
      await loadAuthorizers();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update CAB authorizer.');
    }
  };

  const updateEdit = (key, value) => setEditForm((current) => ({ ...current, [key]: value }));

  const inputClass = 'focus-ring w-full rounded border border-slate-200 px-3 py-2 text-sm';

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <UserPlus size={22} className="text-teal-600" />
        <div>
          <h1 className="text-2xl font-bold text-ink-950">CAB Authorizers Management</h1>
          <p className="mt-1 text-sm text-slate-500">Create and manage users who can authorize CAB changes.</p>
        </div>
      </div>

      {error && <p className="mb-4 rounded-lg border border-coral-200 bg-coral-50 px-4 py-3 text-sm text-coral-600">{error}</p>}
      {message && <p className="mb-4 rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-700">{message}</p>}

      <form onSubmit={submit} className="mb-12 max-w-2xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-ink-900">Create New CAB Authorizer</div>
        <div className="space-y-4 p-4">
          <label className="block"><span className="mb-1 block text-sm text-ink-800">CAB Name *</span><input required value={form.name} onChange={(event) => update('name', event.target.value)} className={inputClass} /></label>
          <label className="block"><span className="mb-1 block text-sm text-ink-800">CAB Mobile Number *</span><input required type="tel" value={form.mobile} onChange={(event) => update('mobile', event.target.value)} className={inputClass} /></label>
          <label className="block"><span className="mb-1 block text-sm text-ink-800">CAB Email ID *</span><input required type="email" value={form.email} onChange={(event) => update('email', event.target.value)} className={inputClass} /></label>
          <label className="block"><span className="mb-1 block text-sm text-ink-800">Username *</span><input required value={form.username} onChange={(event) => update('username', event.target.value)} className={inputClass} /></label>
          <label className="block"><span className="mb-1 block text-sm text-ink-800">Password *</span><input required minLength="6" type="password" value={form.password} onChange={(event) => update('password', event.target.value)} className={inputClass} /></label>
          <button type="submit" className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">Create CAB</button>
        </div>
      </form>

      <div className="overflow-x-auto bg-white">
        <table className="w-full min-w-[920px] text-sm">
          <thead><tr className="border-b border-slate-200 text-left font-semibold text-ink-900"><th className="px-2 py-3">ID</th><th className="px-4 py-3">Name</th><th className="px-4 py-3">Username</th><th className="px-4 py-3">Mobile</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Created</th><th className="px-4 py-3 text-right">Action</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {authorizers.map((authorizer, index) => {
              const editing = editingId === authorizer._id;
              return <tr key={authorizer._id}>
                <td className="px-2 py-3">{index + 1}</td>
                <td className="px-4 py-3 font-medium text-slate-700">{editing ? <input value={editForm.name} onChange={(event) => updateEdit('name', event.target.value)} className="w-28 rounded border border-slate-200 px-2 py-1" /> : authorizer.name}</td>
                <td className="px-4 py-3 text-slate-600">{editing ? <input value={editForm.username} onChange={(event) => updateEdit('username', event.target.value)} className="w-28 rounded border border-slate-200 px-2 py-1" /> : authorizer.username}</td>
                <td className="px-4 py-3 text-slate-600">{editing ? <input value={editForm.mobile} onChange={(event) => updateEdit('mobile', event.target.value)} className="w-28 rounded border border-slate-200 px-2 py-1" /> : authorizer.mobile}</td>
                <td className="px-4 py-3 text-slate-600">{editing ? <input type="email" value={editForm.email} onChange={(event) => updateEdit('email', event.target.value)} className="w-44 rounded border border-slate-200 px-2 py-1" /> : authorizer.email}</td>
                <td className="px-4 py-3"><span className={`rounded px-2 py-1 text-xs font-semibold ${authorizer.isActive ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>{authorizer.isActive ? 'Active' : 'Deactivated'}</span></td>
                <td className="px-4 py-3 text-slate-600">{editing ? <input placeholder="New password" minLength="6" type="password" value={editForm.password} onChange={(event) => updateEdit('password', event.target.value)} className="w-32 rounded border border-slate-200 px-2 py-1" /> : new Date(authorizer.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3 text-right">{editing ? <><button type="button" title="Save changes" onClick={() => saveEdit(authorizer._id)} className="mr-2 rounded p-1.5 text-emerald-600 hover:bg-emerald-50"><Check size={17} /></button><button type="button" title="Cancel editing" onClick={() => setEditingId(null)} className="mr-2 rounded p-1.5 text-slate-500 hover:bg-slate-100"><X size={17} /></button></> : <button type="button" title="Edit authorizer" onClick={() => startEdit(authorizer)} className="mr-2 rounded p-1.5 text-slate-500 hover:bg-slate-100"><Pencil size={17} /></button>}<button type="button" onClick={() => toggleStatus(authorizer._id)} className={`rounded px-3 py-1.5 text-sm font-medium text-white ${authorizer.isActive ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-600 hover:bg-emerald-700'}`}>{authorizer.isActive ? 'Deactivate' : 'Activate'}</button></td>
              </tr>;
            })}
          </tbody>
        </table>
        {authorizers.length === 0 && <p className="px-4 py-8 text-center text-sm text-slate-400">No CAB authorizers have been created yet.</p>}
      </div>
    </div>
  );
};

export default CabCreate;
