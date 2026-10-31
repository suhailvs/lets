import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, NavLink, useParams } from 'react-router-dom';
import { api } from './api.js';
import { useAuth } from './auth.jsx';
import { Avatar, COIN, Icon, displayName, fmtDay, fmtRel, fmtTime } from './util.jsx';

// ---------------------------------------------------------------- chat list
export function ChatList() {
  const [users, setUsers] = useState(null);
  const [q, setQ] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api('users/')
      .then((d) => setUsers(Array.isArray(d) ? d : d.results))
      .catch((e) => setError(e.message));
  }, []);

  const needle = q.trim().toLowerCase();
  const shown = (users || []).filter(
    (u) =>
      !needle || `${u.first_name} ${u.username}`.toLowerCase().includes(needle)
  );

  return (
    <>
      <div className="search">
        <Icon name="search" size={18} />
        <input placeholder="Search members" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="list">
        {error && <div className="error m">{error}</div>}
        {!users && !error && <div className="muted center m">Loading members…</div>}
        {users && shown.length === 0 && <div className="muted center m">No members found.</div>}
        {shown.map((u) => (
          <NavLink key={u.id} to={`/chats/${u.id}`} className="row">
            <Avatar src={u.thumbnail} name={displayName(u)} />
            <div className="grow">
              <div className="row-top">
                <span className="name">{displayName(u)}</span>
                <span className={`bal ${u.balance < 0 ? 'neg' : ''}`}>
                  {COIN} {u.balance}
                </span>
              </div>
              <div className="row-sub">
                @{u.username}
                {!u.is_active && <span className="tag warn">Pending</span>}
              </div>
            </div>
          </NavLink>
        ))}
      </div>
    </>
  );
}

// -------------------------------------------------------------------- chat
const PAGE = 30;

export function Chat() {
  const { userId } = useParams();
  const { session, refreshBalance } = useAuth();
  const me = session.user_id;

  const [other, setOther] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [nextPage, setNextPage] = useState(null);
  const [loading, setLoading] = useState(true); // transactions
  const [userLoading, setUserLoading] = useState(true);
  const [error, setError] = useState('');
  // 'all' = every transaction of this member (incl. with others), 'mine' = only between me and them
  const [scope, setScope] = useState('all');

  const [mode, setMode] = useState('pay'); // pay | receive
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);

  const bottom = useRef(null);
  const stick = useRef(true);

  useEffect(() => {
    let off = false;
    setOther(null);
    setUserLoading(true);
    setError('');
    api(`users/${userId}/`)
      .then((u) => !off && setOther(u))
      .catch((e) => !off && setError(e.message))
      .finally(() => !off && setUserLoading(false));
    return () => {
      off = true;
    };
  }, [userId]);

  useEffect(() => {
    let off = false;
    setMsgs([]);
    setNextPage(null);
    setLoading(true);
    stick.current = true;
    api('transactions/', { params: { user: userId, show: scope, page_size: PAGE } })
      .then((t) => {
        if (off) return;
        setMsgs([...t.results].reverse());
        setNextPage(t.next ? 2 : null);
      })
      .catch((e) => !off && setError(e.message))
      .finally(() => !off && setLoading(false));
    return () => {
      off = true;
    };
  }, [userId, scope]);

  useLayoutEffect(() => {
    if (stick.current) bottom.current?.scrollIntoView();
  }, [msgs]);

  const loadEarlier = useCallback(async () => {
    try {
      const t = await api('transactions/', {
        params: { user: userId, show: scope, page_size: PAGE, page: nextPage },
      });
      stick.current = false;
      setMsgs((m) => {
        const have = new Set(m.map((x) => x.id));
        return [...[...t.results].reverse().filter((x) => !have.has(x.id)), ...m];
      });
      setNextPage(t.next ? nextPage + 1 : null);
    } catch (e) {
      setError(e.message);
    }
  }, [userId, scope, nextPage]);

  async function send(e) {
    e.preventDefault();
    const amt = parseInt(amount, 10);
    if (!amt || amt < 1) return setError('Enter an amount of at least 1.');
    setSending(true);
    setError('');
    try {
      const t = await api('transactions/', {
        method: 'POST',
        body: {
          user: Number(userId),
          transaction_type: mode === 'pay' ? 'me_to_someone' : 'someone_to_me',
          message: note.trim(), // the API requires the key to be present
          amount: amt,
        },
      });
      stick.current = true;
      setMsgs((m) => [...m, t]);
      setAmount('');
      setNote('');
      refreshBalance();
      api(`users/${userId}/`).then(setOther).catch(() => {});
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  async function verify() {
    try {
      await api('verifyuser/', { method: 'POST', body: { candidate_id: other.id } });
      setOther({ ...other, is_active: true });
    } catch (err) {
      setError(err.message);
    }
  }

  if (userLoading) return <div className="empty-pane muted">Loading…</div>;
  if (!other)
    return (
      <div className="empty-pane">
        <div className="error">{error || 'Member not found.'}</div>
        <Link to="/chats" className="btn">
          Back
        </Link>
      </div>
    );

  const name = displayName(other);
  let lastDay = null;

  return (
    <div className="chat">
      <header className="bar">
        <Link to="/chats" className="icon-btn back" aria-label="Back">
          <Icon name="back" />
        </Link>
        <Avatar src={other.thumbnail} name={name} size={40} />
        <div className="grow">
          <div className="title">{name}</div>
          <div className="sub">
            @{other.username} · {COIN} {other.balance}
            {other.last_login && ` · seen ${fmtRel(other.last_login)}`}
          </div>
        </div>
        <Link className="chip" to={`/offerings?user=${other.id}`}>
          Offerings
        </Link>
        <Link className="chip" to={`/wants?user=${other.id}`}>
          Wants
        </Link>
      </header>

      {!other.is_active && (
        <div className="banner">
          <span>{name} is waiting for verification by a member of your exchange.</span>
          <button className="btn small primary" onClick={verify}>
            Verify
          </button>
        </div>
      )}

      <div className="scope">
        <div className="seg">
          <button className={scope === 'all' ? 'on' : ''} onClick={() => setScope('all')}>
            All of {name}'s transactions
          </button>
          <button className={scope === 'mine' ? 'on' : ''} onClick={() => setScope('mine')}>
            Between you &amp; {name}
          </button>
        </div>
      </div>

      <div className="messages">
        {nextPage && (
          <button className="load-more" onClick={loadEarlier}>
            Load earlier transactions
          </button>
        )}
        {loading && <div className="system">Loading transactions…</div>}
        {!loading && msgs.length === 0 && (
          <div className="system">
            {scope === 'all'
              ? `${name} has no transactions yet.`
              : 'No transactions between you yet. Say hello with a payment, or request coins below.'}
          </div>
        )}
        {msgs.map((t) => {
          const day = fmtDay(t.created_at);
          const sep = day !== lastDay;
          lastDay = day;
          // who is who in this transaction
          const who = (id, nm) => (id === me ? 'You' : nm || 'Member');
          const fromName = who(t.from_user, t.from_user_name);
          const toName = who(t.to_user, t.to_user_name);
          let side, debit, label;
          if (scope === 'mine') {
            // seen from my side: bubbles I started sit on the right
            debit = t.from_user === me;
            side = t.initiator === me ? 'out' : 'in';
            label = debit ? `You paid ${name}` : `${name} paid you`;
          } else {
            // seen from the opened member's side: what they paid sits on the right
            debit = t.from_user === other.id;
            side = debit ? 'out' : 'in';
            label = `${fromName} paid ${toName}`;
          }
          return (
            <div key={t.id} className="msg-wrap">
              {sep && <div className="day">{day}</div>}
              <div className={`bubble ${side}`}>
                <div className={`pay ${debit ? 'debit' : 'credit'}`}>
                  <div className="pay-label">{label}</div>
                  <div className="pay-amt">
                    {debit ? '−' : '+'} {COIN} {t.amount}
                  </div>
                </div>
                {t.description && <div className="note">{t.description}</div>}
                <span className="time">{fmtTime(t.created_at)}</span>
              </div>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>

      <form className="composer" onSubmit={send}>
        {error && (
          <div className="error toast" onClick={() => setError('')}>
            {error}
          </div>
        )}
        <div className="mode">
          <button type="button" className={mode === 'pay' ? 'on' : ''} onClick={() => setMode('pay')}>
            Pay {name}
          </button>
          <button
            type="button"
            className={mode === 'receive' ? 'on' : ''}
            onClick={() => setMode('receive')}
          >
            Receive from {name}
          </button>
        </div>
        <div className="inputs">
          <input
            className="amt"
            type="number"
            min="1"
            step="1"
            inputMode="numeric"
            placeholder={`${COIN} amount`}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <input
            className="msg"
            maxLength={255}
            placeholder="Add a message"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <button className="send" disabled={sending} aria-label="Send">
            <Icon name="send" />
          </button>
        </div>
      </form>
    </div>
  );
}
