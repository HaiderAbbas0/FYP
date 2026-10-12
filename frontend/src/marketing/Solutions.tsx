import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function Solutions() {
  const [selectedScenario, setSelectedScenario] = useState<number>(0);

  const solutions = [
    {
      id: "hospital",
      title: "Hospital & Health System Campus Security",
      problem:
        "Modern hospitals house thousands of connected devices across complex, multi-building campuses. A single compromised gateway or infected nursing workstation can cascade across unsegmented clinical VLANs, threatening entire hospital operations.",
      solution:
        "MediSOC continuously monitors hospital core traffic across multiple buildings. It identifies unauthorized lateral movement, mapping clinical device subnets to prevent malicious propagation while keeping clinical telemetry open.",
      benefits: [
        "Campus-wide passive network sensor deployment",
        "Clinical VLAN segmentation monitoring and anomaly detection",
        "Zero disruption to emergency room and operating theater networks",
      ],
      kpi: "100% Core Switch Visibility",
    },
    {
      id: "devices",
      title: "Connected Medical Device (IoMT) Protection",
      problem:
        "Infusion pumps, patient monitors, and anesthesia machines run proprietary, legacy operating systems that cannot support endpoint antivirus agents and rarely receive regular security patches.",
      solution:
        "MediSOC provides 100% agentless, passive profiling. It recognizes medical device behaviors (e.g., normal 1-minute telemetry heartbeats) and flags deviations instantly without active ping sweeps that risk device crashes.",
      benefits: [
        "Guaranteed agentless monitoring with zero software installation on medical equipment",
        "FDA-designated medical device risk tier classification (Class I, II, III)",
        "Automated vendor vulnerability (CVE) correlation without active probing",
      ],
      kpi: "Zero Clinical Device Scans",
    },
    {
      id: "ddos",
      title: "DoS & DDoS Attack Mitigation in Critical Care",
      problem:
        "A volumetric DDoS attack or Slowloris resource exhaustion targeting medical telemetry bridges can cause telemetry blackouts in ICUs, leaving doctors blind to sudden patient cardiac events.",
      solution:
        "MediSOC's ensemble ML engine separates legitimate sensor bursts from malicious SYN floods or MQTT connection storms within milliseconds. It recommends targeted upstream rate limiting so patient vital alarms continue uninterrupted.",
      benefits: [
        "Sub-second detection of high-volume and slow-rate DoS patterns",
        "Targeted IP/port rate throttling that isolates attackers instead of medical units",
        "Preservation of vital sign alarm transmission during cyber incidents",
      ],
      kpi: "< 1.2s Detection & Triage",
    },
    {
      id: "investigation",
      title: "Clinical SOC & Incident Investigation",
      problem:
        "SOC analysts are inundated with thousands of generic IT alerts and lack biomedical engineering context to understand whether an anomalous IP is an attacker or a portable X-ray unit.",
      solution:
        "MediSOC correlates alerts into unified incident timelines enriched with clinical metadata (device make, serial number, hospital room, patient criticality). Analysts investigate with complete clinical context at their fingertips.",
      benefits: [
        "Unified incident timeline consolidating network, device, and protocol events",
        "Direct mapping to MITRE ATT&CK for Healthcare and IoMT threat matrices",
        "Exportable forensic reports for hospital clinical leadership and compliance teams",
      ],
      kpi: "78% Reduction in Triage Time",
    },
    {
      id: "biomed",
      title: "BioMed Engineering & SOC Alignment",
      problem:
        "Cybersecurity analysts and biomedical engineering teams traditionally operate in silos with different tools, causing dangerous delays when a medical device is flagged.",
      solution:
        "MediSOC bridges the gap with dual-perspective reporting. SOC teams get packet-level threat telemetry, while clinical engineers get equipment location, firmware state, and maintenance status.",
      benefits: [
        "Shared view for both cybersecurity analysts and clinical engineering staff",
        "Role-based views preventing unauthorized configuration changes",
        "Coordinated remediation playbooks for medical equipment maintenance",
      ],
      kpi: "Cross-Functional Cohesion",
    },
    {
      id: "safety",
      title: "Safe & Accountable Incident Response",
      problem:
        "Automated SOAR playbooks in traditional cybersecurity often execute blunt isolation commands that can shut down network access for active patient care equipment, introducing severe clinical safety risks.",
      solution:
        "MediSOC enforces a strict Clinical Safety Allowlist and Human-In-The-Loop approval gates. Every response action must be verified by an analyst, and all decisions are cryptographically logged for accountability.",
      benefits: [
        "Guaranteed human authorization before any network modification",
        "Hard stops preventing automated quarantine of life-support equipment",
        "Tamper-evident audit logs documenting who approved each mitigation action",
      ],
      kpi: "Zero Inadvertent Disconnects",
    },
  ];

  const scenarios = [
    {
      title: "Scenario A: MQTT Broker Exhaustion on Infusion Subnet",
      context: "ICU Ward B, 32 Smart Infusion Pumps streaming rate telemetry",
      traditional: "Traditional IT firewall quarantines the entire switch port, cutting off telemetry to the central nursing station.",
      medisoc: "MediSOC identifies malicious external IP flooding MQTT port 1883, applies upstream rate limit, and keeps all 32 infusion pumps streaming without interruption.",
    },
    {
      title: "Scenario B: DICOM Imaging Gateway SYN Flood",
      context: "Radiology Department PACS server receiving emergency trauma scans",
      traditional: "Generic IPS rate-limits all DICOM traffic, delaying critical trauma brain scans from reaching the on-call surgeon.",
      medisoc: "MediSOC distinguishes authorized CT scanner endpoints from external spoofed SYN packets using baseline communication profiles, preserving emergency image transfers.",
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
            HEALTHCARE SECURITY SOLUTIONS
          </span>
        </div>

        <h1 className="text-[40px] sm:text-[56px] font-extrabold tracking-tight leading-[1.1] mb-6">
          Tailored Defense for <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--lime)] to-[#8B72F0]">
            Every Hospital Environment
          </span>
        </h1>

        <p className="text-[17px] sm:text-[20px] text-[var(--text-3)] max-w-[760px] mx-auto leading-relaxed mb-10">
          Discover how MediSOC resolves the unique cyber challenges facing hospital networks, clinical engineering teams, and connected medical devices.
        </p>
      </section>

      {/* ── 6 Detailed Solution Cards ── */}
      <section className="px-6 max-w-[1280px] mx-auto mb-28">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {solutions.map((sol) => (
            <div
              key={sol.id}
              className="p-8 rounded-2xl bg-[#111713] border border-[var(--border)] flex flex-col justify-between hover:border-[var(--lime)]/30 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-mono font-bold text-[var(--lime)] bg-[rgba(168,255,53,0.1)] px-2.5 py-1 rounded">
                    {sol.kpi}
                  </span>
                </div>
                <h3 className="text-[20px] font-bold text-white mb-3">{sol.title}</h3>
                <div className="text-[13px] text-[var(--danger)]/90 font-medium mb-2">
                  <span className="uppercase text-[10px] font-mono block text-[var(--text-4)]">The Challenge</span>
                  {sol.problem}
                </div>
                <div className="text-[13px] text-[var(--text-3)] leading-relaxed mt-3 mb-6">
                  <span className="uppercase text-[10px] font-mono block text-[var(--lime)]">MediSOC Approach</span>
                  {sol.solution}
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--border)]">
                <span className="text-[11px] font-mono uppercase text-[var(--text-4)] block mb-2">Key Outcomes:</span>
                <ul className="space-y-1.5 text-[12px] text-[var(--text-2)]">
                  {sol.benefits.map((b, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[var(--lime)]">✓</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Interactive Scenario Comparison ── */}
      <section className="px-6 max-w-[1100px] mx-auto mb-28">
        <div className="p-8 sm:p-12 rounded-3xl bg-[#0E1310] border border-[var(--border)]">
          <div className="text-center max-w-[700px] mx-auto mb-10">
            <h2 className="text-[28px] sm:text-[36px] font-bold text-white mb-3">
              Real-World Clinical Response Scenarios
            </h2>
            <p className="text-[14px] text-[var(--text-3)]">
              See the direct clinical difference between standard IT security automation and MediSOC's clinical-safe mitigation.
            </p>
          </div>

          {/* Scenario Tabs */}
          <div className="flex justify-center gap-3 mb-8">
            {scenarios.map((sc, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedScenario(idx)}
                className={`px-4 py-2 rounded-xl text-[13px] font-semibold transition-all ${
                  selectedScenario === idx
                    ? "bg-[var(--lime)] text-black"
                    : "bg-[#141B16] text-[var(--text-3)] border border-[var(--border)] hover:text-white"
                }`}
              >
                {sc.title.split(":")[0]}
              </button>
            ))}
          </div>

          {/* Scenario Content */}
          <div className="bg-[#131915] p-6 rounded-2xl border border-[var(--border)] space-y-6">
            <div>
              <h3 className="text-[17px] font-bold text-white mb-1">{scenarios[selectedScenario].title}</h3>
              <p className="text-[12px] font-mono text-[var(--text-4)]">{scenarios[selectedScenario].context}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-xl bg-[#1A1111] border border-[var(--danger)]/30">
                <span className="text-[11px] font-mono font-bold text-[var(--danger)] uppercase block mb-2">
                  ❌ Standard Enterprise IT Tool Action
                </span>
                <p className="text-[13px] text-[var(--text-2)] leading-relaxed">
                  {scenarios[selectedScenario].traditional}
                </p>
                <div className="mt-4 text-[11px] font-mono text-[var(--danger)]">
                  RESULT: High clinical patient risk due to lost telemetry
                </div>
              </div>

              <div className="p-5 rounded-xl bg-[#111A13] border border-[var(--lime)]/30">
                <span className="text-[11px] font-mono font-bold text-[var(--lime)] uppercase block mb-2">
                  ✓ MediSOC Clinical SOC Action
                </span>
                <p className="text-[13px] text-[var(--text-2)] leading-relaxed">
                  {scenarios[selectedScenario].medisoc}
                </p>
                <div className="mt-4 text-[11px] font-mono text-[var(--lime)]">
                  RESULT: Threat neutralized; 100% patient care continuity
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Closing CTA ── */}
      <section className="px-6 max-w-[900px] mx-auto text-center border-t border-[var(--border)] pt-20">
        <h2 className="text-[32px] font-bold text-white mb-4">Tailored to your hospital environment</h2>
        <p className="text-[15px] text-[var(--text-3)] mb-8">
          Speak with our healthcare cybersecurity engineers to evaluate MediSOC on your network topology.
        </p>
        <Link to="/contact" className="px-8 py-3.5 rounded-xl bg-[var(--lime)] text-black font-bold text-[14px]">
          Request a Custom Demonstration
        </Link>
      </section>
    </div>
  );
}
