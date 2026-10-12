import React, { useState, useEffect } from "react";
import type { Screen } from "../types";
import { StatusDot } from "./ui/Badge";

const titles: Partial<Record<Screen, string>> = {
  dashboard: "Dashboard",
  "simulation-configure": "Attack Simulation",
  "simulation-running": "Attack Simulation",
  "simulation-result": "Attack Simulation",
  devices: "Devices",
  "device-detail": "Device Detail",
  incidents: "Incidents",
  "incident-overview": "Incident Detail",
  "incident-safereuse": "Incident Detail",
  "incident-response": "Incident Detail",
  "case-memory": "Case Memory",
  "case-detail": "Case Detail",
  evaluation: "Evaluation",
  "system-health": "System & Settings",
  settings: "System & Settings",
};

interface Props {
  screen: Screen;
}

export default function Header({ screen }: Props) {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="h-[52px] min-h-[52px] bg-[#0F120F] border-b border-[#1A1F1B] flex items-center px-6 gap-4">
      <h1 className="font-semibold text-[20px] text-[#E8EDE9] flex-1">{titles[screen]}</h1>

      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#242924] text-[14px] mono text-[#94A8BA] uppercase tracking-widest bg-[#111511]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] inline-block" />
        Isolated IoMT Testbed
      </span>

      <div className="flex items-center gap-1.5">
        <StatusDot online={true} />
        <span className="text-[15px] text-[#94A8BA] mono">Systems OK</span>
      </div>

      <span className="text-[15px] mono text-[#94A8BA]">
        {time.toLocaleTimeString("en-GB")}
      </span>

      <div className="flex items-center gap-2 pl-3 border-l border-[#1A1F1B]">
        <div className="w-7 h-7 bg-[#B6FF3B] rounded-full flex items-center justify-center text-[14px] text-[#0C0F0D] font-bold">SA</div>
        <span className="text-[15px] font-medium text-[#E8EDE9]">Super Admin</span>
      </div>
    </header>
  );
}
