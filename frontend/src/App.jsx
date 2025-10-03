import { useEffect, useState } from "react";
import LoginPage from "./components/LoginPage";
import SetupPage from "./components/SetupPage";
import DashboardApp from "./DashboardApp";

export default function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    fetch("/api/needs-setup")
      .then((res) => res.json())
      .then((data) => setNeedsSetup(data.needsSetup));
  }, []);

  if (needsSetup) {
    return <SetupPage onSetupSuccess={() => setAuthenticated(true)} />;
  }

  if (!authenticated) {
    return <LoginPage onLoginSuccess={() => setAuthenticated(true)} />;
  }

  return <DashboardApp />;
}
