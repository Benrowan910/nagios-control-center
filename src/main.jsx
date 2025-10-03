import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import SetupAdmin from "../frontend/src/auth/SetupAdmin.jsx";
import Login from "../frontend/src/auth/Login.jsx";
import DashboardApp from "../frontend/src/DashboardApp.jsx";
import ServerConfig from "../frontend/src/components/ServerConfig.jsx";
import { appConfig } from "../frontend/src/controls/config.js";
export default function Root() {
  const [needsSetup, setNeedsSetup] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [serverConfigured, setServerConfigured] = useState(false);

  useEffect(() => {
    checkInitialState();
  }, []);

  const checkInitialState = async () => {
    // Check if we already have a server configured
    if (appConfig.serverBaseUrl) {
      // Test the saved configuration
      const isReachable = await appConfig.testConnection();
      if (isReachable) {
        setServerConfigured(true);
        await checkAuthStatus();
      } else {
        // Saved server is not reachable
        setServerConfigured(false);
      }
    } else {
      // No server configured, try current origin
      const isReachable = await appConfig.testConnection('');
      if (isReachable) {
        setServerConfigured(true);
        await checkAuthStatus();
      } else {
        setServerConfigured(false);
      }
    }
    setLoading(false);
  };

  const checkAuthStatus = async () => {
    try {
      // Check if setup is needed
      const needsSetupRes = await fetch(`${appConfig.apiUrl}/needs-setup`);
      if (!needsSetupRes.ok) throw new Error('Server error');
      const needsSetupData = await needsSetupRes.json();
      setNeedsSetup(needsSetupData);

      // Check existing session
      const sessionId = localStorage.getItem("sessionId");
      if (sessionId) {
        const sessionRes = await fetch(`${appConfig.apiUrl}/validate-session`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId }),
        });
        
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          setLoggedIn(sessionData.success);
          if (!sessionData.success) {
            localStorage.removeItem("sessionId");
            localStorage.removeItem("loggedIn");
          }
        }
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setServerConfigured(false); // Server might be down
    }
  };

  const handleServerConfigured = () => {
    setServerConfigured(true);
    checkAuthStatus();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!serverConfigured) {
    return <ServerConfig onServerConfigured={handleServerConfigured} />;
  }
  if (needsSetup) return <SetupAdmin />;
  if (!loggedIn) return <Login onLogin={() => setLoggedIn(true)} />;

  return <DashboardApp />;
}

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);