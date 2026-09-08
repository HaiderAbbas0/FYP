import React, { useState } from "react";
import Card from "../components/ui/Card";
import { StatusDot } from "../components/ui/Badge";
import { services } from "../data/mock";
import type { Screen } from "../types";

interface Props { onNavigate: (s: Screen) => void; }

const serviceIcons: Record<string, React.ReactNode> = {
  "Edge Gateway": <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="5" width="14" height="8" rx="2" stroke="currentColor" strokeWidth="1.2"/><path d="M6 9h6M9 7v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
  "Detector": <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.2"/><path d="M6 9l2 2 4-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  "Controller": <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 6h12M3 9h8M3 12h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
  "Case Memory": <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="3" y="3" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.2"/><path d="M6 7h6M6 10h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
  "MQTT Broker": <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 9h2M14 9h2M9 2v2M9 14v2M4.93 4.93l1.41 1.41M11.66 11.66l1.41 1.41M4.93 13.07l1.41-1.41M11.66 6.34l1.41-1.41" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.2"/></svg>,
  "Database": <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><ellipse cx="9" cy="5.5" rx="6" ry="2.5" stroke="currentColor" strokeWidth="1.2"/><path d="M3 5.5v7c0 1.38 2.69 2.5 6 2.5s6-1.12 6-2.5v-7" stroke="currentColor" strokeWidth="1.2"/><path d="M3 9c0 1.38 2.69 2.5 6 2.5S15 10.38 15 9" stroke="currentColor" strokeWidth="1.2"/></svg>,
};

export default function SystemHealth({ onNavigate }: Props) {
  const [activeTab, setActiveTab] = useState<"health" | "settings">("health");

  return (
    <div className="h-full overflow-y-auto bg-[#0C0F0D]">
      <div className="max-w-[1440px] mx-auto px-8 py-7 fade-in">
        <div className="flex gap-0 border-b border-[#1A1F1B] mb-6">
          {(["health", "settings"] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-5 py-3 text-[19px] font-medium capitalize transition-all border-b-2 -mb-px
                ${activeTab === t ? "border-[#B6FF3B] text-[#E8EDE9]" : "border-transparent text-[#94A8BA] hover:text-[#E8EDE9]"}`}>
              {t === "health" ? "System Health" : "Settings"}
            </button>
          ))}
        </div>

        {activeTab === "health" && (
          <div className="grid grid-cols-3 gap-4">
            {services.map(s => (
              <Card key={s.name} className="p-5" hover>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-9 h-9 bg-[#0C0F0D] border border-[#1A1F1B] rounded-[8px] flex items-center justify-center text-[#94A8BA]">
                    {serviceIcons[s.name]}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <StatusDot online={s.status === "Online"}/>
                    <span className={`text-[15px] font-semibold ${s.status === "Online" ? "text-[#22C55E]" : "text-[#EF4444]"}`}>{s.status}</span>
                  </div>
                </div>
                <div className="font-semibold text-[#E8EDE9] mb-1">{s.name}</div>
                <div className="text-[15px] mono text-[#94A8BA] mb-3">{s.detail}</div>
                <div className="flex items-center justify-between text-[15px]">
                  <span className="text-[#94A8BA]">Latency</span>
                  <span className="mono font-semibold text-[#22C55E]">{s.latency}</span>
                </div>
                <div className="mt-2 pt-2 border-t border-[#1A1F1B]">
                  <div className="text-[13px] text-[#94A8BA]">{s.impact}</div>
                </div>
                <div className="mt-2 text-[13px] mono text-[#1E241F]">Last heartbeat: just now</div>
              </Card>
            ))}
          </div>
        )}

        {activeTab === "settings" && <SettingsContent/>}
      </div>
    </div>
  );
}

function Toggle({ defaultOn = false, label, tag }: { defaultOn?: boolean; label: string; tag?: string }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#1A1F1B] last:border-0">
      <div className="flex items-center gap-2">
        <span className="text-[19px] text-[#E8EDE9]">{label}</span>
        {tag && <span className={`px-2 py-0.5 rounded-full text-[13px] font-semibold mono uppercase ${tag === "EXPERIMENTAL" ? "bg-[#2C1E06] text-[#FBBF24]" : tag === "FROZEN FOR FINAL TESTING" ? "bg-[#2C1010] text-[#F87171]" : "bg-[#1A1F1B] text-[#94A8BA]"}`}>{tag}</span>}
      </div>
      <button onClick={() => setOn(!on)} className={`w-10 h-5 rounded-full transition-colors relative ${on ? "bg-[#B6FF3B]" : "bg-[#1A1F1B] border border-[#242924]"}`}>
        <span className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all" style={{ left: on ? "calc(100% - 18px)" : "2px" }}/>
      </button>
    </div>
  );
}

function SliderInput({ label, value, min, max, unit, tag }: { label: string; value: number; min: number; max: number; unit?: string; tag?: string }) {
  const [v, setV] = useState(value);
  return (
    <div className="py-3 border-b border-[#1A1F1B] last:border-0">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[19px] text-[#E8EDE9]">{label}</span>
          {tag && <span className={`px-2 py-0.5 rounded-full text-[13px] font-semibold mono uppercase ${tag === "EXPERIMENTAL" ? "bg-[#2C1E06] text-[#FBBF24]" : tag === "FROZEN FOR FINAL TESTING" ? "bg-[#2C1010] text-[#F87171]" : "bg-[#1A1F1B] text-[#94A8BA]"}`}>{tag}</span>}
        </div>
        <span className="mono text-[19px] font-semibold text-[#B6FF3B]">{v}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={(max - min) / 100} value={v} onChange={e => setV(+e.target.value)}
        className="w-full h-1 bg-[#1A1F1B] rounded-full cursor-pointer accent-[#B6FF3B]"/>
    </div>
  );
}

function SettingsContent() {
  return (
    <div className="grid grid-cols-2 gap-5">
      <div className="space-y-5">
        <Card className="p-5">
          <div className="text-[19px] font-semibold text-[#E8EDE9] mb-4">Detection</div>
          <SliderInput label="Confidence Threshold" value={0.90} min={0.5} max={1} unit="" tag="CONFIGURABLE"/>
          <div className="py-3 border-b border-[#1A1F1B]">
            <label className="text-[13px] font-semibold text-[#94A8BA] uppercase tracking-widest block mb-2">Selected Model Version</label>
            <select className="w-full px-3 py-2 rounded-[8px] border border-[#242924] text-[19px] bg-[#0C0F0D] text-[#E8EDE9] focus:outline-none focus:border-[#B6FF3B]">
              <option>XGBoost-v3</option>
              <option>XGBoost-v2</option>
              <option>LightGBM-v1</option>
            </select>
          </div>
          <div className="py-3">
            <label className="text-[13px] font-semibold text-[#94A8BA] uppercase tracking-widest block mb-2">Calibration Profile</label>
            <select className="w-full px-3 py-2 rounded-[8px] border border-[#242924] text-[19px] bg-[#0C0F0D] text-[#E8EDE9] focus:outline-none focus:border-[#B6FF3B]">
              <option>Platt Scaling</option>
              <option>Isotonic Regression</option>
              <option>None</option>
            </select>
          </div>
        </Card>

        <Card className="p-5">
          <div className="text-[19px] font-semibold text-[#E8EDE9] mb-4">Simulation</div>
          <SliderInput label="Default Duration" value={60} min={10} max={300} unit="s" tag="CONFIGURABLE"/>
          <div className="py-3 border-b border-[#1A1F1B]">
            <label className="text-[13px] font-semibold text-[#94A8BA] uppercase tracking-widest block mb-2">Default Intensity</label>
            <div className="flex rounded-[8px] border border-[#242924] overflow-hidden">
              {["Low", "Medium", "High"].map((m, i) => (
                <button key={m} className={`flex-1 py-2 text-[15px] font-medium transition-colors ${i === 1 ? "bg-[#B6FF3B] text-[#0C0F0D]" : "bg-[#0C0F0D] text-[#94A8BA] hover:text-[#94A8BA]"}`}>{m}</button>
              ))}
            </div>
          </div>
          <SliderInput label="Maximum Source Count" value={50} min={1} max={200} tag="CONFIGURABLE"/>
        </Card>
      </div>

      <div className="space-y-5">
        <Card className="p-5">
          <div className="text-[19px] font-semibold text-[#E8EDE9] mb-4">Safe Reuse</div>
          <SliderInput label="High Similarity Threshold" value={0.85} min={0.5} max={1} unit="" tag="EXPERIMENTAL"/>
          <SliderInput label="Partial Similarity Threshold" value={0.70} min={0.3} max={0.9} unit="" tag="EXPERIMENTAL"/>
          <SliderInput label="Minimum Historical Reliability" value={0.75} min={0.3} max={1} unit="" tag="EXPERIMENTAL"/>
          <SliderInput label="Minimum Evidence Count" value={5} min={1} max={50} tag="EXPERIMENTAL"/>
        </Card>

        <Card className="p-5">
          <div className="text-[19px] font-semibold text-[#E8EDE9] mb-4">Response</div>
          <Toggle defaultOn={true} label="Automatic Bounded Response" tag="CONFIGURABLE"/>
          <SliderInput label="Max Source Block Duration" value={300} min={30} max={3600} unit="s" tag="CONFIGURABLE"/>
          <SliderInput label="Max Rate Limit Duration" value={120} min={10} max={600} unit="s" tag="CONFIGURABLE"/>
          <Toggle defaultOn={false} label="Enable Simulated Isolation" tag="EXPERIMENTAL"/>
          <div className="py-3">
            <label className="text-[13px] font-semibold text-[#94A8BA] uppercase tracking-widest block mb-2">Allowlist (CIDR notation)</label>
            <input type="text" defaultValue="10.0.0.1/32, 10.0.0.2/32" className="w-full px-3 py-2 rounded-[8px] border border-[#242924] text-[15px] mono bg-[#0C0F0D] text-[#E8EDE9] focus:outline-none focus:border-[#B6FF3B]"/>
          </div>
        </Card>
      </div>
    </div>
  );
}
