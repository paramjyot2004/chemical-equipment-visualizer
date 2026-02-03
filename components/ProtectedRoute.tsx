import React from 'react';

interface ProtectedRouteProps {
  isAuthenticated: boolean;
  children: React.ReactNode;
  fallback: React.ReactNode;
}

/**
 * Simple route protection component
 * Shows children if authenticated, otherwise shows fallback (usually Login)
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  isAuthenticated,
  children,
  fallback,
}) => {
  return isAuthenticated ? <>{children}</> : <>{fallback}</>;
};
