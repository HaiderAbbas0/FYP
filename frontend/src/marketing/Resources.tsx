import React, { useState } from "react";
import { useReveal } from "../hooks/useReveal";
import { MarketingPage, Section, SectionTitle, GradText, Chip, CtaBand } from "./components/MarketingPage";
import { ChipRow, Bars } from "./components/Charts";

const RESOURCES = [
  { title: "The Hospital SOC Guide to IoMT DDoS Defense", category: "guides", type: "Implementation Guide", readTime: "12 min read", desc: "A step-by-step engineering handbook on deploying passive SPAN taps, calibrating NetFlow thresholds, and defending smart infusion fleets without active scanning.", badge: "FEATURED GUIDE" },
  { title: "Case-Based Reasoning for Medical IoT Incident Triage", category: "technical", type: "Technical Whitepaper", readTime: "18 min read", desc: "An architectural deep-dive into how MediSOC's k-NN Case Memory retrieves verified historical hospital incident playbooks with quantified confidence scores.", badge: "ARCHITECTURE SPEC" },
  { title: "Analyzing MQTT and DICOM DoS Vectors in Critical Care", category: "research", type: "Threat Research Briefing", readTime: "9 min read", desc: "Empirical analysis of volumetric SYN floods vs low-and-slow MQTT connection exhaustion attacks against connected medical equipment.", badge: "LAB RESEARCH" },
  { title: "Zero-PHI Network Telemetry: A HIPAA-Compliant Model", category: "guides", type: "Compliance Whitepaper", readTime: "10 min read", desc: "How hospital security teams can analyze raw packet metadata for cyber anomalies while mathematically guaranteeing zero Electronic Health Record ingestion.", badge: "COMPLIANCE" },
  { title: "MediSOC API & Telemetry Ingestion Specification v2.0", category: "technical", type: "Developer Documentation", readTime: "15 min read", desc: "Comprehensive JSON schema definitions for streaming NetFlow, Zeek logs, and switch telemetry into the MediSOC detection pipeline.", badge: "DEVELOPER DOCS" },
  { title: "2026 Connected Medical Device Threat Landscape", category: "research", type: "Hospital Threat Index", readTime: "14 min read", desc: "Statistical breakdown of top exploited IoMT communication protocols, firmware vulnerabilities, and clinical impact distributions.", badge: "THREAT INDEX" },
];

const TABS = [
  { id: "all", label: "All Resources" },
  { id: "guides", label: "Deployment Guides" },
  { id: "technical", label: "Architecture Specs" },
  { id: "research", label: "Threat Research" },
];

const FAQS = [
  { q: "Does MediSOC actively scan or ping medical devices on the hospital network?", a: "No. MediSOC is 100% passive. It ingests mirrored network traffic via SPAN/mirror ports or optical network TAPs. It never transmits active probes or port sweeps that could disrupt sensitive medical equipment such as infusion pumps or ventilators." },
  { q: "Can MediSOC automatically isolate or disconnect a patient's medical device?", a: "No. MediSOC enforces a strict Clinical Safety Allowlist and Human-In-The-Loop policy. Automated quarantining of critical medical equipment is fundamentally blocked. Any network mitigation (such as upstream IP rate limiting) requires explicit authorization by a SOC analyst." },
  { q: "Does MediSOC capture or store Patient Health Information (PHI)?", a: "No. MediSOC inspects only packet headers and connection metadata (flow duration, byte counts, TCP flags, port distributions). No patient names, medical records, or sensitive clinical payloads are ever parsed, stored, or processed." },
  { q: "What is the difference between this demonstration and production hospital deployment?", a: "The current web application is an interactive demonstration environment powered by realistic hospital testbed datasets and simulated incident workflows. It is ready for architectural review and testing prior to connecting live campus network taps." },
  { q: "How does MediSOC's Case Memory assist hospital security analysts?", a: "Case-Based Reasoning (CBR) matches new incoming alerts against a repository of verified historical incidents. It shows the analyst how similar attacks were safely resolved in the past, including the exact mitigation playbook and clinical stability score." },
];

const TOP_VECTORS = [
  { label: "MQTT Connect Flood", value: 4, color: "var(--lime)" },
  { label: "UDP Flood", value: 3, color: "var(--lime)" },
  { label: "SYN Flood", value: 2, color: "var(--lime)" },
  { label: "TCP Flood", value: 1, color: "var(--lime)" },
  { label: "ICMP Flood", value: 1, color: "var(--lime)" },
];

export default function Resources() {
  useReveal();
  const [category, setCategory] = useState("all");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const filtered = RESOURCES.filter((r) => category === "all" || r.category === category);

  return (
    <MarketingPage
      eyebrow="Knowledge Base & Technical Resources"
      title={<>Healthcare Cybersecurity <br /><GradText>Research & Documentation</GradText></>}
      lead="Explore technical whitepapers, deployment guides, threat research, and frequently asked questions on clinical IoMT network defense."
    >
      <Section>
        <SectionTitle title="Browse the library" lead="Filter by the kind of material you need." />
        <div className="mb-8 flex justify-center">
          <ChipRow options={TABS} value={category} onChange={setCategory} label="Resource category" />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
            <article key={r.title} className="card group flex flex-col p-6 transition-colors duration-300 hover:border-[var(--lime-line)]">
              <div className="mb-4 flex items-start justify-between gap-2">
                <Chip>{r.badge}</Chip>
                <span className="mono shrink-0 text-[11px] text-[var(--text-4)]">{r.readTime}</span>
              </div>
              <h3 className="t-h3 text-[var(--text)] transition-colors duration-200 group-hover:text-[var(--lime)]">{r.title}</h3>
              <p className="mt-2 flex-1 text-[13px] leading-relaxed text-[var(--text-3)]">{r.desc}</p>
              <div className="mt-5 flex items-center justify-between border-t pt-4 text-[12px]" style={{ borderColor: "var(--border)" }}>
                <span className="mono text-[var(--text-4)]">{r.type}</span>
                <span className="font-semibold transition-transform duration-200 group-hover:translate-x-1" style={{ color: "var(--lime)" }}>
                  Read Briefing →
                </span>
              </div>
            </article>
          ))}
          {filtered.length === 0 && (
            <p className="col-span-full py-12 text-center text-[14px] text-[var(--text-4)]">No resources in this category yet.</p>
          )}
        </div>
      </Section>

      <Section>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center">
          <div className="card-elevated p-6 sm:p-8">
            <div className="t-label mb-4">Attack vectors in the demonstration set</div>
            <Bars data={TOP_VECTORS} legend={{ primary: "Incidents" }} />
            <p className="mt-4 text-[12px] leading-relaxed text-[var(--text-4)]">
              MQTT connection floods dominate the hospital IoMT testbed because clinical telemetry overwhelmingly rides MQTT; volumetric IP floods follow.
            </p>
          </div>
          <div className="card-elevated p-6 sm:p-8">
            <div className="t-label mb-4">Case memory reliability</div>
            <Bars
              data={[
                { label: "MQTT Connect Flood", value: 84, compare: 89, color: "var(--lime)", compareColor: "var(--violet)" },
                { label: "UDP Flood", value: 91, color: "var(--lime)" },
                { label: "TCP Flood", value: 88, color: "var(--lime)" },
                { label: "ICMP Flood", value: 93, color: "var(--lime)" },
              ]}
              unit="%"
              legend={{ primary: "Case Memory reliability" }}
            />
            <p className="mt-4 text-[12px] leading-relaxed text-[var(--text-4)]">
              Reliability is outcome-weighted across validated uses; the violet marker is the similarity score for CASE-128.
            </p>
          </div>
        </div>
      </Section>

      <Section id="faq">
        <SectionTitle title="Frequently Asked Clinical Questions" lead="Answers to common clinical engineering, network architecture, and patient safety questions." />
        <div className="mx-auto max-w-[900px] space-y-3">
          {FAQS.map((f, i) => {
            const open = openFaq === i;
            return (
              <div key={f.q} className="card overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenFaq(open ? null : i)}
                  aria-expanded={open}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-[var(--surface-2)]"
                >
                  <span className="text-[15px] font-semibold text-[var(--text)]">{f.q}</span>
                  <span className="mono shrink-0 text-[16px]" style={{ color: "var(--lime)" }} aria-hidden>{open ? "−" : "+"}</span>
                </button>
                {open && (
                  <p className="animate-in fade-in border-t px-5 py-4 text-[13.5px] leading-relaxed text-[var(--text-3)]" style={{ borderColor: "var(--border)" }}>
                    {f.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      <div>
        <CtaBand
          title="Need specific testbed documentation?"
          lead="Contact our technical team for custom network schema definitions and protocol capture guides."
          primary={{ to: "/contact", label: "Request Technical Docs Packet" }}
        />
      </div>
    </MarketingPage>
  );
}