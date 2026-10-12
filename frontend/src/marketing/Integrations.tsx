import React, { useState } from "react";
import { Link } from "react-router-dom";

interface IntegrationItem {
  name: string;
  category: "network" | "siem" | "firewall" | "endpoint" | "iomt" | "alerting";
  status: "Supported (Testbed Verified)" | "Blueprint Available" | "Roadmap Connector";
  statusColor: string;
  desc: string;
  protocols: string;
}

export default function Integrations() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const categories = [
    { id: "all", label: "All Integrations" },
    { id: "network", label: "Network & Telemetry" },
    { id: "siem", label: "SIEM & XDR" },
    { id: "firewall", label: "Firewalls & NAC" },
    { id: "endpoint", label: "Endpoint Security" },
    { id: "iomt", label: "Medical Devices & IoMT" },
    { id: "alerting", label: "Alerting & ITSM" },
  ];

  const integrations: IntegrationItem[] = [
    // Network & Telemetry
    {
      name: "Cisco & Arista SPAN / Mirror Ports",
      category: "network",
      status: "Supported (Testbed Verified)",
      statusColor: "var(--lime)",
      desc: "Passive switch port mirroring capturing raw Ethernet frames without impacting core transit latency.",
      protocols: "SPAN / RSPAN / ERSPAN / 10G SFP+",
    },
    {
      name: "Zeek & Suricata Network Sensor",
      category: "network",
      status: "Supported (Testbed Verified)",
      statusColor: "var(--lime)",
      desc: "Protocol parsing for DICOM, HL7, and MQTT streams into structured JSON telemetry for MediSOC ingestion.",
      protocols: "NetFlow / IPFIX / JSON Kafka",
    },
    {
      name: "Gigamon & Ixia Network TAPs",
      category: "network",
      status: "Blueprint Available",
      statusColor: "var(--info)",
      desc: "Hardware network packet brokers for zero-loss optical tap aggregation across hospital data centers.",
      protocols: "Hardware Optical Tap / NetFlow v9",
    },

    // SIEM & XDR
    {
      name: "Splunk Enterprise Security",
      category: "siem",
      status: "Blueprint Available",
      statusColor: "var(--info)",
      desc: "Bilateral forwarding of enriched IoMT security alerts, risk indices, and MITRE ATT&CK healthcare tags.",
      protocols: "Splunk HEC / Syslog CEF",
    },
    {
      name: "Microsoft Sentinel",
      category: "siem",
      status: "Blueprint Available",
      statusColor: "var(--info)",
      desc: "Data connector streaming validated DoS incident telemetry into Azure Sentinel incident queues.",
      protocols: "Azure Monitor REST API / Log Analytics",
    },
    {
      name: "IBM QRadar SIEM",
      category: "siem",
      status: "Roadmap Connector",
      statusColor: "var(--text-3)",
      desc: "LEEF-formatted event stream integration for centralized hospital security operations dashboards.",
      protocols: "LEEF / Syslog TLS",
    },

    // Firewalls & NAC
    {
      name: "Palo Alto Networks Next-Gen Firewalls",
      category: "firewall",
      status: "Blueprint Available",
      statusColor: "var(--info)",
      desc: "Dynamic address group updates for upstream rate limiting during verified medical gateway DoS attacks.",
      protocols: "PAN-OS XML / REST API",
    },
    {
      name: "Fortinet FortiGate Firewalls",
      category: "firewall",
      status: "Roadmap Connector",
      statusColor: "var(--text-3)",
      desc: "Coordinated policy adjustments for hospital perimeter filtering under volumetric DDoS conditions.",
      protocols: "FortiOS REST API",
    },
    {
      name: "Cisco ISE (Identity Services Engine)",
      category: "firewall",
      status: "Blueprint Available",
      statusColor: "var(--info)",
      desc: "Clinical device quarantine coordination that checks MediSOC allowlists before modifying 802.1X VLANs.",
      protocols: "pxGrid / RADIUS Change of Auth (CoA)",
    },

    // Endpoint & Host Security
    {
      name: "CrowdStrike Falcon",
      category: "endpoint",
      status: "Blueprint Available",
      statusColor: "var(--info)",
      desc: "Cross-correlates clinical workstation alerts with network telemetry to identify infected nurse PCs launching internal floods.",
      protocols: "Falcon Streaming API / Webhooks",
    },
    {
      name: "Microsoft Defender for Endpoint",
      category: "endpoint",
      status: "Roadmap Connector",
      statusColor: "var(--text-3)",
      desc: "Ingests host-level process events from hospital imaging PACS servers alongside network anomaly streams.",
      protocols: "Graph Security API",
    },

    // Medical Devices & IoMT Ecosystems
    {
      name: "BD Alaris Infusion Ecosystem",
      category: "iomt",
      status: "Supported (Testbed Verified)",
      statusColor: "var(--lime)",
      desc: "Passive MQTT and wireless gateway profile validation for Point-of-Care infusion pump fleets.",
      protocols: "802.11a/b/g/n / MQTT / TCP 1883",
    },
    {
      name: "Philips IntelliVue Patient Monitors",
      category: "iomt",
      status: "Supported (Testbed Verified)",
      statusColor: "var(--lime)",
      desc: "Clinical telemetry heartbeat tracking over private hospital monitoring networks with zero device intrusion.",
      protocols: "Philips Private Telemetry / UDP Multicast",
    },
    {
      name: "GE Healthcare CARESCAPE Gateways",
      category: "iomt",
      status: "Blueprint Available",
      statusColor: "var(--info)",
      desc: "Passive DICOM / HL7 traffic baseline verification to detect slow-rate exfiltration or DoS disruptions.",
      protocols: "HL7 v2.x / DICOM Part 10",
    },

    // Alerting & ITSM
    {
      name: "ServiceNow ITSM & Clinical BioMed",
      category: "alerting",
      status: "Blueprint Available",
      statusColor: "var(--info)",
      desc: "Automated ticket routing creating paired cybersecurity and biomedical engineering maintenance tickets.",
      protocols: "ServiceNow Table REST API",
    },
    {
      name: "PagerDuty Clinical On-Call",
      category: "alerting",
      status: "Supported (Testbed Verified)",
      statusColor: "var(--lime)",
      desc: "High-priority on-call notification for critical medical telemetry loss requiring immediate SOC review.",
      protocols: "Events API v2",
    },
  ];

  const filtered = integrations.filter((item) => {
    const matchCat = activeCategory === "all" || item.category === activeCategory;
    const matchQuery =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.protocols.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchQuery;
  });

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
            ECOSYSTEM INTEGRATIONS & CONNECTORS
          </span>
        </div>

        <h1 className="text-[40px] sm:text-[56px] font-extrabold tracking-tight leading-[1.1] mb-6">
          Connects Seamlessly With Your <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--lime)] to-[#8B72F0]">
            Existing Healthcare Stack
          </span>
        </h1>

        <p className="text-[17px] sm:text-[20px] text-[var(--text-3)] max-w-[760px] mx-auto leading-relaxed mb-8">
          MediSOC ingests passive telemetry from core switches and exports enriched incident alerts to your SIEM, firewalls, and clinical ticketing systems.
        </p>

        {/* Clear Demonstration Disclosure */}
        <div className="inline-block p-4 rounded-xl bg-[#141B16] border border-[var(--border)] max-w-[720px] mx-auto text-[12px] text-[var(--text-3)]">
          <span className="font-bold text-[var(--lime)] font-mono">INTEGRATION STATUS DISCLOSURE:</span> MediSOC testbed integrations are verified in our virtual healthcare lab. Production enterprise connectors are available as architecture blueprints or on our active development roadmap.
        </div>
      </section>

      {/* ── Category Filter & Search ── */}
      <section className="px-6 max-w-[1280px] mx-auto mb-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-[13px] font-medium transition-all ${
                  activeCategory === cat.id
                    ? "bg-[var(--lime)] text-black font-bold shadow-[0_0_15px_rgba(168,255,53,0.2)]"
                    : "bg-[#121814] text-[var(--text-3)] hover:text-white border border-[var(--border)]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="w-full md:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search integrations, protocols..."
              className="w-full px-4 py-2 rounded-xl bg-[#121814] border border-[var(--border)] text-[13px] text-white focus:outline-none focus:border-[var(--lime)]"
            />
          </div>
        </div>

        {/* Integration Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-[#111713] border border-[var(--border)] flex flex-col justify-between hover:border-[var(--lime)]/30 transition-all group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded"
                    style={{ color: item.statusColor, background: `${item.statusColor}15` }}
                  >
                    {item.status}
                  </span>
                  <span className="text-[11px] font-mono text-[var(--text-4)] uppercase">{item.category}</span>
                </div>
                <h3 className="text-[17px] font-bold text-white mb-2 group-hover:text-[var(--lime)] transition-colors">
                  {item.name}
                </h3>
                <p className="text-[13px] text-[var(--text-3)] leading-relaxed mb-4">{item.desc}</p>
              </div>

              <div className="pt-3 border-t border-[var(--border)]">
                <span className="text-[10px] font-mono text-[var(--text-4)] block mb-1">PROTOCOLS / INTERFACE:</span>
                <div className="text-[11px] font-mono text-[var(--lime)] truncate">{item.protocols}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Architecture Data Flow Diagram ── */}
      <section className="px-6 max-w-[1100px] mx-auto mt-20 p-8 sm:p-12 rounded-3xl bg-[#0E1310] border border-[var(--border)]">
        <h2 className="text-[26px] font-bold text-white mb-3 text-center">Bilateral Integration Data Flow</h2>
        <p className="text-[14px] text-[var(--text-3)] text-center max-w-[620px] mx-auto mb-10">
          How MediSOC sits non-intrusively in your hospital core and interfaces with security operations and firewalls.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="p-5 rounded-xl bg-[#131915] border border-[var(--border)]">
            <span className="text-[11px] font-mono text-[var(--info)] block mb-1">INGESTION (PASSIVE)</span>
            <h4 className="font-bold text-white text-[15px] mb-2">Hospital Network SPAN / TAP</h4>
            <p className="text-[12px] text-[var(--text-3)]">
              Raw packet streams and flow records are mirrored into MediSOC with zero packet injection.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#151D17] border border-[var(--lime)]/40 shadow-lg">
            <span className="text-[11px] font-mono text-[var(--lime)] block mb-1">CORE ENGINE</span>
            <h4 className="font-bold text-white text-[15px] mb-2">MediSOC Platform</h4>
            <p className="text-[12px] text-[var(--text-3)]">
              Ensemble detection, Case Memory retrieval, and Clinical Safety Allowlist evaluation.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#131915] border border-[var(--border)]">
            <span className="text-[11px] font-mono text-[var(--success)] block mb-1">ORCHESTRATION (AUTHORIZED)</span>
            <h4 className="font-bold text-white text-[15px] mb-2">SIEM & Upstream Firewalls</h4>
            <p className="text-[12px] text-[var(--text-3)]">
              Approved upstream rate limits dispatched to Palo Alto / Fortinet; alerts forwarded to Splunk.
            </p>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-6 max-w-[800px] mx-auto text-center border-t border-[var(--border)] pt-20 mt-20">
        <h2 className="text-[30px] font-bold text-white mb-4">Need a custom hospital protocol connector?</h2>
        <p className="text-[15px] text-[var(--text-3)] mb-8">
          Our engineering team regularly validates custom proprietary medical gateway protocols.
        </p>
        <Link to="/contact" className="px-8 py-3.5 rounded-xl bg-[var(--lime)] text-black font-bold text-[14px]">
          Request Integration Assessment
        </Link>
      </section>
    </div>
  );
}
