// src/layouts/SiteLayout.tsx
import React from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import FooterCTA from "../components/FooterCTA";

export default function SiteLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      {/* Reserve exactly the measured header(+strip) height and stop margin-collapsing */}
      <main
        id="content"
        className="flex-1 min-h-0 border-t border-transparent"  // <- stops first-child margin collapse
        style={{ paddingTop: "var(--app-header-h, 64px)" }}     // <- one source of spacing
      >
        <Outlet />
      </main>

      <FooterCTA />
    </div>
  );
}
