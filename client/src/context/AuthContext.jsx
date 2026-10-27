import { createContext, useContext, useEffect, useState } from 'react';
import { api, TOKEN_KEY } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem(TOKEN_KEY)));

  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return;
    api('/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  const saveSession = ({ token, user }) => {
    localStorage.setItem(TOKEN_KEY, token);
    setUser(user);
  };

  const login = async (email, password) => saveSession(await api('/auth/login', { method: 'POST', body: { email, password } }));

  const register = async (username, email, password) =>
    saveSession(await api('/auth/register', { method: 'POST', body: { username, email, password } }));

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
