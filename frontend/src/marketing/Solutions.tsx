import React, { useState } from "react";
import { useReveal } from "../hooks/useReveal";
import { MarketingPage, Section, SectionTitle, GradText, Chip, Checklist, CtaBand } from "./components/MarketingPage";
import { TelemetryLine, Bars } from "./components/Charts";

/* Deterministic telemetry: conventional blast radius versus the contained path. */
const CONVENTIONAL = Array.from({ length: 60 }, (_, i) => 22 + (i % 4) * 2);
const MEDISOC_SAFE = Array.from({ length: 60 }, (_, i) => (i < 30 ? 22 + (i % 4) * 2 : 21 + (i % 4) * 1.5));
const MEDISOC_ATTACK = Array.from({ length: 60 }, (_, i) => (i < 30 ? 0 : Math.max(0, 70 - (i - 30) * 3)));
const MEDISOC_CONVENTIONAL = Array.from({ length: 60 }, (_, i) => (i < 30 ? 0 : Math.max(0, 74 - (i - 30) * 1.1)));

const SOLUTIONS = [
  {
    id: "hospital",
    title: "Hospital & Health System Campus Security",
    kpi: "100% Core Switch Visibility",
    problem: "Modern hospitals house thousands of connected devices across complex, multi-building campuses. A single compromised gateway or infected nursing workstation can cascade across unsegmented clinical VLANs, threatening entire hospital operations.",
    solution: "MediSOC continuously monitors hospital core traffic across multiple buildings. It identifies unauthorized lateral movement, mapping clinical device subnets to prevent malicious propagation while keeping clinical telemetry open.",
    benefits: [
      "Campus-wide passive network sensor deployment",
      "Clinical VLAN segmentation monitoring and anomaly detection",
      "Zero disruption to emergency room and operating theater networks",
    ],
  },
  {
    id: "devices",
    title: "Connected Medical Device (IoMT) Protection",
    kpi: "Zero Clinical Device Scans",
    problem: "Infusion pumps, patient monitors, and anesthesia machines run proprietary, legacy operating systems that cannot support endpoint antivirus agents and rarely receive regular security patches.",
    solution: "MediSOC provides 100% agentless, passive profiling. It recognizes medical device behaviors (e.g., normal 1-minute telemetry heartbeats) and flags deviations instantly without active ping sweeps that risk device crashes.",
    benefits: [
      "Guaranteed agentless monitoring with zero software installation on medical equipment",
      "FDA-designated medical device risk tier classification (Class I, II, III)",
      "Automated vendor vulnerability (CVE) correlation without active probing",
    ],
  },
  {
    id: "ddos",
    title: "DoS & DDoS Attack Mitigation in Critical Care",
    kpi: "< 1.2s Detection & Triage",
    problem: "A volumetric DDoS attack or Slowloris resource exhaustion targeting medical telemetry bridges can cause telemetry blackouts in ICUs, leaving doctors blind to sudden patient cardiac events.",
    solution: "MediSOC's ensemble ML engine separates legitimate sensor bursts from malicious SYN floods or MQTT connection storms within milliseconds. It recommends targeted upstream rate limiting so patient vital alarms continue uninterrupted.",
    benefits: [
      "Sub-second detection of high-volume and slow-rate DoS patterns",
      "Targeted IP/port rate throttling that isolates attackers instead of medical units",
      "Preservation of vital sign alarm transmission during cyber incidents",
    ],
  },
  {
    id: "investigation",
    title: "Clinical SOC & Incident Investigation",
    kpi: "78% Reduction in Triage Time",
    problem: "SOC analysts are inundated with thousands of generic IT alerts and lack biomedical engineering context to understand whether an anomalous IP is an attacker or a portable X-ray unit.",
    solution: "MediSOC correlates alerts into unified incident timelines enriched with clinical metadata (device make, serial number, hospital room, patient criticality). Analysts investigate with complete clinical context at their fingertips.",
    benefits: [
      "Unified incident timeline consolidating network, device, and protocol events",
      "Direct mapping to MITRE ATT&CK for Healthcare and IoMT threat matrices",
      "Exportable forensic reports for hospital clinical leadership and compliance teams",
    ],
  },
  {
    id: "biomed",
    title: "BioMed Engineering & SOC Alignment",
    kpi: "Cross-Functional Cohesion",
    problem: "Cybersecurity analysts and biomedical engineering teams traditionally operate in silos with different tools, causing dangerous delays when a medical device is flagged.",
    solution: "MediSOC bridges the gap with dual-perspective reporting. SOC teams get packet-level threat telemetry, while clinical engineers get equipment location, firmware state, and maintenance status.",
    benefits: [
      "Shared view for both cybersecurity analysts and clinical engineering staff",
      "Role-based views preventing unauthorized configuration changes",
      "Coordinated remediation playbooks for medical equipment maintenance",
    ],
  },
  {
    id: "safety",
    title: "Safe & Accountable Incident Response",
    kpi: "Zero Inadvertent Disconnects",
    problem: "Automated SOAR playbooks in traditional cybersecurity often execute blunt isolation commands that can shut down network access for active patient care equipment, introducing severe clinical safety risks.",
    solution: "MediSOC enforces a strict Clinical Safety Allowlist and Human-In-The-Loop approval gates. Every response action must be verified by an analyst, and all decisions are cryptographically logged for accountability.",
    benefits: [
      "Guaranteed human authorization before any network modification",
      "Hard stops preventing automated quarantine of life-support equipment",
      "Tamper-evident audit logs documenting who approved each mitigation action",
    ],
  },
];

const SCENARIOS = [
  {
    id: "mqtt",
    tab: "Scenario A",
    title: "MQTT Broker Exhaustion on Infusion Subnet",
    context: "ICU Ward B, 32 Smart Infusion Pumps streaming rate telemetry",
    traditional: "Traditional IT firewall quarantines the entire switch port, cutting off telemetry to the central nursing station.",
    medisoc: "MediSOC identifies malicious external IP flooding MQTT port 1883, applies upstream rate limit, and keeps all 32 infusion pumps streaming without interruption.",
  },
  {
    id: "dicom",
    tab: "Scenario B",
    title: "DICOM Imaging Gateway SYN Flood",
    context: "Radiology Department PACS server receiving emergency trauma scans",
    traditional: "Generic IPS rate-limits all DICOM traffic, delaying critical trauma brain scans from reaching the on-call surgeon.",
    medisoc: "MediSOC distinguishes authorized CT scanner endpoints from external spoofed SYN packets using baseline communication profiles, preserving emergency image transfers.",
  },
];

const OUTCOMES = [
  { label: "SYN Flood", value: 92, compare: 78, color: "var(--lime)", compareColor: "var(--text-4)" },
  { label: "TCP Flood", value: 88, compare: 73, color: "var(--lime)", compareColor: "var(--text-4)" },
  { label: "UDP Flood", value: 87, compare: 70, color: "var(--lime)", compareColor: "var(--text-4)" },
  { label: "ICMP Flood", value: 92, compare: 78, color: "var(--lime)", compareColor: "var(--text-4)" },
  { label: "MQTT Connect", value: 93, compare: 80, color: "var(--lime)", compareColor: "var(--text-4)" },
  { label: "MQTT Publish", value: 91, compare: 77, color: "var(--lime)", compareColor: "var(--text-4)" },
];

export default function Solutions() {
  useReveal();
  const [scenario, setScenario] = useState(SCENARIOS[0].id);
  const active = SCENARIOS.find((s) => s.id === scenario)!;

  return (
    <MarketingPage
      eyebrow="Healthcare Security Solutions"
      title={<>Tailored Defense for <br /><GradText>Every Hospital Environment</GradText></>}
      lead="Discover how MediSOC resolves the unique cyber challenges facing hospital networks, clinical engineering teams, and connected medical devices."
    >
      <Section>
        <SectionTitle title="Six problems, six answers" lead="Each card states the challenge, the MediSOC approach, and the outcomes a hospital team can measure." />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {SOLUTIONS.map((s) => (
            <article key={s.id} className="card flex flex-col p-6 transition-colors duration-300 hover:border-[var(--lime-line)]">
              <Chip>{s.kpi}</Chip>
              <h3 className="t-h3 mt-3 text-[var(--text)]">{s.title}</h3>

              <div className="mt-4 flex-1 space-y-3.5">
                <div>
                  <div className="t-label mb-1" style={{ color: "var(--critical)" }}>The Challenge</div>
                  <p className="text-[13px] leading-relaxed text-[var(--text-3)]">{s.problem}</p>
                </div>
                <div>
                  <div className="t-label mb-1" style={{ color: "var(--lime)" }}>MediSOC Approach</div>
                  <p className="text-[13px] leading-relaxed text-[var(--text-2)]">{s.solution}</p>
                </div>
              </div>

              <div className="mt-5 border-t pt-4" style={{ borderColor: "var(--border)" }}>
                <div className="t-label mb-2">Key Outcomes</div>
                <Checklist items={s.benefits} />
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section>
        <SectionTitle
          title="Real-World Clinical Response Scenarios"
          lead="The direct clinical difference between standard IT security automation and MediSOC's clinical-safe mitigation."
        />
        <div className="mb-6 flex flex-wrap justify-center gap-2">
          {SCENARIOS.map((s) => {
            const on = s.id === scenario;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setScenario(s.id)}
                aria-pressed={on}
                className="filter-chip"
                style={{
                  background: on ? "var(--lime-soft)" : "transparent",
                  color: on ? "var(--lime)" : "var(--text-3)",
                  borderColor: on ? "var(--lime-line)" : "var(--border)",
                  fontWeight: on ? 600 : 500,
                }}
              >
                {s.tab}
              </button>
            );
          })}
        </div>

        <div className="card-elevated p-6 sm:p-8" key={active.id}>
          <div className="mb-6">
            <h3 className="t-h3 text-[var(--text)]">{active.title}</h3>
            <p className="mono mt-1 text-[12px] text-[var(--text-4)]">{active.context}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl p-5" style={{ background: "var(--critical-bg)", border: "1px solid var(--critical-line)" }}>
              <div className="t-label mb-2" style={{ color: "var(--critical)" }}>Standard Enterprise IT Tool Action</div>
              <p className="text-[13.5px] leading-relaxed text-[var(--text-2)]">{active.traditional}</p>
              <div className="mono mt-4 text-[11px]" style={{ color: "var(--critical)" }}>RESULT: High clinical patient risk due to lost telemetry</div>
            </div>
            <div className="rounded-xl p-5" style={{ background: "var(--low-bg)", border: "1px solid var(--low-line)" }}>
              <div className="t-label mb-2" style={{ color: "var(--success)" }}>MediSOC Clinical SOC Action</div>
              <p className="text-[13.5px] leading-relaxed text-[var(--text-2)]">{active.medisoc}</p>
              <div className="mono mt-4 text-[11px]" style={{ color: "var(--success)" }}>RESULT: Threat neutralized; 100% patient care continuity</div>
            </div>
          </div>

          <div className="mt-8">
            <div className="t-label mb-3">Illustrative response trace · two paths from the same attack</div>
            <TelemetryLine
              id={`sc-${active.id}`}
              data={MEDISOC_SAFE}
              yMax={90}
              height={180}
              series={[
                { key: "safe", label: "Clinical telemetry (MediSOC path)", color: "var(--lime)", fill: true },
                { key: "conv", label: "Clinical telemetry (conventional isolation)", color: "var(--critical)", fill: true },
                { key: "attack", label: "Malicious traffic suppressed", color: "var(--medium)" },
              ]}
              markers={[{ at: 30, label: "attack", color: "var(--critical)" }]}
            />
            <p className="mt-3 text-[12px] leading-relaxed text-[var(--text-4)]">
              Conventional isolation cuts the clinical series with the malicious one; the MediSOC path suppresses the flood upstream and leaves the telemetry band intact. Values are the demonstration dataset.
            </p>
          </div>
        </div>
      </Section>

      <Section>
        <SectionTitle title="Suppression by attack vector" lead="Baseline versus MediSOC, as reported in the Evaluation module of the SOC app." />
        <div className="card-elevated p-6 sm:p-8">
          <Bars data={OUTCOMES} unit="%" legend={{ primary: "MediSOC", secondary: "Baseline" }} />
        </div>
      </Section>

      <div className="mb-0">
        <CtaBand
          title="Tailored to your hospital environment"
          lead="Speak with our healthcare cybersecurity engineers to evaluate MediSOC on your network topology."
          primary={{ to: "/contact", label: "Request a Custom Demonstration" }}
        />
      </div>
    </MarketingPage>
  );
}