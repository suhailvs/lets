import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from './api.js';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('session'));
    } catch {
      return null;
    }
  });
  const [balance, setBalance] = useState(null);

  const clear = useCallback(() => {
    localStorage.removeItem('session');
    localStorage.removeItem('token');
    setSession(null);
    setBalance(null);
  }, []);

  useEffect(() => {
    window.addEventListener('unauthorized', clear);
    return () => window.removeEventListener('unauthorized', clear);
  }, [clear]);

  const refreshBalance = useCallback(
    () =>
      api('ajax/', { params: { purpose: 'userbalance' } })
        .then((r) => setBalance(r.data))
        .catch(() => {}),
    []
  );

  useEffect(() => {
    if (session) refreshBalance();
  }, [session, refreshBalance]);

  async function login(username, password) {
    const d = await api('login/', { method: 'POST', body: { username, password }, auth: false });
    localStorage.setItem('token', d.key);
    localStorage.setItem('session', JSON.stringify(d));
    setSession(d);
  }

  async function logout() {
    try {
      await api('ajax/', { params: { purpose: 'logout' } });
    } catch {
      /* ignore – we clear locally anyway */
    }
    clear();
  }

  return (
    <Ctx.Provider value={{ session, balance, refreshBalance, login, logout }}>
      {children}
    </Ctx.Provider>
  );
}
