import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getCookie } from '@/utils/storage';
import { FLEXSHARE_ACCESS_TOKEN } from '@/constant';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const location = useLocation();
  const token = getCookie(FLEXSHARE_ACCESS_TOKEN);

  // Check if user is authenticated
  // if (!token) {
  // Redirect to login page with return URL
  // return <Navigate to="/" state={{ from: location.pathname }} replace />;
  // }
  return children;
};

export default ProtectedRoute;
