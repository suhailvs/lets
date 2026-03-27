import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { formatDate } from '../utils/formatDate';

export default function Listings({ listingType, userId, showAddButton = false }) {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setData([]);
    setPage(1);
    setHasNext(true);
    fetchData(1, true);
  }, [listingType, userId]);

  const fetchData = async (pageNumber = page, replace = false) => {
    if (loading || refreshing || !hasNext) return;
    setLoading(true);
    try {
      const res = await API.get(`/listings/?type=${listingType}&user=${userId}&page=${pageNumber}`);
      const results = res.data?.results || [];
      setTotal(res.data?.count ?? results.length);
      setData((prev) => (replace ? results : [...prev, ...results]));
      if (res.data?.next) {
        setPage(pageNumber + 1);
        setHasNext(true);
      } else {
        setHasNext(false);
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await API.get(`/listings/?type=${listingType}&user=${userId}&page=1`);
      const results = res.data?.results || [];
      setData(results);
      setTotal(res.data?.count ?? results.length);
      setPage(2);
      setHasNext(!!res.data?.next);
    } catch (error) {
      console.error('Error refreshing listings:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const title = listingType === 'O' ? 'Offerings' : 'Wants';

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h5 className="mb-1">{title}</h5>
          <small className="text-muted">Browse the latest listings</small>
        </div>
        <div className="badge text-bg-light">Total {total}</div>
      </div>

      {data.length === 0 && !loading ? (
        <div className="alert alert-light border">No listings yet.</div>
      ) : (
        <div className="row g-3">
          {data.map((item) => (
            <div className="col-12 col-md-6" key={item.id}>
              <Link to={`/listing/${item.id}`} className="text-decoration-none">
                <div className="card h-100 listing-card">
                  <div className="card-body d-flex align-items-center gap-3">
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="listing-thumb"
                      />
                    ) : (
                      <div className="listing-fallback">
                        {item.title?.[0] || 'L'}
                      </div>
                    )}
                    <div className="flex-grow-1">
                      <h6 className="mb-1 text-dark">{item.title}</h6>
                      <div className="text-muted small">Rate: {item.rate} KC</div>
                      <div className="text-muted small">{formatDate(item.created_at)}</div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}

      <div className="d-flex gap-2 mt-3">
        <button className="btn btn-outline-secondary" type="button" onClick={onRefresh} disabled={refreshing}>
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
        <button className="btn btn-outline-primary" type="button" onClick={() => fetchData(page)} disabled={!hasNext || loading}>
          {loading ? 'Loading...' : hasNext ? 'Load more' : 'No more'}
        </button>
        {showAddButton && (
          <button
            className="btn btn-primary ms-auto"
            type="button"
            onClick={() => navigate(`/new-listing?type=${listingType}`)}
          >
            Add {listingType === 'O' ? 'Offering' : 'Want'}
          </button>
        )}
      </div>
    </div>
  );
}
