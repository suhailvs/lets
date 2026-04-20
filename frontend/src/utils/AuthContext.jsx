// src/context/AuthContext.js
import { createContext, useState } from 'react';
import API from './api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('user');
  });

  const login = (user) => {
    localStorage.setItem('user', user);
    try {
      const parsed = typeof user === 'string' ? JSON.parse(user) : user;
      if (parsed?.key) {
        API.defaults.headers.common['Authorization'] = `Token ${parsed.key}`;
      }
    } catch {
      // Ignore invalid user payload; server calls will fail with 401.
    }
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('user');
    delete API.defaults.headers.common['Authorization'];
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
