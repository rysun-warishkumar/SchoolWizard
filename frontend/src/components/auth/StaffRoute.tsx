import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import StaffLayout from '../../layouts/StaffLayout';

interface StaffRouteProps {
  children: ReactNode;
}

const StaffRoute: React.FC<StaffRouteProps> = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Allow staff, teacher, and other staff roles
  const allowedRoles = ['staff', 'teacher', 'admin', 'superadmin'];
  if (!user?.role || !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <StaffLayout>{children}</StaffLayout>;
};

export default StaffRoute;

