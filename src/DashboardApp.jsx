import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import Instance from "./pages/instance";
import Settings from "./pages/settings";
import Layout from "./Layout";
import { ThemeProvider } from "./context/ThemeContext";
import "./index.css"

export default function DashboardApp() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="instance/:id" element={<Instance />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

