/**
 * MediSOC Mock Data
 * Comprehensive demonstration data for the healthcare cybersecurity SOC platform.
 * All data is clearly labeled as DEMONSTRATION DATA — not from a live hospital environment.
 */

export const trafficData = Array.from({ length: 60 }, (_, i) => {
  const t = i;
  const isAttack = i >= 15 && i <= 50;
  const isContained = i >= 38;
  const legitBase = 25 + Math.sin(i * 0.3) * 3 + Math.random() * 2;
  const malicious = isAttack
    ? isContained
      ? Math.max(2, 80 - (i - 38) * 4 + Math.random() * 5)
      : 60 + Math.random() * 30
    : 0;
  const legit = isAttack
    ? isContained
      ? legitBase * 0.9
      : legitBase * (1 - Math.min(0.7, (malicious / 100) * 0.6))
    : legitBase;
  return { t, legit: +legit.toFixed(1), malicious: +malicious.toFixed(1) };
});

// 7-day alert trend data
export const alertTrendData = [
  { day: "Mon", critical: 2, high: 5, medium: 8, low: 12 },
  { day: "Tue", critical: 1, high: 3, medium: 11, low: 9 },
  { day: "Wed", critical: 3, high: 7, medium: 6, low: 14 },
  { day: "Thu", critical: 0, high: 4, medium: 9, low: 11 },
  { day: "Fri", critical: 4, high: 8, medium: 7, low: 8 },
  { day: "Sat", critical: 1, high: 2, medium: 5, low: 6 },
  { day: "Sun", critical: 2, high: 6, medium: 10, low: 7 },
];

// Attack type breakdown for donut / bar chart
export const attackTypeData = [
  { type: "MQTT Flood", count: 4, pct: 38 },
  { type: "UDP Flood",  count: 3, pct: 28 },
  { type: "SYN Flood",  count: 2, pct: 19 },
  { type: "TCP Flood",  count: 1, pct: 9  },
  { type: "ICMP Flood", count: 1, pct: 6  },
];

export const featureImportance = [
  { name: "Connection Rate", value: 0.34 },
  { name: "Packets/sec",     value: 0.27 },
  { name: "Bytes/sec",       value: 0.19 },
  { name: "Flow Duration",   value: 0.12 },
  { name: "SYN Count",       value: 0.08 },
];

export const incidents = [
  {
    id: "INC-104",
    attack: "MQTT Connect Flood",
    type: "DDoS",
    target: "Gateway-01",
    targetId: "GW-01",
    criticality: "Critical",
    status: "Investigating",
    confidence: 97,
    route: "PARTIAL",
    outcome: "SUCCESS",
    time: "14:32",
    assignee: "admin@iomt-testbed.local",
    detectedBy: "XGBoost-v3",
    sourceIp: "192.168.50.22",
    protocol: "MQTT",
    packetsPerSec: 4218,
    description: "High-volume MQTT CONNECT packet flood targeting the patient monitor gateway. Source identified as internal subnet 192.168.50.x. Detector confidence above threshold.",
  },
  {
    id: "INC-103",
    attack: "UDP Flood",
    type: "DoS",
    target: "Sensor-02",
    targetId: "SN-02",
    criticality: "Low",
    status: "Resolved",
    confidence: 94,
    route: "SHORT",
    outcome: "SUCCESS",
    time: "14:21",
    assignee: "analyst@iomt-testbed.local",
    detectedBy: "XGBoost-v3",
    sourceIp: "10.0.0.55",
    protocol: "UDP",
    packetsPerSec: 1820,
    description: "UDP packet flood on Sensor-02. Short investigation route used — signature matches known pattern. Contained at source.",
  },
  {
    id: "INC-102",
    attack: "SYN Flood",
    type: "DDoS",
    target: "Gateway-01",
    targetId: "GW-01",
    criticality: "Critical",
    status: "Escalated",
    confidence: 89,
    route: "DEEP",
    outcome: "PARTIAL",
    time: "13:57",
    assignee: "admin@iomt-testbed.local",
    detectedBy: "XGBoost-v3",
    sourceIp: "Multiple",
    protocol: "TCP",
    packetsPerSec: 3105,
    description: "Multi-source SYN flood on Gateway-01. Detector confidence below 90% threshold — deep investigation route triggered. Escalated to Super Admin.",
  },
  {
    id: "INC-101",
    attack: "ICMP Flood",
    type: "DoS",
    target: "Sensor-01",
    targetId: "SN-01",
    criticality: "Medium",
    status: "Resolved",
    confidence: 91,
    route: "SHORT",
    outcome: "SUCCESS",
    time: "13:44",
    assignee: "analyst@iomt-testbed.local",
    detectedBy: "XGBoost-v3",
    sourceIp: "10.0.0.88",
    protocol: "ICMP",
    packetsPerSec: 850,
    description: "ICMP echo-request flood on Sensor-01. Resolved via source block. Sensor availability maintained throughout.",
  },
  {
    id: "INC-100",
    attack: "TCP Flood",
    type: "DDoS",
    target: "Broker-01",
    targetId: "BR-01",
    criticality: "High",
    status: "Resolved",
    confidence: 88,
    route: "PARTIAL",
    outcome: "PARTIAL",
    time: "13:12",
    assignee: "admin@iomt-testbed.local",
    detectedBy: "XGBoost-v3",
    sourceIp: "Multiple",
    protocol: "TCP",
    packetsPerSec: 2440,
    description: "Multi-source TCP flood targeting MQTT Broker. Partial containment achieved — rate limiting applied. Service degraded for approximately 40 seconds.",
  },
  {
    id: "INC-099",
    attack: "MQTT Publish Flood",
    type: "DDoS",
    target: "Gateway-01",
    targetId: "GW-01",
    criticality: "Critical",
    status: "Resolved",
    confidence: 95,
    route: "DEEP",
    outcome: "SUCCESS",
    time: "12:55",
    assignee: "admin@iomt-testbed.local",
    detectedBy: "XGBoost-v3",
    sourceIp: "192.168.50.11",
    protocol: "MQTT",
    packetsPerSec: 3880,
    description: "MQTT PUBLISH packet flood on Gateway-01. Full investigation completed — case stored in memory for future reuse.",
  },
];

export const devices = [
  {
    id: "GW-01",
    name: "Gateway-01",
    type: "Patient Monitor Gateway",
    category: "Gateway",
    manufacturer: "MedConnect Inc.",
    model: "MCG-4000",
    criticality: "Critical",
    clinicalRole: "Primary gateway for ICU patient monitor telemetry",
    ip: "10.0.0.10",
    macAddress: "AA:BB:CC:DD:EE:01",
    protocol: "MQTT",
    baseline: "20–30 msg/s",
    status: "Online",
    monitoringStatus: "Active",
    riskScore: 82,
    vulnerabilities: 2,
    firmwareVersion: "4.2.1",
    lastSeen: "Just now",
    networkZone: "Clinical IoMT",
    incidentCount: 3,
    notes: "[DEMO] Fictional device for demonstration purposes.",
  },
  {
    id: "BR-01",
    name: "Broker-01",
    type: "MQTT Broker",
    category: "Broker",
    manufacturer: "Eclipse Foundation",
    model: "Mosquitto 2.0",
    criticality: "High",
    clinicalRole: "Central MQTT message broker for all IoMT communications",
    ip: "10.0.0.5",
    macAddress: "AA:BB:CC:DD:EE:02",
    protocol: "MQTT",
    baseline: "60–80 msg/s",
    status: "Online",
    monitoringStatus: "Active",
    riskScore: 55,
    vulnerabilities: 1,
    firmwareVersion: "2.0.15",
    lastSeen: "Just now",
    networkZone: "Infrastructure",
    incidentCount: 1,
    notes: "[DEMO] Fictional device for demonstration purposes.",
  },
  {
    id: "SN-01",
    name: "Sensor-01",
    type: "Medical Sensor",
    category: "Sensor",
    manufacturer: "BioSense Labs",
    model: "BSL-S200",
    criticality: "Medium",
    clinicalRole: "Vital signs sensor — Ward A, Beds 1-8",
    ip: "10.0.0.21",
    macAddress: "AA:BB:CC:DD:EE:03",
    protocol: "MQTT",
    baseline: "8–12 msg/s",
    status: "Online",
    monitoringStatus: "Active",
    riskScore: 31,
    vulnerabilities: 0,
    firmwareVersion: "3.1.0",
    lastSeen: "2 min ago",
    networkZone: "Clinical IoMT",
    incidentCount: 1,
    notes: "[DEMO] Fictional device for demonstration purposes.",
  },
  {
    id: "SN-02",
    name: "Sensor-02",
    type: "Medical Sensor",
    category: "Sensor",
    manufacturer: "BioSense Labs",
    model: "BSL-S200",
    criticality: "Low",
    clinicalRole: "Vital signs sensor — Ward B, Beds 1-6",
    ip: "10.0.0.22",
    macAddress: "AA:BB:CC:DD:EE:04",
    protocol: "MQTT",
    baseline: "6–10 msg/s",
    status: "Online",
    monitoringStatus: "Active",
    riskScore: 18,
    vulnerabilities: 0,
    firmwareVersion: "3.1.0",
    lastSeen: "3 min ago",
    networkZone: "Clinical IoMT",
    incidentCount: 1,
    notes: "[DEMO] Fictional device for demonstration purposes.",
  },
];

export const cases = [
  { id: "CASE-128", attack: "MQTT Flood", device: "Gateway — Critical", response: "Rate Limiting + Source Block", outcome: "SUCCESS", uses: 12, reliability: 84, similarity: 89 },
  { id: "CASE-117", attack: "UDP Flood",  device: "Sensor — Medium",   response: "Source Block",                outcome: "SUCCESS", uses: 8,  reliability: 91, similarity: 77 },
  { id: "CASE-099", attack: "SYN Flood",  device: "Gateway — Critical", response: "Rate Limiting",              outcome: "PARTIAL", uses: 5,  reliability: 72, similarity: 65 },
  { id: "CASE-087", attack: "TCP Flood",  device: "Broker — High",      response: "Source Block + Rate Limit",  outcome: "SUCCESS", uses: 14, reliability: 88, similarity: 82 },
  { id: "CASE-073", attack: "ICMP Flood", device: "Sensor — Low",       response: "Source Block",               outcome: "SUCCESS", uses: 6,  reliability: 93, similarity: 71 },
  { id: "CASE-017", attack: "MQTT Connect Flood", device: "Sensor — Medium", response: "Rate Limiting",         outcome: "SUCCESS", uses: 12, reliability: 89, similarity: 82 },
];

export const services = [
  { name: "Edge Gateway",  status: "Online", detail: "v2.4.1",          latency: "3ms",  impact: "Primary network entry point" },
  { name: "Detector",      status: "Online", detail: "XGBoost-v3",      latency: "12ms", impact: "Required for incident detection" },
  { name: "Controller",    status: "Online", detail: "v1.8.0",          latency: "5ms",  impact: "Routes response decisions" },
  { name: "Case Memory",   status: "Online", detail: "ChromaDB v0.4",   latency: "8ms",  impact: "Historical case retrieval" },
  { name: "MQTT Broker",   status: "Online", detail: "Mosquitto 2.0",   latency: "1ms",  impact: "IoMT message transport" },
  { name: "Database",      status: "Online", detail: "PostgreSQL 15",   latency: "4ms",  impact: "Persistent incident storage" },
];

export const detectionMetrics = {
  precision: 0.963,
  recall: 0.951,
  f1: 0.957,
  fpr: 0.021,
};

export const confusionMatrix = [
  { label: "TP", value: 284 }, { label: "FP", value: 11  },
  { label: "FN", value: 14  }, { label: "TN", value: 512 },
];

export const modelComparison = [
  { model: "Random Forest", precision: 0.934, recall: 0.921, f1: 0.927, latency: 18 },
  { model: "XGBoost",       precision: 0.963, recall: 0.951, f1: 0.957, latency: 12 },
  { model: "LightGBM",      precision: 0.948, recall: 0.939, f1: 0.943, latency: 9  },
];

export const safeReuseMetrics = [
  { metric: "Safe-Reuse Precision",   fullInv: "N/A",  simOnly: "0.71", simOutcome: "0.79", proposed: "0.88" },
  { metric: "Wrong-Reuse Rate",       fullInv: "0.00", simOnly: "0.18", simOutcome: "0.12", proposed: "0.06" },
  { metric: "Investigation Steps",    fullInv: "4.0",  simOnly: "1.2",  simOutcome: "1.8",  proposed: "1.4"  },
  { metric: "Median TTC (s)",         fullInv: "38",   simOnly: "11",   simOutcome: "16",   proposed: "14"   },
  { metric: "Harmful Response Rate",  fullInv: "0.00", simOnly: "0.09", simOutcome: "0.04", proposed: "0.02" },
];

export const vectorMetrics = [
  { attack: "SYN Flood",      suppression: 94, availability: 91, ttc: 12, recovery: 18 },
  { attack: "TCP Flood",      suppression: 88, availability: 87, ttc: 15, recovery: 22 },
  { attack: "UDP Flood",      suppression: 92, availability: 90, ttc: 11, recovery: 17 },
  { attack: "ICMP Flood",     suppression: 96, availability: 93, ttc: 9,  recovery: 14 },
  { attack: "MQTT Connect",   suppression: 90, availability: 88, ttc: 14, recovery: 20 },
  { attack: "MQTT Publish",   suppression: 87, availability: 85, ttc: 16, recovery: 24 },
];
