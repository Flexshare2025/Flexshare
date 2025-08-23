import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getCookie } from '@/utils/storage';
import { FLEXSHARE_ACCESS_TOKEN } from '@/constant';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const location = useLocation();
  const token = getCookie(FLEXSHARE_ACCESS_TOKEN);

  // Check if user is authenticated
  if (!token) {
    // Redirect to login page with return URL
    return <Navigate to="/" state={{ from: location.pathname }} replace />;
  }

  // If role is required, check user role (you can extend this logic)
  if (requiredRole) {
    // TODO: You can add role checking logic here
    // For now, just allow access if authenticated
  }

  return children;
};

export default ProtectedRoute;
