import React, { useState, useEffect } from "react";
import type { Screen } from "../types";

interface NavGroup {
  id: Screen;
  label: string;
}

const navGroups: NavGroup[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "agent-simulation", label: "Agent Simulation" },
  { id: "simulation-configure", label: "Attack Simulation" },
  { id: "devices", label: "Devices" },
  { id: "incidents", label: "Incidents" },
  { id: "case-memory", label: "Case Memory" },
  { id: "evaluation", label: "Evaluation" },
  { id: "system-health", label: "System & Settings" },
];

function matchGroup(screen: Screen): Screen {
  if (screen.startsWith("simulation")) return "simulation-configure";
  if (screen === "device-detail") return "devices";
  if (screen.startsWith("incident")) return "incidents";
  if (screen === "case-detail") return "case-memory";
  if (screen === "settings") return "system-health";
  return screen;
}

interface Props {
  screen: Screen;
  onNavigate: (s: Screen) => void;
  onLogout: () => void;
}

export default function TopNav({ screen, onNavigate, onLogout }: Props) {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const active = matchGroup(screen);

  return (
    <nav className="w-full h-[64px] min-h-[64px] bg-[#080B08] border-b border-[#1A1E1B] flex items-center px-6 gap-0 z-50">
      {/* Wordmark */}
      <div className="flex items-center gap-2.5 mr-8 shrink-0">
        <div className="w-6 h-6 bg-[#EF4444] rounded-[4px] flex items-center justify-center shrink-0">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1L10 6L6 11L2 6L6 1Z" fill="white"/>
            <circle cx="6" cy="6" r="1.8" fill="#EF4444"/>
          </svg>
        </div>
        <span className="font-bold text-[20px] text-[#E2E8E2] tracking-tight">MediSOC</span>
      </div>

      {/* Nav links */}
      <div className="flex items-center gap-0 flex-1 min-w-0">
        {navGroups.map((g) => {
          const isActive = active === g.id;
          const col = isActive ? "#E2E8E2" : "#94A8BA";
          return (
            <button
              key={g.id}
              onClick={() => onNavigate(g.id)}
              className={`relative px-3.5 py-1.5 text-[18px] font-medium whitespace-nowrap rounded-[6px] ${isActive ? "bg-[#1A1E1B]" : ""}`}
              style={{ color: col, transition: "color 0.15s" }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = "#C8CEC8"; }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = "#94A8BA"; }}
            >
              {g.label}
              {isActive && (
                <span className="absolute bottom-0 left-3.5 right-3.5 h-[2px] bg-[#EF4444] rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4 shrink-0 pl-4 border-l border-[#1A1E1B]">
        {/* System status dot only */}
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] inline-block" />
        </div>

        {/* Time */}
        <span className="text-[14px] mono text-[#94A8BA]">
          {time.toLocaleTimeString("en-GB")}
        </span>

        {/* Admin */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#1A1E1B] border border-[#2A302B] rounded-full flex items-center justify-center text-[13px] text-[#94A8BA] font-bold mono">
            SA
          </div>
          <button
            onClick={onLogout}
            className="text-[14px] text-[#94A8BA] hover:text-[#EF4444] transition-colors mono"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
