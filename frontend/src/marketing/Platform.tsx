import React, { useState } from "react";
import { Link } from "react-router-dom";
import Logo from "../components/Logo";

export default function Platform() {
  const [activeModule, setActiveModule] = useState<string>("detection");

  const modules = [
    {
      id: "iomt",
      title: "IoMT Passive Profiling & Asset Mapping",
      tagline: "Agentless medical device visibility with clinical context",
      desc: "Automatically maps device models, firmware versions, MAC/IP, and clinical functions across hospital VLANs using passive network inspection.",
      features: [
        "Zero-scanning passive analysis (safe for infusion pumps and telemetry transmitters)",
        "Automated vendor and model fingerprinting (Alaris, Philips, GE, Baxter)",
        "Clinical criticality classification (Class I, II, III patient risk tiers)",
        "Continuous baseline communication profile modeling",
      ],
      badge: "VISIBILITY ENGINE",
    },
    {
      id: "detection",
      title: "Multi-Model DoS & Threat Detection",
      tagline: "High-accuracy anomaly detection trained on clinical network traffic",
      desc: "Combines Random Forest classifiers, Autoencoders, and protocol-aware statistical thresholds to catch volumetric and stealthy slow-rate DoS attacks.",
      features: [
        "Detection of TCP SYN floods, UDP amplification, and MQTT connection storms",
        "Sub-second alert triggering with statistical confidence percentages",
        "Thresholds calibrated for bursty hospital telemetry patterns",
        "Zero disruption to legitimate emergency telemetry traffic",
      ],
      badge: "BEHAVIORAL ML",
    },
    {
      id: "safereuse",
      title: "Outcome-Aware Case Memory (CBR)",
      tagline: "Historic incident knowledge that drives explainable triage",
      desc: "Utilizes Case-Based Reasoning to cross-reference active attacks with verified past hospital incidents, predicting mitigation effectiveness and patient safety impact.",
      features: [
        "Nearest-neighbor similarity matching against verified case repository",
        "Historical success and clinical impact scoring",
        "Explainable reasoning rationale with transparency indices",
        "Continuous feedback loop: records approved interventions and post-mitigation stability",
      ],
      badge: "EXPLAINABLE CBR",
    },
    {
      id: "response",
      title: "Controlled Clinical Response Controller",
      tagline: "Human-in-the-loop mitigation with strict clinical allowlists",
      desc: "Never drops a critical medical device off the network automatically. Proposes targeted rate limits, VLAN microsegmentation, and upstream source throttling.",
      features: [
        "Clinical Safety Allowlist engine (hard stop on patient monitor isolation)",
        "Mandatory SOC Analyst authorization and role-based confirmation",
        "Simulated outcome preview before policy execution",
        "Automated rollback trigger if clinical latency increases",
      ],
      badge: "SAFE CONTROL",
    },
  ];

  return (
    <div className="w-full text-white pt-28 pb-20 relative overflow-hidden">
      {/* Cyber Network Mesh Background */}
      <div
        className="absolute top-0 left-0 right-0 h-[680px] bg-cover bg-center bg-no-repeat pointer-events-none opacity-45"
        style={{
          backgroundImage: "url('/cyber-network-bg.png')",
          backgroundPosition: "center top",
        }}
      />
      <div className="absolute top-0 left-0 right-0 h-[680px] bg-gradient-to-b from-[#0C0F0D]/60 via-[#0C0F0D]/30 to-[#0C0F0D] pointer-events-none" />

      {/* ── Hero ── */}
      <section className="relative z-10 px-6 max-w-[1280px] mx-auto text-center mb-20">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(168,255,53,0.08)] border border-[rgba(168,255,53,0.25)] mb-6">
          <span className="w-2 h-2 rounded-full bg-[var(--lime)]" />
          <span className="text-[11px] font-mono font-bold text-[var(--lime)] uppercase tracking-widest">
            MEDISOC PLATFORM ARCHITECTURE
          </span>
        </div>

        <h1 className="text-[40px] sm:text-[56px] font-extrabold tracking-tight leading-[1.1] mb-6">
          Intelligent Defense Built for <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--lime)] to-[#8B72F0]">
            Clinical Network Operations
          </span>
        </h1>

        <p className="text-[17px] sm:text-[20px] text-[var(--text-3)] max-w-[760px] mx-auto leading-relaxed mb-10">
          Explore the modular architecture that enables hospital security teams to detect attacks, assess clinical risk, and execute safe responses in real time.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link to="/contact" className="px-7 py-3 rounded-xl bg-[var(--lime)] text-black font-bold text-[14px] hover:bg-[#b5ff4d] transition-all">
            Schedule Architecture Review
          </Link>
          <Link to="/dashboard" className="px-7 py-3 rounded-xl bg-[var(--surface-3)] border border-[var(--border-2)] text-white font-medium text-[14px] hover:bg-[var(--surface-2)] transition-all">
            Open Live SOC Demo
          </Link>
        </div>
      </section>

      {/* ── Architecture Diagram (Visual Data Flow) ── */}
      <section className="px-6 max-w-[1280px] mx-auto mb-28">
        <div className="p-8 sm:p-12 rounded-3xl bg-[#0F1410] border border-[var(--border)] shadow-2xl relative overflow-hidden">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-[24px] font-bold text-white">System Architecture & Telemetry Pipeline</h2>
              <p className="text-[14px] text-[var(--text-3)]">Continuous flow from passive tap to authorized hospital switch mitigation</p>
            </div>
            <span className="text-[11px] font-mono px-3 py-1 rounded bg-[rgba(168,255,53,0.1)] text-[var(--lime)] border border-[rgba(168,255,53,0.25)] self-start sm:self-auto">
              100% PASSIVE TAP INGESTION
            </span>
          </div>

          {/* Visual Architecture Stages */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {[
              {
                stage: "1. DATA SOURCE",
                title: "Hospital Network Tap",
                items: ["SPAN / Core Mirror Ports", "NetFlow / IPFIX Streams", "Passive Zeek / Suricata", "Zero-PHI Protocol Metadata"],
                color: "var(--text-2)",
              },
              {
                stage: "2. FEATURE EXTRACTION",
                title: "IoMT Telemetry Engine",
                items: ["Flow Duration & Packet Rates", "TCP Flag Distribution", "MQTT / DICOM Framing", "Baseline Deviation Score"],
                color: "var(--info)",
              },
              {
                stage: "3. DETECTION & CBR",
                title: "Ensemble ML & Memory",
                items: ["Random Forest Classifier", "Autoencoder Anomaly Model", "k-NN Case Memory Retrieval", "Clinical Risk Indexing"],
                color: "var(--lime)",
              },
              {
                stage: "4. SAFE EXECUTION",
                title: "Human Approval Gate",
                items: ["Clinical Safety Allowlist", "SOC Analyst Authorization", "Targeted Rate Limiting", "Tamper-Evident Audit Log"],
                color: "var(--success)",
              },
            ].map((box, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-[#141B16] border border-[var(--border)] flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-mono tracking-wider mb-2" style={{ color: box.color }}>
                    {box.stage}
                  </div>
                  <h3 className="text-[16px] font-bold text-white mb-4">{box.title}</h3>
                  <ul className="space-y-2 text-[12px] text-[var(--text-3)]">
                    {box.items.map((it, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="text-[var(--lime)]">•</span>
                        <span>{it}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-6 pt-4 border-t border-[var(--border)] text-[10px] font-mono text-[var(--text-4)] text-right">
                  Phase {idx + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Interactive Deep-Dive Module Breakdown ── */}
      <section className="px-6 max-w-[1280px] mx-auto mb-28">
        <div className="text-center mb-12">
          <h2 className="text-[32px] sm:text-[40px] font-bold text-white mb-4">Core Platform Capabilities</h2>
          <p className="text-[16px] text-[var(--text-3)]">Select a capability module to inspect its technical implementation</p>
        </div>

        {/* Tab Selector */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {modules.map((m) => (
            <button
              key={m.id}
              onClick={() => setActiveModule(m.id)}
              className={`px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
                activeModule === m.id
                  ? "bg-[var(--lime)] text-black shadow-[0_0_20px_rgba(168,255,53,0.25)]"
                  : "bg-[#141B16] text-[var(--text-3)] hover:text-white border border-[var(--border)]"
              }`}
            >
              {m.title.split("&")[0]}
            </button>
          ))}
        </div>

        {/* Detailed Module Showcase */}
        {modules
          .filter((m) => m.id === activeModule)
          .map((m) => (
            <div key={m.id} className="p-8 sm:p-12 rounded-3xl bg-[#111713] border border-[var(--border)] grid grid-cols-1 lg:grid-cols-2 gap-10 items-center animate-in fade-in duration-200">
              <div>
                <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded bg-[rgba(168,255,53,0.1)] text-[var(--lime)] border border-[rgba(168,255,53,0.25)]">
                  {m.badge}
                </span>
                <h3 className="text-[28px] sm:text-[34px] font-bold text-white mt-4 mb-3">{m.title}</h3>
                <p className="text-[16px] text-[var(--lime)] font-medium mb-4">{m.tagline}</p>
                <p className="text-[14px] text-[var(--text-3)] leading-relaxed mb-6">{m.desc}</p>

                <div className="space-y-3">
                  {m.features.map((feat, i) => (
                    <div key={i} className="flex items-start gap-3 text-[13px] text-[var(--text-2)]">
                      <span className="w-5 h-5 rounded-full bg-[rgba(168,255,53,0.15)] text-[var(--lime)] flex items-center justify-center shrink-0 mt-0.5 text-[11px] font-bold">
                        ✓
                      </span>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Technical Telemetry Card preview */}
              <div className="p-6 rounded-2xl bg-[#0B0F0C] border border-[var(--border)] font-mono text-[12px] space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                  <span className="text-[var(--text-4)]">MODULE_STATUS</span>
                  <span className="text-[var(--lime)] font-bold">ACTIVE & OPERATIONAL</span>
                </div>
                <div className="text-[var(--text-3)] space-y-2">
                  <div>&gt; INGESTION_MODE: PASSIVE_SPAN_MIRROR</div>
                  <div>&gt; PACKET_SAMPLING_RATE: 1:1 (FULL_CAPTURE_METADATA)</div>
                  <div>&gt; MODEL_CONVERGENCE: LOSS &lt; 0.0024 (RF_ACCURACY=97.4%)</div>
                  <div>&gt; ALLOWLIST_ENFORCEMENT: STRICT_MODE (PATIENT_SAFETY=ON)</div>
                </div>
                <div className="p-3 rounded bg-[#131B15] text-[var(--lime)] border border-[rgba(168,255,53,0.2)]">
                  SAFE REUSE VERIFICATION: 1,248 historical cases validated without single clinical incident.
                </div>
              </div>
            </div>
          ))}
      </section>

      {/* ── CTA ── */}
      <section className="px-6 max-w-[900px] mx-auto text-center border-t border-[var(--border)] pt-20">
        <h2 className="text-[32px] font-bold text-white mb-4">Ready to test the platform in action?</h2>
        <p className="text-[15px] text-[var(--text-3)] mb-8">
          Sign in to the operational SOC application to run simulations or review live incident cases.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/dashboard" className="px-8 py-3.5 rounded-xl bg-[var(--lime)] text-black font-bold text-[14px]">
            Launch SOC Application
          </Link>
          <Link to="/contact" className="px-8 py-3.5 rounded-xl bg-[var(--surface-3)] text-white font-medium text-[14px] border border-[var(--border)]">
            Contact Engineering Team
          </Link>
        </div>
      </section>
    </div>
  );
}
