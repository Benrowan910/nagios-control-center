import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import Instance from "./pages/instance";
import Settings from "./pages/settings";
import Layout from "./Layout";
import HostHealth from "./pages/HostHealth";
import ServiceHealthRoute from "./routes/ServiceHealthRoute"; // <-- add
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { InstanceProvider } from "./context/InstanceContext";
import "./index.css";

export default function DashboardApp() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <InstanceProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="instance/:id" element={<Instance />} />
                <Route path="settings" element={<Settings />} />
                <Route path="hostHealth" element={<HostHealth />} />
                <Route path="serviceHealth" element={<ServiceHealthRoute />} /> {/* NEW */}
              </Route>
            </Routes>
          </BrowserRouter>
        </InstanceProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
