import { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';

import { API } from '../config.js';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('attendai_user')); } catch { return null; }
  });

  const token = localStorage.getItem('attendai_token');
  if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

  const setAuth = (data) => {
    if (data) {
      localStorage.setItem('attendai_token', data.token);
      localStorage.setItem('attendai_user', JSON.stringify(data.user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      setUser(data.user);
    } else {
      localStorage.removeItem('attendai_token');
      localStorage.removeItem('attendai_user');
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
    }
  };

  const login = useCallback(async (email, password) => {
    const { data } = await axios.post(`${API}/auth/login`, { email, password });
    setAuth(data);
    return data;
  }, []);

  const register = useCallback(async (name, email, password, institution, role) => {
    const { data } = await axios.post(`${API}/auth/register`, { name, email, password, institution, role });
    setAuth(data);
    return data;
  }, []);

  const logout = useCallback(() => setAuth(null), []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
