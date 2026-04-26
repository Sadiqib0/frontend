import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AdminProvider, useAdmin } from './context/AdminContext';
import AuthPage from './pages/AuthPage';
import ElectionsPage from './pages/ElectionsPage';
import ElectionDetailPage from './pages/ElectionDetailPage';
import AdminDashboard from './pages/AdminDashboard';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/" replace />;
}

function AdminProtectedRoute({ children }) {
  const { admin } = useAdmin();
  return admin ? children : <Navigate to="/" replace />;
}

function GuestRoute({ children }) {
  const { user } = useAuth();
  const { admin } = useAdmin();
  if (user) return <Navigate to="/elections" replace />;
  if (admin) return <Navigate to="/admin/dashboard" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<GuestRoute><AuthPage /></GuestRoute>} />
      <Route path="/elections" element={<ProtectedRoute><ElectionsPage /></ProtectedRoute>} />
      <Route path="/elections/:position" element={<ProtectedRoute><ElectionDetailPage /></ProtectedRoute>} />
      <Route path="/admin/dashboard" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AdminProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </AdminProvider>
    </BrowserRouter>
  );
}
