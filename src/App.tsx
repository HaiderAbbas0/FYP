import React, { useState } from "react";
import type { Screen } from "./types";
import TopNav from "./components/TopNav";
import Dashboard from "./screens/Dashboard";
import AttackSimulation from "./screens/AttackSimulation";
import AgentSimulation from "./screens/AgentSimulation";
import Devices from "./screens/Devices";
import DeviceDetail from "./screens/DeviceDetail";
import Incidents from "./screens/Incidents";
import IncidentDetail from "./screens/IncidentDetail";
import CaseMemory from "./screens/CaseMemory";
import CaseDetail from "./screens/CaseDetail";
import Evaluation from "./screens/Evaluation";
import SystemHealth from "./screens/SystemHealth";
import RuntimeWorkspace from "./components/RuntimeWorkspace";

export default function App() {
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [designPreview, setDesignPreview] = useState(false);
  const [incidentTab, setIncidentTab] = useState<"overview" | "safereuse" | "response">("overview");

  const navigate = (s: Screen) => {
    if (s.startsWith("incident-")) {
      const tab = s.replace("incident-", "") as "overview" | "safereuse" | "response";
      setIncidentTab(tab);
    }
    setScreen(s);
  };

  const simView =
    screen === "simulation-running" ? "running"
    : screen === "simulation-result" ? "result"
    : "configure";

  return (
    <div className="h-full flex flex-col pt-3" style={{ background: "#0A0C0A" }}>
      <TopNav screen={screen} onNavigate={navigate} onLogout={() => {
        const api = import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_API_BASE ?? 'http://localhost:8099';
        void fetch(`${api}/api/auth/session`, { method: 'DELETE', credentials: 'include' }).then(response => {
          if (response.ok || response.status === 401) window.location.reload();
          else window.alert('Session logout failed. Retry when the runtime is available.');
        }).catch(() => window.alert('Session logout failed. The runtime could not be reached.'));
      }} />
      <div className="px-6 py-2 text-sm text-[#8A918A] flex justify-between border-b border-[#242924]">
        <span>{designPreview ? "Design preview — sample values and illustrative results" : "Operational workspace — persisted runtime data"}</span>
        <button className="text-[#B6FF3B]" onClick={() => setDesignPreview(!designPreview)}>{designPreview ? "Open runtime" : "View design preview"}</button>
      </div>
      <main className="flex-1 min-h-0 overflow-hidden">
        {!designPreview && screen !== "agent-simulation" && <RuntimeWorkspace view={
          screen.startsWith("incident") || screen.startsWith("simulation") ? "runs" :
          screen.startsWith("case") ? "cases" : screen.startsWith("device") ? "devices" :
          screen === "evaluation" ? "evaluation" : screen === "system-health" || screen === "settings" ? "health" : "dashboard"
        } />}
        {designPreview && <>
        {screen === "dashboard" && <Dashboard onNavigate={navigate} />}
        {(screen === "simulation-configure" || screen === "simulation-running" || screen === "simulation-result") &&
          <AttackSimulation view={simView} onNavigate={navigate} />}
        {screen === "devices" && <Devices onNavigate={navigate} />}
        {screen === "device-detail" && <DeviceDetail onNavigate={navigate} />}
        {screen === "incidents" && <Incidents onNavigate={navigate} />}
        {(screen === "incident-overview" || screen === "incident-safereuse" || screen === "incident-response") &&
          <IncidentDetail tab={incidentTab} onNavigate={navigate} onTabChange={(t) => { setIncidentTab(t); setScreen(`incident-${t}` as Screen); }} />}
        {screen === "case-memory" && <CaseMemory onNavigate={navigate} />}
        {screen === "case-detail" && <CaseDetail onNavigate={navigate} />}
        {screen === "evaluation" && <Evaluation onNavigate={navigate} />}
        {(screen === "system-health" || screen === "settings") && <SystemHealth onNavigate={navigate} />}
        </>}
        {screen === "agent-simulation" && <AgentSimulation />}
      </main>
    </div>
  );
}
