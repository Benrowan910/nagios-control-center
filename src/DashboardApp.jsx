import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import Instance from "./pages/instance";
import Settings from "./pages/settings";
import Layout from "./Layout";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { InstanceProvider } from "./context/InstanceContext";
import LS from "./pages/LS"
import NNA from "./pages/NNA"
import "./index.css"
import LogServerDashboard from "./pages/LS";
import NetworkAnalyzerDashboard from "./pages/NNA";
import DashletCreator from "./pages/creator";

export default function DashboardApp() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <InstanceProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="logserver" element={<LogServerDashboard/>}/>
                <Route path="nna" element={<NetworkAnalyzerDashboard/>}/>
                <Route path="dashlet-creator" element={<DashletCreator/>}/> {/* New route */}
                <Route path="instance/:id" element={<Instance />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </InstanceProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}