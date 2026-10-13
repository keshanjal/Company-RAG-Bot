import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

import {
  getChatSessions,
  deleteChatSession,
} from "../../services/chatSessionService";

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const { user, logout } = useAuth();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const role = user?.role?.toLowerCase();

  // ========================================================
  // Load Chat Sessions
  // ========================================================

  useEffect(() => {
    async function loadSessions() {
      try {
        setLoading(true);

        const data = await getChatSessions();

        setSessions(data);
      } catch (error) {
        console.error(
          "Failed to load chat sessions:",
          error,
        );
      } finally {
        setLoading(false);
      }
    }

    loadSessions();
  }, []);

  // ========================================================
  // Listen for Dynamic Title Updates
  // ========================================================

  useEffect(() => {
    function handleUpdateTitle(event) {
      const { id, title } = event.detail || {};

      if (!id || !title) {
        return;
      }

      setSessions((previousSessions) => {
        const sessionExists = previousSessions.some(
          (session) =>
            String(session.id) === String(id),
        );

        if (sessionExists) {
          return previousSessions.map((session) =>
            String(session.id) === String(id)
              ? {
                  ...session,
                  title,
                }
              : session,
          );
        }

        return [
          {
            id,
            title,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          ...previousSessions,
        ];
      });
    }

    window.addEventListener(
      "update-session-title",
      handleUpdateTitle,
    );

    return () => {
      window.removeEventListener(
        "update-session-title",
        handleUpdateTitle,
      );
    };
  }, []);

  // ========================================================
  // New Chat
  // ========================================================

  function handleNewChat() {
    navigate("/chat");
  }

  // ========================================================
  // Delete Chat
  // ========================================================

  async function handleDeleteSession(
    event,
    sessionId,
  ) {
    event.preventDefault();
    event.stopPropagation();

    if (deletingId !== null) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this conversation?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(sessionId);

      await deleteChatSession(sessionId);

      setSessions((previousSessions) =>
        previousSessions.filter(
          (session) =>
            String(session.id) !==
            String(sessionId),
        ),
      );

      if (
        location.pathname ===
        `/chat/${sessionId}`
      ) {
        navigate("/chat", {
          replace: true,
        });
      }
    } catch (error) {
      console.error(
        "Failed to delete chat session:",
        error,
      );

      window.alert(
        "Failed to delete the conversation. Please try again.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  // ========================================================
  // Logout
  // ========================================================

  function handleLogout() {
    logout();

    navigate("/login", {
      replace: true,
    });
  }

  const userInitial =
    user?.username
      ?.charAt(0)
      ?.toUpperCase() || "U";

  return (
    <aside className="sidebar">

      {/* ====================================================
          Header
      ==================================================== */}

      <div className="sidebar-header">
        <div className="sidebar-logo">
          K
        </div>

        <div className="sidebar-title">
          Knowledge Bot
        </div>
      </div>


      {/* ====================================================
          New Chat
      ==================================================== */}

      <button
        type="button"
        className="new-chat-button"
        onClick={handleNewChat}
      >
        <span className="new-chat-icon">
          +
        </span>

        <span>New Chat</span>
      </button>


      {/* ====================================================
          Workspace
      ==================================================== */}

      <div className="sidebar-section">

        <div className="sidebar-section-title">
          Workspace
        </div>

        <button
          type="button"
          className={`sidebar-nav-item ${
            location.pathname.startsWith("/chat")
              ? "active"
              : ""
          }`}
          onClick={() => navigate("/chat")}
        >
          <span className="sidebar-nav-icon">
            💬
          </span>

          <span>Chat</span>
        </button>


        {/* ==================================================
            Management
        ================================================== */}

        {(role === "admin" ||
          role === "manager") && (
          <>
            <div className="sidebar-section-title management-title">
              Management
            </div>


            {role === "admin" && (
              <button
                type="button"
                className={`sidebar-nav-item ${
                  location.pathname === "/admin"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  navigate("/admin")
                }
              >
                <span className="sidebar-nav-icon">
                  ⚙
                </span>

                <span>Admin Dashboard</span>
              </button>
            )}


            {role === "manager" && (
              <button
                type="button"
                className={`sidebar-nav-item ${
                  location.pathname === "/manager"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  navigate("/manager")
                }
              >
                <span className="sidebar-nav-icon">
                  ◈
                </span>

                <span>Manager Dashboard</span>
              </button>
            )}
          </>
        )}


        {/* ==================================================
            Chat History
        ================================================== */}

        <div className="sidebar-section-title history-title">
          Chat History
        </div>

        {loading && (
          <div className="sidebar-empty">
            Loading conversations...
          </div>
        )}

        {!loading &&
          sessions.length === 0 && (
            <div className="sidebar-empty">
              No conversations yet.
            </div>
          )}

        {!loading &&
          sessions.length > 0 && (
            <div className="session-list">

              {sessions.map((session) => {
                const isActive =
                  location.pathname ===
                  `/chat/${session.id}`;

                const isDeleting =
                  deletingId === session.id;

                return (
                  <div
                    key={session.id}
                    className={`session-item ${
                      isActive
                        ? "active"
                        : ""
                    }`}
                  >

                    <button
                      type="button"
                      className="session-open"
                      onClick={() =>
                        navigate(
                          `/chat/${session.id}`,
                        )
                      }
                      title={
                        session.title ||
                        "New conversation"
                      }
                    >
                      <span className="session-icon">
                        💬
                      </span>

                      <span className="session-title">
                        {session.title ||
                          "New conversation"}
                      </span>
                    </button>


                    <button
                      type="button"
                      className="session-delete"
                      onClick={(event) =>
                        handleDeleteSession(
                          event,
                          session.id,
                        )
                      }
                      disabled={isDeleting}
                      aria-label={`Delete ${
                        session.title ||
                        "conversation"
                      }`}
                      title="Delete conversation"
                    >
                      {isDeleting
                        ? "..."
                        : "×"}
                    </button>

                  </div>
                );
              })}

            </div>
          )}

      </div>


      {/* ====================================================
          Account
      ==================================================== */}

      <div className="sidebar-bottom">

        <div className="sidebar-section-title account-title">
          Account
        </div>

        <button
          type="button"
          className={`sidebar-user ${
            location.pathname === "/profile"
              ? "active"
              : ""
          }`}
          onClick={() =>
            navigate("/profile")
          }
        >
          <div className="user-avatar">
            {userInitial}
          </div>

          <div className="user-info">

            <div className="user-name">
              {user?.username || "User"}
            </div>

            <div className="user-role">
              {user?.role || "employee"}
            </div>

          </div>
        </button>

        <button
          type="button"
          className="logout-button"
          onClick={handleLogout}
        >
          Logout
        </button>

      </div>

    </aside>
  );
}

export default Sidebar;