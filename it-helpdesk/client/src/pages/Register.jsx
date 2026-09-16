import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Headset } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', department: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      if (!err.response) {
        setError('The API is unavailable. Start MongoDB and the backend, then try again.');
      } else {
        setError(err.response.data?.message || 'Unable to create your account.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500 text-ink-950">
            <Headset size={22} strokeWidth={2.5} />
          </div>
          <h1 className="text-xl font-bold text-white">Create your account</h1>
          <p className="mt-1 text-center text-sm text-slate-400">
            Employee accounts can raise and track tickets
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow-soft">
          {error && (
            <div className="mb-4 rounded-lg bg-coral-400/10 px-3 py-2 text-sm text-coral-500">
              {error}
            </div>
          )}
          <label className="mb-3 block">
            <span className="mb-1.5 block text-sm font-medium text-ink-800">Full name</span>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="focus-ring w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Jordan Lee"
            />
          </label>
          <label className="mb-3 block">
            <span className="mb-1.5 block text-sm font-medium text-ink-800">Email</span>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="focus-ring w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="you@company.com"
            />
          </label>
          <label className="mb-3 block">
            <span className="mb-1.5 block text-sm font-medium text-ink-800">Department</span>
            <input
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              className="focus-ring w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Marketing"
            />
          </label>
          <label className="mb-5 block">
            <span className="mb-1.5 block text-sm font-medium text-ink-800">Password</span>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="focus-ring w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="At least 6 characters"
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="focus-ring w-full rounded-lg bg-teal-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-600 disabled:opacity-60"
          >
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-teal-400 hover:text-teal-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
