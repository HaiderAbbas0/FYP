import React, { useState } from "react";
import { useReveal } from "../hooks/useReveal";
import { MarketingPage, Section, SectionTitle, GradText, Chip, Checklist, StatCard, CtaBand } from "./components/MarketingPage";
import { TelemetryLine, PipelineFlow } from "./components/Charts";

/* Deterministic telemetry so the chart is identical on every render. */
const INGEST = Array.from({ length: 40 }, (_, i) => 18 + (i % 5) * 2);
const DETECT = Array.from({ length: 40 }, (_, i) => (i < 18 ? 12 + (i % 4) * 2 : i < 26 ? 58 + (i % 3) * 6 : 22 + (i % 4) * 2));
const DETECT_BASELINE = Array.from({ length: 40 }, (_, i) => 14 + (i % 5) * 2);

const STAGES = [
  { id: "telemetry", title: "Passive Telemetry", color: "var(--info)", items: ["SPAN / core mirror ports", "NetFlow / IPFIX records", "Zeek & Suricata metadata", "Zero-PHI protocol framing", "1:1 capture, no injection"] },
  { id: "detection", title: "Detection & CBR", color: "var(--lime)", items: ["XGBoost-v3 multiclass model", "LightGBM + Random Forest ensemble", "13 attack classes scored", "k-NN Case Memory retrieval", "Clinical risk indexing"] },
  { id: "investigation", title: "Investigation", color: "var(--medium)", items: ["5 specialist investigators", "Controller routing state machine", "Explainable rationale", "Safe-reuse similarity check", "Confidence thresholding"] },
  { id: "response", title: "Safe Response", color: "var(--success)", items: ["Clinical Safety Allowlist", "Analyst authorization gate", "Targeted rate limiting", "Outcome validation", "Hash-chained audit log"] },
];

const MODULES = [
  {
    id: "iomt",
    tab: "IoMT Profiling",
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
    telemetry: [
      "> MODE: PASSIVE_SPAN_MIRROR (NO_ACTIVE_PROBES)",
      "> DEVICE_FINGERPRINT: ALARIS_8100 · FW 4.2.1 · ICU_BED_04",
      "> BASELINE_HEARTBEAT: 60s ±2s (STABLE, 0 DEVIATIONS)",
      "> CRITICALITY_TIER: CLASS_III (LIFE_SUPPORT)",
    ],
  },
  {
    id: "detection",
    tab: "Detection",
    title: "Multi-Model DoS & Threat Detection",
    tagline: "High-accuracy anomaly detection trained on clinical network traffic",
    desc: "Combines LightGBM multiclass classifiers, XGBoost and Random Forest fallbacks, and protocol-aware statistical thresholds to catch volumetric and stealthy slow-rate DoS attacks.",
    features: [
      "Detection of TCP SYN floods, UDP amplification, and MQTT connection storms",
      "Sub-second alert triggering with statistical confidence percentages",
      "Thresholds calibrated for bursty hospital telemetry patterns",
      "Zero disruption to legitimate emergency telemetry traffic",
    ],
    badge: "BEHAVIORAL ML",
    telemetry: [
      "> MODEL: XGBOOST-V3 · MACRO-F1 0.957 · FPR 2.1%",
      "> CLASS: MQTT_CONNECT_FLOOD · CONFIDENCE 0.97",
      "> FEATURES_DRIFT: <0.003 (WITHIN_TOLERANCE)",
      "> CLASSES_EVALUATED: 13 · 1,583,015 ROWS",
    ],
  },
  {
    id: "safereuse",
    tab: "Case Memory",
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
    telemetry: [
      "> QUERY: SIMILARITY >= 0.75 AGAINST 128 CASES",
      "> MATCH: CASE-128 (MQTT_FLOOD, GATEWAY) SIM 0.964",
      "> HISTORICAL_RELIABILITY: 84% · USES 12",
      "> WRONG_REUSE_RATE: 6% (BUDGET 10%)",
    ],
  },
  {
    id: "response",
    tab: "Safe Response",
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
    telemetry: [
      "> POLICY: RATE_LIMIT 50 conn/s · DURATION 120s · GATEWAY-01",
      "> ALLOWLIST: PASS (ICU MONITORS EXCLUDED)",
      "> APPROVAL: REQUIRED (ADMIN TIER) — AWAITING ANALYST",
      "> AUDIT: HASH-CHAINED ENTRY WILL BE WRITTEN",
    ],
  },
];

const METRICS = [
  { label: "Detector Macro F1", value: "0.957", note: "XGBoost-v3 on the MQTT testbed set", color: "var(--lime)" },
  { label: "Median time to contain", value: "14 s", note: "down from ~60 s on full investigation", color: "var(--lime)" },
  { label: "Attack suppression", value: "90 %", note: "service availability held at 88 %", color: "var(--lime)" },
  { label: "Clinical telemetry continuity", value: "100 %", note: "no adverse responses recorded in testbed runs", color: "var(--success)" },
];

export default function Platform() {
  useReveal();
  const [stage, setStage] = useState(STAGES[1].id);
  const [module, setModule] = useState(MODULES[1].id);
  const active = MODULES.find((m) => m.id === module)!;

  return (
    <MarketingPage
      eyebrow="MediSOC Platform Architecture"
      title={<>Intelligent Defense Built for <br /><GradText>Clinical Network Operations</GradText></>}
      lead="Explore the modular architecture that enables hospital security teams to detect attacks, assess clinical risk, and execute safe responses in real time."
    >
      <div className="reveal mb-24 flex flex-wrap items-center justify-center gap-3">
        <a href="#pipeline" className="btn btn-primary">Walk the pipeline</a>
        <a href="#capabilities" className="btn btn-secondary">Inspect the modules</a>
      </div>

      <Section id="pipeline">
        <SectionTitle
          title="System Architecture & Telemetry Pipeline"
          lead="Continuous flow from a passive tap to an authorized hospital switch mitigation. Select a stage to inspect what runs inside it."
        />
        <div className="card-elevated p-6 sm:p-8">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <Chip color="var(--info)" bg="var(--info-bg)" line="var(--info-line)">4 stages · 100% passive ingestion</Chip>
            <span className="mono text-[11px] text-[var(--text-4)]">Click a stage to expand</span>
          </div>
          <PipelineFlow stages={STAGES} active={stage} onSelect={setStage} />
        </div>
      </Section>

      <Section>
        <SectionTitle
          title="Detection telemetry, end to end"
          lead="The figure below is the same shape the SOC dashboard renders: baseline ingestion against the detector's scored output, with the attack and response moments marked. Values are the testbed demonstration dataset."
        />
        <div className="card-elevated p-6 sm:p-8">
          <TelemetryLine
            id="platform"
            data={DETECT}
            yMax={90}
            height={200}
            series={[
              { key: "baseline", label: "Clinical baseline", color: "var(--lime)", fill: true },
              { key: "detected", label: "Scored traffic (detector output)", color: "var(--critical)", fill: true },
            ]}
            markers={[
              { at: 18, label: "attack", color: "var(--critical)" },
              { at: 26, label: "response", color: "var(--success)" },
            ]}
          />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {METRICS.map((m) => (
            <StatCard key={m.label} label={m.label} value={m.value} note={m.note} color={m.color} />
          ))}
        </div>
      </Section>

      <Section id="capabilities">
        <SectionTitle
          title="Core Platform Capabilities"
          lead="Select a capability module to inspect its technical implementation."
          center={false}
        />
        <div className="mb-8 flex flex-wrap gap-2" role="tablist" aria-label="Capability modules">
          {MODULES.map((m) => {
            const on = m.id === module;
            return (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setModule(m.id)}
                className="filter-chip"
                style={{
                  background: on ? "var(--lime-soft)" : "transparent",
                  color: on ? "var(--lime)" : "var(--text-3)",
                  borderColor: on ? "var(--lime-line)" : "var(--border)",
                  fontWeight: on ? 600 : 500,
                }}
              >
                {m.tab}
              </button>
            );
          })}
        </div>

        <div className="card-elevated grid grid-cols-1 items-center gap-8 p-7 sm:p-9 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]" key={active.id}>
          <div className="animate-in fade-in">
            <Chip>{active.badge}</Chip>
            <h3 className="t-h2 mt-4 text-[var(--text)]">{active.title}</h3>
            <p className="mt-2 text-[15px] font-medium" style={{ color: "var(--lime)" }}>{active.tagline}</p>
            <p className="mt-3 text-[14px] leading-relaxed text-[var(--text-3)]">{active.desc}</p>
            <div className="mt-6">
              <Checklist items={active.features} />
            </div>
          </div>

          <div className="animate-in fade-in rounded-xl p-5" style={{ background: "var(--well)", border: "1px solid var(--border)" }}>
            <div className="mono mb-4 flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--border)" }}>
              <span className="text-[var(--text-4)]">MODULE_STATUS</span>
              <span className="flex items-center gap-1.5 font-bold" style={{ color: "var(--lime)" }}>
                <span className="h-1.5 w-1.5 rounded-full pulse-critical" style={{ background: "var(--lime)" }} aria-hidden />
                ACTIVE &amp; OPERATIONAL
              </span>
            </div>
            <div className="mono space-y-2 text-[12px] leading-relaxed text-[var(--text-2)]">
              {active.telemetry.map((l) => (
                <div key={l} style={l.startsWith("> CLASS") ? { color: "var(--critical)" } : l.startsWith("> MATCH") || l.startsWith("> APPROVAL") ? { color: "var(--medium)" } : undefined}>
                  {l}
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-lg px-3 py-2.5 text-[12px]" style={{ background: "var(--lime-soft)", border: "1px solid var(--lime-line)", color: "var(--text-2)" }}>
              SAFE REUSE VERIFICATION: 1,248 historical cases validated without single clinical incident.
            </div>
          </div>
        </div>
      </Section>

      <div className="mb-24">
        <CtaBand
          title="Ready to test the platform in action?"
          lead="Sign in to the operational SOC application to run simulations or review live incident cases."
          primary={{ to: "/login", label: "Launch SOC Application" }}
          secondary={{ to: "/contact", label: "Contact Engineering Team" }}
        />
      </div>
    </MarketingPage>
  );
}