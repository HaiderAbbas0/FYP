import React, { useState, useEffect, useRef } from "react";
import type { Screen } from "../types";
import { useAuth } from "../auth/AuthContext";
import type { Notification } from "../api/apiService";
import { getNotifications } from "../api/apiService";
import Logo from "./Logo";

interface NavGroup { id: Screen; label: string; roles?: string[]; }

const navGroups: NavGroup[] = [
  { id: "dashboard",             label: "Dashboard" },
  { id: "simulation-configure",  label: "Attack Simulation" },
  { id: "devices",               label: "Devices" },
  { id: "incidents",             label: "Incidents" },
  { id: "case-memory",           label: "Case Memory" },
  { id: "evaluation",            label: "Evaluation" },
  { id: "system-health",         label: "System & Settings", roles: ["super_admin", "analyst"] },
  { id: "audit-log",             label: "Audit Log",         roles: ["super_admin"] },
];

function matchGroup(screen: Screen): Screen {
  if (screen.startsWith("simulation")) return "simulation-configure";
  if (screen === "device-detail")      return "devices";
  if (screen.startsWith("incident"))   return "incidents";
  if (screen === "case-detail")        return "case-memory";
  if (screen === "settings")           return "system-health";
  return screen;
}

function roleBadgeStyle(role: string): { bg: string; color: string } {
  if (role === "super_admin") return { bg: "#1E1A3D", color: "#A78BFA" };
  if (role === "analyst")     return { bg: "#0D1410", color: "#4ADE80" };
  return                             { bg: "#111511", color: "#94A8BA" };
}
function roleLabel(role: string): string {
  if (role === "super_admin") return "Super Admin";
  if (role === "analyst")     return "Analyst";
  return "Viewer";
}

interface Props {
  screen: Screen;
  onNavigate: (s: Screen) => void;
}

export default function TopNav({ screen, onNavigate }: Props) {
  const { user, logout } = useAuth();
  const [time, setTime] = useState(new Date());
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    getNotifications().then((r) => { if (r.data) setNotifications(r.data); });
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

  const active = matchGroup(screen);
  const unread = notifications.filter((n) => !n.read).length;
  const role   = user?.role ?? "viewer";

  // Filter nav by role
  const visibleNav = navGroups.filter((g) => !g.roles || g.roles.includes(role));

  function severityDot(s: Notification["severity"]) {
    if (s === "critical") return "#EF4444";
    if (s === "warning")  return "#D97706";
    return "#16A34A";
  }

  return (
    <nav className="w-full h-[64px] min-h-[64px] bg-[#080B08] border-b border-[#1C272D] flex items-center px-6 gap-0 z-50 relative">
      {/* Wordmark & Brand Logo */}
      <div className="flex items-center mr-8 shrink-0">
        <Logo size="sm" variant="white" clickable to="/" />
      </div>

      {/* Nav links */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-x-auto">
        {visibleNav.map((g) => {
          const isActive = active === g.id;
          return (
            <button
              key={g.id}
              onClick={() => onNavigate(g.id as Screen)}
              className={`relative px-4 py-2 text-[18px] font-semibold whitespace-nowrap rounded-[7px] transition-colors ${
                isActive ? "bg-[#1A2124] text-white" : "text-white/80 hover:text-white hover:bg-[#111619]"
              }`}
            >
              {g.label}
              {isActive && (
                <span className="absolute bottom-0 left-3 right-3 h-[2.5px] bg-[#B6FF3B] rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4 shrink-0 pl-5 border-l border-[#1C272D]">

        {/* System status dot */}
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] inline-block lime-pulse" />
          <span className="text-[15px] font-semibold mono text-white hidden xl:inline">ONLINE</span>
        </div>

        {/* Clock */}
        <span className="text-[16px] mono text-white/90 hidden lg:inline font-medium">
          {time.toLocaleTimeString("en-GB")}
        </span>

        {/* Notification bell */}
        <div className="relative" ref={bellRef}>
          <button
            id="notification-bell"
            onClick={() => setBellOpen((o) => !o)}
            className="relative w-9 h-9 flex items-center justify-center rounded-[8px] transition-colors hover:bg-[#1A2124] text-white"
            aria-label="Notifications"
          >
            <svg width="18" height="18" viewBox="0 0 15 15" fill="none">
              <path d="M7.5 1.5a5 5 0 00-5 5v3.5l-1 1.5h12l-1-1.5V6.5a5 5 0 00-5-5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
              <path d="M6 12.5a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.4"/>
            </svg>
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#EF4444] rounded-full text-[11px] font-bold text-white flex items-center justify-center">
                {unread}
              </span>
            )}
          </button>

          {/* Notification dropdown */}
          {bellOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-[380px] rounded-[12px] shadow-2xl z-50 overflow-hidden fade-in"
              style={{ background: "#0D1112", border: "1px solid #243038" }}
            >
              <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: "#243038" }}>
                <span className="text-[16px] font-bold text-white">Notifications</span>
                <span className="text-[14px] mono font-semibold text-white/80">{unread} unread</span>
              </div>
              {notifications.length === 0 ? (
                <div className="px-5 py-10 text-center text-[16px] text-white/70">No notifications</div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className="flex items-start gap-3.5 px-5 py-3.5 border-b cursor-pointer transition-colors hover:bg-[#151B1E]"
                    style={{
                      borderColor: "#1C272D",
                      background: n.read ? "transparent" : "#111619",
                    }}
                    onClick={() => setBellOpen(false)}
                  >
                    <span className="w-2 h-2 rounded-full shrink-0 mt-2" style={{ background: severityDot(n.severity) }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] font-semibold text-white">{n.title}</div>
                      <div className="text-[14px] mt-0.5 text-slate-300">{n.detail}</div>
                    </div>
                    <span className="text-[13px] mono shrink-0 mt-0.5 text-white/70">{n.time}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Role badge + user info */}
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-2 px-3 py-1 rounded-[6px] text-[13px] mono font-bold uppercase tracking-wider"
            style={roleBadgeStyle(role)}
          >
            {roleLabel(role)}
          </div>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold mono"
            style={{ background: "#151B1E", border: "1px solid #2E3D48", color: "#FFFFFF" }}
            title={user?.email}
          >
            {user?.name?.slice(0, 2).toUpperCase() ?? "SA"}
          </div>
          <button
            id="sign-out-btn"
            onClick={logout}
            className="text-[15px] mono font-medium text-white transition-colors hover:text-[#EF4444]"
          >
            Sign out
          </button>
        </div>

      </div>
    </nav>
  );
}
