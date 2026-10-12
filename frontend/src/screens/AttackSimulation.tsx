import React, { useState, useEffect } from "react";
import type { Screen } from "../types";
import ConfirmDialog from "../components/ConfirmDialog";
import Field from "../components/Field";

interface Props { onNavigate: (s: Screen) => void; }

type LogType = "info" | "warn" | "crit" | "success";
interface LogLine { time: string; text: string; type: LogType }

const LOG_COLOR: Record<LogType, string> = {
  info: "var(--text-2)",
  warn: "var(--medium)",
  crit: "var(--critical)",
  success: "var(--lime)",
};

const PHASES = [
  {
    n: "PHASE 01",
    title: "DETECTION PHASE",
    rows: [
      { text: "• Packet Ingestion: OK" },
      { text: "• Feature Vector: Extracted" },
      { text: "• Anomaly Model: ", value: "98.4%" },
    ],
  },
  {
    n: "PHASE 02",
    title: "ROUTING & CBR MATCH",
    rows: [
      { text: "• Case Retrieval: CAS-041" },
      { text: "• Vector Sim: 0.964" },
      { text: "• Confidence: HIGH" },
    ],
  },
  {
    n: "PHASE 03",
    title: "BIOMED SAFEGUARD",
    rows: [
      { text: "• Target: ", value: "" },
      { text: "• Criticality: Tier-1 (Life)" },
      { text: "• Action: Non-Disruptive" },
    ],
  },
  {
    n: "PHASE 04",
    title: "CONTAINMENT APPLIED",
    rows: [
      { text: "• Dynamic ACL: Enforced" },
      { text: "• Traffic Scrubbed: 100%" },
      { text: "• Telemetry: Restored" },
    ],
  },
];

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
  const [consoleLogs, setConsoleLogs] = useState<LogLine[]>([]);
  const [simCompleted, setSimCompleted] = useState(false);
  const [reportExported, setReportExported] = useState(false);

  // Live Metrics during simulation
  const [packetRate, setPacketRate] = useState(0);
  const [bandwidth, setBandwidth] = useState(0);
  const [targetLatency, setTargetLatency] = useState(4.2);

  const vectors = [
    { value: "MQTT Connect Flood", label: "MQTT Connect Flood (DDoS Broker Exhaustion)" },
    { value: "SYN Flood (ICU Telemetry)", label: "SYN Flood (ICU Vital Signs Stream)" },
    { value: "UDP Amplification", label: "UDP Amplification (PACS Archive Port 104)" },
    { value: "DICOM Stream Flooding", label: "DICOM C-STORE Flood (Imaging Station)" },
    { value: "HL7 Telemetry Starvation", label: "HL7 EHR Interface Starvation" },
    { value: "HTTP Slowloris", label: "HTTP Slowloris (Infusion Pump Gateway)" },
  ];

  const devices = [
    { id: "Gateway-01", label: "Gateway-01 (10.0.4.15 · IoMT Edge Gateway)", ip: "10.0.4.15", type: "Gateway" },
    { id: "Infusion-Pump-3B", label: "Infusion-Pump-3B (10.0.4.102 · Alaris Medley)", ip: "10.0.4.102", type: "Infusion Pump" },
    { id: "Patient-Monitor-ICU-04", label: "Patient-Monitor-ICU-04 (10.0.4.88 · Philips IntelliVue)", ip: "10.0.4.88", type: "Monitor" },
    { id: "MRI-Scanner-02", label: "MRI-Scanner-02 (10.0.5.12 · Siemens Magnetom)", ip: "10.0.5.12", type: "Imaging" },
    { id: "Ventilator-CCU-01", label: "Ventilator-CCU-01 (10.0.4.45 · Puritan Bennett 980)", ip: "10.0.4.45", type: "Ventilator" },
  ];

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
    let timer: ReturnType<typeof setInterval>;
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
          setActiveStep((step) => {
            if (pct > 20) return Math.max(step, 1);
            if (pct > 45) return Math.max(step, 2);
            if (pct > 70) return Math.max(step, 3);
            if (pct > 90) return Math.max(step, 4);
            return step;
          });

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
  }, [running, duration, intensity]);

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

  function Segmented({
    options,
    value,
    onChange,
    ariaLabel,
  }: {
    options: readonly string[];
    value: string;
    onChange: (v: any) => void;
    ariaLabel: string;
  }) {
    return (
      <div className="grid gap-1.5 p-1" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`, background: "var(--well)", border: "1px solid var(--border)", borderRadius: 8 }} role="group" aria-label={ariaLabel}>
        {options.map((o) => {
          const on = value === o;
          return (
            <button
              key={o}
              type="button"
              onClick={() => onChange(o)}
              aria-pressed={on}
              className="rounded-[5px] py-2 text-center text-[13.5px] font-bold transition-colors"
              style={{
                background: on ? "var(--lime)" : "transparent",
                color: on ? "var(--on-lime)" : "var(--text-3)",
              }}
            >
              {o}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="page max-w-[1440px]">
        <div className="page-header">
          <div>
            <div className="t-label mb-1.5" style={{ color: "var(--lime)" }}>CONTROLLED ATTACK SIMULATION</div>
            <h1 className="page-title">Isolated Lab Mode</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Simulation Parameters */}
          <div className="panel lg:col-span-8">
            <div className="panel-head">
              <h2>Simulation Parameters</h2>
            </div>
            <div className="panel-body">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
                <div>
                  <div className="field-label">ATTACK MODE</div>
                  <Segmented
                    options={["DoS", "DDoS"] as const}
                    value={attackMode}
                    ariaLabel="Attack mode"
                    onChange={(v) => {
                      setAttackMode(v);
                      setSourceCount(v === "DoS" ? "1" : "32");
                    }}
                  />
                </div>

                <Field label="ATTACK VECTOR">
                  {(p) => (
                    <select {...p} value={attackVector} onChange={(e) => setAttackVector(e.target.value)}>
                      {vectors.map((v) => (
                        <option key={v.value} value={v.value}>{v.label}</option>
                      ))}
                    </select>
                  )}
                </Field>

                <Field label="TARGET DEVICE">
                  {(p) => (
                    <select {...p} value={targetDevice} onChange={(e) => setTargetDevice(e.target.value)}>
                      {devices.map((d) => (
                        <option key={d.id} value={d.id}>{d.label}</option>
                      ))}
                    </select>
                  )}
                </Field>

                <div>
                  <div className="field-label">INTENSITY</div>
                  <Segmented options={["Low", "Medium", "High"] as const} value={intensity} onChange={setIntensity} ariaLabel="Intensity" />
                </div>

                <div>
                  <div className="field-label">DURATION</div>
                  <Segmented options={["30 sec", "60 sec", "120 sec"] as const} value={duration} onChange={setDuration} ariaLabel="Duration" />
                </div>

                <Field label="SOURCE COUNT">
                  {(p) => (
                    <input
                      {...p}
                      className={`${p.className} mono`}
                      type="number"
                      min={1}
                      max={500}
                      value={sourceCount}
                      onChange={(e) => setSourceCount(e.target.value)}
                    />
                  )}
                </Field>
              </div>

              <div className="mt-5">
                <Field label="RUN NOTE (OPTIONAL)">
                  {(p) => (
                    <input {...p} type="text" value={runNote} onChange={(e) => setRunNote(e.target.value)} placeholder="e.g. FYP Demo Run — MQTT scenario" />
                  )}
                </Field>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3 border-t pt-5" style={{ borderColor: "var(--border)" }}>
                <button
                  type="button"
                  disabled={running}
                  onClick={() => setConfirmOpen(true)}
                  className={`btn btn-danger ${running ? "cursor-not-allowed opacity-70" : ""}`}
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5" />
                    <circle cx="12" cy="16" r="1" fill="currentColor" />
                  </svg>
                  <span>{running ? "Simulation in Progress..." : "Start Controlled Simulation"}</span>
                </button>

                <button type="button" onClick={handleExportReport} className="btn btn-secondary">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span>{reportExported ? "Attack Report Exported ✓" : "Export Attack Report"}</span>
                </button>

                {simCompleted && (
                  <button type="button" onClick={() => onNavigate("incidents")} className="btn btn-ghost btn-sm ml-auto">
                    Review in Incidents →
                  </button>
                )}
              </div>

              {running && (
                <div className="animate-in fade-in mt-6 border-t pt-5" style={{ borderColor: "var(--border)" }}>
                  <div className="mono mb-2 flex items-center justify-between text-[13px]">
                    <span className="font-bold" style={{ color: "var(--lime)" }}>SIMULATION EXECUTING: {progress}%</span>
                    <span className="text-[var(--text-4)]">{elapsed}s / {duration}</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full" style={{ background: "var(--surface-3)" }}>
                    <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: "var(--medium)" }} />
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                    {[
                      { label: "Packet Rate", value: `${packetRate} pps`, color: "var(--medium)" },
                      { label: "Bandwidth", value: `${bandwidth} Mbps`, color: "var(--lime)" },
                      { label: "Target RTT", value: `${targetLatency} ms`, color: "var(--critical)" },
                    ].map((m) => (
                      <div key={m.label} className="rounded-lg p-2.5" style={{ background: "var(--well)", border: "1px solid var(--border)" }}>
                        <div className="t-label">{m.label}</div>
                        <div className="mono text-[16px] font-bold" style={{ color: m.color }}>{m.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pre-flight Checklist */}
          <div className="panel flex flex-col justify-between lg:col-span-4">
            <div className="panel-head">
              <h2>Pre-flight Checklist</h2>
            </div>
            <div className="panel-body flex flex-1 flex-col justify-between">
              <ul className="space-y-3.5">
                {checklist.map((item) => (
                  <li key={item.label} className="flex items-center gap-3 text-[14px]">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: "var(--lime)" }} aria-hidden>
                      <path d="M3 7.2l2.8 2.8L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="font-medium text-[var(--text-2)]">{item.label}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 rounded-lg p-4" style={{ background: "var(--lime-soft)", border: "1px solid var(--lime-line)" }}>
                <div className="mono mb-1 flex items-center gap-2 text-[12px] font-bold" style={{ color: "var(--lime)" }}>
                  <span className="h-2 w-2 rounded-full pulse-critical" style={{ background: "var(--lime)" }} aria-hidden />
                  SAFEGUARD ACTIVE
                </div>
                <p className="text-[12.5px] leading-relaxed text-[var(--text-2)]">
                  IoMT sandboxing prevents disruption to critical clinical patient networks. All flows are constrained to the isolated virtual testbed.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Investigation Path */}
        <div className="panel mt-5">
          <div className="panel-head">
            <div>
              <h2>Investigation Path</h2>
              <p className="mono mt-1 text-[13px] text-[var(--text-4)]">
                Simulated case traversal · PARTIAL route selected by controller
              </p>
            </div>
            <div className="flex items-center gap-5 text-[12px]">
              <span className="flex items-center gap-2 text-[var(--text-3)]">
                <span className="inline-block h-[2px] w-5" style={{ background: "var(--lime)" }} aria-hidden />
                Active path
              </span>
              <span className="flex items-center gap-2 text-[var(--text-4)]">
                <span className="inline-block h-0 w-5 border-t border-dashed" style={{ borderColor: "var(--border-3)" }} aria-hidden />
                Alternate
              </span>
            </div>
          </div>

          <div className="panel-body">
            <div className="grid grid-cols-1 gap-3 pt-1 md:grid-cols-4">
              {PHASES.map((phase, idx) => {
                const reached = activeStep >= idx + 1;
                const rows = phase.rows.map((r) =>
                  r.text === "• Target: " ? { ...r, value: targetDevice } : r,
                );
                return (
                  <div
                    key={phase.n}
                    className="rounded-lg p-4 transition-colors duration-300"
                    style={{
                      background: reached ? "var(--lime-soft)" : "var(--well)",
                      border: reached ? "1px solid var(--lime-line)" : "1px solid var(--border)",
                    }}
                  >
                    <div className="mono mb-1 text-[10px]" style={{ color: reached ? "var(--lime)" : "var(--text-4)" }}>
                      {phase.n}
                    </div>
                    <div className="mb-2 text-[13.5px] font-bold text-[var(--text)]">{phase.title}</div>
                    <div className="mono space-y-1 text-[12px]" style={{ color: "var(--text-3)" }}>
                      {rows.map((r) => (
                        <div key={r.text}>
                          {r.text}
                          {r.value && <span className="font-bold" style={{ color: "var(--lime)" }}>{r.value}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Console Log Output */}
            <div className="mt-5 overflow-hidden rounded-lg" style={{ border: "1px solid var(--border)" }}>
              <div
                className="flex items-center justify-between px-4 py-2"
                style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}
              >
                <span className="t-label">Simulation Engine Console Output</span>
                {running && (
                  <span className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--lime)" }}>
                    <span className="h-2 w-2 rounded-full pulse-critical" style={{ background: "var(--lime)" }} aria-hidden />
                    LIVE TRAFFIC STREAM
                  </span>
                )}
              </div>
              <div className="mono h-[160px] space-y-1.5 overflow-y-auto p-4 text-[12.5px]" style={{ background: "var(--well)" }} role="log" aria-live="polite">
                {consoleLogs.length === 0 ? (
                  <div style={{ color: "var(--text-4)" }}>
                    Awaiting attack simulation execution. Select your parameters and click "Start Controlled Simulation" above.
                  </div>
                ) : (
                  consoleLogs.map((log, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="shrink-0" style={{ color: "var(--text-4)" }}>[{log.time}]</span>
                      <span style={{ color: LOG_COLOR[log.type], fontWeight: log.type === "crit" || log.type === "success" ? 600 : 400 }}>
                        {log.text}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

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