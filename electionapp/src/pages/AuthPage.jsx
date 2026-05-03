import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerVoter, loginVoter } from '../api/auth';
import { registerAdmin, loginAdmin } from '../api/admin';
import { useAuth } from '../context/AuthContext';
import { useAdmin } from '../context/AdminContext';
import { Logo } from '../components/Logo';

function Input({ label, type = 'text', value, onChange, placeholder, hint, required, rightElement }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-white">{label}</label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500 transition-colors text-sm"
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</div>
        )}
      </div>
      {hint && <p className="text-xs text-neutral-500">{hint}</p>}
    </div>
  );
}

function EyeIcon({ open }) {
  return open ? (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  ) : (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function RoleSelector({ role, onChange }) {
  return (
    <div className="flex bg-neutral-900 border border-neutral-800 rounded-xl p-1 gap-1">
      {['voter', 'admin'].map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => onChange(r)}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors capitalize ${
            role === r
              ? 'bg-blue-500 text-white'
              : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          {r}
        </button>
      ))}
    </div>
  );
}

function VoterLoginForm({ onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await loginVoter({ email, password });
      onSuccess({ data, role: 'voter' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-xl">{error}</p>}
      <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
      <Input
        label="Password"
        type={showPw ? 'text' : 'password'}
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
        rightElement={
          <button type="button" onClick={() => setShowPw(v => !v)} className="text-neutral-500 hover:text-neutral-300 transition-colors">
            <EyeIcon open={showPw} />
          </button>
        }
      />
      <button type="submit" disabled={loading} className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors text-base mt-1">
        {loading ? 'Signing in…' : 'Log in'}
      </button>
    </form>
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
      onSuccess({ data, role: 'admin' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-xl">{error}</p>}
      <Input label="Username" value={username} onChange={e => setUsername(e.target.value)} required />
      <Input
        label="Password"
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
      />
      <button type="submit" disabled={loading} className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors text-base mt-1">
        {loading ? 'Signing in…' : 'Log in as Admin'}
      </button>
    </form>
  );
}

function VoterSignupForm({ onSuccess }) {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', matricNumber: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await registerVoter(form);
      const data = await loginVoter({ email: form.email, password: form.password });
      onSuccess({ data, role: 'voter' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-xl">{error}</p>}
      <div className="grid grid-cols-2 gap-4">
        <Input label="First name" value={form.firstName} onChange={set('firstName')} required />
        <Input label="Last name" value={form.lastName} onChange={set('lastName')} required />
      </div>
      <Input label="Email" type="email" value={form.email} onChange={set('email')} required />
      <Input label="Matric number" value={form.matricNumber} onChange={set('matricNumber')} required />
      <Input
        label="Password"
        type={showPw ? 'text' : 'password'}
        value={form.password}
        onChange={set('password')}
        hint="Use a password 10 to 12 characters"
        required
        rightElement={
          <button type="button" onClick={() => setShowPw(v => !v)} className="text-neutral-500 hover:text-neutral-300 transition-colors">
            <EyeIcon open={showPw} />
          </button>
        }
      />
      <button type="submit" disabled={loading} className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors text-base mt-1">
        {loading ? 'Creating account…' : 'Create voter account'}
      </button>
    </form>
  );
}

function AdminSignupForm({ onSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await registerAdmin({ username, password });
      const data = await loginAdmin({ username, password });
      onSuccess({ data, role: 'admin' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-xl">{error}</p>}
      <Input label="Username" value={username} onChange={e => setUsername(e.target.value)} required />
      <Input
        label="Password"
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        hint="Min 6 characters"
        required
      />
      <button type="submit" disabled={loading} className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors text-base mt-1">
        {loading ? 'Creating account…' : 'Create admin account'}
      </button>
    </form>
  );
}

export default function AuthPage() {
  const [tab, setTab] = useState('signup');
  const [role, setRole] = useState('voter');
  const { login: voterLogin } = useAuth();
  const { login: adminLogin } = useAdmin();
  const navigate = useNavigate();

  const handleSuccess = ({ data, role }) => {
    if (role === 'admin') {
      adminLogin(data);
      navigate('/admin/dashboard');
    } else {
      voterLogin(data);
      navigate('/elections');
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center p-4">
      <div className="mb-10">
        <Logo size="lg" />
      </div>

      <div className="w-full max-w-md bg-[#161616] border border-neutral-800 rounded-2xl overflow-hidden">
        <div className="flex border-b border-neutral-800">
          {['login', 'signup'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-4 text-base font-semibold transition-colors relative ${
                tab === t ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              {t === 'login' ? 'Log in' : 'Sign up'}
              {tab === t && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />}
            </button>
          ))}
        </div>

        <div className="p-6 flex flex-col gap-5">
          <RoleSelector role={role} onChange={setRole} />

          {tab === 'login'
            ? role === 'voter'
              ? <VoterLoginForm onSuccess={handleSuccess} />
              : <AdminLoginForm onSuccess={handleSuccess} />
            : role === 'voter'
              ? <VoterSignupForm onSuccess={handleSuccess} />
              : <AdminSignupForm onSuccess={handleSuccess} />
          }
        </div>
      </div>
    </div>
  );
}
