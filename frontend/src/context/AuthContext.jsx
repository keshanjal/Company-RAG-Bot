import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  getCurrentUser,
  loginUser,
  registerUser,
} from "../services/authService";


const AuthContext = createContext(null);


export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);


  // ==================================================
  // Load authenticated user when application starts
  // ==================================================

  useEffect(() => {
    async function loadCurrentUser() {
      const token = localStorage.getItem(
        "access_token",
      );

      // No saved token
      if (!token) {
        setUser(null);
        setLoading(false);

        return;
      }

      try {
        const currentUser = await getCurrentUser();

        setUser(currentUser);

      } catch (error) {
        // Token is invalid or expired
        localStorage.removeItem(
          "access_token",
        );

        setUser(null);

      } finally {
        setLoading(false);
      }
    }

    loadCurrentUser();
  }, []);


  // ==================================================
  // Login
  // ==================================================

  async function login(credentials) {
    const tokenResponse = await loginUser(
      credentials,
    );

    const accessToken =
      tokenResponse.access_token;

    if (!accessToken) {
      throw new Error(
        "Access token was not returned by the server.",
      );
    }

    // Store JWT token
    localStorage.setItem(
      "access_token",
      accessToken,
    );

    try {
      // Get authenticated user information
      const currentUser =
        await getCurrentUser();

      setUser(currentUser);

      return currentUser;

    } catch (error) {
      // Remove token if /auth/me fails
      localStorage.removeItem(
        "access_token",
      );

      setUser(null);

      throw error;
    }
  }


  // ==================================================
  // Register
  // ==================================================

  async function register(userData) {
    return await registerUser(
      userData,
    );
  }


  // ==================================================
  // Logout
  // ==================================================

  function logout() {
    localStorage.removeItem(
      "access_token",
    );

    setUser(null);
  }


  // ==================================================
  // Authentication state
  // ==================================================

  const value = {
    user,

    loading,

    isAuthenticated: Boolean(user),

    // Used later for role-based access control
    role: user?.role ?? null,

    login,

    register,

    logout,
  };


  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}


export function useAuth() {
  const context = useContext(
    AuthContext,
  );

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider.",
    );
  }

  return context;
}