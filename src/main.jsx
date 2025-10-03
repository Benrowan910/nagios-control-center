import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import SetupAdmin from "./auth/SetupAdmin.jsx";
import Login from "./auth/Login.jsx";
import DashboardApp from "./DashboardApp.jsx";

function Root() {
  const [needsSetup, setNeedsSetup] = useState(null);
  const [loggedIn, setLoggedIn] = useState(localStorage.getItem("loggedIn") === "true");

  useEffect(() => {
    fetch("/api/needs-setup")
      .then((res) => res.json())
      .then((data) => setNeedsSetup(data));
  }, []);

  if (needsSetup === null) return <div>Loading...</div>;
  if (needsSetup) return <SetupAdmin />;
  if (!loggedIn) return <Login onLogin={() => setLoggedIn(true)} />;

  return <App />;
}

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
