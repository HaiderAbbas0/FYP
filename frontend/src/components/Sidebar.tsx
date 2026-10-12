import React from "react";
import { Link } from "react-router-dom";
import type { Screen } from "../types";
import { useAuth } from "../auth/AuthContext";
import Logo from "./Logo";

interface NavSection {
  title?: string;
  items: NavItem[];
}

interface NavItem {
  id: Screen;
  label: string;
  icon: React.ReactNode;
  roles?: string[];
  badge?: string;
  badgeColor?: string;
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const icons = {
  dashboard: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
      <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
      <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
      <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  ),
  incidents: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 2L14.5 13.5H1.5L8 2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M8 6v3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <circle cx="8" cy="11.5" r="0.6" fill="currentColor"/>
    </svg>
  ),
  devices: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="3.5" width="14" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
      <circle cx="3.5" cy="8" r="0.8" fill="currentColor"/>
      <path d="M6 6.5h6M6 9.5h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
  simulation: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M5.5 5.5c.8-.5 4.5.5 5 3-1 2-4.5 2.5-5.5 1.5-.5-1 0-4 .5-4.5Z" stroke="currentColor" strokeWidth="1.1"/>
      <circle cx="8" cy="8" r="1.2" fill="currentColor"/>
    </svg>
  ),
  cases: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 2.5h10a1 1 0 011 1v9a1 1 0 01-1 1H3a1 1 0 01-1-1v-9a1 1 0 011-1Z" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M5 6h6M5 8.5h4M5 11h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
  evaluation: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 12L5.5 8 8.5 10.5 13 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M11 4h2v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  reports: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 2h7l3 3v9a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1Z" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M10 2v3h3" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M5 8h6M5 10.5h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
  audit: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 1.5L13.5 4.5v7L8 14.5 2.5 11.5v-7L8 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M5.5 8l2 2 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  system: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M8 2v1.5M8 12.5V14M2 8h1.5M12.5 8H14M3.5 3.5l1.1 1.1M11.4 11.4l1.1 1.1M3.5 12.5l1.1-1.1M11.4 4.6l1.1-1.1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
  chevronLeft: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  chevronRight: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  medisoc: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M9 2L16 9L9 16L2 9L9 2Z" fill="#0A0C0A"/>
      <circle cx="9" cy="9" r="2.5" fill="#0A0C0A"/>
    </svg>
  ),
};

// ─── Nav sections ──────────────────────────────────────────────────────────────
const navSections: NavSection[] = [
  {
    title: "Operations",
    items: [
      { id: "dashboard",            label: "Overview",        icon: icons.dashboard },
      { id: "incidents",            label: "Incidents",       icon: icons.incidents },
      { id: "devices",              label: "Devices",         icon: icons.devices },
    ],
  },
  {
    title: "Investigation",
    items: [
      { id: "simulation-configure", label: "Attack Simulation", icon: icons.simulation, roles: ["super_admin", "analyst"] },
      { id: "case-memory",          label: "Case Memory",       icon: icons.cases },
      { id: "evaluation",           label: "Evaluation",        icon: icons.evaluation },
    ],
  },
  {
    title: "Management",
    items: [
      { id: "reports",              label: "Reports",         icon: icons.reports },
      { id: "audit-log",            label: "Audit Log",       icon: icons.audit, roles: ["super_admin"] },
      { id: "system-health",        label: "System",          icon: icons.system, roles: ["super_admin", "analyst"] },
    ],
  },
];

function matchActive(screen: Screen): Screen {
  if (screen.startsWith("simulation")) return "simulation-configure";
  if (screen === "device-detail")      return "devices";
  if (screen.startsWith("incident"))   return "incidents";
  if (screen === "case-detail")        return "case-memory";
  if (screen === "settings")           return "system-health";
  return screen;
}

interface Props {
  screen: Screen;
  onNavigate: (s: Screen) => void;
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ screen, onNavigate, collapsed, onToggle }: Props) {
  const { user, logout } = useAuth();
  const role = user?.role ?? "viewer";
  const active = matchActive(screen);

  function roleBadge() {
    if (role === "super_admin") return { label: "Admin",   bg: "rgba(139,114,240,0.18)", color: "#8B72F0" };
    if (role === "analyst")     return { label: "Analyst", bg: "rgba(168,255,53,0.15)",  color: "#A8FF35" };
    return                             { label: "Viewer",  bg: "rgba(255,255,255,0.15)", color: "#FFFFFF" };
  }

  const rb = roleBadge();

  return (
    <aside
      className="h-full flex flex-col shrink-0 transition-all duration-200 overflow-hidden"
      style={{
        width: collapsed ? "64px" : "275px",
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
      }}
    >
      {/* ─── Brand header ─────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between shrink-0 px-3 py-3 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <Logo size="sm" clickable to="/" />
          </div>
        ) : (
          <div className="mx-auto flex items-center justify-center">
            <Logo size="xs" showText={false} clickable to="/" />
          </div>
        )}

        {/* Collapse toggle */}
        <button
          onClick={onToggle}
          className="w-6 h-6 flex items-center justify-center rounded-[5px] transition-colors shrink-0"
          style={{ color: "var(--text-4)" }}
          onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-3)")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? icons.chevronRight : icons.chevronLeft}
        </button>
      </div>

      {/* ─── Demo data notice ─────────────────────────────────────────── */}
      {!collapsed && (
        <div
          className="mx-3 mt-2.5 px-2.5 py-1.5 rounded-[6px] flex items-center gap-1.5 text-[10px]"
          style={{ background: "rgba(139,114,240,0.08)", border: "1px solid rgba(139,114,240,0.18)", color: "#8B72F0", fontFamily: "JetBrains Mono, monospace", textTransform: "uppercase", letterSpacing: "0.06em" }}
        >
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
            <circle cx="4.5" cy="4.5" r="3.5" stroke="currentColor" strokeWidth="1"/>
            <path d="M4.5 3v2.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
            <circle cx="4.5" cy="6.5" r="0.4" fill="currentColor"/>
          </svg>
          Demo Data
        </div>
      )}

      {/* ─── Navigation ───────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 mt-1">
        {navSections.map((section, si) => {
          const visibleItems = section.items.filter(item =>
            !item.roles || item.roles.includes(role)
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={si} className="mb-4">
              {!collapsed && section.title && (
                <div
                  className="px-3 mb-1.5 text-[13px] font-bold uppercase tracking-[0.09em]"
                  style={{ color: "var(--text-3)", fontFamily: "JetBrains Mono, monospace" }}
                >
                  {section.title}
                </div>
              )}
              {collapsed && si > 0 && (
                <div className="h-px my-2 mx-1" style={{ background: "var(--border)" }} />
              )}

              {visibleItems.map(item => {
                const isActive = active === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    title={collapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all mb-1 border ${
                      isActive
                        ? "bg-[var(--surface-3)] border-[var(--border-2)] text-white shadow-sm"
                        : "border-transparent hover:bg-[var(--surface-2)] hover:text-white"
                    }`}
                    style={{ color: isActive ? "white" : "var(--text-2)", justifyContent: collapsed ? "center" : "flex-start" }}
                  >
                    <span
                      className="shrink-0 scale-110"
                      style={{ color: isActive ? "var(--lime)" : "currentColor" }}
                    >
                      {item.icon}
                    </span>
                    {!collapsed && (
                      <span className="text-[17px] font-semibold truncate">{item.label}</span>
                    )}
                    {!collapsed && item.badge && (
                      <span
                        className="ml-auto text-[13px] font-bold px-2 py-0.5 rounded-full mono"
                        style={{ background: item.badgeColor ?? "var(--surface-4)", color: "white" }}
                      >
                        {item.badge}
                      </span>
                    )}
                    {/* Active indicator line */}
                    {isActive && (
                      <span
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full"
                        style={{ background: "var(--lime)" }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* ─── User profile footer ──────────────────────────────────────── */}
      <div
        className="shrink-0 border-t"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="p-3">
          <Link
            to="/"
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[14.5px] font-medium text-white hover:bg-white/[0.08] transition-colors mb-2.5"
            title="Return to Public Website"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            {!collapsed && <span>Public Website</span>}
          </Link>

          {!collapsed ? (
            <div
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
            >
              {/* Avatar */}
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold mono shrink-0"
                style={{ background: "var(--surface-4)", border: "1px solid var(--border-2)", color: "white" }}
              >
                {user?.name?.slice(0, 2).toUpperCase() ?? "?"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-bold truncate text-white">
                  {user?.name ?? "Unknown"}
                </div>
                <div
                  className="text-[12px] px-2 py-0.5 rounded-[4px] inline-flex mt-0.5 font-bold mono uppercase"
                  style={{ background: rb.bg, color: rb.color, letterSpacing: "0.06em" }}
                >
                  {rb.label}
                </div>
              </div>
              <button
                onClick={logout}
                className="shrink-0 text-[13px] mono transition-colors p-1"
                style={{ color: "var(--text-3)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--danger)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--text-4)")}
                title="Sign out"
                id="sign-out-btn"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M9.5 4.5L12.5 7l-3 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12.5 7H6M6 3H4a1 1 0 00-1 1v6a1 1 0 001 1h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-1">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold mono"
                style={{ background: "var(--surface-4)", border: "1px solid var(--border-2)", color: "var(--text-2)" }}
                title={user?.name}
              >
                {user?.name?.slice(0, 2).toUpperCase() ?? "?"}
              </div>
              <button
                onClick={logout}
                className="transition-colors"
                style={{ color: "var(--text-4)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--danger)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--text-4)")}
                title="Sign out"
              >
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <path d="M9.5 4.5L12.5 7l-3 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12.5 7H6M6 3H4a1 1 0 00-1 1v6a1 1 0 001 1h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
