import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from './api.js';
import { useAuth } from './auth.jsx';

function AuthCard({ title, subtitle, children }) {
  return (
    <div className="auth-wrap">
      <div className="auth-band" />
      <div className="auth-card">
        <div className="logo">◎</div>
        <h1>{title}</h1>
        <p className="muted">{subtitle}</p>
        {children}
      </div>
    </div>
  );
}

export function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(username.trim(), password);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard title="CoinApp" subtitle="Trade with your neighbours in your local exchange">
      <form onSubmit={submit} className="form">
        <label>
          Username
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. ABCD12"
            autoCapitalize="characters"
            autoComplete="username"
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        {error && <div className="error">{error}</div>}
        <button className="btn primary" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="muted center">
        New here? <Link to="/register">Join an exchange</Link>
      </p>
    </AuthCard>
  );
}

export function Register() {
  const [exchanges, setExchanges] = useState([]);
  const [f, setF] = useState({ first_name: '', email: '', phone: '+91', password: '', exchange: '' });
  const [image, setImage] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);

  useEffect(() => {
    api('ajax/', { params: { purpose: 'exchanges' }, auth: false })
      .then((r) => setExchanges(r.data))
      .catch((e) => setError(e.message));
  }, []);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    if (!image) return setError('Please choose a profile photo.');
    setBusy(true);
    setError('');
    try {
      const fd = new FormData();
      Object.entries(f).forEach(([k, v]) => fd.append(k, v));
      fd.append('image', image);
      const r = await api('registration/', { method: 'POST', form: fd, auth: false });
      setDone(r);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <AuthCard title="You're registered" subtitle="One more step">
        <p>
          Your username is <b>{done.username}</b>. A member of your exchange needs to verify you
          before you can sign in.
        </p>
        <Link className="btn primary" to="/login">
          Back to sign in
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Join an exchange" subtitle="Create your CoinApp account">
      <form onSubmit={submit} className="form">
        <label>
          Exchange
          <select value={f.exchange} onChange={set('exchange')} required>
            <option value="">Select your exchange…</option>
            {exchanges.map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Name
          <input value={f.first_name} onChange={set('first_name')} required />
        </label>
        <label>
          Email
          <input type="email" value={f.email} onChange={set('email')} required />
        </label>
        <label>
          Phone (with country code)
          <input value={f.phone} onChange={set('phone')} placeholder="+919876543210" required />
        </label>
        <label>
          Password
          <input type="password" value={f.password} onChange={set('password')} required />
        </label>
        <label>
          Profile photo
          <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} required />
        </label>
        {error && <div className="error">{error}</div>}
        <button className="btn primary" disabled={busy}>
          {busy ? 'Registering…' : 'Register'}
        </button>
      </form>
      <p className="muted center">
        Already a member? <Link to="/login">Sign in</Link>
      </p>
    </AuthCard>
  );
}
