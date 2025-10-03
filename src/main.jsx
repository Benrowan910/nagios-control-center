import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import SetupAdmin from "../frontend/src/auth/SetupAdmin.jsx";
import Login from "../frontend/src/auth/Login.jsx";
import DashboardApp from "../frontend/src/DashboardApp.jsx";

export default function Root() {
  const [needsSetup, setNeedsSetup] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // First check if setup is needed
      const setupRes = await fetch("/api/needs-setup");
      const needsSetupData = await setupRes.json();
      setNeedsSetup(needsSetupData);

      // Then check if we have a valid session
      const sessionId = localStorage.getItem("sessionId");
      if (sessionId) {
        const sessionRes = await fetch("/api/validate-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId }),
        });
        const sessionData = await sessionRes.json();

        if (sessionData.success) {
          setLoggedIn(true);
        } else {
          // Session is invalid, clear local storage
          localStorage.removeItem("sessionId");
          localStorage.removeItem("loggedIn");
          setLoggedIn(false);
        }
      } else {
        setLoggedIn(false);
      }
    } catch (error) {
      console.error("Failed to check auth status:", error);
      // If server is unreachable, assume not logged in
      localStorage.removeItem("sessionId");
      localStorage.removeItem("loggedIn");
      setLoggedIn(false);
      setNeedsSetup(true); // Fallback
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (needsSetup) return <SetupAdmin />;
  if (!loggedIn) return <Login onLogin={() => setLoggedIn(true)} />;

  return <DashboardApp />;
}

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
