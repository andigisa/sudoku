import React from "react";
import ReactDOM from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { applyThemeVars } from "./themes";
import App from "./App";
import "./styles.css";

// Apply saved theme synchronously before React renders to prevent flash
const savedTheme = localStorage.getItem("sudoku-theme");
if (savedTheme) applyThemeVars(savedTheme);

registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
