// ui/src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";

import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";

import "./index.css";                    // your app styles (tailwind, etc.)
import "maplibre-gl/dist/maplibre-gl.css"; // ✅ import CSS via JS (no <link>)

const rootEl = document.getElementById("root");
if (!rootEl) {
  console.error("root not mounted");
} else {
  console.log("root mounted");
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <HashRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </HashRouter>
    </React.StrictMode>
  );
}
