import { useEffect, useState } from 'react';
import API from '../utils/api';
import { formatDate } from '../utils/formatDate';

export default function Transactions({ userId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [totalCount, setTotalCount] = useState(null);

  useEffect(() => {
    setData([]);
    setPage(1);
    setHasNext(false);
    setTotalCount(null);
    fetchPage(1, true);
  }, [userId]);

  const fetchPage = async (pageNumber, replace = false) => {
    const isFirstPage = pageNumber === 1;
    if (isFirstPage) setLoading(true);
    else setLoadingMore(true);
    try {
      const response = await API.get(`/transactions/?user=${userId}&page=${pageNumber}`);
      const payload = response.data;
      const rows = Array.isArray(payload?.results) ? payload.results : Array.isArray(payload) ? payload : [];

      setData((prev) => (replace ? rows : [...prev, ...rows]));
      setHasNext(Boolean(payload?.next));
      setTotalCount(typeof payload?.count === 'number' ? payload.count : null);
      setPage(pageNumber);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      if (replace) setData([]);
    } finally {
      if (isFirstPage) setLoading(false);
      else setLoadingMore(false);
    }
  };

  if (loading) {
    return <div>Loading transactions...</div>;
  }

  if (data.length === 0) {
    return <div className="alert alert-light border">No transactions yet.</div>;
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div className="text-muted small">
          Showing {data.length}
          {typeof totalCount === 'number' ? ` of ${totalCount}` : ''}.
        </div>
        {hasNext && (
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={() => fetchPage(page + 1, false)}
            disabled={loadingMore}
          >
            {loadingMore ? 'Loading...' : 'Load more'}
          </button>
        )}
      </div>

      <div className="list-group">
        {data.map((item) => {
          const isReceived = Boolean(item.is_received);
          return (
            <div className="list-group-item d-flex justify-content-between align-items-start" key={item.id}>
              <div>
                <div className="fw-semibold">
                  {isReceived ? `Received from ${item.buyer_name}` : `Paid to ${item.seller_name}`}
                </div>
                {item.description && <div className="text-muted small">{item.description}</div>}
                <div className="text-muted small">{formatDate(item.created_at)}</div>
              </div>
              <span className={`badge ${isReceived ? 'text-bg-success' : 'text-bg-primary'}`}>
                ℏ{isReceived ? '+' : '-'}{item.amount}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}
