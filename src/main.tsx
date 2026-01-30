import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

// Handle reset-dashboards BEFORE React loads state from localStorage
if (window.location.search.includes("reset-dashboards=1")) {
  const key = "looops_app_state";
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      const state = JSON.parse(saved);
      delete state.dashboards;
      localStorage.setItem(key, JSON.stringify(state));
    } catch (e) {
      console.error("Failed to reset dashboards:", e);
    }
  }
  // Redirect - use href to force full navigation
  window.location.href = window.location.origin + window.location.pathname;
  throw new Error("Redirecting..."); // Stop execution
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
