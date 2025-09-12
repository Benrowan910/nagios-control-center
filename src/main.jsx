import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
// import App from "./App.jsx";
import DashboardApp from "./DashboardApp.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <DashboardApp />
  </StrictMode>
);


