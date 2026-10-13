import { useAuth } from "../../context/AuthContext";

function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="app-header">
      <div className="brand">
        <div className="brand-logo">
          K
        </div>

        <div>
          <h2>Knowledge Bot</h2>
          <p>Company Knowledge Assistant</p>
        </div>
      </div>

      <div className="header-user">
        <div className="user-info">
          <span className="user-name">
            {user?.username}
          </span>

          <span className="user-role">
            {user?.role}
          </span>
        </div>

        <button
          className="logout-button"
          onClick={logout}
        >
          Logout
        </button>
      </div>
    </header>
  );
}

export default Header;