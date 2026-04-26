import { createContext, useContext, useState } from 'react';
import { logoutAdmin } from '../api/admin';

const AdminContext = createContext(null);

const ADMIN_KEY = 'election_app_admin';
const POSITIONS_KEY = 'election_app_positions';

export function AdminProvider({ children }) {
  const [admin, setAdmin] = useState(() => {
    try {
      const stored = localStorage.getItem(ADMIN_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const login = (adminData) => {
    localStorage.setItem(ADMIN_KEY, JSON.stringify(adminData));
    setAdmin(adminData);
  };

  const logout = async () => {
    if (admin?.token) {
      try { await logoutAdmin(admin.token); } catch { /* ignore */ }
    }
    localStorage.removeItem(ADMIN_KEY);
    setAdmin(null);
  };

  return (
    <AdminContext.Provider value={{ admin, login, logout }}>
      {children}
    </AdminContext.Provider>
  );
}

export const useAdmin = () => useContext(AdminContext);

export const saveElectionPositions = (positions) =>
  localStorage.setItem(POSITIONS_KEY, JSON.stringify(positions));

export const loadElectionPositions = () => {
  try {
    const stored = localStorage.getItem(POSITIONS_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};
