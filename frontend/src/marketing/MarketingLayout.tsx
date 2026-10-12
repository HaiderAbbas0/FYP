import React from "react";
import { Outlet } from "react-router-dom";
import MarketingNavbar from "./components/MarketingNavbar";
import MarketingFooter from "./components/MarketingFooter";

export default function MarketingLayout() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col selection:bg-[var(--lime)] selection:text-black">
      <MarketingNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <MarketingFooter />
    </div>
  );
}
