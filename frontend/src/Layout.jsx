import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

export default function Layout() {
  const { authenticatedInstances } = useAuth();
  const location = useLocation();

  // In your Layout.jsx, update the logout function:
  const handleLogoutAll = async () => {
    if (window.confirm("Are you sure you want to logout from all instances?")) {
      const sessionId = localStorage.getItem("sessionId");
      if (sessionId) {
        await fetch("/api/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId }),
        });
      }

      // Clear all stored credentials
      localStorage.removeItem("sessionId");
      localStorage.removeItem("loggedIn");
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith("credentials_")) {
          sessionStorage.removeItem(key);
        }
      });
      window.location.reload();
    }
  };

  const getActiveTab = () => {
    if (location.pathname.startsWith("/nna")) return "nna";
    if (location.pathname.startsWith("/logserver")) return "logserver";
    if (location.pathname.startsWith("/creator")) return "dashlet-creator";
    return "xi"; // Default to XI dashboard
  };

  const activeTab = getActiveTab();

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>Nagios Control Center</h1>
        </div>
        <nav className="sidebar-nav">
          <Link to="/" className="nav-link">
            Nagios XI
          </Link>

          {/* Conditionally render XI sub-tabs */}
          {activeTab === "xi" && (
            <div className="sub-nav">
              <Link
                to="/hostHealth"
                className={`nav-link sub-nav-link ${location.pathname === "/hostHealth" ? "active" : ""}`}
              >
                Host Health
              </Link>
              <Link
                to="/serviceHealth"
                className={`nav-link sub-nav-link ${location.pathname === "/serviceHealth" ? "active" : ""}`}
              >
                Service Health
              </Link>
            </div>
          )}

          <Link
            to="/logserver"
            className={`nav-link ${activeTab === "logserver" ? "active" : ""}`}
          >
            Nagios Log Server
          </Link>
          <Link
            to="/nna"
            className={`nav-link ${activeTab === "nna" ? "active" : ""}`}
          >
            Nagios Network Analyzer
          </Link>
          <Link
            to="/dashlet-creator"
            className={`nav-link ${activeTab === "dashlet-creator" ? "active" : ""}`}
          >
            Dashlet Creator
          </Link>
          <Link to="/settings" className="nav-link">
            Settings
          </Link>
        </nav>
        <div className="sidebar-footer">
          <div className="session-status">
            <span className="session-indicator"></span>
            {authenticatedInstances.length} instance(s) authenticated
          </div>
          <button
            onClick={handleLogoutAll}
            className="btn btn-sm btn-secondary"
            disabled={authenticatedInstances.length === 0}
          >
            Logout All
          </button>
          <div>© 2025 Nagios Control Center</div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        {/* Top Navbar */}
        <header className="top-navbar">
          <div className="navbar-search">
            <input
              type="text"
              placeholder="Search..."
              className="search-input"
            />
          </div>
          <div className="navbar-actions">
            <Link to="/settings" className="btn btn-primary">
              Settings
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
