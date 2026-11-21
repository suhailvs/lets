import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import { Avatar, COIN, Icon } from './util.jsx';
import { UserList } from './Users.jsx';
import { ListingList } from './Listings.jsx';

export function Empty() {
  return (
    <div className="empty-pane">
      <div className="logo big">◎</div>
      <h2>CoinApp for the web</h2>
      <p className="muted">
        Pick a member to pay or request coins, or browse what your exchange is offering and wants.
      </p>
    </div>
  );
}

export default function Shell() {
  const { session, balance, logout } = useAuth();
  const nav = useNavigate();
  const parts = useLocation().pathname.split('/').filter(Boolean);
  const tab = parts[0] || 'users';
  const hasPane = parts.length > 1 || tab === 'me' || tab === 'transactions';

  return (
    <div className={`app ${hasPane ? 'has-pane' : ''}`}>
      <aside className="sidebar">
        <header className="bar">
          <button className="plain" onClick={() => nav('/me')} title="My profile">
            <Avatar src={session.thumbnail} name={session.firstname || session.username} size={40} />
          </button>
          <div className="grow">
            <div className="title">{session.exchange_name}</div>
            <div className="sub">
              {session.firstname} · {balance === null ? '…' : `${COIN} ${balance}`}
            </div>
          </div>
          <NavLink className="icon-btn" to="/transactions" aria-label="My transactions" title="My transactions">
            <Icon name="history" />
          </NavLink>
          <button className="icon-btn" onClick={logout} title="Log out">
            <Icon name="logout" />
          </button>
        </header>

        <nav className="pills">
          <NavLink to="/users" className={tab === 'users' || tab === 'me' ? 'on' : ''}>
            Users
          </NavLink>
          <NavLink to="/offerings">Offerings</NavLink>
          <NavLink to="/wants">Wants</NavLink>
        </nav>

        {(tab === 'users' || tab === 'me') && <UserList />}
        {tab === 'offerings' && <ListingList type="O" />}
        {tab === 'wants' && <ListingList type="W" />}
      </aside>

      <main className="pane">
        <Outlet />
      </main>
    </div>
  );
}
