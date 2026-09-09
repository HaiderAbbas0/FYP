import React, { useState } from "react";
import type { Screen } from "./types";
import TopNav from "./components/TopNav";
import Login from "./screens/Login";
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

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [incidentTab, setIncidentTab] = useState<"overview" | "safereuse" | "response">("overview");

  const navigate = (s: Screen) => {
    if (s.startsWith("incident-")) {
      const tab = s.replace("incident-", "") as "overview" | "safereuse" | "response";
      setIncidentTab(tab);
    }
    setScreen(s);
  };

  if (!loggedIn) {
    return <Login onLogin={() => setLoggedIn(true)} />;
  }

  const simView =
    screen === "simulation-running" ? "running"
    : screen === "simulation-result" ? "result"
    : "configure";

  return (
    <div className="h-full flex flex-col pt-3" style={{ background: "#0A0C0A" }}>
      <TopNav screen={screen} onNavigate={navigate} onLogout={() => setLoggedIn(false)} />
      <main className="flex-1 min-h-0 overflow-hidden">
        {screen === "dashboard" && <Dashboard onNavigate={navigate} />}
        {screen === "agent-simulation" && <AgentSimulation />}
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
      </main>
    </div>
  );
}
