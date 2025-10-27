// src/pages/_Health.tsx
import React from "react";
import { useLocation } from "react-router-dom";

export default function Health() {
  const loc = useLocation();
  return (
    <div style={{
      padding: 16,
      margin: 16,
      borderRadius: 12,
      border: "2px solid #16a34a",
      background: "#ecfdf5",
      fontFamily: "ui-monospace, Menlo, monospace"
    }}>
      <div><strong>Health</strong></div>
      <div>pathname: {loc.pathname}</div>
      <div>search: {loc.search}</div>
      <div>hash: {window.location.hash}</div>
      <div>router: HashRouter</div>
      <div>build: {import.meta.env.MODE}</div>
    </div>
  );
}
