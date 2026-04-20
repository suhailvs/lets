import { NavLink, useNavigate } from 'react-router-dom';
import { useContext, useState } from 'react';
import { AuthContext } from '../utils/AuthContext';

export default function Nav() {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const getUser = () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const user = getUser();
  if (!user) return null;

  const initials = user.username
    ? user.username.slice(0, 2).toUpperCase()
    : '??';

  const navLinks = [
    { to: '/dashboard', label: 'Members' },
    { to: '/listings', label: 'Listings' },
    ...(user?.user_id ? [{ to: `/user/${user.user_id}`, label: 'My Profile' }] : []),
    { to: '/map', label: 'Map' },
  ];

  return (
    <>
      <style>{`
        .kt-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          background: #fff;
          border-bottom: 1.5px solid #e8e8e8;
          font-family: 'DM Sans', sans-serif;
        }

        .kt-nav-inner {
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-sizing: border-box;
        }

        .kt-brand {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          text-decoration: none;
        }

        .kt-brand-badge {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: #1a8a5a;
          color: #fff;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.03em;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .kt-brand-name {
          font-size: 1rem;
          font-weight: 700;
          color: #111;
          letter-spacing: -0.02em;
        }

        .kt-brand-name span {
          color: #1a8a5a;
        }

        /* Desktop links */
        .kt-links {
          display: flex;
          align-items: center;
          gap: 0.15rem;
        }

        .kt-link {
          padding: 0.4rem 0.85rem;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          color: #555;
          text-decoration: none;
          transition: background 0.15s, color 0.15s;
          white-space: nowrap;
        }

        .kt-link:hover {
          background: #f4f4f4;
          color: #111;
        }

        .kt-link.active {
          background: #eaf4ee;
          color: #1a8a5a;
          font-weight: 600;
        }

        .kt-logout {
          margin-left: 0.5rem;
          padding: 0.4rem 0.9rem;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 600;
          background: #111;
          color: #fff;
          border: none;
          cursor: pointer;
          transition: background 0.15s;
          font-family: inherit;
        }

        .kt-logout:hover {
          background: #333;
        }

        /* Hamburger */
        .kt-hamburger {
          display: none;
          flex-direction: column;
          gap: 5px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 6px;
          border-radius: 8px;
        }

        .kt-hamburger:hover {
          background: #f4f4f4;
        }

        .kt-hamburger span {
          display: block;
          width: 22px;
          height: 2px;
          background: #111;
          border-radius: 2px;
          transition: all 0.2s;
          transform-origin: center;
        }

        .kt-hamburger.open span:nth-child(1) {
          transform: translateY(7px) rotate(45deg);
        }
        .kt-hamburger.open span:nth-child(2) {
          opacity: 0;
        }
        .kt-hamburger.open span:nth-child(3) {
          transform: translateY(-7px) rotate(-45deg);
        }

        /* Mobile menu */
        .kt-mobile-menu {
          display: none;
          background: #fff;
          border-top: 1px solid #f0f0f0;
        }

        .kt-mobile-menu.open {
          display: flex;
        }

        .kt-mobile-menu-inner {
          width: 100%;
          padding: 0.75rem 0 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          box-sizing: border-box;
        }

        .kt-mobile-link {
          padding: 0.65rem 0.85rem;
          border-radius: 10px;
          font-size: 0.95rem;
          font-weight: 500;
          color: #444;
          text-decoration: none;
          transition: background 0.15s, color 0.15s;
        }

        .kt-mobile-link:hover {
          background: #f5f5f5;
          color: #111;
        }

        .kt-mobile-link.active {
          background: #eaf4ee;
          color: #1a8a5a;
          font-weight: 600;
        }

        .kt-mobile-divider {
          height: 1px;
          background: #f0f0f0;
          margin: 0.5rem 0;
        }

        .kt-mobile-user {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem 0.85rem 0.75rem;
        }

        .kt-mobile-badge {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: #1a8a5a;
          color: #fff;
          font-size: 0.75rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .kt-mobile-username {
          font-size: 0.95rem;
          font-weight: 600;
          color: #111;
        }

        .kt-mobile-role {
          font-size: 0.75rem;
          color: #999;
        }

        .kt-mobile-logout {
          width: 100%;
          margin-top: 0.25rem;
          padding: 0.7rem;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 600;
          background: #111;
          color: #fff;
          border: none;
          cursor: pointer;
          font-family: inherit;
          transition: background 0.15s;
        }

        .kt-mobile-logout:hover {
          background: #333;
        }

        @media (max-width: 768px) {
          .kt-links {
            display: none;
          }
          .kt-hamburger {
            display: flex;
          }
        }
      `}</style>

      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <nav className="kt-nav">
        <div className="container kt-nav-inner">
          {/* Brand */}
          <a className="kt-brand" href="/">
            <div className="kt-brand-badge">{initials}</div>
            <span className="kt-brand-name">
              Koot<span>tam</span>
            </span>
          </a>

          {/* Desktop links */}
          <div className="kt-links">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  'kt-link' + (isActive ? ' active' : '')
                }
              >
                {link.label}
              </NavLink>
            ))}
            <button className="kt-logout" onClick={handleLogout}>
              Logout
            </button>
          </div>

          {/* Hamburger (mobile) */}
          <button
            className={`kt-hamburger${menuOpen ? ' open' : ''}`}
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        {/* Mobile menu */}
        <div className={`kt-mobile-menu${menuOpen ? ' open' : ''}`}>
          <div className="container kt-mobile-menu-inner">
            <div className="kt-mobile-user">
              <div className="kt-mobile-badge">{initials}</div>
              <div>
                <div className="kt-mobile-username">{user.username}</div>
                <div className="kt-mobile-role">LETS Member</div>
              </div>
            </div>

            <div className="kt-mobile-divider" />

            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  'kt-mobile-link' + (isActive ? ' active' : '')
                }
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}

            <div className="kt-mobile-divider" />

            <button className="kt-mobile-logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Spacer to push content below fixed nav */}
      <div style={{ height: '80px' }} />
    </>
  );
}
