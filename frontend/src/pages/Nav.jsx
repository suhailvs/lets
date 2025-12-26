import { NavLink } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../utils/AuthContext';


export default function Nav() {
    const { isAuthenticated, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const getUser = () => {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    };

    const handleLogout = () => {
    //   localStorage.removeItem('user');
    logout();
      navigate('/login');
    };

    const user = getUser();
    // only show nav when logged in
    if (!user) return null;
    return (
        <>
            <nav className="navbar navbar-expand navbar-dark bg-dark fixed-top">
                <div className="container">
                    <a className='navbar-brand' href='/'>{user['username']}</a>
                    <div className="navbar-nav">
                        <NavLink to="/dashboard" className="nav-item nav-link">Users</NavLink>
                        <button onClick={handleLogout} className="btn btn-link nav-item nav-link">Logout</button>
                    </div>
                </div>
            </nav>
            <br /><br /><br /><br />
        </>
    );
}