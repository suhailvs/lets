import { useEffect, useState } from 'react';
import { api } from './api.js';
import { useAuth } from './auth.jsx';
import { COIN, fmtDay, fmtTime } from './util.jsx';

export default function Transactions() {
  const { session } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let off = false;
    setLoading(true);
    api('transactions/', { params: { user: session.user_id, show: 'all', page_size: 30 } })
      .then(async (first) => {
        const results = [...(first.results || [])];
        let page = first.next ? 2 : null;
        while (page) {
          const next = await api('transactions/', {
            params: { user: session.user_id, show: 'all', page_size: 30, page },
          });
          results.push(...(next.results || []));
          page = next.next ? page + 1 : null;
        }
        if (!off) setTransactions(results);
      })
      .catch((e) => !off && setError(e.message))
      .finally(() => !off && setLoading(false));
    return () => { off = true; };
  }, [session.user_id]);

  return (
    <div className="detail">
      <header className="bar">
        <div className="grow title">My transactions</div>
      </header>
      <div className="messages">
        {loading && <div className="system">Loading transactions…</div>}
        {error && <div className="error m">{error}</div>}
        {!loading && !error && transactions.length === 0 && (
          <div className="system">You have no transactions yet.</div>
        )}
        {!loading && !error && transactions.map((t) => {
          const debit = t.from_user === session.user_id;
          const counterparty = debit ? t.to_user_name : t.from_user_name;
          const day = fmtDay(t.created_at);
          return (
            <div key={t.id} className="msg-wrap history-wrap">
              <div className="history-row">
                <div className={`history-icon ${debit ? 'debit' : 'credit'}`} aria-hidden="true">
                  {debit ? '↗' : '↙'}
                </div>
                <div className="history-info">
                  <div className="history-name">{counterparty || 'Member'}</div>
                  <div className="history-note">{t.description || (debit ? 'Payment sent' : 'Payment received')}</div>
                  <div className="history-time">{day} · {fmtTime(t.created_at)}</div>
                </div>
                <div className={`history-amount ${debit ? 'debit' : 'credit'}`}>
                  {debit ? '−' : '+'} {COIN} {t.amount}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
