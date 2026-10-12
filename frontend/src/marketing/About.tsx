import React from "react";
import { useReveal } from "../hooks/useReveal";
import { MarketingPage, Section, SectionTitle, GradText, StatCard, CtaBand } from "./components/MarketingPage";
import { Timeline, Donut } from "./components/Charts";

const MILESTONES = [
  { title: "Foundational IoMT Attack Modeling", meta: "Phase 1: Research & Virtual Testbed", status: "COMPLETED", done: true, desc: "Simulated hospital DoS and DDoS attack vectors (MQTT floods, SYN storms) against virtual medical devices in a controlled research testbed." },
  { title: "Clinical-Safe Operational Platform", meta: "Phase 2: Interactive SOC Frontend & Case Memory", status: "CURRENT RELEASE (v2.0)", done: true, desc: "Architected the desktop-first SOC application, Case-Based Reasoning memory engine, clinical allowlists, and public educational portal." },
  { title: "Real-Time Switch Integration", meta: "Phase 3: Live Passive Telemetry & Connector Backend", status: "DEVELOPMENT ROADMAP", desc: "Integration with live SPAN/mirror hardware taps, high-throughput Kafka streaming, and bilateral SIEM connectors for campus pilots." },
  { title: "Multi-Hospital Federated Defense", meta: "Phase 4: Collaborative Healthcare Threat Intelligence", status: "FUTURE VISION", desc: "Federated Case Memory allowing participating hospital networks to share anonymized DoS attack mitigation playbooks without exposing PHI." },
];

const PRINCIPLES = [
  { num: "01", title: "Clinical Care Continuity Above All", desc: "No cybersecurity alert or automated rule is ever allowed to take down an active medical device or patient monitor without explicit human authorization." },
  { num: "02", title: "Explainable Decisions Over Black-Box Automation", desc: "Hospital analysts must understand exactly why an alert fired, which historical cases support the response recommendation, and what risk it poses." },
  { num: "03", title: "Zero Electronic Health Record Capture", desc: "MediSOC is mathematically isolated from patient private records. We inspect network flow metadata and transport headers only." },
];

const PROFILE = [
  { label: "IoMT devices per hospital bed", value: "12–18", note: "Connected clinical assets sharing a bedside network", color: "var(--text)" },
  { label: "Devices that cannot run agents", value: "99.4 %", note: "Legacy or proprietary firmware", color: "var(--critical)" },
  { label: "Clinical availability standard", value: "100.0 %", note: "Telemetry continuity pledge", color: "var(--success)" },
];

const CASE_OUTCOMES = [
  { label: "Resolved", value: 104, color: "var(--lime)" },
  { label: "Partial", value: 18, color: "var(--medium)" },
  { label: "Failed", value: 5, color: "var(--critical)" },
  { label: "Harmful", value: 1, color: "var(--critical)" },
];

export default function About() {
  useReveal();

  return (
    <MarketingPage
      eyebrow="Our Mission & Vision"
      title={<>Defending the Digital Infrastructure <br /><GradText>That Powers Patient Care</GradText></>}
      lead="MediSOC was conceived to address a critical vulnerability in modern medicine: the dangerous intersection of legacy, unpatchable medical equipment and aggressive volumetric cyber attacks."
    >
      <Section>
        <div className="card-elevated grid grid-cols-1 items-center gap-8 p-7 sm:p-10 lg:grid-cols-2">
          <div>
            <span className="t-label mb-2 block" style={{ color: "var(--lime)" }}>The Healthcare Dilemma</span>
            <h2 className="t-h2 text-[var(--text)]">Why Traditional Cyber Defense Fails in Hospitals</h2>
            <div className="mt-5 space-y-4 text-[14px] leading-relaxed text-[var(--text-3)]">
              <p>
                In a standard enterprise, if a server acts suspiciously, security teams isolate it immediately. But in a hospital ICU, isolating a connected infusion pump or patient telemetry monitor can sever real-time alarms and endanger human lives.
              </p>
              <p>
                Meanwhile, medical devices (IoMT) typically run legacy firmware that cannot support modern endpoint security agents. Hospitals are left with a dangerous blind spot: thousands of unmonitored devices on high-speed clinical subnets.
              </p>
              <p className="font-medium text-[var(--text)]">
                MediSOC provides the answer: 100% passive, agentless network monitoring paired with clinically safe, human-authorized mitigation.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {PROFILE.map((p) => (
              <StatCard key={p.label} label={p.label} value={p.value} note={p.note} color={p.color} />
            ))}
            <div className="card p-5">
              <div className="t-label mb-4">Case memory outcomes to date</div>
              <Donut size={160} stroke={22} data={CASE_OUTCOMES} />
            </div>
          </div>
        </div>
      </Section>

      <Section>
        <SectionTitle title="Our Core Principles" lead="The non-negotiable rules governing every feature we engineer." />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {PRINCIPLES.map((p) => (
            <article key={p.num} className="card relative overflow-hidden p-6">
              <span className="mono absolute right-5 top-4 select-none text-[40px] font-black" style={{ color: "var(--lime)", opacity: 0.2 }} aria-hidden>
                {p.num}
              </span>
              <h3 className="t-h3 pr-10 text-[var(--text)]">{p.title}</h3>
              <p className="mt-3 text-[13.5px] leading-relaxed text-[var(--text-3)]">{p.desc}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section>
        <SectionTitle title="Engineering Milestones & Roadmap" lead="From university healthcare testbed research to commercial hospital operations." />
        <div className="mx-auto max-w-[820px]">
          <Timeline
            items={MILESTONES.map((m) => ({ title: m.title, meta: m.meta, status: m.status, desc: m.desc, done: m.done }))}
          />
        </div>
      </Section>

      <div>
        <CtaBand
          title="Partner with MediSOC"
          lead="We collaborate with hospitals, biomedical engineering programs, and healthcare cybersecurity researchers."
          primary={{ to: "/contact", label: "Connect with Our Leadership" }}
        />
      </div>
    </MarketingPage>
  );
}