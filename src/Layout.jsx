import { Link, Outlet } from "react-router-dom";
import { useTheme } from "./context/ThemeContext";

export default function Layout() {
  const { theme } = useTheme();

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
          © 2025 Nagios Fusion Lite
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