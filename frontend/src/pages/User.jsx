import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import API from '../utils/api';
import Listings from '../components/Listings';
import Transactions from '../components/Transactions';
import { openWhatsApp } from '../utils/openWhatsApp';
import { formatDate } from '../utils/formatDate';

export default function User() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialTab = searchParams.get('tab') || 'home';

  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(true);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState(initialTab);
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [txnType, setTxnType] = useState('buyer');
  const [txnLoading, setTxnLoading] = useState(false);
  const [txnError, setTxnError] = useState('');
  const [txnSuccess, setTxnSuccess] = useState('');

  const authUser = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}'), []);
  const isMe = String(authUser?.user_id) === String(id);

  useEffect(() => {
    fetchUser();
  }, [id]);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const fetchUser = async () => {
    setLoading(true);
    try {
      const response = await API.get(`/users/${id}/`);
      setUser(response.data);
    } catch (err) {
      console.error('Error fetching user:', err);
      setError('Unable to load user.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyUser = async () => {
    setError('');
    setVerifyLoading(true);
    try {
      await API.post('/verifyuser/', { candidate_id: user.id });
      fetchUser();
    } catch (err) {
      console.error('Error verifying user:', err);
      setError('Unable to verify user.');
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleSendMoney = async () => {
    setTxnError('');
    setTxnSuccess('');

    if (!amount || Number(amount) <= 0) {
      setTxnError('Please enter a valid amount.');
      return;
    }

    const actionLabel = txnType === 'seller' ? 'receive' : 'pay';
    if (!window.confirm(`Confirm to ${actionLabel} ℏ${amount} ${txnType === 'seller' ? 'from' : 'to'} ${user.first_name}?`)) {
      return;
    }

    setTxnLoading(true);
    try {
      await API.post('/transactions/', {
        user: id,
        amount,
        message,
        transaction_type: txnType,
      });
      setTxnSuccess('Transaction successful.');
      setAmount('');
      setMessage('');
    } catch (err) {
      console.error('Error sending money:', err);
      setTxnError(JSON.stringify(err.response?.data) || 'Unable to process transaction.');
    } finally {
      setTxnLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
        <div className="d-flex align-items-center gap-3">
          {user?.thumbnail ? (
            <img src={user.thumbnail} alt={user.first_name} className="rounded-circle" style={{ width: 64, height: 64, objectFit: 'cover' }} />
          ) : (
            <div className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center" style={{ width: 64, height: 64 }}>
              {user?.first_name?.[0] || 'U'}
            </div>
          )}
          <div>
            <h4 className="mb-0">{user.first_name || user.username}</h4>
            <div className="text-muted">ID {user.id} · {user.username}</div>
          </div>
        </div>
      </div>

      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button className={`nav-link ${tab === 'home' ? 'active' : ''}`} onClick={() => setTab('home')}>
            Home
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${tab === 'offerings' ? 'active' : ''}`} onClick={() => setTab('offerings')}>
            Offerings
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${tab === 'wants' ? 'active' : ''}`} onClick={() => setTab('wants')}>
            Wants
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${tab === 'transactions' ? 'active' : ''}`} onClick={() => setTab('transactions')}>
            Transactions
          </button>
        </li>
      </ul>

      {tab === 'home' && (
        <div className="row g-3">
          <div className="col-lg-6">
            <div className="card h-100">
              <div className="card-body">
                <h5 className="card-title">User Details</h5>
                <p className={`mb-1 ${user.balance >= 0 ? 'text-success' : 'text-danger'}`}>
                  Balance: ℏ{user.balance ?? 0}
                </p>
                <p className="mb-1">Email: {user.email || '-'}</p>
                <p className="mb-1">WhatsApp: {user.phone || '-'}</p>
                <p className="text-muted small">Last login: {formatDate(user.last_login, { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                {error && <div className="alert alert-danger">{error}</div>}
                {!user.is_active && !isMe && (
                  <button className="btn btn-warning" onClick={handleVerifyUser} disabled={verifyLoading}>
                    {verifyLoading ? 'Verifying...' : 'Verify User'}
                  </button>
                )}
                <div className="d-flex gap-2 mt-3">
                  {!isMe && user.phone && (
                    <button
                      className="btn btn-success"
                      type="button"
                      onClick={() => openWhatsApp(user.phone, '')}
                    >
                      WhatsApp
                    </button>
                  )}
                  {user.phone && (
                    <a className="btn btn-outline-secondary" href={`tel:${user.phone}`}>
                      Call
                    </a>
                  )}
                </div>
                {isMe && (
                  <div className="d-flex gap-2 mt-3">
                    <button className="btn btn-primary" onClick={() => navigate('/new-listing?type=O')}>
                      Add Offering
                    </button>
                    <button className="btn btn-outline-primary" onClick={() => navigate('/new-listing?type=W')}>
                      Add Want
                    </button>
                    <button className="btn btn-outline-secondary" onClick={() => navigate('/change-password')}>
                      Change Password
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {!isMe && (
            <div className="col-lg-6">
              <div className="card h-100">
                <div className="card-body">
                  <h5 className="card-title">Pay / Receive</h5>
                  <div className="btn-group mb-3" role="group">
                    <button
                      type="button"
                      className={`btn btn-outline-primary ${txnType === 'buyer' ? 'active' : ''}`}
                      onClick={() => setTxnType('buyer')}
                    >
                      Pay
                    </button>
                    <button
                      type="button"
                      className={`btn btn-outline-primary ${txnType === 'seller' ? 'active' : ''}`}
                      onClick={() => setTxnType('seller')}
                    >
                      Receive
                    </button>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Amount (ℏ)</label>
                    <input className="form-control" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Message (optional)</label>
                    <input className="form-control" value={message} onChange={(e) => setMessage(e.target.value)} />
                  </div>
                  {txnError && <div className="alert alert-danger">{txnError}</div>}
                  {txnSuccess && <div className="alert alert-success">{txnSuccess}</div>}
                  <button className="btn btn-primary" onClick={handleSendMoney} disabled={txnLoading}>
                    {txnLoading ? 'Processing...' : txnType === 'seller' ? 'Receive' : 'Pay'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'offerings' && (
        <Listings listingType="O" userId={id} showAddButton={isMe} />
      )}
      {tab === 'wants' && (
        <Listings listingType="W" userId={id} showAddButton={isMe} />
      )}
      {tab === 'transactions' && (
        <Transactions userId={id} />
      )}
    </div>
  );
}
