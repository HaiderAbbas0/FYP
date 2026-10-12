import React from "react";
import { Link } from "react-router-dom";

export default function SecurityCompliance() {
  const compliancePillars = [
    {
      title: "Zero-PHI Telemetry Architecture",
      regulation: "HIPAA Security Rule §164.312(a)",
      desc: "MediSOC inspects only packet headers, TCP flags, throughput metrics, and protocol metadata (e.g., MQTT message types). No Electronic Protected Health Information (ePHI) or patient records are ever captured, inspected, or stored in our database.",
      status: "Architectural Safeguard (Design Verified)",
      icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    },
    {
      title: "Strict Role-Based Access Control (RBAC)",
      regulation: "HITECH Minimum Necessary Standard",
      desc: "Enforces strict role separation between SOC Analysts, Biomedical Engineers, and System Administrators. Sensitive forensic configurations and audit log exports are restricted to verified administrative tiers.",
      status: "Role Enforced in Frontend & State",
      icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
    },
    {
      title: "Tamper-Evident Audit Logging",
      regulation: "HIPAA §164.312(b) Audit Controls",
      desc: "Every alert acknowledgment, escalation, mitigation proposal, and response authorization is logged with full analyst attribution, timestamps, and target IP/device details, establishing a transparent chain of custody.",
      status: "Demonstration Audit Trail Active",
      icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
    },
    {
      title: "Clinical Safety Allowlists & Human Approval",
      regulation: "FDA Medical Device Safety Guidelines",
      desc: "Automated network disconnection of patient care devices is fundamentally banned. Potentially disruptive mitigation actions require explicit confirmation from authorized personnel, preventing accidental medical disruptions.",
      status: "Zero-Disruption Core Policy",
      icon: "M13 10V3L4 14h7v7l9-11h-7z",
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
      <section className="relative z-10 px-6 max-w-[1280px] mx-auto text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(168,255,53,0.08)] border border-[rgba(168,255,53,0.25)] mb-6">
          <span className="w-2 h-2 rounded-full bg-[var(--lime)]" />
          <span className="text-[11px] font-mono font-bold text-[var(--lime)] uppercase tracking-widest">
            GOVERNANCE, SECURITY & PATIENT SAFETY
          </span>
        </div>

        <h1 className="text-[40px] sm:text-[56px] font-extrabold tracking-tight leading-[1.1] mb-6">
          Patient Safety First. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--lime)] to-[#8B72F0]">
            Compliance by Design.
          </span>
        </h1>

        <p className="text-[17px] sm:text-[20px] text-[var(--text-3)] max-w-[760px] mx-auto leading-relaxed mb-8">
          Healthcare cybersecurity requires a fundamentally different trust model. Discover how MediSOC protects clinical operations without compromising compliance or patient care.
        </p>

        {/* Honest Compliance Disclaimer */}
        <div className="inline-block p-4 rounded-xl bg-[#141B16] border border-[var(--border)] max-w-[760px] mx-auto text-[12px] text-[var(--text-3)] text-left">
          <span className="font-bold text-[var(--lime)] font-mono block mb-1">COMPLIANCE & CERTIFICATION TRANSPARENCY:</span>
          MediSOC is engineered from the ground up to align with HIPAA Security Rule and FDA medical device cybersecurity guidance. Formal third-party attestation (SOC 2 Type II, ISO 27001) is planned as the platform transitions from university testbed validation to commercial hospital deployments.
        </div>
      </section>

      {/* ── 4 Compliance Pillars ── */}
      <section className="px-6 max-w-[1280px] mx-auto mb-28">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {compliancePillars.map((p, idx) => (
            <div
              key={idx}
              className="p-8 rounded-2xl bg-[#111713] border border-[var(--border)] hover:border-[var(--lime)]/30 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[rgba(168,255,53,0.1)] flex items-center justify-center text-[var(--lime)]">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d={p.icon} />
                    </svg>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-[var(--lime)] bg-[rgba(168,255,53,0.08)] px-2.5 py-1 rounded">
                    {p.status}
                  </span>
                </div>
                <h3 className="text-[20px] font-bold text-white mb-1">{p.title}</h3>
                <div className="text-[12px] font-mono text-[var(--text-4)] mb-3">{p.regulation}</div>
                <p className="text-[14px] text-[var(--text-3)] leading-relaxed">{p.desc}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-[var(--border)] text-[11px] font-mono text-[var(--text-4)]">
                Pillar {idx + 1} of 4 — Clinical Integrity Guarantee
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Layered Defense Architecture Visual ── */}
      <section className="px-6 max-w-[1100px] mx-auto mb-28 p-8 sm:p-12 rounded-3xl bg-[#0E1310] border border-[var(--border)]">
        <h2 className="text-[28px] font-bold text-white mb-2 text-center">Layered Healthcare Governance Model</h2>
        <p className="text-[14px] text-[var(--text-3)] text-center max-w-[620px] mx-auto mb-10">
          How MediSOC enforces zero clinical disruption across each technical layer.
        </p>

        <div className="space-y-4">
          {[
            {
              layer: "Layer 4: Human-in-the-Loop Governance",
              desc: "Explicit analyst signature required for network modifications. Automatic SOAR isolation is prohibited for Class II/III medical devices.",
              color: "var(--lime)",
            },
            {
              layer: "Layer 3: Clinical Safety Allowlist Engine",
              desc: "Verified IP/MAC allowlists protect infusion pumps, ventilators, and vital telemetry streams from collateral rate limiting.",
              color: "var(--success)",
            },
            {
              layer: "Layer 2: Zero-PHI Deep Metadata Inspection",
              desc: "Packets are inspected only for volumetric signatures, TCP syn-flood anomalies, and protocol framing. Payload text is immediately discarded.",
              color: "var(--info)",
            },
            {
              layer: "Layer 1: Passive SPAN Optical Isolation",
              desc: "MediSOC connects via unidirectional passive optical taps or SPAN ports, physically preventing any packet injection from reaching patient bedsides.",
              color: "var(--text-2)",
            },
          ].map((lyr, i) => (
            <div key={i} className="p-5 rounded-xl bg-[#141B16] border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-mono font-bold block mb-1" style={{ color: lyr.color }}>
                  {lyr.layer}
                </span>
                <p className="text-[13px] text-[var(--text-3)]">{lyr.desc}</p>
              </div>
              <span className="text-[11px] font-mono px-3 py-1 rounded bg-white/5 text-[var(--text-2)] whitespace-nowrap self-start sm:self-auto">
                ENFORCED
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-6 max-w-[800px] mx-auto text-center border-t border-[var(--border)] pt-20">
        <h2 className="text-[30px] font-bold text-white mb-4">Questions about hospital compliance?</h2>
        <p className="text-[15px] text-[var(--text-3)] mb-8">
          Request our technical compliance brief or review our testbed privacy safeguards with our security team.
        </p>
        <Link to="/contact" className="px-8 py-3.5 rounded-xl bg-[var(--lime)] text-black font-bold text-[14px]">
          Request Security & Compliance Packet
        </Link>
      </section>
    </div>
  );
}
