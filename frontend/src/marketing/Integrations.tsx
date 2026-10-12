import React, { useState } from "react";
import { useReveal } from "../hooks/useReveal";
import { MarketingPage, Section, SectionTitle, GradText, Chip, Notice, CtaBand } from "./components/MarketingPage";
import { ChipRow, Donut, PipelineFlow } from "./components/Charts";
import Field from "../components/Field";

type Status = "Supported (Testbed Verified)" | "Blueprint Available" | "Roadmap Connector";

interface IntegrationItem {
  name: string;
  category: string;
  status: Status;
  desc: string;
  protocols: string;
}

const STATUS_TONE: Record<Status, { text: string; bg: string; line: string }> = {
  "Supported (Testbed Verified)": { text: "var(--lime)", bg: "var(--lime-soft)", line: "var(--lime-line)" },
  "Blueprint Available": { text: "var(--info)", bg: "var(--info-bg)", line: "var(--info-line)" },
  "Roadmap Connector": { text: "var(--text-4)", bg: "var(--surface-3)", line: "var(--border-2)" },
};

const CATEGORIES = [
  { id: "all", label: "All Integrations" },
  { id: "network", label: "Network & Telemetry" },
  { id: "siem", label: "SIEM & XDR" },
  { id: "firewall", label: "Firewalls & NAC" },
  { id: "endpoint", label: "Endpoint Security" },
  { id: "iomt", label: "Medical Devices & IoMT" },
  { id: "alerting", label: "Alerting & ITSM" },
];

const INTEGRATIONS: IntegrationItem[] = [
  { name: "Cisco & Arista SPAN / Mirror Ports", category: "network", status: "Supported (Testbed Verified)", desc: "Passive switch port mirroring capturing raw Ethernet frames without impacting core transit latency.", protocols: "SPAN / RSPAN / ERSPAN / 10G SFP+" },
  { name: "Zeek & Suricata Network Sensor", category: "network", status: "Supported (Testbed Verified)", desc: "Protocol parsing for DICOM, HL7, and MQTT streams into structured JSON telemetry for MediSOC ingestion.", protocols: "NetFlow / IPFIX / JSON Kafka" },
  { name: "Gigamon & Ixia Network TAPs", category: "network", status: "Blueprint Available", desc: "Hardware network packet brokers for zero-loss optical tap aggregation across hospital data centers.", protocols: "Hardware Optical Tap / NetFlow v9" },
  { name: "Splunk Enterprise Security", category: "siem", status: "Blueprint Available", desc: "Bilateral forwarding of enriched IoMT security alerts, risk indices, and MITRE ATT&CK healthcare tags.", protocols: "Splunk HEC / Syslog CEF" },
  { name: "Microsoft Sentinel", category: "siem", status: "Blueprint Available", desc: "Data connector streaming validated DoS incident telemetry into Azure Sentinel incident queues.", protocols: "Azure Monitor REST API / Log Analytics" },
  { name: "IBM QRadar SIEM", category: "siem", status: "Roadmap Connector", desc: "LEEF-formatted event stream integration for centralized hospital security operations dashboards.", protocols: "LEEF / Syslog TLS" },
  { name: "Palo Alto Networks Next-Gen Firewalls", category: "firewall", status: "Blueprint Available", desc: "Dynamic address group updates for upstream rate limiting during verified medical gateway DoS attacks.", protocols: "PAN-OS XML / REST API" },
  { name: "Fortinet FortiGate Firewalls", category: "firewall", status: "Roadmap Connector", desc: "Coordinated policy adjustments for hospital perimeter filtering under volumetric DDoS conditions.", protocols: "FortiOS REST API" },
  { name: "Cisco ISE (Identity Services Engine)", category: "firewall", status: "Blueprint Available", desc: "Clinical device quarantine coordination that checks MediSOC allowlists before modifying 802.1X VLANs.", protocols: "pxGrid / RADIUS Change of Auth (CoA)" },
  { name: "CrowdStrike Falcon", category: "endpoint", status: "Blueprint Available", desc: "Cross-correlates clinical workstation alerts with network telemetry to identify infected nurse PCs launching internal floods.", protocols: "Falcon Streaming API / Webhooks" },
  { name: "Microsoft Defender for Endpoint", category: "endpoint", status: "Roadmap Connector", desc: "Ingests host-level process events from hospital imaging PACS servers alongside network anomaly streams.", protocols: "Graph Security API" },
  { name: "BD Alaris Infusion Ecosystem", category: "iomt", status: "Supported (Testbed Verified)", desc: "Passive MQTT and wireless gateway profile validation for Point-of-Care infusion pump fleets.", protocols: "802.11a/b/g/n / MQTT / TCP 1883" },
  { name: "Philips IntelliVue Patient Monitors", category: "iomt", status: "Supported (Testbed Verified)", desc: "Clinical telemetry heartbeat tracking over private hospital monitoring networks with zero device intrusion.", protocols: "Philips Private Telemetry / UDP Multicast" },
  { name: "GE Healthcare CARESCAPE Gateways", category: "iomt", status: "Blueprint Available", desc: "Passive DICOM / HL7 traffic baseline verification to detect slow-rate exfiltration or DoS disruptions.", protocols: "HL7 v2.x / DICOM Part 10" },
  { name: "ServiceNow ITSM & Clinical BioMed", category: "alerting", status: "Blueprint Available", desc: "Automated ticket routing creating paired cybersecurity and biomedical engineering maintenance tickets.", protocols: "ServiceNow Table REST API" },
  { name: "PagerDuty Clinical On-Call", category: "alerting", status: "Supported (Testbed Verified)", desc: "High-priority on-call notification for critical medical telemetry loss requiring immediate SOC review.", protocols: "Events API v2" },
];

const FLOW_STAGES = [
  { id: "tap", title: "Hospital Network", color: "var(--info)", items: ["SPAN / RSPAN / ERSPAN mirroring", "NetFlow v9 / IPFIX", "Zeek & Suricata metadata", "Optical packet broker taps", "No packet injection"] },
  { id: "medisoc", title: "MediSOC Platform", color: "var(--lime)", items: ["Ensemble detection", "Case Memory retrieval", "Clinical Safety Allowlist", "Explainable rationale", "Policy gate"] },
  { id: "out", title: "Security Stack", color: "var(--success)", items: ["Splunk / Sentinel forwarding", "Palo Alto rate-limit dispatch", "Fortinet coordination", "ServiceNow tickets", "PagerDuty on-call"] },
];

export default function Integrations() {
  useReveal();
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState(FLOW_STAGES[1].id);

  const filtered = INTEGRATIONS.filter((i) => {
    const matchCat = category === "all" || i.category === category;
    const q = query.trim().toLowerCase();
    const matchQuery = !q || i.name.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q) || i.protocols.toLowerCase().includes(q);
    return matchCat && matchQuery;
  });

  const counts = {
    supported: INTEGRATIONS.filter((i) => i.status === "Supported (Testbed Verified)").length,
    blueprint: INTEGRATIONS.filter((i) => i.status === "Blueprint Available").length,
    roadmap: INTEGRATIONS.filter((i) => i.status === "Roadmap Connector").length,
  };

  return (
    <MarketingPage
      eyebrow="Ecosystem Integrations & Connectors"
      title={<>Connects Seamlessly With Your <br /><GradText>Existing Healthcare Stack</GradText></>}
      lead="MediSOC ingests passive telemetry from core switches and exports enriched incident alerts to your SIEM, firewalls, and clinical ticketing systems."
    >
      <div className="reveal mb-24">
        <Notice label="Integration status disclosure">
          MediSOC testbed integrations are verified in our virtual healthcare lab. Production enterprise connectors are available as architecture blueprints or on our active development roadmap.
        </Notice>
      </div>

      <Section>
        <SectionTitle title="Connector status at a glance" lead="Every connector below is either verified in the lab, specified as a blueprint, or on the roadmap. Nothing is presented as verified before it is." />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
          <div className="card-elevated p-6">
            <Donut
              data={[
                { label: "Verified", value: counts.supported, color: "var(--lime)" },
                { label: "Blueprint", value: counts.blueprint, color: "var(--info)" },
                { label: "Roadmap", value: counts.roadmap, color: "var(--text-4)" },
              ]}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { label: "Testbed verified", value: counts.supported, color: "var(--lime)" },
              { label: "Architecture blueprint", value: counts.blueprint, color: "var(--info)" },
              { label: "On the roadmap", value: counts.roadmap, color: "var(--text-3)" },
            ].map((c) => (
              <div key={c.label} className="card p-5 text-center">
                <div className="mono text-[34px] font-bold leading-none" style={{ color: c.color }}>{c.value}</div>
                <div className="mt-2 text-[12.5px] leading-tight text-[var(--text-3)]">{c.label}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section>
        <SectionTitle
          title="Browse connectors"
          lead="Filter by category or search by name, protocol, or description."
          center={false}
          action={
            <Field label="Search integrations" className="w-full max-w-[280px]">
              {(p) => (
                <input {...p} type="search" value={query} placeholder="Search integrations, protocols…" onChange={(e) => setQuery(e.target.value)} />
              )}
            </Field>
          }
        />
        <div className="mb-6">
          <ChipRow options={CATEGORIES} value={category} onChange={setCategory} label="Integration category" />
        </div>

        <p className="mb-4 text-[12.5px] text-[var(--text-4)]" role="status">
          Showing {filtered.length} of {INTEGRATIONS.length} connectors
        </p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((i) => {
            const tone = STATUS_TONE[i.status];
            return (
              <article key={i.name} className="card flex flex-col p-5 transition-colors duration-300 hover:border-[var(--lime-line)]">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <Chip color={tone.text} bg={tone.bg} line={tone.line}>{i.status}</Chip>
                  <span className="mono shrink-0 text-[10.5px] uppercase text-[var(--text-4)]">{i.category}</span>
                </div>
                <h3 className="t-h3 text-[var(--text)]">{i.name}</h3>
                <p className="mt-2 flex-1 text-[13px] leading-relaxed text-[var(--text-3)]">{i.desc}</p>
                <div className="mt-4 border-t pt-3" style={{ borderColor: "var(--border)" }}>
                  <div className="t-label mb-1">Protocols / Interface</div>
                  <div className="mono text-[11px] leading-relaxed" style={{ color: "var(--lime)" }}>{i.protocols}</div>
                </div>
              </article>
            );
          })}
          {filtered.length === 0 && (
            <p className="col-span-full py-12 text-center text-[14px] text-[var(--text-4)]">
              No connectors match that search. Try a different protocol or category.
            </p>
          )}
        </div>
      </Section>

      <Section>
        <SectionTitle
          title="Bilateral Integration Data Flow"
          lead="How MediSOC sits non-intrusively in your hospital core and interfaces with security operations and firewalls."
        />
        <div className="card-elevated p-6 sm:p-8">
          <PipelineFlow stages={FLOW_STAGES} active={stage} onSelect={setStage} />
        </div>
      </Section>

      <div>
        <CtaBand
          title="Need a custom hospital protocol connector?"
          lead="Our engineering team regularly validates custom proprietary medical gateway protocols."
          primary={{ to: "/contact", label: "Request Integration Assessment" }}
        />
      </div>
    </MarketingPage>
  );
}