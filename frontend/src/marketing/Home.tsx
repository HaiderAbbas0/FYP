import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Logo from "../components/Logo";
import { useReveal } from "../hooks/useReveal";

const TABS = [
  { id: "overview", label: "Security Overview" },
  { id: "iomt", label: "IoMT Devices" },
  { id: "attack", label: "Attack Simulation" },
  { id: "memory", label: "Safe Case Memory" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Passive Telemetry Ingestion",
    desc: "Captures NetFlow, Zeek metadata, and SPAN port traffic with zero disruption to patient monitoring streams and zero-PHI capture.",
    tech: "Passive SPAN / Zeek / DICOM Metadata",
  },
  {
    step: "02",
    title: "Behavioral & Anomaly Detection",
    desc: "Ensemble ML models (Random Forest, Autoencoder) detect volumetric DDoS, MQTT connection floods, and abnormal packet inter-arrival times.",
    tech: "Multi-Model Behavioral ML Engine",
  },
  {
    step: "03",
    title: "Case-Based Safe Reuse (CBR)",
    desc: "Queries historical case memory to match attack signatures against proven clinical response playbooks, scoring similarity & confidence.",
    tech: "k-NN Case Memory & Risk Scoring",
  },
  {
    step: "04",
    title: "Authorized Clinical Response",
    desc: "Presents transparent mitigation plans to SOC analysts. Enforces clinical allowlists to guarantee medical device uptime before any execution.",
    tech: "Human-In-The-Loop Approval & Audit",
  },
];

const CAPABILITIES = [
  {
    title: "Passive IoMT Discovery",
    desc: "100% passive profiling that identifies vendors, firmware, and clinical functions without sending active probes that could crash sensitive infusion systems.",
    tag: "ZERO SCANNING RISK",
    icon: "M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z",
  },
  {
    title: "DoS & DDoS Attack Defense",
    desc: "Detects both volumetric floods and low-and-slow DoS attacks on medical telemetry gateways using healthcare-trained anomaly models.",
    tag: "BEHAVIORAL ML",
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
  },
  {
    title: "Safe Reuse Case Memory",
    desc: "Learns from past hospital incidents. Recommends proven, field-tested remediation playbooks with similarity confidence metrics.",
    tag: "EXPLAINABLE AI",
    icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  },
  {
    title: "Clinical Safety Allowlists",
    desc: "Prevents automated network isolation of critical life-support devices. Every disruptive action requires explicit human authorization.",
    tag: "PATIENT SAFETY FIRST",
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  },
  {
    title: "Zero-PHI Telemetry Only",
    desc: "MediSOC inspects packet headers and protocol metadata only. No patient health records or identifiable health information are ever stored.",
    tag: "HIPAA-BY-DESIGN",
    icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
  },
  {
    title: "Forensic Audit Logging",
    desc: "Detailed record of every alert triage, rule trigger, and mitigation action, creating an accountable audit trail for hospital compliance.",
    tag: "AUDITABLE & ACCOUNTABLE",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  },
];

const COMPARISON = [
  {
    req: "Endpoint Agent Installation",
    trad: "Required (Fails on medical devices)",
    med: "100% Agentless & Passive SPAN/TAP",
  },
  {
    req: "Automatic Device Quarantine",
    trad: "Isolates without checking clinical state",
    med: "Guarded by Clinical Allowlist Engine",
  },
  {
    req: "Healthcare Protocol Decoding",
    trad: "Generic TCP/UDP packet analysis",
    med: "Native DICOM, HL7, MQTT, CoAP parsing",
  },
  {
    req: "Incident History & Playbooks",
    trad: "Static runbooks written for servers",
    med: "Outcome-aware Case Memory (CBR)",
  },
  {
    req: "Patient Safety & HIPAA Stance",
    trad: "No clinical context awareness",
    med: "Zero-PHI ingestion & human approval gates",
  },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [activeWorkflowStep, setActiveWorkflowStep] = useState(0);
  const [heroOffset, setHeroOffset] = useState(0);
  const heroRef = useRef<HTMLElement>(null);

  useReveal();

  // Parallax: the hero artwork and glow drift upward slightly as the page
  // scrolls, and settle back. Driven by a scroll listener with rAF throttling
  // so it never runs layout on a hot path. Disabled under reduced motion by the
  // guard below.
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    function onScroll() {
      if (frame || reduced.matches) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const top = heroRef.current?.offsetTop ?? 0;
        const offset = Math.min(140, Math.max(0, (window.scrollY - top) * 0.22));
        setHeroOffset(offset);
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="w-full text-[var(--text)] overflow-hidden">
      {/* ── 1. Hero ── */}
      <section
        ref={heroRef}
        className="relative flex min-h-[92vh] flex-col items-center justify-center overflow-hidden px-6 pb-24 pt-32"
        style={{ background: "var(--bg)" }}
      >
        {/* Hospital network artwork */}
        <div
          className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/hero-bg.png')",
            backgroundPosition: "center 28%",
            opacity: 0.85,
            transform: `translateY(${heroOffset}px) scale(1.06)`,
            transition: "transform 120ms linear",
          }}
          aria-hidden
        />
        {/* Scrim: darkest behind the headline, fading to the page colour at the fold */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 80% at 50% 26%, rgba(7,10,9,0.62) 0%, rgba(7,10,9,0.86) 45%, rgba(7,10,9,0.97) 100%)",
          }}
          aria-hidden
        />
        {/* Brand-coloured light behind the wordmark */}
        <div
          className="pointer-events-none absolute left-1/2 top-[30%] h-[420px] w-[820px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: "radial-gradient(closest-side, rgba(168,255,53,0.10), transparent)" }}
          aria-hidden
        />

        <div className="relative z-10 mx-auto mt-6 max-w-[940px] text-center">
          <span className="pill mb-8">
            <span className="dot status-pulse" style={{ background: "var(--lime)" }} aria-hidden />
            Healthcare Cybersecurity Operations Platform
          </span>

          <h1 className="t-display mb-7 text-[var(--text)]">
            Protecting Healthcare.{" "}
            <br />
            <span
              className="text-transparent"
              style={{
                backgroundImage: "linear-gradient(96deg, var(--lime) 8%, #7DE9A6 52%, var(--violet) 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
              }}
            >
              Securing Every Connection.
            </span>
          </h1>

          <p className="t-lead mx-auto mb-11 max-w-[720px]">
            MediSOC empowers hospital security teams to detect network threats, protect connected medical devices (IoMT), and execute safe, evidence-driven incident responses without disrupting clinical patient care.
          </p>

          <div className="mb-16 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
            <Link to="/contact" className="btn btn-primary btn-lg w-full sm:w-auto">
              Request a Demo
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              to="/dashboard"
              className="btn btn-secondary btn-lg w-full sm:w-auto"
              style={{ background: "var(--surface-2)", borderColor: "var(--border-2)" }}
            >
              <span className="dot" style={{ background: "var(--lime)" }} aria-hidden />
              Explore the Platform
            </Link>
          </div>
        </div>

        {/* Interactive product preview */}
        <div className="reveal relative z-10 w-full max-w-[1240px] overflow-hidden rounded-xl" style={{ border: "1px solid var(--border-2)", boxShadow: "var(--shadow-xl)" }}>
          <div
            className="flex flex-wrap items-center justify-between gap-4 px-4 py-2.5"
            style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}
          >
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#3A4240" }} aria-hidden />
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#3A4240" }} aria-hidden />
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#3A4240" }} aria-hidden />
              <span className="mono ml-2 hidden text-[11px] text-[var(--text-4)] sm:inline">
                https://soc.hospital.local/command-center
              </span>
            </div>

            <div className="flex items-center gap-1 rounded-md p-1" style={{ background: "var(--bg)", border: "1px solid var(--border)" }} role="tablist" aria-label="Product preview">
              {TABS.map((tab) => {
                const on = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    onClick={() => setActiveTab(tab.id)}
                    className="rounded px-3 py-1.5 text-[12px] font-medium transition-colors duration-150"
                    style={{
                      background: on ? "var(--surface-4)" : "transparent",
                      color: on ? "var(--lime)" : "var(--text-3)",
                      fontWeight: on ? 600 : 400,
                    }}
                    onMouseEnter={(e) => {
                      if (!on) e.currentTarget.style.color = "var(--text)";
                    }}
                    onMouseLeave={(e) => {
                      if (!on) e.currentTarget.style.color = "var(--text-3)";
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="min-h-[400px] p-6" style={{ background: "var(--surface)" }}>
            {activeTab === "overview" && (
              <div className="animate-in fade-in space-y-5">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {[
                    { label: "Active Hospital Incidents", val: "3 Critical", sub: "1 under investigation", color: "var(--critical)" },
                    { label: "Connected Medical Assets", val: "48 Devices", sub: "100% telemetry healthy", color: "var(--lime)" },
                    { label: "Detector Accuracy (F1)", val: "97.4%", sub: "Multi-model ensemble", color: "var(--info)" },
                    { label: "Clinical Availability Pledge", val: "100.0%", sub: "Zero device drops", color: "var(--success)" },
                  ].map((m) => (
                    <div key={m.label} className="card px-4 py-3.5">
                      <div className="t-label">{m.label}</div>
                      <div className="mono mt-1.5 text-[20px] font-bold" style={{ color: m.color }}>{m.val}</div>
                      <div className="mt-1 text-[11.5px] text-[var(--text-4)]">{m.sub}</div>
                    </div>
                  ))}
                </div>

                <div className="card p-5">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h4 className="text-[13.5px] font-semibold text-[var(--text)]">Live Clinical Network Telemetry (IoMT VLAN 104)</h4>
                      <p className="mt-0.5 text-[12px] text-[var(--text-4)]">
                        Real-time packet throughput with automated DoS threshold indicators
                      </p>
                    </div>
                    <span
                      className="mono rounded px-2 py-1 text-[10.5px] font-semibold uppercase tracking-wider"
                      style={{ background: "var(--critical-bg)", border: "1px solid var(--critical-line)", color: "var(--critical)" }}
                    >
                      Anomaly Detected: +412% MQTT Volumetric Spike
                    </span>
                  </div>

                  <div className="relative h-44 w-full">
                    <svg className="h-full w-full" viewBox="0 0 800 160" preserveAspectRatio="none" aria-hidden>
                      <defs>
                        <linearGradient id="heroAttackGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#FF5A5A" stopOpacity="0.32" />
                          <stop offset="100%" stopColor="#FF5A5A" stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="heroNormalGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#A8FF35" stopOpacity="0.22" />
                          <stop offset="100%" stopColor="#A8FF35" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      {[40, 80, 120].map((y) => (
                        <line key={y} x1="0" y1={y} x2="800" y2={y} stroke="var(--border)" strokeDasharray="4 4" />
                      ))}
                      <path d="M0,130 C120,125 240,128 360,126 L360,160 L0,160 Z" fill="url(#heroNormalGrad)" />
                      <path d="M0,130 C120,125 240,128 360,126" fill="none" stroke="#A8FF35" strokeWidth="2" />
                      <path d="M360,126 C420,50 480,20 540,25 C600,30 660,110 800,120 L800,160 L360,160 Z" fill="url(#heroAttackGrad)" />
                      <path d="M360,126 C420,50 480,20 540,25 C600,30 660,110 800,120" fill="none" stroke="#FF5A5A" strokeWidth="2.5" />
                      <line x1="360" y1="0" x2="360" y2="160" stroke="var(--border-2)" strokeWidth="1" />
                    </svg>
                    <div className="absolute right-3 top-1 flex items-center gap-4 text-[11px]">
                      <span className="flex items-center gap-1.5 text-[var(--text-3)]">
                        <span className="h-0.5 w-3 rounded" style={{ background: "var(--lime)" }} aria-hidden />
                        Clinical Baseline
                      </span>
                      <span className="flex items-center gap-1.5 text-[var(--text-3)]">
                        <span className="h-0.5 w-3 rounded" style={{ background: "var(--critical)" }} aria-hidden />
                        SYN/MQTT Flood
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "iomt" && (
              <div className="animate-in fade-in space-y-3.5">
                <div className="t-label">Live Connected Medical Device Inventory (Passive Discovery)</div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {[
                    { name: "Alaris Infusion Pump 8100", ip: "192.168.10.12", room: "ICU Bed 04", risk: "HIGH RISK (88)", status: "MQTT Flood Victim", color: "var(--critical)" },
                    { name: "Philips IntelliVue MX800", ip: "192.168.10.45", room: "OR Suite 02", risk: "LOW RISK (18)", status: "Normal Telemetry", color: "var(--success)" },
                    { name: "GE Healthcare Gateway", ip: "192.168.10.01", room: "Telemetry Hub", risk: "MED RISK (52)", status: "Rate Limited (Safe)", color: "var(--warning)" },
                  ].map((dev) => (
                    <div key={dev.name} className="card flex flex-col justify-between p-4">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="mono text-[11px] text-[var(--text-4)]">{dev.ip}</span>
                          <span
                            className="mono rounded px-2 py-0.5 text-[10px] font-bold"
                            style={{ color: dev.color, background: "var(--surface-3)", border: "1px solid var(--border-2)" }}
                          >
                            {dev.risk}
                          </span>
                        </div>
                        <h4 className="mt-2 text-[13.5px] font-semibold text-[var(--text)]">{dev.name}</h4>
                        <p className="mt-0.5 text-[12px] text-[var(--text-4)]">{dev.room}</p>
                      </div>
                      <div className="mt-4 flex items-center justify-between border-t pt-3 text-[11.5px]" style={{ borderColor: "var(--border)" }}>
                        <span className="text-[var(--text-4)]">Current State:</span>
                        <span className="font-semibold" style={{ color: dev.color }}>{dev.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "attack" && (
              <div className="card animate-in fade-in space-y-4 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h4 className="text-[13.5px] font-semibold text-[var(--text)]">Live Attack Vector: Slowloris &amp; TCP SYN Exhaustion</h4>
                  <span className="mono rounded px-2 py-1 text-[10.5px] font-semibold uppercase tracking-wider" style={{ background: "var(--lime-soft)", color: "var(--lime)", border: "1px solid var(--lime-line)" }}>
                    Mitigation Engaged
                  </span>
                </div>
                <p className="text-[13px] leading-relaxed text-[var(--text-3)]">
                  Adversary IP <code className="mono text-[12.5px] text-[var(--text-2)]">10.0.84.192</code> initiated a 45,000 req/sec SYN flood targeting the infusion telemetry bridge. MediSOC's behavioral engine isolated malicious sources within 1.2 seconds, preserving medical device telemetry streams.
                </p>
                <div className="mono space-y-1.5 rounded-md border p-3.5 text-[12px] text-[var(--text-3)]" style={{ background: "var(--bg)", borderColor: "var(--border)" }}>
                  <div>[23:14:02.102] ALERT: Inbound rate exceeds 99th percentile baseline (+840%)</div>
                  <div>[23:14:02.418] DETECTOR: Ensemble confidence = 98.4% (RandomForest + Autoencoder)</div>
                  <div style={{ color: "var(--lime)" }}>[23:14:02.950] RECOMMENDATION: Route through safe rate-limiter (Preserves Clinical Allowlist)</div>
                </div>
              </div>
            )}

            {activeTab === "memory" && (
              <div className="card animate-in fade-in space-y-4 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h4 className="text-[13.5px] font-semibold text-[var(--text)]">Case Memory Match: Historical Case #MED-2025-084</h4>
                  <span className="mono rounded px-2 py-1 text-[10.5px] font-semibold" style={{ background: "var(--violet-bg)", color: "var(--violet)", border: "1px solid var(--violet-line)" }}>
                    96% Pattern Match
                  </span>
                </div>
                <p className="text-[13px] leading-relaxed text-[var(--text-3)]">
                  MediSOC compared current telemetry against 1,200+ historical hospital incident cases. The closest match was resolved via <strong className="text-[var(--text)]">Selective Port Throttling</strong>, resulting in zero clinical alarm delay.
                </p>
                <div className="grid grid-cols-2 gap-3 text-[12px]">
                  <div className="rounded-md border p-3" style={{ background: "var(--bg)", borderColor: "var(--border)" }}>
                    <span className="t-label block">Historical Outcome</span>
                    <span className="mt-1 block font-semibold" style={{ color: "var(--success)" }}>100% Threat Neutralized</span>
                  </div>
                  <div className="rounded-md border p-3" style={{ background: "var(--bg)", borderColor: "var(--border)" }}>
                    <span className="t-label block">Clinical Disruption</span>
                    <span className="mt-1 block font-semibold text-[var(--text)]">0.0 seconds downtime</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── 2. Capabilities ── */}
      <section className="border-t px-6 py-24" style={{ borderColor: "var(--border)", background: "var(--bg-alt, #090C0C)" }}>
        <div className="mx-auto max-w-[1280px]">
          <div className="reveal mx-auto mb-14 max-w-[760px] text-center">
            <h2 className="t-h1 mb-5 text-[var(--text)]">Built Specifically for the Clinical Environment</h2>
            <p className="text-[15px] leading-relaxed text-[var(--text-3)]">
              General-purpose enterprise security tools fail in healthcare because they don't understand clinical context. MediSOC bridges security operations with patient safety.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {CAPABILITIES.map((card, i) => (
              <div
                key={card.title}
                className="reveal card p-7 transition-colors duration-200 hover:border-[var(--lime-line)]"
                data-reveal-delay={i * 60}
              >
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: "var(--lime-soft)", color: "var(--lime)" }}
                    aria-hidden
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d={card.icon} />
                    </svg>
                  </div>
                  <span className="mono rounded px-2 py-1 text-[9.5px] uppercase tracking-wider" style={{ background: "var(--surface-3)", border: "1px solid var(--border)", color: "var(--text-4)" }}>
                    {card.tag}
                  </span>
                </div>
                <h3 className="t-h3 mb-2.5 text-[var(--text)]">{card.title}</h3>
                <p className="text-[13px] leading-relaxed text-[var(--text-3)]">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. How MediSOC Works ── */}
      <section className="border-t px-6 py-24" style={{ borderColor: "var(--border)" }}>
        <div className="mx-auto max-w-[1280px]">
          <div className="reveal mx-auto mb-14 max-w-[700px] text-center">
            <h2 className="t-h1 mb-5 text-[var(--text)]">How MediSOC Works</h2>
            <p className="text-[15px] text-[var(--text-3)]">
              From raw hospital switch telemetry to clinically validated containment in four steps.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
            {WORKFLOW_STEPS.map((ws, i) => (
              <button
                key={ws.step}
                type="button"
                onClick={() => setActiveWorkflowStep(i)}
                aria-pressed={activeWorkflowStep === i}
                className="reveal card p-6 text-left transition-colors duration-200"
                data-reveal-delay={i * 80}
                style={{
                  borderColor: activeWorkflowStep === i ? "var(--lime-line)" : "var(--border)",
                  background: activeWorkflowStep === i ? "var(--surface-2)" : "var(--surface)",
                }}
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="mono text-[22px] font-bold" style={{ color: activeWorkflowStep === i ? "var(--lime)" : "var(--text-4)" }}>
                    {ws.step}
                  </span>
                  <span className="mono rounded px-2 py-0.5 text-[9.5px] uppercase tracking-wider" style={{ background: "var(--surface-3)", color: "var(--text-4)" }}>
                    Stage {i + 1}
                  </span>
                </div>
                <h3 className="t-h3 mb-2 text-[var(--text)]">{ws.title}</h3>
                <p className="mb-4 text-[13px] leading-relaxed text-[var(--text-3)]">{ws.desc}</p>
                <div className="mono rounded border px-2.5 py-2 text-[11px]" style={{ background: "var(--lime-soft)", borderColor: "var(--lime-line)", color: "var(--lime)" }}>
                  {ws.tech}
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. Comparison ── */}
      <section className="border-t px-6 py-24" style={{ borderColor: "var(--border)" }}>
        <div className="mx-auto max-w-[1080px]">
          <div className="reveal mb-14 text-center">
            <h2 className="t-h1 mb-4 text-[var(--text)]">Standard IT EDR vs. MediSOC Healthcare SOC</h2>
            <p className="text-[14.5px] text-[var(--text-3)]">
              Why traditional IT security tooling cannot solve the IoMT crisis.
            </p>
          </div>

          <div className="reveal overflow-x-auto rounded-xl" style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Capability / Requirement</th>
                  <th>Traditional IT Tools (EDR/SIEM)</th>
                  <th>MediSOC Clinical SOC</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row) => (
                  <tr key={row.req}>
                    <td className="font-medium text-[var(--text)]">{row.req}</td>
                    <td className="text-[var(--text-4)]">{row.trad}</td>
                    <td>
                      <span className="flex items-start gap-2 font-medium" style={{ color: "var(--lime)" }}>
                        <span className="mt-0.5 shrink-0" aria-hidden>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2.5 6.2l2.4 2.4 4.6-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                        {row.med}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── 5. Closing CTA ── */}
      <section
        className="border-t px-6 py-24"
        style={{ borderColor: "var(--border)", background: "linear-gradient(180deg, var(--bg) 0%, #0A100D 100%)" }}
      >
        <div className="reveal mx-auto max-w-[880px] text-center">
          <div className="mb-7 inline-block">
            <Logo size="lg" />
          </div>
          <h2 className="t-h1 mb-6 text-[var(--text)]">Experience the Future of Healthcare SOC Operations</h2>
          <p className="t-lead mx-auto mb-10 max-w-[620px]">
            Test our DoS detection and safe medical device response workflows in your browser with our interactive testbed.
          </p>
          <div className="flex flex-col items-center justify-center gap-3.5 sm:flex-row">
            <Link to="/contact" className="btn btn-primary btn-lg w-full sm:w-auto">
              Request a Demonstration
            </Link>
            <Link
              to="/dashboard"
              className="btn btn-secondary btn-lg w-full sm:w-auto"
              style={{ background: "var(--surface-2)", borderColor: "var(--border-2)" }}
            >
              Access Operational SOC
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}