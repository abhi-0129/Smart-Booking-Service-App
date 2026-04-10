import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, roles }) => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (roles && !roles.includes(user.user?.role)) {
    const roleRedirects = {
      customer: '/customer',
      provider: '/provider',
      admin: '/admin',
    };
    return <Navigate to={roleRedirects[user.user?.role] || '/login'} replace />;
  }

  return children;
};

export default ProtectedRoute;
