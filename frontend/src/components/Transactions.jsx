import { useEffect, useState } from 'react';
import API from '../utils/api';
import { formatDate } from '../utils/formatDate';

export default function Transactions({ userId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await API.get(`/transactions/?user=${userId}`);
      setData(response.data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading transactions...</div>;
  }

  if (data.length === 0) {
    return <div className="alert alert-light border">No transactions yet.</div>;
  }

  return (
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
              {isReceived ? '+' : '-'}{item.amount} KC
            </span>
          </div>
        );
      })}
    </div>
  );
}
