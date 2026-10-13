import { useState } from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";


function Login() {
  const navigate = useNavigate();

  const { login } = useAuth();


  // ==================================================
  // Form state
  // ==================================================

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });


  const [error, setError] = useState("");

  const [loading, setLoading] =
    useState(false);


  // ==================================================
  // Handle input changes
  // ==================================================

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }


  // ==================================================
  // Handle login
  // ==================================================

 async function handleSubmit(event) {
  event.preventDefault();

  if (loading) {
    return;
  }

  setError("");
  setLoading(true);

  try {
    const user = await login(formData);

    // ==============================================
    // Role-based redirect
    // ==============================================

    if (user.role === "admin") {
      navigate("/admin", { replace: true });
    } else if (user.role === "manager") {
      navigate("/manager", { replace: true });
    } else {
      navigate("/chat", { replace: true });
    }
  } catch (error) {
    const message =
      error.response?.data?.detail ||
      error.message ||
      "Unable to sign in. Please check your credentials.";

    setError(message);
  } finally {
    setLoading(false);
  }
}

  // ==================================================
  // UI
  // ==================================================

  return (
    <div className="auth-page">

      <div className="auth-card">

        {/* Logo */}

        <div className="auth-logo">
          K
        </div>


        {/* Heading */}

        <h1>
          Welcome back
        </h1>

        <p className="auth-description">
          Sign in to access your company knowledge
          assistant.
        </p>


        {/* Error */}

        {error && (
          <div
            className="auth-error"
            role="alert"
          >
            {error}
          </div>
        )}


        {/* Login form */}

        <form onSubmit={handleSubmit}>

          <div className="form-group">

            <label htmlFor="email">
              Email
            </label>

            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              autoComplete="email"
              disabled={loading}
              required
            />

          </div>


          <div className="form-group">

            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              autoComplete="current-password"
              disabled={loading}
              required
            />

          </div>


          {/* Submit */}

          <button
            className="auth-submit"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Signing in..."
              : "Sign in"}
          </button>

        </form>


        {/* Register link */}

        <p className="auth-footer">

          Don't have an account?{" "}

          <Link to="/register">
            Create an account
          </Link>

        </p>

      </div>

    </div>
  );
}


export default Login;

// a@gmail.com
// 123450909