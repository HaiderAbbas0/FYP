import React, { useState, useEffect, useRef } from "react";
import type { Screen } from "../types";
import { useAuth } from "../auth/AuthContext";
import type { Notification } from "../api/apiService";
import { getNotifications } from "../api/apiService";

const PAGE_LABELS: Partial<Record<Screen, string>> = {
  "dashboard":            "Security Overview",
  "incidents":            "Incident Management",
  "incident-overview":    "Incident Investigation",
  "incident-safereuse":   "Safe Reuse Analysis",
  "incident-response":    "Response & Outcome",
  "devices":              "Device Inventory",
  "device-detail":        "Device Details",
  "simulation-configure": "Attack Simulation",
  "simulation-running":   "Attack Simulation · Running",
  "simulation-result":    "Attack Simulation · Results",
  "case-memory":          "Case Memory",
  "case-detail":          "Case Detail",
  "evaluation":           "Evaluation & Metrics",
  "audit-log":            "Audit Log",
  "reports":              "Reports & Export",
  "system-health":        "System Health",
  "settings":             "Settings",
};

function severityColor(s: Notification["severity"]) {
  if (s === "critical") return "var(--critical)";
  if (s === "warning")  return "var(--warning)";
  return "var(--success)";
}

interface Props {
  screen: Screen;
  onNavigate: (s: Screen) => void;
  onToggleSidebar: () => void;
}

export default function TopBar({ screen, onNavigate, onToggleSidebar }: Props) {
  const { user } = useAuth();
  const [time, setTime] = useState(new Date());
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    getNotifications().then(r => { if (r.data) setNotifications(r.data); });
  }, []);

  // Close bell on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unread = notifications.filter(n => !n.read).length;
  const pageLabel = PAGE_LABELS[screen] ?? "MediSOC";

  return (
    <header
      className="w-full h-[58px] min-h-[58px] flex items-center px-6 gap-4 z-40 shrink-0"
      style={{
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {/* Page title */}
      <div className="flex-1 min-w-0">
        <h1
          className="text-[20px] font-bold truncate text-white"
        >
          {pageLabel}
        </h1>
      </div>

      {/* Right-side controls */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Quick link to public website */}
        <a
          href="/"
          className="hidden md:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[14px] font-mono text-white hover:bg-white/[0.08] transition-colors"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
          title="Switch to Public Website"
        >
          <span>Public Website</span>
          <span className="text-[var(--lime)] font-bold">↗</span>
        </a>

        {/* System status indicator */}
        <div
          className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[13px] font-mono text-white font-bold"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
        >
          <span className="w-2 h-2 rounded-full inline-block lime-pulse" style={{ background: "var(--lime)" }} />
          <span style={{ textTransform: "uppercase", letterSpacing: "0.07em" }}>
            Online
          </span>
        </div>

        {/* Clock */}
        <div
          className="hidden xl:block text-[14px] mono px-3.5 py-1.5 rounded-lg font-semibold text-white"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}
        >
          {time.toLocaleTimeString("en-GB")}
        </div>

        {/* Notification bell */}
        <div className="relative" ref={bellRef}>
          <button
            id="notification-bell"
            onClick={() => setBellOpen(o => !o)}
            className="relative w-8 h-8 flex items-center justify-center rounded-[7px] transition-colors"
            style={{
              background: bellOpen ? "var(--surface-3)" : "transparent",
              border: `1px solid ${bellOpen ? "var(--border-2)" : "transparent"}`,
              color: bellOpen ? "var(--text)" : "var(--text-3)",
            }}
            onMouseEnter={e => {
              if (!bellOpen) e.currentTarget.style.background = "var(--surface-2)";
            }}
            onMouseLeave={e => {
              if (!bellOpen) e.currentTarget.style.background = "transparent";
            }}
            aria-label="Notifications"
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M7.5 1.5a5 5 0 00-5 5v3.5l-1 1.5h12l-1-1.5V6.5a5 5 0 00-5-5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
              <path d="M6 12.5a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.2"/>
            </svg>
            {unread > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center mono"
                style={{ background: "var(--critical)", color: "white" }}
              >
                {unread}
              </span>
            )}
          </button>

          {/* Notification panel */}
          {bellOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-[340px] rounded-[10px] shadow-2xl z-50 overflow-hidden fade-in"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border-2)" }}
            >
              <div
                className="flex items-center justify-between px-4 py-2.5 border-b"
                style={{ borderColor: "var(--border)" }}
              >
                <span className="text-[13px] font-semibold" style={{ color: "var(--text)" }}>
                  Notifications
                </span>
                <span className="text-[11px] mono" style={{ color: "var(--text-3)" }}>
                  {unread} unread
                </span>
              </div>

              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-[13px]" style={{ color: "var(--text-3)" }}>
                  No notifications
                </div>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    className="flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors border-b last:border-b-0"
                    style={{
                      borderColor: "var(--border)",
                      background: n.read ? "transparent" : "rgba(168,255,53,0.03)",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-3)")}
                    onMouseLeave={e => (e.currentTarget.style.background = n.read ? "transparent" : "rgba(168,255,53,0.03)")}
                    onClick={() => setBellOpen(false)}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5"
                      style={{ background: severityColor(n.severity) }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium" style={{ color: "var(--text-2)" }}>
                        {n.title}
                      </div>
                      <div className="text-[12px] mt-0.5" style={{ color: "var(--text-3)" }}>
                        {n.detail}
                      </div>
                    </div>
                    <span className="text-[11px] mono shrink-0 mt-0.5" style={{ color: "var(--text-3)" }}>
                      {n.time}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Active incident quick indicator */}
        <button
          onClick={() => onNavigate("incident-overview")}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-[7px] text-[11px] mono font-semibold uppercase tracking-widest transition-colors"
          style={{
            background: "rgba(245,56,56,0.1)",
            border: "1px solid rgba(245,56,56,0.25)",
            color: "var(--critical)",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(245,56,56,0.15)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(245,56,56,0.1)")}
          title="Active critical incident"
        >
          <span className="w-1.5 h-1.5 rounded-full pulse-critical" style={{ background: "var(--critical)" }} />
          INC-104
        </button>
      </div>
    </header>
  );
}
