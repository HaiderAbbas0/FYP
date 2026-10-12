import React from "react";
import { Link } from "react-router-dom";
import type { Screen } from "../types";
import { useAuth } from "../auth/AuthContext";
import Logo from "./Logo";

interface NavItem {
  id: Screen;
  label: string;
  icon: React.ReactNode;
  roles?: string[];
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const ICON_SIZE = 16;

const icons = {
  dashboard: (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
      <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.2" />
      <rect x="9" y="1.5" width="5.5" height="5.5" rx="1.2" />
      <rect x="1.5" y="9" width="5.5" height="5.5" rx="1.2" />
      <rect x="9" y="9" width="5.5" height="5.5" rx="1.2" />
    </svg>
  ),
  incidents: (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round">
      <path d="M8 2.2L14.2 13.4H1.8L8 2.2Z" />
      <path d="M8 6.4v3.1" strokeLinecap="round" />
      <circle cx="8" cy="11.5" r="0.55" fill="currentColor" stroke="none" />
    </svg>
  ),
  devices: (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
      <rect x="1.8" y="3.4" width="12.4" height="8.2" rx="1.4" />
      <circle cx="4.4" cy="7.5" r="0.7" fill="currentColor" stroke="none" />
      <path d="M7 6.4h5M7 9.2h3.4" strokeLinecap="round" />
    </svg>
  ),
  simulation: (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
      <path d="M13.5 2.5L7.2 7.1" strokeLinecap="round" />
      <path d="M7.2 7.1L3 8.4l2 1.5-.9 2.7 2.1-.6.6 2.1L9 12.5l2.4-3.4-2.1-1.1L13.5 2.5Z" strokeLinejoin="round" />
    </svg>
  ),
  cases: (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
      <path d="M2.6 3.2a1.2 1.2 0 011.2-1.2h8.4a1.2 1.2 0 011.2 1.2v9.6a1.2 1.2 0 01-1.2 1.2H3.8a1.2 1.2 0 01-1.2-1.2V3.2Z" />
      <path d="M5.2 5.8h5.6M5.2 8h3.8" strokeLinecap="round" />
    </svg>
  ),
  evaluation: (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12.4L5.6 8l3 2.6L13.6 3.6" />
      <path d="M11 3.6h2.6v2.6" />
    </svg>
  ),
  reports: (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round">
      <path d="M3.4 2.2h5.4l3.8 3.8v7.8a.8.8 0 01-.8.8H3.4a.8.8 0 01-.8-.8V3a.8.8 0 01.8-.8Z" />
      <path d="M8.8 2.2V6h3.8" />
      <path d="M5.2 8.6h5.4M5.2 11h3.4" strokeLinecap="round" />
    </svg>
  ),
  audit: (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round">
      <path d="M8 1.8l5.2 2.6v6.2L8 13.2 2.8 10.6V4.4L8 1.8Z" />
      <path d="M5.6 8.2l1.8 1.8 3-3.2" strokeLinecap="round" />
    </svg>
  ),
  system: (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
      <circle cx="8" cy="8" r="2.1" />
      <path d="M8 1.8v1.6M8 12.6v1.6M1.8 8h1.6M12.6 8h1.6M3.6 3.6l1.1 1.1M11.3 11.3l1.1 1.1M3.6 12.4l1.1-1.1M11.3 4.7l1.1-1.1" />
    </svg>
  ),
  chevronLeft: (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11L5 7l4-4" />
    </svg>
  ),
  chevronRight: (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 3l4 4-4 4" />
    </svg>
  ),
  globe: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a15 15 0 010 18a15 15 0 010-18Z" />
    </svg>
  ),
  signOut: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2.5L13.5 6 9.5 9.5" />
      <path d="M13.5 6H6.5a1.5 1.5 0 00-1.5 1.5v5A1.5 1.5 0 006.5 14h7" />
    </svg>
  ),
  info: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2">
      <circle cx="6" cy="6" r="4.6" />
      <path d="M6 5.2v3M6 3.4v.5" strokeLinecap="round" />
    </svg>
  ),
};

const navSections: NavSection[] = [
  {
    title: "Operations",
    items: [
      { id: "dashboard", label: "Overview", icon: icons.dashboard },
      { id: "incidents", label: "Incidents", icon: icons.incidents },
      { id: "devices", label: "Devices", icon: icons.devices },
    ],
  },
  {
    title: "Investigation",
    items: [
      { id: "simulation-configure", label: "Attack Simulation", icon: icons.simulation, roles: ["super_admin", "analyst"] },
      { id: "case-memory", label: "Case Memory", icon: icons.cases },
      { id: "evaluation", label: "Evaluation", icon: icons.evaluation },
    ],
  },
  {
    title: "Management",
    items: [
      { id: "reports", label: "Reports", icon: icons.reports },
      { id: "audit-log", label: "Audit Log", icon: icons.audit, roles: ["super_admin"] },
      { id: "system-health", label: "System", icon: icons.system, roles: ["super_admin", "analyst"] },
    ],
  },
];

function matchActive(screen: Screen): Screen {
  if (screen.startsWith("simulation")) return "simulation-configure";
  if (screen === "device-detail") return "devices";
  if (screen.startsWith("incident")) return "incidents";
  if (screen === "case-detail") return "case-memory";
  if (screen === "settings") return "system-health";
  return screen;
}

function roleBadge(role: string) {
  if (role === "super_admin") return { label: "Admin", bg: "var(--violet-bg)", color: "var(--violet)", line: "var(--violet-line)" };
  if (role === "analyst") return { label: "Analyst", bg: "var(--lime-soft)", color: "var(--lime)", line: "var(--lime-line)" };
  return { label: "Viewer", bg: "var(--surface-3)", color: "var(--text-3)", line: "var(--border-2)" };
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
  const rb = roleBadge(role);
  const initials = (user?.name ?? "?").slice(0, 2).toUpperCase();

  return (
    <aside
      className="h-full flex flex-col shrink-0 overflow-hidden transition-[width] duration-200 ease-[var(--ease)]"
      style={{ width: collapsed ? 64 : "var(--sidebar-w)", background: "var(--bg)", borderRight: "1px solid var(--border)" }}
    >
      {/* Brand */}
      <div
        className="flex items-center shrink-0 border-b"
        style={{ height: "var(--topbar-h)", borderColor: "var(--border)", padding: collapsed ? "0 14px" : "0 14px 0 18px" }}
      >
        <Logo size="sm" clickable to="/" />
        {!collapsed && (
          <button
            type="button"
            onClick={onToggle}
            className="ml-auto flex h-6 w-6 items-center justify-center rounded transition-colors"
            style={{ color: "var(--text-4)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-3)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            aria-label="Collapse sidebar"
          >
            {icons.chevronLeft}
          </button>
        )}
      </div>

      {collapsed && (
        <div className="flex justify-center py-2">
          <button
            type="button"
            onClick={onToggle}
            className="flex h-6 w-6 items-center justify-center rounded transition-colors"
            style={{ color: "var(--text-4)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-3)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            aria-label="Expand sidebar"
          >
            {icons.chevronRight}
          </button>
        </div>
      )}

      {/* Demo data notice */}
      {!collapsed && (
        <div className="px-3 pt-3">
          <div className="demo-banner w-full justify-center" title="This deployment is wired to the demonstration data layer">
            <span aria-hidden>{icons.info}</span>
            Demo Data
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3" aria-label="Main">
        {navSections.map((section, si) => {
          const visible = section.items.filter((item) => !item.roles || item.roles.includes(role));
          if (visible.length === 0) return null;
          return (
            <div key={si} className="mb-5 last:mb-0">
              {!collapsed && section.title && (
                <div className="t-label mb-2 px-2.5">{section.title}</div>
              )}
              {collapsed && si > 0 && <div className="mx-2 mb-3 h-px" style={{ background: "var(--border)" }} />}
              <div className="space-y-0.5">
                {visible.map((item) => {
                  const isActive = active === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onNavigate(item.id)}
                      title={collapsed ? item.label : undefined}
                      aria-current={isActive ? "page" : undefined}
                      className={`sidebar-nav-item ${isActive ? "active" : ""}`}
                      style={collapsed ? { justifyContent: "center", paddingLeft: 0, paddingRight: 0 } : undefined}
                    >
                      <span className="nav-icon shrink-0" style={{ color: isActive ? "var(--lime)" : "currentColor" }} aria-hidden>
                        {item.icon}
                      </span>
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="shrink-0 border-t p-3" style={{ borderColor: "var(--border)" }}>
        <Link
          to="/"
          className="sidebar-nav-item mb-2"
          style={collapsed ? { justifyContent: "center", paddingLeft: 0, paddingRight: 0 } : undefined}
          title={collapsed ? "Public Website" : undefined}
        >
          <span aria-hidden style={{ color: "var(--text-4)" }}>{icons.globe}</span>
          {!collapsed && <span>Public Website</span>}
        </Link>

        {!collapsed ? (
          <div
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-2"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <div
              className="mono flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
              style={{ background: "var(--surface-3)", border: "1px solid var(--border-2)", color: "var(--text-2)" }}
              aria-hidden
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-semibold text-[var(--text)]">{user?.name ?? "Unknown"}</div>
              <span
                className="badge mt-0.5"
                style={{ background: rb.bg, color: rb.color, borderColor: rb.line, fontSize: 10 }}
              >
                {rb.label}
              </span>
            </div>
            <button
              type="button"
              onClick={logout}
              className="shrink-0 rounded p-1.5 transition-colors"
              style={{ color: "var(--text-4)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--danger)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-4)")}
              title="Sign out"
              aria-label="Sign out"
              id="sign-out-btn"
            >
              {icons.signOut}
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div
              className="mono flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold"
              style={{ background: "var(--surface-3)", border: "1px solid var(--border-2)", color: "var(--text-3)" }}
              title={user?.name}
              aria-hidden
            >
              {initials}
            </div>
            <button
              type="button"
              onClick={logout}
              className="rounded p-1.5 transition-colors"
              style={{ color: "var(--text-4)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--danger)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-4)")}
              title="Sign out"
              aria-label="Sign out"
            >
              {icons.signOut}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}