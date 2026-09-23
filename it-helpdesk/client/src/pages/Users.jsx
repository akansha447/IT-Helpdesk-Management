import { useEffect, useState } from 'react';
import { UserPlus, Trash2, Pencil, Save } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const ROLE_OPTIONS = ['employee', 'manager', 'agent', 'admin'];

const Users = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'employee', department: '' });
  const [error, setError] = useState('');
  const [departments, setDepartments] = useState([]);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});

  const load = async () => {
    const { data } = await api.get('/users');
    setUsers(data);
    if (currentUser.role === 'admin') {
      const departmentRes = await api.get('/departments');
      setDepartments(departmentRes.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/users', form);
      setForm({ name: '', email: '', password: '', role: 'employee', department: '' });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create user.');
    }
  };

  const handleRoleChange = async (id, role) => { await api.put(`/users/${id}`, { role }); load(); };
  const startEdit = (user) => { setEditing(user._id); setEditForm({ username: user.username || '', name: user.name, email: user.email, mobile: user.mobile || '', employeeId: user.employeeId || '', departmentId: user.departmentId?._id || user.departmentId || '', department: user.department || '' }); };
  const saveEdit = async (id) => { await api.put(`/users/${id}`, editForm); setEditing(null); load(); };

  const handleToggleActive = async (id, isActive) => {
    await api.put(`/users/${id}`, { isActive: !isActive });
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this user permanently?')) return;
    await api.delete(`/users/${id}`);
    load();
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-950">Team</h1>
          <p className="mt-1 text-sm text-slate-500">Manage agents, admins, and employee accounts.</p>
        </div>
        {currentUser.role === 'admin' && <button
          onClick={() => setShowForm((s) => !s)}
          className="focus-ring flex items-center gap-2 rounded-lg bg-teal-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-600"
        >
          <UserPlus size={17} />
          Add user
        </button>}
      </div>

      {showForm && currentUser.role === 'admin' && (
        <form
          onSubmit={handleCreate}
          className="mb-6 grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-soft sm:grid-cols-2 lg:grid-cols-4"
        >
          {error && <p className="col-span-full text-sm text-coral-500">{error}</p>}
          <input required placeholder="Username" value={form.username || ''} onChange={(e) => setForm({ ...form, username: e.target.value })} className="focus-ring rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <input
            required
            placeholder="Full name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="focus-ring rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <input required placeholder="Mobile" value={form.mobile || ''} onChange={(e) => setForm({ ...form, mobile: e.target.value })} className="focus-ring rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <input required placeholder="Employee ID" value={form.employeeId || ''} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} className="focus-ring rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <input
            required
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="focus-ring rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            required
            type="password"
            placeholder="Temporary password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="focus-ring rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="focus-ring rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <select value={form.departmentId || ''} onChange={(e) => setForm({ ...form, departmentId: e.target.value })} className="focus-ring rounded-lg border border-slate-200 px-3 py-2 text-sm"><option value="">Department</option>{departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}</select>
          <button
            type="submit"
            className="focus-ring rounded-lg bg-ink-950 px-3 py-2 text-sm font-semibold text-white hover:bg-ink-800"
          >
            Create
          </button>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
              <th className="px-5 py-3">Username / name</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Employee ID</th>
              <th className="px-5 py-3">Department</th>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!loading &&
              users.map((u) => (
                <tr key={u._id}>
                  <td className="px-5 py-3.5 font-medium text-ink-900">{editing === u._id ? <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-32 rounded border px-2 py-1" /> : <>{u.username || '—'} / {u.name}</>}</td>
                  <td className="px-5 py-3.5 font-medium text-ink-900">{editing === u._id ? <input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="w-32 rounded border px-2 py-1" /> : <>{u.email}</>}</td>
                  <td className="px-5 py-3.5 font-medium text-ink-900">{editing === u._id ? <input value={editForm.employeeId} onChange={(e) => setEditForm({ ...editForm, employeeId: e.target.value })} className="w-32 rounded border px-2 py-1" /> : <>{u.employeeId || '—'}</>}</td>
                  <td className="px-5 py-3.5 text-slate-600">{u.departmentId?.name || u.department || '—'}</td>
                  <td className="px-5 py-3.5">
                    <select
                      value={u.role}
                      disabled={u._id === currentUser._id}
                      onChange={(e) => handleRoleChange(u._id, e.target.value)}
                      className="focus-ring rounded-lg border border-slate-200 px-2 py-1 text-sm disabled:opacity-50"
                    >
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => handleToggleActive(u._id, u.isActive)}
                      disabled={u._id === currentUser._id}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium disabled:opacity-50 ${
                        u.isActive ? 'bg-teal-50 text-teal-600' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {u.isActive ? 'Active' : 'Deactivated'}
                    </button>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {editing === u._id ? <button onClick={() => saveEdit(u._id)} className="mr-2 text-teal-600"><Save size={15} /></button> : <button onClick={() => startEdit(u)} className="mr-2 text-slate-400"><Pencil size={15} /></button>}
                    {u._id !== currentUser._id && (
                      <button
                        onClick={() => handleDelete(u._id)}
                        className="focus-ring rounded-md p-1.5 text-slate-400 hover:bg-coral-400/10 hover:text-coral-500"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Users;
