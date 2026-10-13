import { useEffect, useMemo, useState } from "react";

import AppLayout from "../components/layout/AppLayout";
import { useAuth } from "../context/AuthContext";
import {
  getAdminUsers,
  updateAdminUserRole,
  updateAdminUserStatus,
  updateAdminUserManager,
} from "../services/adminService";

function AdminDashboard() {
  const { user } = useAuth();

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState("");

  const [selectedUser, setSelectedUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);

  // ========================================================
  // Load Users
  // ========================================================

  useEffect(() => {
    async function loadUsers() {
      try {
        setLoadingUsers(true);
        setError("");

        const data = await getAdminUsers();

        setUsers(data);
      } catch (error) {
        console.error(
          "Failed to load admin users:",
          error,
        );

        const message =
          error.response?.data?.detail ||
          "Failed to load users.";

        setError(message);
      } finally {
        setLoadingUsers(false);
      }
    }

    loadUsers();
  }, []);

  // ========================================================
  // Statistics
  // ========================================================

  const statistics = useMemo(() => {
    const total = users.length;

    const active = users.filter(
      (item) => item.is_active,
    ).length;

    const admins = users.filter(
      (item) => item.role === "admin",
    ).length;

    const managers = users.filter(
      (item) => item.role === "manager",
    ).length;

    const employees = users.filter(
      (item) => item.role === "employee",
    ).length;

    return {
      total,
      active,
      admins,
      managers,
      employees,
    };
  }, [users]);

  const activeManagers = useMemo(
    () => users.filter((item) => item.role === "manager" && item.is_active),
    [users],
  );

  // ========================================================
  // Role label
  // ========================================================

  function getRoleLabel(role) {
    if (role === "admin") {
      return "Administrator";
    }

    if (role === "manager") {
      return "Manager";
    }

    return "Employee";
  }

  // ========================================================
  // Open User Management
  // ========================================================

  function handleManageUser(selected) {
    setSelectedUser({
      ...selected,
    });

    setActionError("");
    setActionSuccess("");
  }

  // ========================================================
  // Close User Management
  // ========================================================

  function handleCloseModal() {
    if (saving) {
      return;
    }

    setSelectedUser(null);
    setActionError("");
    setActionSuccess("");
  }

  // ========================================================
  // Save User Changes
  // ========================================================

  async function handleSaveChanges() {
  if (!selectedUser) {
    return;
  }

  const originalUser = users.find(
    (item) => item.id === selectedUser.id,
  );

  if (!originalUser) {
    setActionError("User no longer exists.");
    return;
  }

  const roleChanged =
    originalUser.role !== selectedUser.role;

  const statusChanged =
    originalUser.is_active !== selectedUser.is_active;

  const managerChanged =
    selectedUser.role === "employee" &&
    (originalUser.manager_id ?? null) !== (selectedUser.manager_id ?? null);

  if (!roleChanged && !statusChanged && !managerChanged) {
    setSelectedUser(null);
    return;
  }

  // Confirm role change
  if (roleChanged) {
    setConfirmAction({
      type: "role",
      originalRole: originalUser.role,
      newRole: selectedUser.role,
    });

    return;
  }

  // Confirm deactivation
  if (
    statusChanged &&
    selectedUser.is_active === false
  ) {
    setConfirmAction({
      type: "deactivate",
    });

    return;
  }

  // Activation does not require confirmation
  await performSaveChanges(
    originalUser,
    selectedUser,
  );
}

async function performSaveChanges(
  originalUser,
  updatedUser,
) {
  try {
    setSaving(true);
    setActionError("");
    setActionSuccess("");

    if (
      originalUser.role !== updatedUser.role
    ) {
      await updateAdminUserRole(
        updatedUser.id,
        updatedUser.role,
      );
    }

    if (
      originalUser.is_active !==
      updatedUser.is_active
    ) {
      await updateAdminUserStatus(
        updatedUser.id,
        updatedUser.is_active,
      );
    }

    if (
      updatedUser.role === "employee" &&
      (originalUser.manager_id ?? null) !== (updatedUser.manager_id ?? null)
    ) {
      await updateAdminUserManager(
        updatedUser.id,
        updatedUser.manager_id ?? null,
      );
    }

    const updatedUsers = await getAdminUsers();

    setUsers(updatedUsers);

    setSelectedUser(null);
    setConfirmAction(null);

    setActionSuccess(
      "User updated successfully.",
    );
  } catch (error) {
    console.error(
      "Failed to update user:",
      error,
    );

    setActionError(
      error.response?.data?.detail ||
        "Failed to update user.",
    );
  } finally {
    setSaving(false);
  }
}

async function handleConfirmAction() {
  if (!confirmAction || !selectedUser) {
    return;
  }

  const originalUser = users.find(
    (item) => item.id === selectedUser.id,
  );

  if (!originalUser) {
    setActionError("User no longer exists.");
    setConfirmAction(null);
    return;
  }

  await performSaveChanges(
    originalUser,
    selectedUser,
  );
}

  return (
    <AppLayout>
      <div className="admin-dashboard">

        {/* ==================================================
            Header
        ================================================== */}

        <div className="admin-dashboard-header">
          <div>
            <div className="dashboard-eyebrow">
              Administration
            </div>

            <h1>
              Welcome back, {user?.username}
            </h1>

            <p>
              Manage users and monitor your company
              knowledge system.
            </p>
          </div>

          <div className="dashboard-role-badge">
            Administrator
          </div>
        </div>

        {/* ==================================================
            Overview
        ================================================== */}

        <section className="dashboard-section">
          <div className="dashboard-section-header">
            <div>
              <h2>Overview</h2>

              <p>
                Current user and account statistics.
              </p>
            </div>
          </div>

          <div className="admin-overview-grid">

            <div className="admin-info-card">
              <div className="admin-info-card-icon">
                U
              </div>

              <div className="admin-info-card-content">
                <span>Total Users</span>

                <strong>
                  {loadingUsers
                    ? "..."
                    : statistics.total}
                </strong>

                <small>
                  Registered accounts
                </small>
              </div>
            </div>

            <div className="admin-info-card">
              <div className="admin-info-card-icon">
                ✓
              </div>

              <div className="admin-info-card-content">
                <span>Active Users</span>

                <strong className="status-active">
                  {loadingUsers
                    ? "..."
                    : statistics.active}
                </strong>

                <small>
                  Currently active accounts
                </small>
              </div>
            </div>

            <div className="admin-info-card">
              <div className="admin-info-card-icon">
                A
              </div>

              <div className="admin-info-card-content">
                <span>Administrators</span>

                <strong>
                  {loadingUsers
                    ? "..."
                    : statistics.admins}
                </strong>

                <small>
                  Users with admin access
                </small>
              </div>
            </div>

          </div>
        </section>

        {/* ==================================================
            User Distribution
        ================================================== */}

        <section className="dashboard-section">
          <div className="dashboard-section-header">
            <div>
              <h2>User Distribution</h2>

              <p>
                Current users by role.
              </p>
            </div>
          </div>

          <div className="role-summary-grid">

            <div className="role-summary-card">
              <span>Employees</span>

              <strong>
                {loadingUsers
                  ? "..."
                  : statistics.employees}
              </strong>
            </div>

            <div className="role-summary-card">
              <span>Managers</span>

              <strong>
                {loadingUsers
                  ? "..."
                  : statistics.managers}
              </strong>
            </div>

            <div className="role-summary-card">
              <span>Administrators</span>

              <strong>
                {loadingUsers
                  ? "..."
                  : statistics.admins}
              </strong>
            </div>

          </div>
        </section>

        {/* ==================================================
            User Management
        ================================================== */}

        <section className="dashboard-section">
          <div className="dashboard-section-header">
            <div>
              <h2>User Management</h2>

              <p>
                View and manage registered accounts and
                their access levels.
              </p>
            </div>
          </div>

          {error && (
            <div className="admin-error">
              {error}
            </div>
          )}

          <div className="user-table-card">

            {loadingUsers ? (
              <div className="admin-table-loading">
                Loading users...
              </div>
            ) : users.length === 0 ? (
              <div className="admin-table-empty">
                No users found.
              </div>
            ) : (
              <div className="user-table-wrapper">

                <table className="user-table">

                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {users.map((item) => {
                      const initial =
                        item.username
                          ?.charAt(0)
                          ?.toUpperCase() || "U";

                      return (
                        <tr key={item.id}>

                          <td>
                            <div className="table-user">

                              <div className="table-user-avatar">
                                {initial}
                              </div>

                              <div>
                                <div className="table-user-name">
                                  {item.username}
                                </div>

                                <div className="table-user-id">
                                  ID #{item.id}
                                </div>
                              </div>

                            </div>
                          </td>

                          <td>
                            <span className="table-email">
                              {item.email}
                            </span>
                          </td>

                          <td>
                            <span
                              className={`user-role-badge role-${item.role}`}
                            >
                              {getRoleLabel(item.role)}
                            </span>
                          </td>

                          <td>
                            <span
                              className={`user-status ${
                                item.is_active
                                  ? "active"
                                  : "inactive"
                              }`}
                            >
                              <span className="status-dot" />

                              {item.is_active
                                ? "Active"
                                : "Inactive"}
                            </span>
                          </td>

                          <td>
                            <button
                              type="button"
                              className="admin-manage-button"
                              onClick={() =>
                                handleManageUser(item)
                              }
                            >
                              Manage
                            </button>
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>

                </table>

              </div>
            )}

          </div>
        </section>

        {/* ==================================================
            Account
        ================================================== */}

        <section className="dashboard-section">
          <div className="dashboard-section-header">
            <div>
              <h2>Account</h2>

              <p>
                Your current administrator account.
              </p>
            </div>
          </div>

          <div className="admin-account-card">
            <div>
              <span>Username</span>

              <strong>
                {user?.username || "-"}
              </strong>
            </div>

            <div>
              <span>Email</span>

              <strong>
                {user?.email || "-"}
              </strong>
            </div>

            <div>
              <span>Role</span>

              <strong>
                {getRoleLabel(user?.role)}
              </strong>
            </div>
          </div>
        </section>

        {/* ==================================================
            Manage User Modal
        ================================================== */}

        {selectedUser && (
          <div
            className="admin-modal-overlay"
            onMouseDown={(event) => {
              if (
                event.target === event.currentTarget &&
                !saving
              ) {
                handleCloseModal();
              }
            }}
          >
            <div
              className="admin-modal"
              onMouseDown={(event) =>
                event.stopPropagation()
              }
            >

              <div className="admin-modal-header">
                <div>
                  <span className="dashboard-eyebrow">
                    USER MANAGEMENT
                  </span>

                  <h2>Manage User</h2>
                </div>

                <button
                  type="button"
                  className="admin-modal-close"
                  onClick={handleCloseModal}
                  disabled={saving}
                >
                  ×
                </button>
              </div>

              <div className="admin-user-details">

                <div>
                  <span>Username</span>

                  <strong>
                    {selectedUser.username}
                  </strong>
                </div>

                <div>
                  <span>Email</span>

                  <strong>
                    {selectedUser.email}
                  </strong>
                </div>

                <div>
                  <span>User ID</span>

                  <strong>
                    #{selectedUser.id}
                  </strong>
                </div>

              </div>

              {/* Role */}

              <div className="admin-form-group">
                <label htmlFor="user-role">
                  Role
                </label>

                <select
                  id="user-role"
                  value={selectedUser.role}
                  onChange={(event) =>
                    setSelectedUser({
                      ...selectedUser,
                      role: event.target.value,
                    })
                  }
                  disabled={saving}
                >
                  <option value="employee">
                    Employee
                  </option>

                  <option value="manager">
                    Manager
                  </option>

                  <option value="admin">
                    Administrator
                  </option>
                </select>
              </div>

              {/* Manager assignment: employees only */}

              {selectedUser.role === "employee" && (
                <div className="admin-form-group">
                  <label htmlFor="user-manager">
                    Assign Manager
                  </label>

                  <select
                    id="user-manager"
                    value={selectedUser.manager_id ?? ""}
                    onChange={(event) =>
                      setSelectedUser({
                        ...selectedUser,
                        manager_id: event.target.value
                          ? Number(event.target.value)
                          : null,
                      })
                    }
                    disabled={saving}
                  >
                    <option value="">No manager assigned</option>
                    {activeManagers
                      .filter((manager) => manager.id !== selectedUser.id)
                      .map((manager) => (
                        <option key={manager.id} value={manager.id}>
                          {manager.username} ({manager.email})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Status */}

              <div className="admin-form-group">
                <label htmlFor="user-status">
                  Account Status
                </label>

                <select
                  id="user-status"
                  value={
                    selectedUser.is_active
                      ? "active"
                      : "inactive"
                  }
                  onChange={(event) =>
                    setSelectedUser({
                      ...selectedUser,
                      is_active:
                        event.target.value ===
                        "active",
                    })
                  }
                  disabled={saving}
                >
                  <option value="active">
                    Active
                  </option>

                  <option value="inactive">
                    Inactive
                  </option>
                </select>
              </div>

              {/* Messages */}

              {actionError && (
                <div className="admin-action-error">
                  {actionError}
                </div>
              )}

              {actionSuccess && (
                <div className="admin-action-success">
                  {actionSuccess}
                </div>
              )}

              {/* Actions */}

              <div className="admin-modal-actions">

                <button
                  type="button"
                  className="admin-cancel-button"
                  onClick={handleCloseModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="admin-save-button"
                  onClick={handleSaveChanges}
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>

              </div>

            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
}

export default AdminDashboard;