import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import { createLogger } from '../lib/logger';

const AuthContext = createContext(null);
const log = createLogger('Auth');

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Token'ı dinamik olarak al (localStorage'dan)
  const getToken = useCallback(() => {
    return localStorage.getItem('token');
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    log.info('Initializing auth', { hasToken: !!token });
    
    if (token) {
      api
        .get('/auth/me')
        .then((res) => {
          log.info('User loaded', { userId: res.data.user?.id });
          setUser(res.data.user);
        })
        .catch((err) => {
          log.warn('Token validation failed, removing token');
          localStorage.removeItem('token');
        })
        .finally(() => setLoading(false));
    } else {
      log.info('No token found, skipping auth check');
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    log.info('Login attempt', { email });
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    log.info('Login successful', { userId: res.data.user?.id });
    return res.data;
  };

  const register = async (name, email, password) => {
    log.info('Register attempt', { email, name });
    const res = await api.post('/auth/register', { name, email, password });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    log.info('Register successful', { userId: res.data.user?.id });
    return res.data;
  };

  const logout = () => {
    log.info('Logout', { userId: user?.id });
    localStorage.removeItem('token');
    setUser(null);
  };

  // Token'ı her render'da localStorage'dan al
  const token = getToken();

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
