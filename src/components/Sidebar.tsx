import React from "react";
import type { Screen } from "../types";

interface NavItem {
  id: Screen;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    id: "dashboard", label: "Dashboard", icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
        <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
        <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
        <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
      </svg>
    )
  },
  {
    id: "simulation-configure", label: "Attack Simulation", icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M8 4v4l3 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    )
  },
  {
    id: "devices", label: "Devices", icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="3" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M5 13h6M8 11v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    )
  },
  {
    id: "incidents", label: "Incidents", icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 2L14 13H2L8 2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
        <path d="M8 6v3M8 11v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    )
  },
  {
    id: "case-memory", label: "Case Memory", icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M3 2h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M5 5h6M5 8h6M5 11h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    )
  },
  {
    id: "evaluation", label: "Evaluation", icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M2 12l4-4 3 3 5-7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  {
    id: "system-health", label: "System & Settings", icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.22 3.22l1.41 1.41M11.37 11.37l1.41 1.41M3.22 12.78l1.41-1.41M11.37 4.63l1.41-1.41" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    )
  },
];

interface Props {
  active: Screen;
  onNavigate: (s: Screen) => void;
  onLogout: () => void;
}

export default function Sidebar({ active, onNavigate, onLogout }: Props) {
  const isSimulation = active.startsWith("simulation");
  const isDeviceRelated = active === "devices" || active === "device-detail";
  const isIncidentRelated = active === "incidents" || active.startsWith("incident");
  const isCaseRelated = active === "case-memory" || active === "case-detail";
  const isSystemRelated = active === "system-health" || active === "settings";

  const isActive = (id: Screen) => {
    if (id === "simulation-configure") return isSimulation;
    if (id === "devices") return isDeviceRelated;
    if (id === "incidents") return isIncidentRelated;
    if (id === "case-memory") return isCaseRelated;
    if (id === "system-health") return isSystemRelated;
    return active === id;
  };

  return (
    <aside className="w-[220px] min-w-[220px] h-full bg-[#080B08] border-r border-[#161B17] flex flex-col">
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 border-b border-[#161B17]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#B6FF3B] rounded-[6px] flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L12 7L7 13L2 7L7 1Z" fill="#0C0F0D"/>
              <circle cx="7" cy="7" r="2" fill="#0C0F0D"/>
            </svg>
          </div>
          <div>
            <div className="text-[#E8EDE9] font-semibold text-[17px] leading-tight">AACD</div>
            <div className="text-[#94A8BA] text-[13px] mono uppercase tracking-widest leading-tight">IoMT Defense</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active_ = isActive(item.id);
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-[19px] font-medium text-left transition-all duration-150
                ${active_
                  ? "bg-[#B6FF3B] text-[#0C0F0D]"
                  : "text-[#94A8BA] hover:text-[#E8EDE9] hover:bg-[#111511]"
                }`}
            >
              <span className={active_ ? "text-[#0C0F0D]" : "text-[#94A8BA]"}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-[#161B17]">
        <div className="px-3 py-2.5 mb-1">
          <div className="text-[#E8EDE9] text-[15px] font-medium">Super Admin</div>
          <div className="text-[#94A8BA] text-[13px] mono">admin@iomt-testbed.local</div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-[19px] text-[#94A8BA] hover:text-[#EF4444] hover:bg-[#111511] transition-all duration-150"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 2H13a1 1 0 011 1v10a1 1 0 01-1 1H10M6 11L10 8 6 5M10 8H2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Logout
        </button>
      </div>
    </aside>
  );
}
