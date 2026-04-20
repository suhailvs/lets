import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { AuthContext } from '../utils/AuthContext';

export default function ChangePassword() {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!password) {
      setError('New password is required.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await API.post('/change-password/', { password });
      setSuccess(response?.data?.message || 'Password changed successfully.');
      setPassword('');
      setConfirmPassword('');
      // Many apps force re-login after password change; keep this explicit and user-driven.
    } catch (err) {
      const data = err?.response?.data;
      if (typeof data === 'string') setError(data);
      else if (data) setError(JSON.stringify(data));
      else setError('Unable to change password.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="row">
      <div className="col-md-6 offset-md-3">
        <div className="card">
          <div className="card-body">
            <h3 className="card-title mb-3">Change Password</h3>

            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">New password</label>
                <input
                  type="password"
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="Enter a new password"
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Confirm new password</label>
                <input
                  type="password"
                  className="form-control"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="Re-enter the new password"
                />
              </div>

              <div className="d-flex gap-2">
                <button className="btn btn-primary" type="submit" disabled={loading}>
                  {loading ? 'Updating...' : 'Update password'}
                </button>
                <button className="btn btn-outline-secondary" type="button" onClick={() => navigate(-1)}>
                  Cancel
                </button>
                <button className="btn btn-outline-danger ms-auto" type="button" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            </form>

            <div className="text-muted small mt-3">
              Password rules are enforced by the server; if it rejects your password, try a longer one with a mix of characters.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

