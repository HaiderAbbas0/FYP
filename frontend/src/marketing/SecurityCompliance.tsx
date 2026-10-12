import React from "react";
import { useReveal } from "../hooks/useReveal";
import { MarketingPage, Section, SectionTitle, GradText, Notice, CtaBand } from "./components/MarketingPage";
import { DefenceLayers, Donut, Bars } from "./components/Charts";

const PILLARS = [
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

const LAYERS = [
  { name: "Layer 4: Human-in-the-Loop Governance", desc: "Explicit analyst signature required for network modifications. Automatic SOAR isolation is prohibited for Class II/III medical devices.", color: "var(--lime)" },
  { name: "Layer 3: Clinical Safety Allowlist Engine", desc: "Verified IP/MAC allowlists protect infusion pumps, ventilators, and vital telemetry streams from collateral rate limiting.", color: "var(--success)" },
  { name: "Layer 2: Zero-PHI Deep Metadata Inspection", desc: "Packets are inspected only for volumetric signatures, TCP syn-flood anomalies, and protocol framing. Payload text is immediately discarded.", color: "var(--info)" },
  { name: "Layer 1: Passive SPAN Optical Isolation", desc: "MediSOC connects via unidirectional passive optical taps or SPAN ports, physically preventing any packet injection from reaching patient bedsides.", color: "var(--text-2)" },
];

const RBAC = [
  { label: "Viewer", value: 1, color: "var(--text-4)" },
  { label: "Analyst", value: 1, color: "var(--info)" },
  { label: "Super Admin", value: 1, color: "var(--lime)" },
];

const CONTROLS = [
  { label: "HIPAA §164.312(a) Access control", value: 100, color: "var(--lime)" },
  { label: "HIPAA §164.312(b) Audit controls", value: 100, color: "var(--lime)" },
  { label: "HIPAA §164.312(e) Transmission security", value: 100, color: "var(--lime)" },
  { label: "FDA device isolation without approval", value: 0, color: "var(--critical)" },
  { label: "Automated quarantine of life-support devices", value: 0, color: "var(--critical)" },
];

export default function SecurityCompliance() {
  useReveal();

  return (
    <MarketingPage
      eyebrow="Governance, Security & Patient Safety"
      title={<>Patient Safety First. <br /><GradText>Compliance by Design.</GradText></>}
      lead="Healthcare cybersecurity requires a fundamentally different trust model. Discover how MediSOC protects clinical operations without compromising compliance or patient care."
    >
      <div className="reveal mb-24">
        <Notice label="Compliance & certification transparency">
          MediSOC is engineered from the ground up to align with HIPAA Security Rule and FDA medical device cybersecurity guidance. Formal third-party attestation (SOC 2 Type II, ISO 27001) is planned as the platform transitions from university testbed validation to commercial hospital deployments.
        </Notice>
      </div>

      <Section>
        <SectionTitle title="Four compliance pillars" lead="Each pillar maps to a specific regulatory requirement and names how it is enforced in the platform." />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {PILLARS.map((p, i) => (
            <article key={p.title} className="card flex flex-col p-6 transition-colors duration-300 hover:border-[var(--lime-line)]">
              <div className="mb-4 flex items-start justify-between gap-3">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: "var(--lime-soft)", border: "1px solid var(--lime-line)", color: "var(--lime)" }}
                  aria-hidden
                >
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d={p.icon} />
                  </svg>
                </span>
                <span className="mono shrink-0 rounded px-2.5 py-1 text-[10.5px] font-bold tracking-wider" style={{ color: "var(--lime)", background: "var(--lime-soft)", border: "1px solid var(--lime-line)" }}>
                  {p.status}
                </span>
              </div>
              <h3 className="t-h3 text-[var(--text)]">{p.title}</h3>
              <div className="mono mt-1 text-[12px] text-[var(--text-4)]">{p.regulation}</div>
              <p className="mt-3 flex-1 text-[13.5px] leading-relaxed text-[var(--text-3)]">{p.desc}</p>
              <div className="mono mt-5 border-t pt-3 text-[11px] text-[var(--text-4)]" style={{ borderColor: "var(--border)" }}>
                Pillar {i + 1} of 4 — Clinical Integrity Guarantee
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section>
        <SectionTitle title="Layered Healthcare Governance Model" lead="How MediSOC enforces zero clinical disruption across each technical layer. Select a layer to read what it does." />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-start">
          <div className="card-elevated p-6 sm:p-8">
            <DefenceLayers layers={LAYERS} />
          </div>

          <div className="space-y-4">
            <div className="card-elevated p-6">
              <div className="t-label mb-4">Access control tiers enforced in the app</div>
              <div className="mb-4 h-3 w-full overflow-hidden rounded-full" style={{ background: "var(--surface-3)" }}>
                <div className="flex h-full w-full">
                  <span style={{ width: "33%", background: "var(--text-4)" }} />
                  <span style={{ width: "33%", background: "var(--info)" }} />
                  <span style={{ width: "34%", background: "var(--lime)" }} />
                </div>
              </div>
              <ul className="space-y-2.5">
                {RBAC.map((r) => (
                  <li key={r.label} className="flex items-center justify-between text-[13.5px]">
                    <span className="flex items-center gap-2 text-[var(--text-2)]">
                      <span className="h-2.5 w-3 rounded-sm" style={{ background: r.color }} aria-hidden />
                      {r.label}
                    </span>
                    <span className="mono text-[12px] text-[var(--text-4)]">enforced</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card-elevated p-6">
              <div className="t-label mb-4">Controls: coverage vs. prohibited</div>
              <Bars data={CONTROLS} unit="%" legend={{ primary: "Implemented", secondary: "Prohibited by design" }} />
            </div>
          </div>
        </div>
      </Section>

      <Section>
        <SectionTitle title="Telemetry scope, by field" lead="What MediSOC reads from each captured flow. Anything not on this list is not inspected or stored." />
        <div className="card-elevated p-6 sm:p-8">
          <Donut
            data={[
              { label: "Transport headers", value: 34, color: "var(--lime)" },
              { label: "Protocol framing", value: 33, color: "var(--info)" },
              { label: "Throughput metrics", value: 33, color: "var(--medium)" },
              { label: "Payload / PHI", value: 0, color: "var(--critical)" },
            ]}
          />
          <p className="mt-5 text-[13px] leading-relaxed text-[var(--text-3)]">
            The PHI slice is deliberately zero. MediSOC's feature extraction operates on flow duration, byte and packet counts, TCP flag distribution, and MQTT or DICOM message-type codes. The demonstration environment models the same scope.
          </p>
        </div>
      </Section>

      <div>
        <CtaBand
          title="Questions about hospital compliance?"
          lead="Request our technical compliance brief or review our testbed privacy safeguards with our security team."
          primary={{ to: "/contact", label: "Request Security & Compliance Packet" }}
        />
      </div>
    </MarketingPage>
  );
}