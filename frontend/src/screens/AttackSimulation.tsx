import React, { useState, useEffect } from "react";
import type { Screen } from "../types";
import ConfirmDialog from "../components/ConfirmDialog";

interface Props {
  onNavigate: (s: Screen) => void;
}

export default function AttackSimulation({ onNavigate }: Props) {
  // Simulation Parameter States
  const [attackMode, setAttackMode] = useState<"DoS" | "DDoS">("DDoS");
  const [attackVector, setAttackVector] = useState("MQTT Connect Flood");
  const [targetDevice, setTargetDevice] = useState("Gateway-01");
  const [intensity, setIntensity] = useState<"Low" | "Medium" | "High">("Medium");
  const [duration, setDuration] = useState<"30 sec" | "60 sec" | "120 sec">("120 sec");
  const [sourceCount, setSourceCount] = useState("1");
  const [runNote, setRunNote] = useState("");

  // Execution States
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [consoleLogs, setConsoleLogs] = useState<Array<{ time: string; text: string; type: "info" | "warn" | "crit" | "success" }>>([]);
  const [simCompleted, setSimCompleted] = useState(false);
  const [reportExported, setReportExported] = useState(false);

  // Live Metrics during simulation
  const [packetRate, setPacketRate] = useState(0);
  const [bandwidth, setBandwidth] = useState(0);
  const [targetLatency, setTargetLatency] = useState(4.2);

  // Vectors list
  const vectors = [
    { value: "MQTT Connect Flood", label: "MQTT Connect Flood (DDoS Broker Exhaustion)" },
    { value: "SYN Flood (ICU Telemetry)", label: "SYN Flood (ICU Vital Signs Stream)" },
    { value: "UDP Amplification", label: "UDP Amplification (PACS Archive Port 104)" },
    { value: "DICOM Stream Flooding", label: "DICOM C-STORE Flood (Imaging Station)" },
    { value: "HL7 Telemetry Starvation", label: "HL7 EHR Interface Starvation" },
    { value: "HTTP Slowloris", label: "HTTP Slowloris (Infusion Pump Gateway)" },
  ];

  // Target devices list
  const devices = [
    { id: "Gateway-01", label: "Gateway-01 (10.0.4.15 · IoMT Edge Gateway)", ip: "10.0.4.15", type: "Gateway" },
    { id: "Infusion-Pump-3B", label: "Infusion-Pump-3B (10.0.4.102 · Alaris Medley)", ip: "10.0.4.102", type: "Infusion Pump" },
    { id: "Patient-Monitor-ICU-04", label: "Patient-Monitor-ICU-04 (10.0.4.88 · Philips IntelliVue)", ip: "10.0.4.88", type: "Monitor" },
    { id: "MRI-Scanner-02", label: "MRI-Scanner-02 (10.0.5.12 · Siemens Magnetom)", ip: "10.0.5.12", type: "Imaging" },
    { id: "Ventilator-CCU-01", label: "Ventilator-CCU-01 (10.0.4.45 · Puritan Bennett 980)", ip: "10.0.4.45", type: "Ventilator" },
  ];

  // Checklist items
  const checklist = [
    { label: "Lab mode enabled", ok: true },
    { label: "Target device online", ok: true },
    { label: "Edge pipeline healthy", ok: true },
    { label: "Detector online", ok: true },
    { label: "Controller online", ok: true },
    { label: "Database online", ok: true },
    { label: "Baseline monitoring ready", ok: true },
  ];

  // Run simulation timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (running) {
      timer = setInterval(() => {
        setElapsed((prev) => {
          const next = prev + 1;
          const maxSec = duration === "30 sec" ? 30 : duration === "60 sec" ? 60 : 120;
          const pct = Math.min(100, Math.round((next / maxSec) * 100));
          setProgress(pct);

          // Dynamic metrics
          const intensityMultiplier = intensity === "Low" ? 500 : intensity === "Medium" ? 1800 : 4200;
          setPacketRate(Math.floor(intensityMultiplier + Math.random() * 400));
          setBandwidth(parseFloat((intensityMultiplier * 0.008 + Math.random() * 0.5).toFixed(2)));
          setTargetLatency(parseFloat((4.2 + (pct / 10) * 8.5 + Math.random() * 15).toFixed(1)));

          // Step updates
          if (pct > 20 && activeStep < 1) setActiveStep(1);
          if (pct > 45 && activeStep < 2) setActiveStep(2);
          if (pct > 70 && activeStep < 3) setActiveStep(3);
          if (pct > 90 && activeStep < 4) setActiveStep(4);

          if (pct >= 100) {
            setRunning(false);
            setSimCompleted(true);
            setConsoleLogs((logs) => [
              ...logs,
              { time: new Date().toLocaleTimeString(), text: "[SIM-COMPLETE] Attack simulation run concluded. Incident INC-2026-0889 registered in SOC.", type: "success" },
            ]);
          }
          return next;
        });
      }, 500);
    }
    return () => clearInterval(timer);
  }, [running, duration, intensity, activeStep]);

  function handleStartSimulation() {
    setConfirmOpen(false);
    setRunning(true);
    setProgress(0);
    setElapsed(0);
    setActiveStep(0);
    setSimCompleted(false);
    setReportExported(false);

    const now = new Date().toLocaleTimeString();
    setConsoleLogs([
      { time: now, text: `[INIT] Isolated Lab Mode engaged for target ${targetDevice}.`, type: "info" },
      { time: now, text: `[ATTACK-VECTOR] Scenario: ${attackVector} · Mode: ${attackMode} · Intensity: ${intensity}`, type: "warn" },
      { time: now, text: `[SIM-ENGINE] Generating synthetic ${attackMode} packet streams from ${sourceCount} isolated virtual sources...`, type: "warn" },
    ]);

    setTimeout(() => {
      setConsoleLogs((prev) => [
        ...prev,
        { time: new Date().toLocaleTimeString(), text: `[DETECTION] Anomaly detected: MQTT connection rate exceeds baseline threshold (> 850 conn/s).`, type: "crit" },
      ]);
    }, 1500);

    setTimeout(() => {
      setConsoleLogs((prev) => [
        ...prev,
        { time: new Date().toLocaleTimeString(), text: `[CASE-MEMORY] Matching historical case: CAS-041 (IoMT Gateway Flood) found with 96.4% confidence.`, type: "info" },
      ]);
    }, 3000);

    setTimeout(() => {
      setConsoleLogs((prev) => [
        ...prev,
        { time: new Date().toLocaleTimeString(), text: `[BIOMED-SAFEGUARD] Validated target ${targetDevice} clinical priority tier: CRITICAL.`, type: "success" },
        { time: new Date().toLocaleTimeString(), text: `[RESPONSE] Enforcing safe rate-limit & client connection throttling without service drop.`, type: "success" },
      ]);
    }, 4500);
  }

  function handleExportReport() {
    setReportExported(true);
    const reportData = {
      simulationId: `SIM-LAB-${Date.now()}`,
      timestamp: new Date().toISOString(),
      mode: attackMode,
      vector: attackVector,
      target: targetDevice,
      intensity,
      duration,
      sourceCount,
      runNote: runNote || "FYP Demo Run — MQTT scenario",
      status: simCompleted ? "Completed" : "Configured",
      metrics: {
        peakPacketRate: `${packetRate || 2240} pps`,
        peakBandwidth: `${bandwidth || 18.5} Mbps`,
        maxTargetLatency: `${targetLatency || 142.8} ms`,
      },
      preflightPassed: true,
      caseMemoryMatch: "CAS-041 (MQTT Connect Flood Mitigation)",
      safeguardDecision: "Safe Throttling Applied — 0 packet drops on clinical payload",
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `medisoc-attack-sim-${targetDevice}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="h-full overflow-y-auto bg-[#070908] text-white p-6 lg:p-8 font-sans">
      <div className="max-w-[1440px] mx-auto space-y-6">
        
        {/* Header matching prototype screenshot */}
        <div>
          <div className="text-[12px] font-mono font-bold tracking-widest text-[#A8FF35] uppercase mb-1">
            CONTROLLED ATTACK SIMULATION
          </div>
          <h1 className="text-[30px] lg:text-[34px] font-bold text-white tracking-tight">
            Isolated Lab Mode
          </h1>
        </div>

        {/* Top Grid: Simulation Parameters (Left) + Pre-flight Checklist (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Simulation Parameters Card */}
          <div className="lg:col-span-8 bg-[#0D120F] border border-[#1B261F] rounded-xl p-6 shadow-xl">
            <h2 className="text-[17px] font-semibold text-white mb-6">
              Simulation Parameters
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* ATTACK MODE */}
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-white/70 mb-2">
                  ATTACK MODE
                </label>
                <div className="grid grid-cols-2 gap-2 bg-[#080B09] p-1 rounded-lg border border-[#1B261F]">
                  <button
                    type="button"
                    onClick={() => {
                      setAttackMode("DoS");
                      setSourceCount("1");
                    }}
                    className={`py-2.5 px-4 rounded-md font-bold text-[14px] transition-all ${
                      attackMode === "DoS"
                        ? "bg-[#A8FF35] text-black shadow-md"
                        : "text-white/70 hover:text-white hover:bg-white/[0.05]"
                    }`}
                  >
                    DoS
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAttackMode("DDoS");
                      setSourceCount("32");
                    }}
                    className={`py-2.5 px-4 rounded-md font-bold text-[14px] transition-all ${
                      attackMode === "DDoS"
                        ? "bg-[#A8FF35] text-black shadow-md"
                        : "text-white/70 hover:text-white hover:bg-white/[0.05]"
                    }`}
                  >
                    DDoS
                  </button>
                </div>
              </div>

              {/* ATTACK VECTOR */}
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-white/70 mb-2">
                  ATTACK VECTOR
                </label>
                <select
                  value={attackVector}
                  onChange={(e) => setAttackVector(e.target.value)}
                  className="w-full bg-[#080B09] border border-[#1B261F] rounded-lg px-3.5 py-2.5 text-[14px] text-white font-medium focus:outline-none focus:border-[#A8FF35] transition-colors"
                >
                  {vectors.map((v) => (
                    <option key={v.value} value={v.value} className="bg-[#0D120F] text-white">
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* TARGET DEVICE */}
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-white/70 mb-2">
                  TARGET DEVICE
                </label>
                <select
                  value={targetDevice}
                  onChange={(e) => setTargetDevice(e.target.value)}
                  className="w-full bg-[#080B09] border border-[#1B261F] rounded-lg px-3.5 py-2.5 text-[14px] text-white font-medium focus:outline-none focus:border-[#A8FF35] transition-colors"
                >
                  {devices.map((d) => (
                    <option key={d.id} value={d.id} className="bg-[#0D120F] text-white">
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* INTENSITY */}
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-white/70 mb-2">
                  INTENSITY
                </label>
                <div className="grid grid-cols-3 gap-1.5 bg-[#080B09] p-1 rounded-lg border border-[#1B261F]">
                  {(["Low", "Medium", "High"] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setIntensity(lvl)}
                      className={`py-2 px-2 text-center rounded-md text-[13px] font-bold transition-all ${
                        intensity === lvl
                          ? "bg-[#A8FF35] text-black shadow-md"
                          : "text-white/70 hover:text-white hover:bg-white/[0.05]"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* DURATION */}
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-white/70 mb-2">
                  DURATION
                </label>
                <div className="grid grid-cols-3 gap-1.5 bg-[#080B09] p-1 rounded-lg border border-[#1B261F]">
                  {(["30 sec", "60 sec", "120 sec"] as const).map((dur) => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => setDuration(dur)}
                      className={`py-2 px-2 text-center rounded-md text-[13px] font-bold transition-all ${
                        duration === dur
                          ? "bg-[#A8FF35] text-black shadow-md"
                          : "text-white/70 hover:text-white hover:bg-white/[0.05]"
                      }`}
                    >
                      {dur}
                    </button>
                  ))}
                </div>
              </div>

              {/* SOURCE COUNT */}
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-white/70 mb-2">
                  SOURCE COUNT
                </label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={sourceCount}
                  onChange={(e) => setSourceCount(e.target.value)}
                  className="w-full bg-[#080B09] border border-[#1B261F] rounded-lg px-3.5 py-2.5 text-[14px] text-white font-mono font-medium focus:outline-none focus:border-[#A8FF35] transition-colors"
                />
              </div>

            </div>

            {/* RUN NOTE (OPTIONAL) */}
            <div className="mt-6">
              <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-white/70 mb-2">
                RUN NOTE (OPTIONAL)
              </label>
              <input
                type="text"
                value={runNote}
                onChange={(e) => setRunNote(e.target.value)}
                placeholder="e.g. FYP Demo Run — MQTT scenario"
                className="w-full bg-[#080B09] border border-[#1B261F] rounded-lg px-4 py-2.5 text-[14px] text-white placeholder-white/30 focus:outline-none focus:border-[#A8FF35] transition-colors font-sans"
              />
            </div>

            {/* Action Buttons Row */}
            <div className="mt-8 flex flex-wrap items-center gap-4 pt-4 border-t border-[#1B261F]">
              <button
                type="button"
                disabled={running}
                onClick={() => setConfirmOpen(true)}
                className={`px-6 py-3 rounded-lg text-[14px] font-extrabold flex items-center gap-2.5 transition-all shadow-lg active:scale-95 ${
                  running
                    ? "bg-red-900/50 text-red-300 border border-red-700/50 cursor-not-allowed"
                    : "bg-[#FF4D4D] hover:bg-[#ff6161] text-white shadow-red-950/40 hover:shadow-red-900/60"
                }`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5" />
                  <circle cx="12" cy="16" r="1" fill="currentColor" />
                </svg>
                <span>{running ? "Simulation in Progress..." : "Start Controlled Simulation"}</span>
              </button>

              <button
                type="button"
                onClick={handleExportReport}
                className="px-5 py-3 rounded-lg bg-[#14261C] border border-[#21422E] text-[#A8FF35] hover:bg-[#1C3627] hover:border-[#2D5A3F] text-[14px] font-bold flex items-center gap-2 transition-all"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>{reportExported ? "Attack Report Exported ✓" : "Export Attack Report"}</span>
              </button>

              {simCompleted && (
                <button
                  type="button"
                  onClick={() => onNavigate("incidents")}
                  className="px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-[13px] font-semibold flex items-center gap-1.5 ml-auto"
                >
                  <span>Review in Incidents →</span>
                </button>
              )}
            </div>

            {/* Live Progress bar if running */}
            {running && (
              <div className="mt-6 pt-4 border-t border-[#1B261F] animate-in fade-in">
                <div className="flex items-center justify-between text-[13px] font-mono mb-2">
                  <span className="text-[#A8FF35] font-bold">SIMULATION EXECUTING: {progress}%</span>
                  <span className="text-white/60">{elapsed}s / {duration}</span>
                </div>
                <div className="w-full h-2.5 bg-[#080B09] rounded-full overflow-hidden border border-[#1B261F]">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-400 to-[#A8FF35] transition-all duration-300 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                {/* Live Real-time stats */}
                <div className="grid grid-cols-3 gap-3 mt-4 text-center">
                  <div className="p-2.5 rounded-lg bg-[#080B09] border border-[#1B261F]">
                    <div className="text-[11px] text-white/50 uppercase font-mono">Packet Rate</div>
                    <div className="text-[16px] font-bold text-yellow-400 font-mono">{packetRate} pps</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#080B09] border border-[#1B261F]">
                    <div className="text-[11px] text-white/50 uppercase font-mono">Bandwidth</div>
                    <div className="text-[16px] font-bold text-[#A8FF35] font-mono">{bandwidth} Mbps</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#080B09] border border-[#1B261F]">
                    <div className="text-[11px] text-white/50 uppercase font-mono">Target RTT</div>
                    <div className="text-[16px] font-bold text-red-400 font-mono">{targetLatency} ms</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Pre-flight Checklist Card */}
          <div className="lg:col-span-4 bg-[#0D120F] border border-[#1B261F] rounded-xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <h2 className="text-[17px] font-semibold text-white mb-6">
                Pre-flight Checklist
              </h2>

              <ul className="space-y-4">
                {checklist.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-[14px]">
                    <span className="text-[#A8FF35] font-bold text-[15px]">✓</span>
                    <span className="text-white/90 font-medium">{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Safety notice banner */}
            <div className="mt-8 p-4 rounded-lg bg-[#080B09] border border-[#1B261F]/80">
              <div className="flex items-center gap-2 text-[12px] font-mono font-bold text-[#A8FF35] mb-1">
                <span className="w-2 h-2 rounded-full bg-[#A8FF35] animate-pulse" />
                SAFEGUARD ACTIVE
              </div>
              <p className="text-[12px] text-white/65 leading-relaxed">
                IoMT sandboxing prevents disruption to critical clinical patient networks. All flows are constrained to the isolated virtual testbed.
              </p>
            </div>
          </div>

        </div>

        {/* Bottom Card: Investigation Path (matching screenshot) */}
        <div className="bg-[#0D120F] border border-[#1B261F] rounded-xl p-6 shadow-xl">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-[17px] font-semibold text-white">
                Investigation Path
              </h2>
              <p className="text-[13px] text-white/60 font-mono mt-0.5">
                Simulated case traversal · PARTIAL route selected by controller
              </p>
            </div>

            {/* Legend matching prototype */}
            <div className="flex items-center gap-5 text-[12px] font-mono">
              <div className="flex items-center gap-2">
                <span className="w-5 h-[2px] bg-[#A8FF35] inline-block" />
                <span className="text-white/80">Active path</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-[2px] border-t border-dashed border-white/40 inline-block" />
                <span className="text-white/50">Alternate</span>
              </div>
            </div>
          </div>

          {/* Node Diagram Traversal Flow */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
            
            {/* Step 1: Detection Phase */}
            <div className={`p-4 rounded-xl border transition-all ${
              activeStep >= 1 ? "bg-[#111A14] border-[#A8FF35]/60 shadow-[0_0_15px_rgba(168,255,53,0.15)]" : "bg-[#080B09] border-[#1B261F]"
            }`}>
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#A8FF35] font-bold mb-1">
                PHASE 01
              </div>
              <div className="text-[14px] font-bold text-white mb-2">
                DETECTION PHASE
              </div>
              <div className="space-y-1 text-[12px] text-white/70 font-mono">
                <div>• Packet Ingestion: OK</div>
                <div>• Feature Vector: Extracted</div>
                <div>• Anomaly Model: <span className="text-[#A8FF35]">98.4%</span></div>
              </div>
            </div>

            {/* Step 2: Routing & Classification */}
            <div className={`p-4 rounded-xl border transition-all ${
              activeStep >= 2 ? "bg-[#111A14] border-[#A8FF35]/60 shadow-[0_0_15px_rgba(168,255,53,0.15)]" : "bg-[#080B09] border-[#1B261F]"
            }`}>
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#A8FF35] font-bold mb-1">
                PHASE 02
              </div>
              <div className="text-[14px] font-bold text-white mb-2">
                ROUTING & CBR MATCH
              </div>
              <div className="space-y-1 text-[12px] text-white/70 font-mono">
                <div>• Case Retrieval: CAS-041</div>
                <div>• Vector Sim: 0.964</div>
                <div>• Confidence: HIGH</div>
              </div>
            </div>

            {/* Step 3: BioMed Safe Verification */}
            <div className={`p-4 rounded-xl border transition-all ${
              activeStep >= 3 ? "bg-[#111A14] border-[#A8FF35]/60 shadow-[0_0_15px_rgba(168,255,53,0.15)]" : "bg-[#080B09] border-[#1B261F]"
            }`}>
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#A8FF35] font-bold mb-1">
                PHASE 03
              </div>
              <div className="text-[14px] font-bold text-white mb-2">
                BIOMED SAFEGUARD
              </div>
              <div className="space-y-1 text-[12px] text-white/70 font-mono">
                <div>• Target: {targetDevice}</div>
                <div>• Criticality: Tier-1 (Life)</div>
                <div>• Action: Non-Disruptive</div>
              </div>
            </div>

            {/* Step 4: Mitigation & Containment */}
            <div className={`p-4 rounded-xl border transition-all ${
              activeStep >= 4 ? "bg-[#111A14] border-[#A8FF35]/60 shadow-[0_0_15px_rgba(168,255,53,0.15)]" : "bg-[#080B09] border-[#1B261F]"
            }`}>
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#A8FF35] font-bold mb-1">
                PHASE 04
              </div>
              <div className="text-[14px] font-bold text-white mb-2">
                CONTAINMENT APPLIED
              </div>
              <div className="space-y-1 text-[12px] text-white/70 font-mono">
                <div>• Dynamic ACL: Enforced</div>
                <div>• Traffic Scrubbed: 100%</div>
                <div>• Telemetry: Restored</div>
              </div>
            </div>

          </div>

          {/* Console Log Output */}
          <div className="mt-6 rounded-lg border border-[#1B261F] overflow-hidden bg-[#050706]">
            <div className="px-4 py-2 border-b border-[#1B261F] bg-[#0A0E0C] flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase font-mono text-white/60">
                Simulation Engine Console Output
              </span>
              {running && (
                <span className="flex items-center gap-1.5 text-[11px] font-mono text-[#A8FF35]">
                  <span className="w-2 h-2 rounded-full bg-[#A8FF35] animate-ping" />
                  LIVE TRAFFIC STREAM
                </span>
              )}
            </div>
            <div className="p-4 h-[160px] overflow-y-auto font-mono text-[13px] space-y-1.5">
              {consoleLogs.length === 0 ? (
                <div className="text-white/30 italic">
                  Awaiting attack simulation execution. Select your parameters and click "Start Controlled Simulation" above.
                </div>
              ) : (
                consoleLogs.map((log, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-white/40 shrink-0">[{log.time}]</span>
                    <span
                      className={
                        log.type === "crit"
                          ? "text-[#FF5555] font-bold"
                          : log.type === "warn"
                          ? "text-yellow-400"
                          : log.type === "success"
                          ? "text-[#A8FF35] font-bold"
                          : "text-white/80"
                      }
                    >
                      {log.text}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Confirmation Modal */}
        <ConfirmDialog
          open={confirmOpen}
          title="Start Controlled Attack Simulation"
          variant="warning"
          confirmLabel="Execute Attack"
          cancelLabel="Cancel"
          description={`Are you sure you want to execute the ${attackVector} (${attackMode}) simulation on target device ${targetDevice}? Synthetic test traffic will be routed through the isolated lab environment.`}
          onConfirm={handleStartSimulation}
          onCancel={() => setConfirmOpen(false)}
        />

      </div>
    </div>
  );
}

