import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Headset } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to sign in. Check your details.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500 text-ink-950">
            <Headset size={22} strokeWidth={2.5} />
          </div>
          <h1 className="text-xl font-bold text-white">Welcome to DeskLine</h1>
          <p className="mt-1 text-sm text-slate-400">Sign in to manage IT tickets</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow-soft">
          {error && (
            <div className="mb-4 rounded-lg bg-coral-400/10 px-3 py-2 text-sm text-coral-500">
              {error}
            </div>
          )}
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
          <label className="mb-5 block">
            <span className="mb-1.5 block text-sm font-medium text-ink-800">Password</span>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="focus-ring w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="••••••••"
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="focus-ring w-full rounded-lg bg-teal-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-600 disabled:opacity-60"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-400">
          New here?{' '}
          <Link to="/register" className="font-medium text-teal-400 hover:text-teal-300">
            Create an account
          </Link>
        </p>

        <div className="mt-6 rounded-xl border border-ink-800 bg-ink-900 p-4 text-xs text-slate-500">
          <p className="mb-1 font-semibold text-slate-400">Demo accounts (after seeding)</p>
          <p>admin@helpdesk.com · agent@helpdesk.com · employee@helpdesk.com</p>
          <p>password123</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
