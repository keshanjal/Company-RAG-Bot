import { useAuth } from "../../context/AuthContext";
import AppLayout from "../../components/layout/AppLayout";

function Profile() {
  const { user } = useAuth();

  function getRoleLabel(role) {
    if (role === "admin") {
      return "Administrator";
    }

    if (role === "manager") {
      return "Manager";
    }

    return "Employee";
  }

  const initial =
    user?.username?.charAt(0)?.toUpperCase() || "U";

  return (
    <AppLayout>
      <div className="profile-page">

        {/* ==================================================
            Header
        ================================================== */}

        <header className="profile-header">
          <div>
            <div className="dashboard-eyebrow">
              ACCOUNT
            </div>

            <h1>Profile</h1>

            <p>
              View your account information and role.
            </p>
          </div>

          <div className="profile-role-badge">
            {getRoleLabel(user?.role)}
          </div>
        </header>

        {/* ==================================================
            Profile Overview
        ================================================== */}

        <section className="profile-overview-card">

          <div className="profile-avatar">
            {initial}
          </div>

          <div className="profile-overview-content">
            <h2>{user?.username || "-"}</h2>

            <p>
              {user?.email || "-"}
            </p>

            <span
              className={`profile-status ${
                user?.is_active
                  ? "active"
                  : "inactive"
              }`}
            >
              <span className="profile-status-dot" />

              {user?.is_active
                ? "Active account"
                : "Inactive account"}
            </span>
          </div>

        </section>

        {/* ==================================================
            Account Information
        ================================================== */}

        <section className="profile-section">

          <div className="profile-section-header">
            <div>
              <h2>Account Information</h2>

              <p>
                Your current account details.
              </p>
            </div>
          </div>

          <div className="profile-details-card">

            <div className="profile-detail">
              <span>User ID</span>

              <strong>
                #{user?.id ?? "-"}
              </strong>
            </div>

            <div className="profile-detail">
              <span>Username</span>

              <strong>
                {user?.username || "-"}
              </strong>
            </div>

            <div className="profile-detail">
              <span>Email</span>

              <strong>
                {user?.email || "-"}
              </strong>
            </div>

            <div className="profile-detail">
              <span>Role</span>

              <strong>
                {getRoleLabel(user?.role)}
              </strong>
            </div>

            <div className="profile-detail">
              <span>Account Status</span>

              <strong
                className={
                  user?.is_active
                    ? "profile-value-active"
                    : "profile-value-inactive"
                }
              >
                {user?.is_active
                  ? "Active"
                  : "Inactive"}
              </strong>
            </div>

          </div>

        </section>

        {/* ==================================================
            Access Information
        ================================================== */}

        <section className="profile-section">

          <div className="profile-section-header">
            <div>
              <h2>Access</h2>

              <p>
                Permissions associated with your current role.
              </p>
            </div>
          </div>

          <div className="profile-access-card">

            <div className="profile-access-icon">
              {user?.role === "admin"
                ? "A"
                : user?.role === "manager"
                  ? "M"
                  : "E"}
            </div>

            <div className="profile-access-content">

              <strong>
                {getRoleLabel(user?.role)} Access
              </strong>

              <p>
                {user?.role === "admin"
                  ? "You have administrative access to user management and system administration."
                  : user?.role === "manager"
                    ? "You have management access to team information and team activity."
                    : "You have employee access to the company knowledge assistant."}
              </p>

            </div>

          </div>

        </section>

      </div>
    </AppLayout>
  );
}

export default Profile;