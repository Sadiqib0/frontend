import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerAdmin, loginAdmin } from '../api/admin';
import { useAdmin } from '../context/AdminContext';
import { Logo } from '../components/Logo';

function Input({ label, type = 'text', value, onChange, required, hint }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-white">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500 transition-colors text-sm"
      />
      {hint && <p className="text-xs text-neutral-500">{hint}</p>}
    </div>
  );
}

function AdminLoginForm({ onSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await loginAdmin({ username, password });
      onSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-xl">
          {error}
        </p>
      )}
      <Input label="Username" value={username} onChange={e => setUsername(e.target.value)} required />
      <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors text-base mt-1"
      >
        {loading ? 'Signing in…' : 'Log in'}
      </button>
    </form>
  );
}

function AdminRegisterForm({ onSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await registerAdmin({ username, password });
      const data = await loginAdmin({ username, password });
      onSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-xl">
          {error}
        </p>
      )}
      <Input label="Username" value={username} onChange={e => setUsername(e.target.value)} required />
      <Input
        label="Password"
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
        hint="Min 6 characters"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors text-base mt-1"
      >
        {loading ? 'Creating account…' : 'Create admin account'}
      </button>
    </form>
  );
}

export default function AdminPage() {
  const [tab, setTab] = useState('login');
  const { login } = useAdmin();
  const navigate = useNavigate();

  const handleSuccess = (adminData) => {
    login(adminData);
    navigate('/admin/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center p-4">
      <div className="mb-2">
        <Logo size="lg" />
      </div>
      <p className="text-neutral-500 text-sm mb-10">Admin Portal</p>

      <div className="w-full max-w-md bg-[#161616] border border-neutral-800 rounded-2xl overflow-hidden">
        <div className="flex border-b border-neutral-800">
          {['login', 'register'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-4 text-base font-semibold transition-colors relative ${
                tab === t ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              {t === 'login' ? 'Log in' : 'Register'}
              {tab === t && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />}
            </button>
          ))}
        </div>
        <div className="p-6">
          {tab === 'login'
            ? <AdminLoginForm onSuccess={handleSuccess} />
            : <AdminRegisterForm onSuccess={handleSuccess} />
          }
        </div>
      </div>

      <Link to="/" className="mt-8 text-sm text-neutral-600 hover:text-neutral-400 transition-colors">
        ← Back to voter login
      </Link>
    </div>
  );
}
