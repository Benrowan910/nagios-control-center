import { Link, Outlet } from "react-router-dom";
import { useTheme } from "./context/ThemeContext";
import { useAuth } from "./context/AuthContext";

export default function Layout() {
  const { theme } = useTheme();
  const { authenticatedInstances, logoutAllInstances } = useAuth();

  const handleLogoutAll = () => {
    if (window.confirm("Are you sure you want to logout from all instances?")) {
      logoutAllInstances();
      // Clear all stored credentials
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('credentials_')) {
          sessionStorage.removeItem(key);
        }
      });
      window.location.reload();
    }
  };

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>Nagios Control Center</h1>
        </div>
        <nav className="sidebar-nav">
          <Link to="/" className="nav-link">
            Dashboard
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
          <div>© 2025 Nagios Fusion Lite</div>
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