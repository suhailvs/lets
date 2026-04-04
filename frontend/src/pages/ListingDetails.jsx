import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import API from '../utils/api';
import { formatDate } from '../utils/formatDate';
import { openWhatsApp } from '../utils/openWhatsApp';

export default function ListingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const authUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isMe = String(listing?.user?.id) === String(authUser?.user_id);

  useEffect(() => {
    fetchListing();
  }, [id]);

  const fetchListing = async () => {
    setLoading(true);
    try {
      const response = await API.get(`/listings/${id}/`);
      setListing(response.data);
    } catch (err) {
      console.error('Error fetching listing:', err);
      setError('Unable to load listing.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this listing?')) return;
    try {
      await API.delete(`/listings/${listing.id}/`);
      navigate('/dashboard');
    } catch (err) {
      console.error('Error deleting listing:', err);
      setError('Unable to delete listing.');
    }
  };

  const handleActivate = async (is_active) => {
    try {
      await API.patch(`/listings/${listing.id}/`, { is_active });
      fetchListing();
    } catch (err) {
      console.error('Error updating listing:', err);
      setError('Unable to update listing.');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!listing) return <div className="alert alert-warning">Listing not found.</div>;

  return (
    <div className="row">
      <div className="col-lg-8">
        <div className="card mb-3">
          <div className="card-body">
            <h3 className="card-title">{listing.title}</h3>
            <p className="text-muted">Added on {formatDate(listing.created_at, { year: 'numeric', month: 'long', day: '2-digit' })}</p>
            <div className="badge text-bg-secondary mb-3">Rate: ℏ{listing.rate}</div>
            {listing.image && (
              <img src={listing.image} alt={listing.title} className="img-fluid rounded mb-3" />
            )}
            <p style={{ whiteSpace: 'pre-wrap' }}>{listing.description}</p>
            {listing.is_active === false && (
              <div className="alert alert-warning">This listing is inactive.</div>
            )}
            {error && <div className="alert alert-danger">{error}</div>}
          </div>
        </div>
      </div>

      <div className="col-lg-4">
        <div className="card">
          <div className="card-body">
            <h5 className="card-title">Advertiser</h5>
            <p className="mb-1 fw-semibold">{listing.user?.first_name}</p>
            <p className={`mb-1 ${listing.user?.balance >= 0 ? 'text-success' : 'text-danger'}`}>
              Balance: ℏ{listing.user?.balance ?? 0}
            </p>
            <p className="text-muted small">Last login: {formatDate(listing.user?.last_login, { year: 'numeric', month: 'short', day: 'numeric' })}</p>
            <div className="d-grid gap-2 mt-3">
              {!isMe && (
                <>
                  <button
                    className="btn btn-success"
                    type="button"
                    onClick={() => openWhatsApp(listing.user?.phone, `I am interested in your advertisement ${listing.title}.`)}
                  >
                    WhatsApp
                  </button>
                  <a className="btn btn-outline-secondary" href={`tel:${listing.user?.phone}`}>
                    Call
                  </a>
                  <Link className="btn btn-outline-primary" to={`/user/${listing.user?.id}`}>
                    View User
                  </Link>
                </>
              )}
              {isMe && (
                <>
                  {listing.is_active ? (
                    <button className="btn btn-outline-warning" onClick={() => handleActivate(false)}>
                      Deactivate
                    </button>
                  ) : (
                    <button className="btn btn-outline-success" onClick={() => handleActivate(true)}>
                      Activate
                    </button>
                  )}
                  <button className="btn btn-outline-danger" onClick={handleDelete}>
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
