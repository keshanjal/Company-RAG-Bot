import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Login from "../pages/Login";
import Register from "../pages/Register";

import Profile from "../pages/profile/Profile";
import AdminDashboard from "../pages/AdminDashboard";    
import ManagerDashboard from "../pages/ManagerDashboard";

import Chat from "../pages/chat/Chat";

import { useAuth } from "../context/AuthContext";
import ProtectedRoute from "./ProtectedRoute";

// ========================================================
// Home Redirect
// ========================================================

function HomeRedirect() {
  const {
    isAuthenticated,
    loading,
  } = useAuth();

  if (loading) {
    return (
      <div className="app-loading">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return (
    <Navigate
      to="/chat"
      replace
    />
  );
}

// ========================================================
// App Routes
// ========================================================

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ==================================================
            Home
        ================================================== */}
        <Route
          path="/"
          element={<HomeRedirect />}
        />

        {/* ==================================================
            Public Routes
        ================================================== */}
        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        {/* ==================================================
            Chat
            All authenticated users can access Chat
        ================================================== */}
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />

        <Route
          path="/chat/:sessionId"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />

        {/* ==================================================
            Profile
            All authenticated users can access Profile
        ================================================== */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* ==================================================
            Admin Dashboard
            Admin only
        ================================================== */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* ==================================================
            Manager Dashboard
            Manager only
        ================================================== */}
        <Route
          path="/manager"
          element={
            <ProtectedRoute allowedRoles={["manager", "admin"]}>
              <ManagerDashboard />
            </ProtectedRoute>
          }
        />

        {/* ==================================================
            Unknown Route
        ================================================== */}
        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;