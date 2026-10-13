import { Navigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children, allowedRoles }) {
  const {
    isAuthenticated,
    loading,
    role,
  } = useAuth();

  // Wait until authentication check is completed
  if (loading) {
    return (
      <div className="app-loading">
        Loading...
      </div>
    );
  }

  // Redirect unauthenticated users
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  // Check role if allowedRoles are provided
  if (
    allowedRoles &&
    allowedRoles.length > 0 &&
    !allowedRoles.includes(role)
  ) {
    return (
      <Navigate
        to="/chat"
        replace
      />
    );
  }

  return children;
}

export default ProtectedRoute;