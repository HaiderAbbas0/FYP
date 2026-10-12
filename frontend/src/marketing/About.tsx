import React from "react";
import { Link } from "react-router-dom";
import Logo from "../components/Logo";

export default function About() {
  const milestones = [
    {
      year: "Phase 1: Research & Virtual Testbed",
      title: "Foundational IoMT Attack Modeling",
      desc: "Simulated hospital DoS and DDoS attack vectors (MQTT floods, SYN storms) against virtual medical devices in a controlled research testbed.",
      status: "COMPLETED",
    },
    {
      year: "Phase 2: Interactive SOC Frontend & Case Memory",
      title: "Clinical-Safe Operational Platform",
      desc: "Architected the desktop-first SOC application, Case-Based Reasoning memory engine, clinical allowlists, and public educational portal.",
      status: "CURRENT RELEASE (v2.0)",
    },
    {
      year: "Phase 3: Live Passive Telemetry & Connector Backend",
      title: "Real-Time Switch Integration",
      desc: "Integration with live SPAN/mirror hardware taps, high-throughput Kafka streaming, and bilateral SIEM connectors for campus pilots.",
      status: "DEVELOPMENT ROADMAP",
    },
    {
      year: "Phase 4: Multi-Hospital Federated Defense",
      title: "Collaborative Healthcare Threat Intelligence",
      desc: "Federated Case Memory allowing participating hospital networks to share anonymized DoS attack mitigation playbooks without exposing PHI.",
      status: "FUTURE VISION",
    },
  ];

  const corePrinciples = [
    {
      num: "01",
      title: "Clinical Care Continuity Above All",
      desc: "No cybersecurity alert or automated rule is ever allowed to take down an active medical device or patient monitor without explicit human authorization.",
    },
    {
      num: "02",
      title: "Explainable Decisions Over Black-Box Automation",
      desc: "Hospital analysts must understand exactly why an alert fired, which historical cases support the response recommendation, and what risk it poses.",
    },
    {
      num: "03",
      title: "Zero Electronic Health Record Capture",
      desc: "MediSOC is mathematically isolated from patient private records. We inspect network flow metadata and transport headers only.",
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
            OUR MISSION & VISION
          </span>
        </div>

        <h1 className="text-[40px] sm:text-[56px] font-extrabold tracking-tight leading-[1.1] mb-6">
          Defending the Digital Infrastructure <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--lime)] to-[#8B72F0]">
            That Powers Patient Care
          </span>
        </h1>

        <p className="text-[17px] sm:text-[20px] text-[var(--text-3)] max-w-[760px] mx-auto leading-relaxed mb-10">
          MediSOC was conceived to address a critical vulnerability in modern medicine: the dangerous intersection of legacy, unpatchable medical equipment and aggressive volumetric cyber attacks.
        </p>
      </section>

      {/* ── The Healthcare Problem Section ── */}
      <section className="px-6 max-w-[1100px] mx-auto mb-28">
        <div className="p-8 sm:p-12 rounded-3xl bg-[#111713] border border-[var(--border)] grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="text-[11px] font-mono font-bold text-[var(--lime)] uppercase tracking-wider block mb-2">
              THE HEALTHCARE DILEMMA
            </span>
            <h2 className="text-[28px] sm:text-[34px] font-bold text-white mb-4">
              Why Traditional Cyber Defense Fails in Hospitals
            </h2>
            <div className="space-y-4 text-[14px] text-[var(--text-3)] leading-relaxed">
              <p>
                In a standard enterprise, if a server acts suspiciously, security teams isolate it immediately. But in a hospital ICU, isolating a connected infusion pump or patient telemetry monitor can sever real-time alarms and endanger human lives.
              </p>
              <p>
                Meanwhile, medical devices (IoMT) typically run legacy firmware that cannot support modern endpoint security agents. Hospitals are left with a dangerous blind spot: thousands of unmonitored devices on high-speed clinical subnets.
              </p>
              <p className="text-white font-medium">
                MediSOC provides the answer: 100% passive, agentless network monitoring paired with clinically safe, human-authorized mitigation.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#0B0F0C] border border-[var(--border)] space-y-4">
            <div className="text-[11px] font-mono text-[var(--lime)] uppercase tracking-wider pb-2 border-b border-white/5">
              HOSPITAL THREAT PROFILE
            </div>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-[#141B16] border border-white/5">
                <div className="text-[12px] text-[var(--text-4)]">Average IoMT Devices per Hospital Bed</div>
                <div className="text-[20px] font-bold text-white">12 to 18 Connected Assets</div>
              </div>
              <div className="p-3 rounded-lg bg-[#141B16] border border-white/5">
                <div className="text-[12px] text-[var(--text-4)]">Percentage of IoMT Devices That Cannot Run Agents</div>
                <div className="text-[20px] font-bold text-[var(--danger)]">99.4% (Legacy/Proprietary OS)</div>
              </div>
              <div className="p-3 rounded-lg bg-[#141B16] border border-white/5">
                <div className="text-[12px] text-[var(--text-4)]">MediSOC Clinical Availability Standard</div>
                <div className="text-[20px] font-bold text-[var(--lime)]">100.0% Telemetry Continuity</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3 Core Principles ── */}
      <section className="px-6 max-w-[1240px] mx-auto mb-28">
        <div className="text-center mb-12">
          <h2 className="text-[30px] sm:text-[40px] font-bold text-white mb-3">Our Core Principles</h2>
          <p className="text-[15px] text-[var(--text-3)]">The non-negotiable rules governing every feature we engineer</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {corePrinciples.map((cp, idx) => (
            <div key={idx} className="p-8 rounded-2xl bg-[#111713] border border-[var(--border)] relative overflow-hidden">
              <span className="font-mono text-[36px] font-black text-[var(--lime)]/20 absolute top-4 right-4 select-none">
                {cp.num}
              </span>
              <h3 className="text-[18px] font-bold text-white mb-3">{cp.title}</h3>
              <p className="text-[13.5px] text-[var(--text-3)] leading-relaxed">{cp.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Milestones & Roadmap Timeline ── */}
      <section className="px-6 max-w-[1000px] mx-auto mb-28">
        <div className="text-center mb-16">
          <h2 className="text-[30px] sm:text-[40px] font-bold text-white mb-3">Engineering Milestones & Roadmap</h2>
          <p className="text-[15px] text-[var(--text-3)]">From university healthcare testbed research to commercial hospital operations</p>
        </div>

        <div className="space-y-8 relative before:absolute before:inset-0 before:left-5 before:w-0.5 before:bg-[var(--border)]">
          {milestones.map((m, idx) => (
            <div key={idx} className="flex items-start gap-6 relative">
              <div className="w-10 h-10 rounded-full bg-[#131915] border-2 border-[var(--lime)] flex items-center justify-center font-mono font-bold text-[13px] text-[var(--lime)] shrink-0 z-10 shadow-[0_0_15px_rgba(168,255,53,0.3)]">
                {idx + 1}
              </div>
              <div className="flex-1 p-6 rounded-2xl bg-[#111713] border border-[var(--border)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                  <span className="text-[11px] font-mono text-[var(--text-4)] uppercase">{m.year}</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[rgba(168,255,53,0.1)] text-[var(--lime)] self-start sm:self-auto">
                    {m.status}
                  </span>
                </div>
                <h3 className="text-[17px] font-bold text-white mb-2">{m.title}</h3>
                <p className="text-[13px] text-[var(--text-3)] leading-relaxed">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Closing CTA ── */}
      <section className="px-6 max-w-[800px] mx-auto text-center border-t border-[var(--border)] pt-20">
        <h2 className="text-[30px] font-bold text-white mb-4">Partner with MediSOC</h2>
        <p className="text-[15px] text-[var(--text-3)] mb-8">
          We collaborate with hospitals, biomedical engineering programs, and healthcare cybersecurity researchers.
        </p>
        <Link to="/contact" className="px-8 py-3.5 rounded-xl bg-[var(--lime)] text-black font-bold text-[14px]">
          Connect with Our Leadership
        </Link>
      </section>
    </div>
  );
}
