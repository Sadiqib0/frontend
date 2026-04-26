import { createContext, useContext, useState, useEffect } from 'react';
import { logoutVoter } from '../api/auth';

const AuthContext = createContext(null);

const STORAGE_KEY = 'election_app_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  }, [user]);

  const login = (userData) => setUser(userData);

  const logout = async () => {
    if (user?.email) {
      try { await logoutVoter(user.email); } catch { /* ignore */ }
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
