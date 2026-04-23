import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { loginThunk, registerThunk, clearError } from '../store/authSlice';
import toast from 'react-hot-toast';

const inputCls = 'w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition';

export function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, user } = useSelector((s) => s.auth);
  const [form, setForm] = useState({ email: '', password: '' });

  useEffect(() => { if (user) navigate(dashboardPath(user.role)); }, [user, navigate]);
  useEffect(() => { if (error) { toast.error(error); dispatch(clearError()); } }, [error, dispatch]);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const submit = (e) => { e.preventDefault(); dispatch(loginThunk(form)); };
  const demoLogin = (role) => {
    const creds = {
      SEEKER:    { email: 'seeker@demo.com',    password: 'demo123' },
      RECRUITER: { email: 'recruiter@demo.com', password: 'demo123' },
      ADMIN:     { email: 'admin@demo.com',     password: 'demo123' },
    };
    dispatch(loginThunk(creds[role]));
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your HireHub account">
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1 font-medium">Email address</label>
          <input className={inputCls} name="email" type="email" placeholder="you@example.com"
                 value={form.email} onChange={handle} required autoComplete="email" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1 font-medium">Password</label>
          <input className={inputCls} name="password" type="password" placeholder="Your password"
                 value={form.password} onChange={handle} required autoComplete="current-password" />
        </div>
        <button type="submit" disabled={loading}
          className="w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition mt-1">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Signing in…
            </span>
          ) : 'Sign in'}
        </button>
      </form>

      {/* Demo logins */}
      <div className="mt-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-xs text-gray-400">Quick demo login</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { role: 'SEEKER',    label: '🔍 Seeker',    color: 'hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200' },
            { role: 'RECRUITER', label: '🏢 Recruiter', color: 'hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200' },
            { role: 'ADMIN',     label: '⚙️ Admin',     color: 'hover:bg-red-50 hover:text-red-700 hover:border-red-200' },
          ].map(({ role, label, color }) => (
            <button key={role} onClick={() => demoLogin(role)}
              className={`py-2 text-xs border border-gray-200 rounded-xl text-gray-500 transition ${color}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-5 text-center text-sm text-gray-400">
        No account?{' '}
        <Link to="/register" className="text-blue-600 hover:underline font-medium">Create one free</Link>
      </p>
    </AuthLayout>
  );
}

export function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, user } = useSelector((s) => s.auth);
  const [form, setForm] = useState({ fullName: '', email: '', password: '', phone: '', location: '', role: 'SEEKER' });

  useEffect(() => { if (user) navigate(dashboardPath(user.role)); }, [user, navigate]);
  useEffect(() => { if (error) { toast.error(error); dispatch(clearError()); } }, [error, dispatch]);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const submit = (e) => { e.preventDefault(); dispatch(registerThunk(form)); };

  return (
    <AuthLayout title="Create account" subtitle="Join HireHub — find your dream job today">
      <form onSubmit={submit} className="space-y-3">
        {[
          { name: 'fullName', label: 'Full name *', type: 'text', placeholder: 'Ravi Kumar', required: true },
          { name: 'email', label: 'Email address *', type: 'email', placeholder: 'you@example.com', required: true },
          { name: 'password', label: 'Password *', type: 'password', placeholder: 'Min 6 characters', required: true, minLength: 6 },
          { name: 'phone', label: 'Phone number', type: 'tel', placeholder: '+91 98765 43210' },
          { name: 'location', label: 'Location', type: 'text', placeholder: 'Hyderabad, Telangana' },
        ].map(({ name, label, type, placeholder, required, minLength }) => (
          <div key={name}>
            <label className="block text-xs text-gray-500 mb-1 font-medium">{label}</label>
            <input className={inputCls} name={name} type={type} placeholder={placeholder}
                   value={form[name]} onChange={handle} required={required} minLength={minLength} />
          </div>
        ))}

        <div>
          <p className="text-xs text-gray-500 mb-2 font-medium">I am a *</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { role: 'SEEKER', label: '🔍 Job Seeker', sub: 'I\'m looking for a job' },
              { role: 'RECRUITER', label: '🏢 Recruiter', sub: 'I\'m hiring talent' },
            ].map(({ role, label, sub }) => (
              <button key={role} type="button" onClick={() => setForm({ ...form, role })}
                className={`py-2.5 px-3 text-left text-xs rounded-xl border-2 transition-all
                  ${form.role === role ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                <p className="font-semibold">{label}</p>
                <p className="opacity-60 mt-0.5">{sub}</p>
              </button>
            ))}
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Creating account…
            </span>
          ) : 'Create account'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-gray-400">
        Already have an account?{' '}
        <Link to="/login" className="text-blue-600 hover:underline font-medium">Sign in</Link>
      </p>
    </AuthLayout>
  );
}

function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">H</div>
          <div>
            <span className="text-xl font-bold text-gray-900">HireHub</span>
            <p className="text-xs text-gray-400">Your career starts here</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-7 shadow-sm">
          <h1 className="text-xl font-bold text-gray-900 mb-1">{title}</h1>
          <p className="text-sm text-gray-400 mb-6">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

export function dashboardPath(role) {
  if (role === 'RECRUITER') return '/recruiter/dashboard';
  if (role === 'ADMIN')     return '/admin/dashboard';
  return '/seeker/dashboard';
}