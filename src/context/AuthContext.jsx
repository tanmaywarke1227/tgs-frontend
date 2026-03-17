import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in on mount
  useEffect(() => {
    const stored = localStorage.getItem('tgs_user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/api/login', { email, password });
    const userData = res.data.user;
    setUser(userData);
    localStorage.setItem('tgs_user', JSON.stringify(userData));
    return userData;
  };

  const logout = async () => {
    try {
      await api.post('/api/logout');
    } catch (_) {}
    setUser(null);
    localStorage.removeItem('tgs_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
