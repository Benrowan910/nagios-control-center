import { Link, Outlet } from "react-router-dom";
import { useTheme } from "./context/ThemeContext"; // Changed from "/context/ThemeContext"

export default function Layout() {
  const { theme } = useTheme();

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg hidden md:flex flex-col">
        <div className="px-6 py-4 border-b">
          <h1 className="text-xl font-bold text-primary">Nagios Control Center</h1>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          <Link to="/" className="block px-3 py-2 rounded-lg hover:bg-gray-100">
            Dashboard
          </Link>
          <Link
            to="/settings"
            className="block px-3 py-2 rounded-lg hover:bg-gray-100"
          >
            Settings
          </Link>
        </nav>
        <div className="p-4 border-t text-xs text-gray-500">
          © 2025 Nagios Fusion Lite
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b shadow-sm flex items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search..."
              className="px-3 py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/settings"
              className="px-3 py-1.5 rounded-lg bg-primary text-white hover:opacity-90 transition"
            >
              Settings
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}