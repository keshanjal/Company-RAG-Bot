import { useEffect, useMemo, useState } from "react";

import AppLayout from "../components/layout/AppLayout";
import { useAuth } from "../context/AuthContext";
import {
  getManagerQueries,
  getManagerTeam,
} from "../services/managerService";

function ManagerDashboard() {
  const { user } = useAuth();

  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [queries, setQueries] = useState([]);
  const [queriesLoading, setQueriesLoading] = useState(true);

  useEffect(() => {
    async function loadTeam() {
      try {
        setLoading(true);
        setError("");

        const data = await getManagerTeam();
        setTeamMembers(data);
      } catch (err) {
        setError(
          err.response?.data?.detail ||
            "Failed to load team members.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadTeam();
  }, []);

  useEffect(() => {
    async function loadQueries() {
      try {
        setQueriesLoading(true);

        const data = await getManagerQueries();
        setQueries(data);
      } catch (err) {
        console.error(
          "Failed to load manager queries:",
          err,
        );
      } finally {
        setQueriesLoading(false);
      }
    }

    loadQueries();
  }, []);

  const activeMembers = useMemo(
    () =>
      teamMembers.filter(
        (member) => member.is_active,
      ).length,
    [teamMembers],
  );

  return (
    <AppLayout>
      <div className="manager-dashboard">

        {/* ==================================================
            Header
        ================================================== */}
        <header className="manager-dashboard-header">
          <div>
            <div className="dashboard-eyebrow">
              MANAGEMENT
            </div>

            <h1>Manager Dashboard</h1>

            <p>
              Monitor team members and account activity
              from one place.
            </p>
          </div>

          <div className="dashboard-role-badge">
            MANAGER
          </div>
        </header>

        {/* ==================================================
            Overview
        ================================================== */}
        <section className="manager-overview-grid">
          <div className="manager-info-card">
            <span className="manager-card-label">
              Team Members
            </span>

            <strong>
              {loading ? "..." : teamMembers.length}
            </strong>

            <span className="manager-card-description">
              Employees in your management view
            </span>
          </div>

          <div className="manager-info-card">
            <span className="manager-card-label">
              Active Members
            </span>

            <strong>
              {loading ? "..." : activeMembers}
            </strong>

            <span className="manager-card-description">
              Currently active accounts
            </span>
          </div>

          <div className="manager-info-card">
            <span className="manager-card-label">
              Recent Queries
            </span>

            <strong>
              {queriesLoading ? "..." : queries.length}
            </strong>

            <span className="manager-card-description">
              Recent questions from the team
            </span>
          </div>
        </section>

        {/* ==================================================
            Team Members
        ================================================== */}
        <section className="manager-section">
          <div className="manager-section-header">
            <div>
              <h2>Team Members</h2>

              <p>
                Employees available in your management
                view.
              </p>
            </div>
          </div>

          {loading && (
            <div className="manager-state">
              Loading team members...
            </div>
          )}

          {!loading && error && (
            <div className="manager-state manager-state-error">
              {error}
            </div>
          )}

          {!loading &&
            !error &&
            teamMembers.length === 0 && (
              <div className="manager-state">
                No team members found.
              </div>
            )}

          {!loading &&
            !error &&
            teamMembers.length > 0 && (
              <div className="manager-table-card">
                <div className="manager-table-wrapper">
                  <table className="manager-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>ID</th>
                      </tr>
                    </thead>

                    <tbody>
                      {teamMembers.map((member) => (
                        <tr key={member.id}>
                          <td>
                            <div className="manager-user">
                              <div className="manager-user-avatar">
                                {member.username
                                  ?.charAt(0)
                                  .toUpperCase()}
                              </div>

                              <span>
                                {member.username}
                              </span>
                            </div>
                          </td>

                          <td>{member.email}</td>

                          <td>
                            <span className="manager-role-badge">
                              {member.role}
                            </span>
                          </td>

                          <td>
                            <span
                              className={
                                member.is_active
                                  ? "manager-status active"
                                  : "manager-status inactive"
                              }
                            >
                              <span className="manager-status-dot" />

                              {member.is_active
                                ? "Active"
                                : "Inactive"}
                            </span>
                          </td>

                          <td>#{member.id}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
        </section>

        {/* ==================================================
            Recent Team Queries
        ================================================== */}
        <section className="manager-section">
          <div className="manager-section-header">
            <div>
              <h2>Recent Team Queries</h2>

              <p>
                Recent questions submitted to the
                knowledge assistant.
              </p>
            </div>
          </div>

          {queriesLoading && (
            <div className="manager-state">
              Loading recent queries...
            </div>
          )}

          {!queriesLoading &&
            queries.length === 0 && (
              <div className="manager-state">
                No queries found.
              </div>
            )}

          {!queriesLoading &&
            queries.length > 0 && (
              <div className="manager-query-list">
                {queries.map((query) => (
                  <div
                    className="manager-query-item"
                    key={query.id}
                  >
                    <div className="manager-query-avatar">
                      {query.username
                        ?.charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="manager-query-content">
                      <div className="manager-query-meta">
                        <strong>
                          {query.username}
                        </strong>

                        <span>
                          {new Date(
                            query.created_at,
                          ).toLocaleString()}
                        </span>
                      </div>

                      <p>{query.question}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </section>

        {/* ==================================================
            Account
        ================================================== */}
        <section className="manager-section">
          <div className="manager-section-header">
            <div>
              <h2>Account</h2>

              <p>
                Your current management account.
              </p>
            </div>
          </div>

          <div className="manager-account-card">
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
                {user?.role || "-"}
              </strong>
            </div>
          </div>
        </section>

      </div>
    </AppLayout>
  );
}

export default ManagerDashboard;