import React, { useState, useEffect, useRef } from "react";
import type { Screen } from "../types";
import { useAuth } from "../auth/AuthContext";
import type { Notification } from "../api/apiService";
import { getNotifications } from "../api/apiService";

const PAGE_LABELS: Partial<Record<Screen, string>> = {
  dashboard: "Security Overview",
  incidents: "Incident Management",
  "incident-overview": "Incident Investigation",
  "incident-safereuse": "Safe Reuse Analysis",
  "incident-response": "Response & Outcome",
  devices: "Device Inventory",
  "device-detail": "Device Details",
  "simulation-configure": "Attack Simulation",
  "simulation-running": "Attack Simulation · Running",
  "simulation-result": "Attack Simulation · Results",
  "case-memory": "Case Memory",
  "case-detail": "Case Detail",
  "evaluation": "Evaluation & Metrics",
  "audit-log": "Audit Log",
  "reports": "Reports & Export",
  "system-health": "System Health",
  settings: "Settings",
};

function severityColor(s: Notification["severity"]) {
  if (s === "critical") return "var(--critical)";
  if (s === "warning") return "var(--warning)";
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
    getNotifications().then((r) => {
      if (r.data) setNotifications(r.data);
    });
  }, []);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setBellOpen(false);
    }
    if (bellOpen) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [bellOpen]);

  const unread = notifications.filter((n) => !n.read).length;
  const pageLabel = PAGE_LABELS[screen] ?? "MediSOC";

  return (
    <header
      className="w-full flex items-center gap-4 px-6 shrink-0 z-40"
      style={{ height: "var(--topbar-h)", background: "var(--bg)", borderBottom: "1px solid var(--border)" }}
    >
      {/* Breadcrumb / page identity */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded transition-colors xl:hidden"
          style={{ color: "var(--text-3)" }}
          aria-label="Toggle navigation"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
        <div className="min-w-0">
          <div className="t-label">MediSOC</div>
          <h1 className="truncate text-[15px] font-semibold leading-tight text-[var(--text)]">{pageLabel}</h1>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2.5">
        {/* Active incident indicator */}
        <button
          type="button"
          onClick={() => onNavigate("incident-overview")}
          className="badge hidden md:inline-flex transition-colors"
          style={{ background: "var(--critical-bg)", borderColor: "var(--critical-line)", color: "var(--critical)" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,90,90,0.18)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "var(--critical-bg)")}
          title="Active critical incident"
        >
          <span className="dot pulse-critical" style={{ background: "var(--critical)" }} aria-hidden />
          INC-104
        </button>

        {/* Runtime status */}
        <div
          className="hidden lg:flex items-center gap-2 rounded-md px-3 py-1.5"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          title="Agent runtime status"
        >
          <span className="dot status-pulse" style={{ background: "var(--success)" }} aria-hidden />
          <span className="mono text-[11px] font-semibold uppercase tracking-wider text-[var(--text-3)]">Online</span>
        </div>

        {/* Clock */}
        <div
          className="mono hidden xl:block rounded-md px-3 py-1.5 text-[12.5px] font-medium text-[var(--text-3)]"
          style={{ background: "var(--surface)", border: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}
        >
          {time.toLocaleTimeString("en-GB")}
        </div>

        {/* Notifications */}
        <div className="relative" ref={bellRef}>
          <button
            id="notification-bell"
            type="button"
            onClick={() => setBellOpen((o) => !o)}
            className="relative flex h-8 w-8 items-center justify-center rounded-md transition-colors"
            style={{
              background: bellOpen ? "var(--surface-3)" : "transparent",
              border: `1px solid ${bellOpen ? "var(--border-2)" : "transparent"}`,
              color: bellOpen ? "var(--text)" : "var(--text-3)",
            }}
            aria-label={bellOpen ? "Close notifications" : "Open notifications"}
            aria-expanded={bellOpen}
            aria-haspopup="dialog"
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round">
              <path d="M7.5 1.6a4.6 4.6 0 00-4.6 4.6v3.2l-.9 1.4h11l-.9-1.4V6.2a4.6 4.6 0 00-4.6-4.6Z" />
              <path d="M6.2 12.2a1.4 1.4 0 002.6 0" strokeLinecap="round" />
            </svg>
            {unread > 0 && (
              <span
                className="mono absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9.5px] font-bold"
                style={{ background: "var(--critical)", color: "var(--on-lime)" }}
              >
                {unread}
              </span>
            )}
          </button>

          {bellOpen && (
            <div
              role="dialog"
              aria-label="Notifications"
              className="absolute right-0 top-full mt-2 z-50 w-[340px] overflow-hidden rounded-lg animate-in fade-in"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border-2)", boxShadow: "var(--shadow-lg)" }}
            >
              <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: "var(--border)" }}>
                <span className="text-[13px] font-semibold text-[var(--text)]">Notifications</span>
                <span className="mono text-[11px] text-[var(--text-4)]">{unread} unread</span>
              </div>

              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-[13px] text-[var(--text-4)]">No notifications</div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className="flex items-start gap-3 px-4 py-3 cursor-pointer border-b last:border-b-0 transition-colors"
                    style={{
                      borderColor: "var(--border)",
                      background: n.read ? "transparent" : "var(--lime-soft)",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-3)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = n.read ? "transparent" : "var(--lime-soft)")}
                    onClick={() => setBellOpen(false)}
                  >
                    <span className="dot mt-1.5" style={{ background: severityColor(n.severity) }} aria-hidden />
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-medium text-[var(--text-2)]">{n.title}</div>
                      <div className="mt-0.5 text-[12px] leading-snug text-[var(--text-4)]">{n.detail}</div>
                    </div>
                    <span className="mono shrink-0 mt-0.5 text-[11px] text-[var(--text-4)]">{n.time}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Identity */}
        <div
          className="hidden items-center gap-2 pl-3 sm:flex"
          style={{ borderLeft: "1px solid var(--border)" }}
        >
          <div
            className="mono flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold"
            style={{ background: "var(--lime-soft)", border: "1px solid var(--lime-line)", color: "var(--lime)" }}
            aria-hidden
          >
            {(user?.name ?? "?").slice(0, 2).toUpperCase()}
          </div>
          <span className="hidden lg:inline text-[12.5px] font-medium text-[var(--text-2)]">{user?.name ?? "Guest"}</span>
        </div>
      </div>
    </header>
  );
}