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

export const featureImportance = [
  { name: "Connection Rate", value: 0.34 },
  { name: "Packets/sec", value: 0.27 },
  { name: "Bytes/sec", value: 0.19 },
  { name: "Flow Duration", value: 0.12 },
  { name: "SYN Count", value: 0.08 },
];

export const incidents = [
  { id: "INC-104", attack: "MQTT Connect Flood", type: "DDoS", target: "Gateway-01", criticality: "Critical", confidence: 97, route: "PARTIAL", outcome: "SUCCESS", time: "14:32" },
  { id: "INC-103", attack: "UDP Flood", type: "DoS", target: "Sensor-02", criticality: "Low", confidence: 94, route: "SHORT", outcome: "SUCCESS", time: "14:21" },
  { id: "INC-102", attack: "SYN Flood", type: "DDoS", target: "Gateway-01", criticality: "Critical", confidence: 89, route: "DEEP", outcome: "PARTIAL", time: "13:57" },
  { id: "INC-101", attack: "ICMP Flood", type: "DoS", target: "Sensor-01", criticality: "Medium", confidence: 91, route: "SHORT", outcome: "SUCCESS", time: "13:44" },
  { id: "INC-100", attack: "TCP Flood", type: "DDoS", target: "Broker-01", criticality: "High", confidence: 88, route: "PARTIAL", outcome: "PARTIAL", time: "13:12" },
  { id: "INC-099", attack: "MQTT Publish Flood", type: "DDoS", target: "Gateway-01", criticality: "Critical", confidence: 95, route: "DEEP", outcome: "SUCCESS", time: "12:55" },
];

export const devices = [
  { id: "GW-01", name: "Gateway-01", type: "Patient Monitor Gateway", criticality: "Critical", ip: "10.0.0.10", protocol: "MQTT", baseline: "20–30 msg/s", status: "Online" },
  { id: "BR-01", name: "Broker-01", type: "MQTT Broker", criticality: "High", ip: "10.0.0.5", protocol: "MQTT", baseline: "60–80 msg/s", status: "Online" },
  { id: "SN-01", name: "Sensor-01", type: "Medical Sensor", criticality: "Medium", ip: "10.0.0.21", protocol: "MQTT", baseline: "8–12 msg/s", status: "Online" },
  { id: "SN-02", name: "Sensor-02", type: "Medical Sensor", criticality: "Low", ip: "10.0.0.22", protocol: "MQTT", baseline: "6–10 msg/s", status: "Online" },
];

export const cases = [
  { id: "CASE-128", attack: "MQTT Flood", device: "Gateway — Critical", response: "Rate Limiting + Source Block", outcome: "SUCCESS", uses: 12, reliability: 84, similarity: 89 },
  { id: "CASE-117", attack: "UDP Flood", device: "Sensor — Medium", response: "Source Block", outcome: "SUCCESS", uses: 8, reliability: 91, similarity: 77 },
  { id: "CASE-099", attack: "SYN Flood", device: "Gateway — Critical", response: "Rate Limiting", outcome: "PARTIAL", uses: 5, reliability: 72, similarity: 65 },
  { id: "CASE-087", attack: "TCP Flood", device: "Broker — High", response: "Source Block + Rate Limit", outcome: "SUCCESS", uses: 14, reliability: 88, similarity: 82 },
  { id: "CASE-073", attack: "ICMP Flood", device: "Sensor — Low", response: "Source Block", outcome: "SUCCESS", uses: 6, reliability: 93, similarity: 71 },
  { id: "CASE-017", attack: "MQTT Connect Flood", device: "Sensor — Medium", response: "Rate Limiting", outcome: "SUCCESS", uses: 12, reliability: 89, similarity: 82 },
];

export const services = [
  { name: "Edge Gateway", status: "Online", detail: "v2.4.1", latency: "3ms", impact: "Primary network entry point" },
  { name: "Detector", status: "Online", detail: "XGBoost-v3", latency: "12ms", impact: "Required for incident detection" },
  { name: "Controller", status: "Online", detail: "v1.8.0", latency: "5ms", impact: "Routes response decisions" },
  { name: "Case Memory", status: "Online", detail: "ChromaDB v0.4", latency: "8ms", impact: "Historical case retrieval" },
  { name: "MQTT Broker", status: "Online", detail: "Mosquitto 2.0", latency: "1ms", impact: "IoMT message transport" },
  { name: "Database", status: "Online", detail: "PostgreSQL 15", latency: "4ms", impact: "Persistent incident storage" },
];

export const detectionMetrics = {
  precision: 0.963,
  recall: 0.951,
  f1: 0.957,
  fpr: 0.021,
};

export const confusionMatrix = [
  { label: "TP", value: 284 }, { label: "FP", value: 11 },
  { label: "FN", value: 14 }, { label: "TN", value: 512 },
];

export const modelComparison = [
  { model: "Random Forest", precision: 0.934, recall: 0.921, f1: 0.927, latency: 18 },
  { model: "XGBoost", precision: 0.963, recall: 0.951, f1: 0.957, latency: 12 },
  { model: "LightGBM", precision: 0.948, recall: 0.939, f1: 0.943, latency: 9 },
];

export const safeReuseMetrics = [
  { metric: "Safe-Reuse Precision", fullInv: "N/A", simOnly: "0.71", simOutcome: "0.79", proposed: "0.88" },
  { metric: "Wrong-Reuse Rate", fullInv: "0.00", simOnly: "0.18", simOutcome: "0.12", proposed: "0.06" },
  { metric: "Investigation Steps", fullInv: "4.0", simOnly: "1.2", simOutcome: "1.8", proposed: "1.4" },
  { metric: "Median TTC (s)", fullInv: "38", simOnly: "11", simOutcome: "16", proposed: "14" },
  { metric: "Harmful Response Rate", fullInv: "0.00", simOnly: "0.09", simOutcome: "0.04", proposed: "0.02" },
];

export const vectorMetrics = [
  { attack: "SYN Flood", suppression: 94, availability: 91, ttc: 12, recovery: 18 },
  { attack: "TCP Flood", suppression: 88, availability: 87, ttc: 15, recovery: 22 },
  { attack: "UDP Flood", suppression: 92, availability: 90, ttc: 11, recovery: 17 },
  { attack: "ICMP Flood", suppression: 96, availability: 93, ttc: 9, recovery: 14 },
  { attack: "MQTT Connect", suppression: 90, availability: 88, ttc: 14, recovery: 20 },
  { attack: "MQTT Publish", suppression: 87, availability: 85, ttc: 16, recovery: 24 },
];
