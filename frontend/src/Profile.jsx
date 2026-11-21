import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from './api.js';
import { useAuth } from './auth.jsx';
import { Avatar, COIN, Icon } from './util.jsx';

export default function Profile() {
  const { session, balance, logout, refreshBalance } = useAuth();
  const [me, setMe] = useState(null);
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    refreshBalance();
    api(`users/${session.user_id}/`).then(setMe).catch(() => {});
  }, [session.user_id, refreshBalance]);

  async function change(e) {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    setError('');
    try {
      const r = await api('change-password/', { method: 'POST', body: { password } });
      setMsg(r.message);
      setPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="detail">
      <header className="bar">
        <Link to="/users" className="icon-btn back" aria-label="Back">
          <Icon name="back" />
        </Link>
        <div className="grow title">Profile</div>
      </header>
      <div className="scroll">
        <div className="card profile">
          <Avatar src={session.thumbnail} name={session.firstname || session.username} size={110} />
          <h2>{session.firstname}</h2>
          <div className="muted">@{session.username}</div>
          <div className="balance-big">
            {COIN} {balance === null ? '…' : balance}
          </div>
          <div className="muted">your balance</div>
          {me && (
            <dl className="kv">
              <dt>Email</dt>
              <dd>{me.email}</dd>
              <dt>Phone</dt>
              <dd>{me.phone}</dd>
              <dt>Exchange</dt>
              <dd>{session.exchange_name}</dd>
            </dl>
          )}
        </div>

        <form className="form card" onSubmit={change}>
          <h3>Change password</h3>
          <label>
            New password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </label>
          {msg && <div className="ok">{msg}</div>}
          {error && <div className="error">{error}</div>}
          <button className="btn primary" disabled={busy}>
            Update password
          </button>
        </form>

        <div className="card">
          <button className="btn danger" onClick={logout}>
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}
