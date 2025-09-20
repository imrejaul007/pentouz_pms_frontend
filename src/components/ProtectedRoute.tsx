import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles = [] }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  console.log('ProtectedRoute debug:', {
    isAuthenticated,
    user,
    allowedRoles,
    currentPath: location.pathname
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('User not authenticated, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    console.log('User role not allowed, redirecting:', user.role, 'allowed:', allowedRoles);
    // Redirect based on user role to their appropriate dashboard
    let redirectPath = '/';
    
    switch (user.role) {
      case 'admin':
        redirectPath = '/admin';
        break;
      case 'staff':
        redirectPath = '/staff';
        break;
      case 'guest':
        redirectPath = '/app';
        break;
      default:
        redirectPath = '/';
    }
    
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}