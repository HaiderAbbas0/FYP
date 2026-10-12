import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Logo from "../components/Logo";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"overview" | "iomt" | "attack" | "memory">("overview");
  const [activeWorkflowStep, setActiveWorkflowStep] = useState(0);

  // Fade-in on scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("opacity-100", "translate-y-0");
            entry.target.classList.remove("opacity-0", "translate-y-8");
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll(".scroll-reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const workflowSteps = [
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

  return (
    <div className="w-full text-white overflow-hidden">
      {/* ── 1. Hero Section ── */}
      <section className="relative min-h-[94vh] flex flex-col items-center justify-center pt-28 pb-20 px-6 overflow-hidden bg-[#070A08]">
        
        {/* Full-Quality Hero Background Image (Original Colors & True Contrast) */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
          style={{
            backgroundImage: "url('/hero-bg.png')",
            backgroundPosition: "center center",
          }}
        />

        {/* Hero Copy */}
        <div className="relative z-10 max-w-[980px] mx-auto text-center mt-6">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[rgba(168,255,53,0.08)] border border-[rgba(168,255,53,0.25)] mb-8 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-[var(--lime)] shadow-[0_0_8px_var(--lime)]" />
            <span className="text-[11.5px] font-mono font-bold text-[var(--lime)] uppercase tracking-widest">
              HEALTHCARE CYBERSECURITY OPERATIONS PLATFORM
            </span>
          </div>

          <h1 className="text-[46px] sm:text-[62px] lg:text-[76px] font-extrabold tracking-tight leading-[1.08] mb-6">
            Protecting Healthcare. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--lime)] via-[#80FF72] to-[#8B72F0]">
              Securing Every Connection.
            </span>
          </h1>

          <p className="text-[18px] sm:text-[21px] text-[var(--text-3)] leading-relaxed mb-10 max-w-[760px] mx-auto font-normal">
            MediSOC empowers hospital security teams to detect network threats, protect connected medical devices (IoMT), and execute safe, evidence-driven incident responses without disrupting clinical patient care.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              to="/contact"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[var(--lime)] text-black text-[15px] font-bold hover:bg-[#b5ff4d] transition-all shadow-[0_0_30px_rgba(168,255,53,0.35)] hover:shadow-[0_0_40px_rgba(168,255,53,0.5)] active:scale-95 flex items-center justify-center gap-2 group"
            >
              <span>Request a Demo</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="transition-transform group-hover:translate-x-1">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[var(--surface-3)] border border-[var(--border-2)] text-white text-[15px] font-medium hover:bg-[var(--surface-2)] hover:border-white/20 transition-all flex items-center justify-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-[var(--lime)]" />
              <span>Explore the Platform</span>
            </Link>
          </div>
        </div>

        {/* ── Interactive Live Product Preview ── */}
        <div className="relative z-10 w-full max-w-[1240px] rounded-2xl border border-[var(--border-2)] bg-[#0E1310] shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden">
          {/* Mock Browser Header & Tab Switcher */}
          <div className="bg-[#151B17] border-b border-[var(--border)] px-4 py-3 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#FF5F56]" />
              <span className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
              <span className="w-3 h-3 rounded-full bg-[#27C93F]" />
              <span className="ml-3 text-[11px] font-mono text-[var(--text-4)] hidden sm:inline">
                https://soc.hospital.local/command-center
              </span>
            </div>

            {/* Interactive Preview Tabs */}
            <div className="flex items-center gap-1 bg-[#0A0D0B] p-1 rounded-lg border border-[var(--border)]">
              {[
                { id: "overview", label: "Security Overview" },
                { id: "iomt", label: "IoMT Devices" },
                { id: "attack", label: "Attack Simulation" },
                { id: "memory", label: "Safe Case Memory" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-1 text-[12px] font-medium rounded-md transition-all ${
                    activeTab === tab.id
                      ? "bg-[var(--surface-4)] text-[var(--lime)] shadow-sm font-semibold"
                      : "text-[var(--text-3)] hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Screen Content */}
          <div className="p-6 bg-[#0B0F0C] min-h-[420px]">
            {activeTab === "overview" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Metric Strip */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Active Hospital Incidents", val: "3 Critical", sub: "1 under investigation", color: "var(--danger)" },
                    { label: "Connected Medical Assets", val: "48 Devices", sub: "100% telemetry healthy", color: "var(--lime)" },
                    { label: "Detector Accuracy (F1)", val: "97.4%", sub: "Multi-model ensemble", color: "var(--info)" },
                    { label: "Clinical Availability Pledge", val: "100.0%", sub: "Zero device drops", color: "var(--success)" },
                  ].map((m, i) => (
                    <div key={i} className="p-4 rounded-xl bg-[#131915] border border-[var(--border)]">
                      <div className="text-[11px] uppercase tracking-wider text-[var(--text-3)] font-mono">{m.label}</div>
                      <div className="text-[22px] font-bold mt-1" style={{ color: m.color }}>{m.val}</div>
                      <div className="text-[11px] text-[var(--text-4)] mt-0.5">{m.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Simulated Real-Time Traffic Wave */}
                <div className="p-5 rounded-xl bg-[#131915] border border-[var(--border)]">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-[14px] font-bold text-white">Live Clinical Network Telemetry (IoMT VLAN 104)</h4>
                      <p className="text-[12px] text-[var(--text-3)]">Real-time packet throughput with automated DoS threshold indicators</p>
                    </div>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[rgba(245,56,56,0.15)] text-[var(--danger)] border border-[rgba(245,56,56,0.3)]">
                      ANOMALY DETECTED: +412% MQTT Volumetric Spike
                    </span>
                  </div>

                  {/* SVG Chart Preview */}
                  <div className="h-44 w-full relative">
                    <svg className="w-full h-full" viewBox="0 0 800 160" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="heroAttackGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#F53838" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#F53838" stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="heroNormalGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#A8FF35" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#A8FF35" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      {/* Grid Lines */}
                      <line x1="0" y1="40" x2="800" y2="40" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
                      <line x1="0" y1="80" x2="800" y2="80" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
                      <line x1="0" y1="120" x2="800" y2="120" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />

                      {/* Normal Baseline Area */}
                      <path d="M0,130 C120,125 240,128 360,126 L360,160 L0,160 Z" fill="url(#heroNormalGrad)" />
                      <path d="M0,130 C120,125 240,128 360,126" fill="none" stroke="#A8FF35" strokeWidth="2" />

                      {/* Attack Spike Area */}
                      <path d="M360,126 C420,50 480,20 540,25 C600,30 660,110 800,120 L800,160 L360,160 Z" fill="url(#heroAttackGrad)" />
                      <path d="M360,126 C420,50 480,20 540,25 C600,30 660,110 800,120" fill="none" stroke="#F53838" strokeWidth="2.5" />
                    </svg>
                    <div className="absolute top-2 right-4 flex items-center gap-4 text-[11px] font-mono">
                      <span className="flex items-center gap-1.5 text-[var(--lime)]"><span className="w-2.5 h-1 bg-[var(--lime)] rounded" /> Clinical Baseline</span>
                      <span className="flex items-center gap-1.5 text-[var(--danger)]"><span className="w-2.5 h-1 bg-[var(--danger)] rounded" /> SYN/MQTT Flood</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "iomt" && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="text-[13px] text-[var(--text-3)] mb-2">Live Connected Medical Device Inventory (Passive Discovery)</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { name: "Alaris Infusion Pump 8100", ip: "192.168.10.12", room: "ICU Bed 04", risk: "HIGH RISK (88)", status: "MQTT Flood Victim", color: "var(--danger)" },
                    { name: "Philips IntelliVue MX800", ip: "192.168.10.45", room: "OR Suite 02", risk: "LOW RISK (18)", status: "Normal Telemetry", color: "var(--success)" },
                    { name: "GE Healthcare Gateway", ip: "192.168.10.01", room: "Telemetry Hub", risk: "MED RISK (52)", status: "Rate Limited (Safe)", color: "var(--warning)" },
                  ].map((dev, i) => (
                    <div key={i} className="p-4 rounded-xl bg-[#131915] border border-[var(--border)] flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono text-[var(--text-4)]">{dev.ip}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded font-mono" style={{ color: dev.color, background: `${dev.color}15` }}>{dev.risk}</span>
                        </div>
                        <h4 className="text-[14px] font-semibold text-white mt-2">{dev.name}</h4>
                        <p className="text-[12px] text-[var(--text-3)]">{dev.room}</p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between text-[11px]">
                        <span className="text-[var(--text-4)]">Current State:</span>
                        <span className="font-semibold text-white">{dev.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "attack" && (
              <div className="p-5 rounded-xl bg-[#131915] border border-[var(--border)] space-y-4 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <h4 className="text-[14px] font-bold text-white">Live Attack Vector: Slowloris & TCP SYN Exhaustion</h4>
                  <span className="px-2.5 py-1 rounded bg-[rgba(168,255,53,0.1)] text-[var(--lime)] font-mono text-[11px]">MITIGATION ENGAGED</span>
                </div>
                <p className="text-[13px] text-[var(--text-3)] leading-relaxed">
                  Adversary IP <code>10.0.84.192</code> initiated a 45,000 req/sec SYN flood targeting the infusion telemetry bridge. MediSOC's behavioral engine isolated malicious sources within 1.2 seconds, preserving medical device telemetry streams.
                </p>
                <div className="p-3 bg-[#0C100D] rounded-lg font-mono text-[12px] text-[var(--text-2)] border border-white/5 space-y-1">
                  <div>[23:14:02.102] ALERT: Inbound rate exceeds 99th percentile baseline (+840%)</div>
                  <div>[23:14:02.418] DETECTOR: Ensemble confidence = 98.4% (RandomForest + Autoencoder)</div>
                  <div className="text-[var(--lime)]">[23:14:02.950] RECOMMENDATION: Route through safe rate-limiter (Preserves Clinical Allowlist)</div>
                </div>
              </div>
            )}

            {activeTab === "memory" && (
              <div className="p-5 rounded-xl bg-[#131915] border border-[var(--border)] space-y-4 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <h4 className="text-[14px] font-bold text-white">Case Memory Match: Historical Case #MED-2025-084</h4>
                  <span className="px-2 py-0.5 rounded bg-[rgba(139,114,240,0.15)] text-[#8B72F0] font-mono text-[11px]">96% PATTERN MATCH</span>
                </div>
                <p className="text-[13px] text-[var(--text-3)] leading-relaxed">
                  MediSOC compared current telemetry against 1,200+ historical hospital incident cases. The closest match was resolved via <strong>Selective Port Throttling</strong>, resulting in zero clinical alarm delay.
                </p>
                <div className="grid grid-cols-2 gap-3 text-[12px]">
                  <div className="p-3 bg-[#0B0F0C] rounded border border-[var(--border)]">
                    <span className="text-[var(--text-4)] block text-[10px] uppercase">Historical Outcome</span>
                    <span className="text-[var(--success)] font-semibold">100% Threat Neutralized</span>
                  </div>
                  <div className="p-3 bg-[#0B0F0C] rounded border border-[var(--border)]">
                    <span className="text-[var(--text-4)] block text-[10px] uppercase">Clinical Disruption</span>
                    <span className="text-white font-semibold">0.0 seconds downtime</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── 2. Core Capabilities Section (Varied Grid Layout) ── */}
      <section className="py-24 px-6 border-t border-[var(--border)] bg-[#0C100D]/50">
        <div className="max-w-[1280px] mx-auto">
          <div className="text-center max-w-[760px] mx-auto mb-16 scroll-reveal opacity-0 translate-y-8 transition-all duration-700">
            <h2 className="text-[32px] sm:text-[44px] font-bold tracking-tight text-white mb-4">
              Built Specifically for the Clinical Environment
            </h2>
            <p className="text-[16px] text-[var(--text-3)] leading-relaxed">
              General-purpose enterprise security tools fail in healthcare because they don't understand clinical context. MediSOC bridges security operations with patient safety.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
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
            ].map((card, i) => (
              <div
                key={i}
                className="p-8 rounded-2xl bg-[#111713] border border-[var(--border)] hover:border-[var(--lime)]/40 transition-all duration-300 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] group scroll-reveal opacity-0 translate-y-8"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-xl bg-[rgba(168,255,53,0.1)] flex items-center justify-center text-[var(--lime)] group-hover:scale-110 transition-transform">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d={card.icon} />
                    </svg>
                  </div>
                  <span className="text-[10px] font-mono tracking-widest text-[var(--text-4)] border border-white/5 px-2 py-0.5 rounded">
                    {card.tag}
                  </span>
                </div>
                <h3 className="text-[19px] font-bold text-white mb-3 group-hover:text-[var(--lime)] transition-colors">
                  {card.title}
                </h3>
                <p className="text-[14px] text-[var(--text-3)] leading-relaxed">
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. How MediSOC Works: Interactive Connected Pipeline ── */}
      <section className="py-24 px-6 border-t border-[var(--border)]">
        <div className="max-w-[1240px] mx-auto">
          <div className="text-center max-w-[700px] mx-auto mb-16 scroll-reveal opacity-0 translate-y-8 transition-all duration-700">
            <h2 className="text-[32px] sm:text-[44px] font-bold text-white mb-4">
              How MediSOC Works
            </h2>
            <p className="text-[16px] text-[var(--text-3)]">
              From raw hospital switch telemetry to clinically validated containment in four steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {workflowSteps.map((ws, i) => (
              <div
                key={i}
                onClick={() => setActiveWorkflowStep(i)}
                className={`p-6 rounded-2xl border transition-all cursor-pointer relative ${
                  activeWorkflowStep === i
                    ? "bg-[#151D17] border-[var(--lime)] shadow-[0_0_30px_rgba(168,255,53,0.15)]"
                    : "bg-[#101512] border-[var(--border)] hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-[24px] font-extrabold text-[var(--lime)]">
                    {ws.step}
                  </span>
                  <span className="text-[10px] font-mono uppercase text-[var(--text-4)] bg-white/5 px-2 py-0.5 rounded">
                    Stage {i + 1}
                  </span>
                </div>
                <h3 className="text-[17px] font-bold text-white mb-2">{ws.title}</h3>
                <p className="text-[13px] text-[var(--text-3)] leading-relaxed mb-4">{ws.desc}</p>
                <div className="text-[11px] font-mono text-[var(--lime)] bg-[rgba(168,255,53,0.06)] p-2 rounded border border-[rgba(168,255,53,0.15)]">
                  {ws.tech}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. Comparison Table: Standard IT vs MediSOC Clinical SOC ── */}
      <section className="py-24 px-6 border-t border-[var(--border)] bg-[#0C100D]/40">
        <div className="max-w-[1080px] mx-auto">
          <div className="text-center mb-16 scroll-reveal opacity-0 translate-y-8 transition-all duration-700">
            <h2 className="text-[30px] sm:text-[40px] font-bold text-white mb-4">
              Standard IT EDR vs. MediSOC Healthcare SOC
            </h2>
            <p className="text-[15px] text-[var(--text-3)]">
              Why traditional IT security tooling cannot solve the IoMT crisis.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[#101612]">
            <table className="w-full text-left text-[14px]">
              <thead className="bg-[#141C16] border-b border-[var(--border)] text-[12px] font-mono uppercase text-[var(--text-3)]">
                <tr>
                  <th className="p-4 pl-6">Capability / Requirement</th>
                  <th className="p-4 text-[var(--text-4)]">Traditional IT Tools (EDR/SIEM)</th>
                  <th className="p-4 pr-6 text-[var(--lime)]">MediSOC Clinical SOC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-[var(--text-2)]">
                {[
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
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02]">
                    <td className="p-4 pl-6 font-semibold text-white">{row.req}</td>
                    <td className="p-4 text-[var(--text-3)]">{row.trad}</td>
                    <td className="p-4 pr-6 font-medium text-[var(--lime)] flex items-center gap-2">
                      <span>✓</span>
                      <span>{row.med}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── 5. Closing High-Conversion CTA Banner ── */}
      <section className="py-24 px-6 border-t border-[var(--border)] bg-gradient-to-b from-[#0C0F0D] to-[#121A14]">
        <div className="max-w-[880px] mx-auto text-center scroll-reveal opacity-0 translate-y-8 transition-all duration-700">
          <div className="inline-block mb-6">
            <Logo size="lg" />
          </div>
          <h2 className="text-[36px] sm:text-[48px] font-extrabold text-white tracking-tight mb-6">
            Experience the Future of Healthcare SOC Operations
          </h2>
          <p className="text-[17px] text-[var(--text-3)] mb-10 max-w-[620px] mx-auto leading-relaxed">
            Test our DoS detection and safe medical device response workflows in your browser with our interactive testbed.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/contact"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[var(--lime)] text-black text-[15px] font-bold hover:bg-[#b5ff4d] transition-all shadow-[0_0_35px_rgba(168,255,53,0.35)]"
            >
              Request a Demonstration
            </Link>
            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[var(--surface-3)] border border-[var(--border-2)] text-white text-[15px] font-medium hover:bg-[var(--surface-2)] transition-all"
            >
              Access Operational SOC
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
