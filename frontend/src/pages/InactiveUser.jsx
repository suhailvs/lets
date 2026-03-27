import { useLocation, useNavigate } from 'react-router-dom';

export default function InactiveUser() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const username = params.get('username') || '';
  const isActive = params.get('is_active') || 'false';

  return (
    <div className="row justify-content-center">
      <div className="col-md-8">
        <div className="card">
          <div className="card-body">
            <h4 className="card-title">Signup Successful</h4>
            <p>Welcome {username}! Your account has been created successfully.</p>
            <div className="alert alert-light border">
              Username: <strong>{username}</strong>
            </div>
            {isActive === 'false' && (
              <div className="alert alert-warning">
                Your account is inactive. Please wait for approval from your exchange.
              </div>
            )}
            <button className="btn btn-primary" onClick={() => navigate('/login')}>
              Go to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
