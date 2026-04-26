import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TrackingProvider } from './context/TrackingContext';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import StudentDashboard from './pages/StudentDashboard';
import Tracking from './pages/Tracking';
import DriverDashboard from './pages/DriverDashboard';
import AdminDashboard from './pages/AdminDashboard';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRole }) => {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" />;
  if (allowedRole && user.role !== allowedRole) {
    // Redirect to their respective dashboard if they try to access wrong portal
    return <Navigate to={`/${user.role}/dashboard`} />;
  }
  
  return children;
};

// Default redirect from root
const RootRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  return <Navigate to={`/${user.role}/dashboard`} />;
};

function App() {
  return (
    <AuthProvider>
      <TrackingProvider>
        <Router>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            
            {/* Student Routes */}
          <Route path="/student/dashboard" element={
            <ProtectedRoute allowedRole="student"><StudentDashboard /></ProtectedRoute>
          } />
          <Route path="/student/tracking" element={
            <ProtectedRoute allowedRole="student"><Tracking /></ProtectedRoute>
          } />
          
          {/* Driver Routes */}
          <Route path="/driver/dashboard" element={
            <ProtectedRoute allowedRole="driver"><DriverDashboard /></ProtectedRoute>
          } />
          
          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>
          } />
          
          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
      </TrackingProvider>
    </AuthProvider>
  );
}

export default App;
