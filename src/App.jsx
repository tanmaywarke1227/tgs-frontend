import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import StudentDashboard from './pages/StudentDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import AdminDashboard from './pages/AdminDashboard';

// Protected Route — redirects to login if not authenticated
function ProtectedRoute({ children, allowedRole }) {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="loading-center">
      <div className="spinner" />
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;
  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  return children;
}

// Role router — redirects to correct dashboard
function RoleRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={`/${user.role}`} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<RoleRedirect />} />

          <Route path="/student" element={
            <ProtectedRoute allowedRole="student">
              <StudentDashboard />
            </ProtectedRoute>
          } />

          <Route path="/faculty" element={
            <ProtectedRoute allowedRole="faculty">
              <FacultyDashboard />
            </ProtectedRoute>
          } />

          <Route path="/admin" element={
            <ProtectedRoute allowedRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
