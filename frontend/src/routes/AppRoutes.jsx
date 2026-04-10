import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import CustomerDashboard from '../pages/CustomerDashboard';
import ProviderDashboard from '../pages/ProviderDashboard';
import AdminDashboard from '../pages/AdminDashboard';

const AppRoutes = () => {
  const { user } = useAuth();

  const getRoleHome = () => {
    if (!user) return '/login';
    const role = user.user?.role;
    if (role === 'customer') return '/customer';
    if (role === 'provider') return '/provider';
    if (role === 'admin') return '/admin';
    return '/login';
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={getRoleHome()} replace />} />
        <Route path="/login" element={user ? <Navigate to={getRoleHome()} /> : <Login />} />
        <Route path="/signup" element={user ? <Navigate to={getRoleHome()} /> : <Signup />} />

        <Route path="/customer/*" element={
          <ProtectedRoute roles={['customer']}>
            <CustomerDashboard />
          </ProtectedRoute>
        } />

        <Route path="/provider/*" element={
          <ProtectedRoute roles={['provider']}>
            <ProviderDashboard />
          </ProtectedRoute>
        } />

        <Route path="/admin/*" element={
          <ProtectedRoute roles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to={getRoleHome()} replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
