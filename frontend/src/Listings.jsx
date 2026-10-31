import { useEffect, useState } from 'react';
import {
  Link,
  NavLink,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { api, apiAll } from './api.js';
import { useAuth } from './auth.jsx';
import { Avatar, Icon, catLabel, displayName, fmtDay, useCategories } from './util.jsx';

const slug = (type) => (type === 'O' ? 'offerings' : 'wants');

// ------------------------------------------------------------- sidebar list
export function ListingList({ type }) {
  const { session } = useAuth();
  const cats = useCategories();
  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [owner, setOwner] = useState(null);
  const [rev, setRev] = useState(0);

  const user = params.get('user') || 'all'; // all | me | <id>
  const userParam = user === 'me' ? session.user_id : user;
  const base = `/${slug(type)}`;

  useEffect(() => {
    const bump = () => setRev((r) => r + 1);
    window.addEventListener('listings-changed', bump);
    return () => window.removeEventListener('listings-changed', bump);
  }, []);

  useEffect(() => {
    let off = false;
    setItems(null);
    setError('');
    apiAll('listings/', { params: { type, user: userParam } })
      .then((d) => !off && setItems(d))
      .catch((e) => !off && setError(e.message));
    return () => {
      off = true;
    };
  }, [type, userParam, rev]);

  // name for the "listings by X" chip
  useEffect(() => {
    setOwner(null);
    if (user !== 'all' && user !== 'me' && Number(user) !== session.user_id) {
      api(`users/${user}/`).then(setOwner).catch(() => {});
    }
  }, [user, session.user_id]);

  const setScope = (v) => setParams(v === 'all' ? {} : { user: v });
  const needle = q.trim().toLowerCase();
  const shown = (items || []).filter(
    (l) =>
      (!cat || l.category === cat) &&
      (!needle || l.title.toLowerCase().includes(needle))
  );
  const otherUser = user !== 'all' && user !== 'me' && Number(user) !== session.user_id;
  const isMine = user === 'me' || Number(user) === session.user_id;

  return (
    <>
      <div className="search">
        <Icon name="search" size={18} />
        <input
          placeholder={`Search ${slug(type)}`}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <div className="filters">
        <div className="seg">
          <button className={user === 'all' ? 'on' : ''} onClick={() => setScope('all')}>
            Everyone
          </button>
          <button className={isMine ? 'on' : ''} onClick={() => setScope('me')}>
            Mine
          </button>
        </div>
        <select value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">All categories</option>
          {cats.map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </select>
      </div>
      {otherUser && (
        <div className="chip-row">
          <span className="chip on">
            {slug(type)} by {owner ? displayName(owner) : '…'}
            <button className="plain" onClick={() => setScope('all')} aria-label="Clear">
              <Icon name="close" size={14} />
            </button>
          </span>
        </div>
      )}

      <div className="list">
        {error && <div className="error m">{error}</div>}
        {!items && !error && <div className="muted center m">Loading…</div>}
        {items && shown.length === 0 && (
          <div className="muted center m">
            Nothing here yet. Tap + to {type === 'O' ? 'offer something' : 'post a want'}.
          </div>
        )}
        {shown.map((l) => (
          <NavLink key={l.id} to={`${base}/${l.id}`} className="row">
            <Avatar src={l.thumbnail} name={l.title} size={52} square />
            <div className="grow">
              <div className="row-top">
                <span className="name">{l.title}</span>
                <span className="when">{fmtDay(l.created_at)}</span>
              </div>
              <div className="row-sub">
                {l.rate && <b className="rate">{l.rate}</b>}
                <span>{catLabel(cats, l.category)}</span>
              </div>
            </div>
          </NavLink>
        ))}
      </div>

      <Link to={`${base}/new`} className="fab" aria-label="New listing">
        <Icon name="plus" size={26} />
      </Link>
    </>
  );
}

// ------------------------------------------------------------------- detail
export function ListingDetail() {
  const { id } = useParams();
  const { session } = useAuth();
  const nav = useNavigate();
  const cats = useCategories();
  const tab = useLocation().pathname.split('/')[1];
  const [l, setL] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let off = false;
    setL(null);
    setError('');
    api(`listings/${id}/`)
      .then((d) => !off && setL(d))
      .catch((e) => !off && setError(e.message));
    return () => {
      off = true;
    };
  }, [id]);

  if (error)
    return (
      <div className="empty-pane">
        <div className="error">{error}</div>
        <Link className="btn" to={`/${tab}`}>
          Back
        </Link>
      </div>
    );
  if (!l) return <div className="empty-pane muted">Loading…</div>;

  const owner = l.user;
  const mine = owner.id === session.user_id;

  async function toggleActive() {
    try {
      const d = await api(`listings/${id}/`, { method: 'PATCH', body: { is_active: !l.is_active } });
      setL(d);
      window.dispatchEvent(new Event('listings-changed'));
    } catch (e) {
      setError(e.message);
    }
  }

  async function remove() {
    if (!window.confirm('Delete this listing?')) return;
    try {
      await api(`listings/${id}/`, { method: 'DELETE' });
      window.dispatchEvent(new Event('listings-changed'));
      nav(`/${tab}`);
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="detail">
      <header className="bar">
        <Link to={`/${tab}`} className="icon-btn back" aria-label="Back">
          <Icon name="back" />
        </Link>
        <div className="grow">
          <div className="title">{l.listing_type === 'O' ? 'Offering' : 'Wanted'}</div>
          <div className="sub">
            {catLabel(cats, l.category)} · {fmtDay(l.created_at)}
          </div>
        </div>
        {mine && (
          <>
            <Link className="icon-btn" to={`/${tab}/${id}/edit`} title="Edit">
              <Icon name="edit" />
            </Link>
            <button className="icon-btn" onClick={remove} title="Delete">
              <Icon name="trash" />
            </button>
          </>
        )}
      </header>

      <div className="scroll">
        {l.image && <img className="hero" src={l.image} alt={l.title} />}
        <div className="card">
          <h2>{l.title}</h2>
          {l.rate && <div className="price">{l.rate}</div>}
          {!l.is_active && <span className="tag warn">Hidden from others</span>}
          <p className="desc">{l.description}</p>
        </div>

        <div className="card owner">
          <Avatar src={owner.thumbnail} name={displayName(owner)} size={46} />
          <div className="grow">
            <div className="name">{mine ? 'You' : displayName(owner)}</div>
            <div className="row-sub">@{owner.username}</div>
          </div>
          {mine ? (
            <button className="btn small" onClick={toggleActive}>
              {l.is_active ? 'Hide' : 'Show'}
            </button>
          ) : (
            <Link className="btn small primary" to={`/chats/${owner.id}`}>
              Message
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------- form
export function ListingForm({ type, editing = false }) {
  const { id } = useParams();
  const nav = useNavigate();
  const cats = useCategories();
  const tab = slug(type);
  const [f, setF] = useState({ category: '', title: '', description: '', rate: '' });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!editing) return;
    api(`listings/${id}/`)
      .then((l) => {
        setF({ category: l.category, title: l.title, description: l.description, rate: l.rate || '' });
        setPreview(l.image);
      })
      .catch((e) => setError(e.message));
  }, [editing, id]);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  function pick(e) {
    const file = e.target.files[0];
    setFile(file || null);
    if (file) setPreview(URL.createObjectURL(file));
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const fd = new FormData();
      Object.entries(f).forEach(([k, v]) => fd.append(k, v));
      if (!editing) fd.append('listing_type', type);
      if (file) fd.append('image', file);
      const res = await api(editing ? `listings/${id}/` : 'listings/', {
        method: editing ? 'PATCH' : 'POST',
        form: fd,
      });
      window.dispatchEvent(new Event('listings-changed'));
      nav(`/${tab}/${res.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const heading = `${editing ? 'Edit' : 'New'} ${type === 'O' ? 'offering' : 'want'}`;

  return (
    <div className="detail">
      <header className="bar">
        <Link to={editing ? `/${tab}/${id}` : `/${tab}`} className="icon-btn back" aria-label="Back">
          <Icon name="back" />
        </Link>
        <div className="grow title">{heading}</div>
      </header>
      <div className="scroll">
        <form className="form card" onSubmit={submit}>
          <label>
            Category
            <select value={f.category} onChange={set('category')} required>
              <option value="">Choose…</option>
              {cats.map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Title
            <input value={f.title} onChange={set('title')} maxLength={255} required />
          </label>
          <label>
            Description
            <textarea rows={5} value={f.description} onChange={set('description')} required />
          </label>
          <label>
            Rate
            <input
              value={f.rate}
              onChange={set('rate')}
              maxLength={100}
              placeholder="e.g. 50 per kg"
            />
          </label>
          <label>
            Photo (optional)
            <input type="file" accept="image/*" onChange={pick} />
          </label>
          {preview && <img className="preview" src={preview} alt="" />}
          {error && <div className="error">{error}</div>}
          <button className="btn primary" disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </button>
        </form>
      </div>
    </div>
  );
}
