import React, { useState, useMemo, useRef, useEffect } from "react";
import { devices } from "../data/mock";
import type { Screen } from "../types";

interface Props { onNavigate: (s: Screen) => void; }

const CRIT: Record<string, { bar: string; text: string; bg: string }> = {
  Critical: { bar: "#EF4444", text: "#F87171", bg: "#1C0808" },
  High:     { bar: "#A03030", text: "#C06060", bg: "#160606" },
  Medium:   { bar: "#5A2424", text: "#8A5050", bg: "#120505" },
  Low:      { bar: "#2E1616", text: "#5A3A3A", bg: "#0F0404" },
};
const CRIT_ORDER: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
const CURRENT: Record<string, number> = { "GW-01": 24, "BR-01": 69, "SN-01": 10, "SN-02": 7 };
const PREVIEW_MAX = 6;

function parseRange(b: string): [number, number] {
  const m = b.match(/(\d+)[–\-](\d+)/);
  return m ? [+m[1], +m[2]] : [0, 100];
}

function Hl({ text, q }: { text: string; q: string }) {
  if (!q) return <>{text}</>;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark style={{ background: "#1A3020", color: "#4ADE80", borderRadius: 2, padding: "0 2px" }}>
        {text.slice(i, i + q.length)}
      </mark>
      {text.slice(i + q.length)}
    </>
  );
}

function BaselineMeter({ id, baseline }: { id: string; baseline: string }) {
  const [lo, hi] = parseRange(baseline);
  const current = CURRENT[id] ?? (lo + hi) / 2;
  const pad = (hi - lo) * 0.5;
  const total = (hi - lo) + pad * 2;
  const offset = lo - pad;
  const pos = Math.min(Math.max(current - offset, 0), total);
  const pct = (pos / total) * 100;
  const bandLeft = (pad / total) * 100;
  const bandWidth = ((hi - lo) / total) * 100;
  const inRange = current >= lo && current <= hi;
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative w-[72px] h-[5px] rounded-full bg-[#131613]">
        <div className="absolute top-0 h-full rounded-full bg-[#1E261E]"
          style={{ left: `${bandLeft}%`, width: `${bandWidth}%` }} />
        <div className="absolute top-1/2 -translate-y-1/2 w-[8px] h-[8px] rounded-full border border-[#0C0F0D] transition-colors"
          style={{ left: `calc(${pct}% - 4px)`, background: inRange ? "#4ADE80" : "#FBBF24" }} />
      </div>
      <span className="text-[13px] mono" style={{ color: inRange ? "#4A6A4A" : "#7A6030" }}>
        {current} <span className="text-[#94A8BA]">/ {lo}–{hi}</span>
      </span>
    </div>
  );
}

function DeviceIcon({ type }: { type: string }) {
  const isGateway = type.includes("Gateway");
  const isBroker = type.includes("Broker");
  return (
    <div className="w-7 h-7 rounded-[6px] bg-[#141814] border border-[#1E241E] flex items-center justify-center shrink-0">
      {isGateway && (
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <rect x="1" y="4" width="11" height="5" rx="1.5" stroke="#94A8BA" strokeWidth="1"/>
          <circle cx="3" cy="6.5" r="0.8" fill="#94A8BA"/>
          <circle cx="5.5" cy="6.5" r="0.8" fill="#94A8BA"/>
          <path d="M8 6h2.5M6.5 2v2M4 2.5v1.5M9 2.5v1.5" stroke="#94A8BA" strokeWidth="0.9" strokeLinecap="round"/>
        </svg>
      )}
      {isBroker && (
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <circle cx="6.5" cy="6.5" r="2" stroke="#94A8BA" strokeWidth="1"/>
          <path d="M6.5 1.5v2M6.5 9.5v2M1.5 6.5h2M9.5 6.5h2" stroke="#94A8BA" strokeWidth="0.9" strokeLinecap="round"/>
          <path d="M3.2 3.2l1.4 1.4M8.4 8.4l1.4 1.4M3.2 9.8l1.4-1.4M8.4 4.6l1.4-1.4" stroke="#94A8BA" strokeWidth="0.9" strokeLinecap="round"/>
        </svg>
      )}
      {!isGateway && !isBroker && (
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <path d="M1.5 6.5C1.5 3.7 3.7 1.5 6.5 1.5S11.5 3.7 11.5 6.5" stroke="#94A8BA" strokeWidth="1" strokeLinecap="round"/>
          <path d="M3.5 6.5C3.5 4.8 4.8 3.5 6.5 3.5S9.5 4.8 9.5 6.5" stroke="#94A8BA" strokeWidth="1" strokeLinecap="round"/>
          <circle cx="6.5" cy="7.5" r="1.3" stroke="#94A8BA" strokeWidth="1"/>
          <path d="M6.5 8.8v2" stroke="#94A8BA" strokeWidth="1" strokeLinecap="round"/>
        </svg>
      )}
    </div>
  );
}

function CritDot({ value }: { value: string }) {
  const c = CRIT[value] ?? CRIT.Low;
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-[5px] h-[5px] rounded-full shrink-0" style={{ background: c.bar }} />
      <span className="text-[14px] font-medium" style={{ color: c.text }}>{value}</span>
    </div>
  );
}

const SAVED_VIEWS = [
  { label: "Critical only", crit: "Critical", status: "All" },
  { label: "Offline", crit: "All", status: "Offline" },
  { label: "High & above", crit: "High", status: "All" },
];

type SortKey = "criticality" | "name" | "status";

export default function Devices({ onNavigate }: Props) {
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("criticality");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [filterCrit, setFilterCrit] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [page, setPage] = useState(0);
  const searchWrapRef = useRef<HTMLDivElement>(null);

  const PAGE_SIZE = density === "compact" ? 8 : 5;

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }

  // Preview results: search all devices regardless of active filters
  const previewResults = useMemo(() => {
    if (!search) return [];
    const q = search.toLowerCase();
    return devices.filter(x =>
      x.name.toLowerCase().includes(q) ||
      x.id.toLowerCase().includes(q) ||
      x.type.toLowerCase().includes(q) ||
      x.ip.includes(q)
    );
  }, [search]);
  const previewShown = previewResults.slice(0, PREVIEW_MAX);
  const hasMore = previewResults.length > PREVIEW_MAX;

  const filtered = useMemo(() => {
    let d = [...devices];
    if (search) {
      const q = search.toLowerCase();
      d = d.filter(x =>
        x.name.toLowerCase().includes(q) ||
        x.id.toLowerCase().includes(q) ||
        x.type.toLowerCase().includes(q) ||
        x.ip.includes(q)
      );
    }
    if (filterCrit !== "All") d = d.filter(x => x.criticality === filterCrit);
    if (filterStatus !== "All") d = d.filter(x => x.status === filterStatus);
    d.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "criticality") cmp = (CRIT_ORDER[a.criticality] ?? 4) - (CRIT_ORDER[b.criticality] ?? 4);
      else if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "status") cmp = a.status.localeCompare(b.status);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return d;
  }, [search, filterCrit, filterStatus, sortKey, sortDir]);

  const pageDevices = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const rowPy = density === "compact" ? "py-2.5" : "py-4";

  function selectDevice(d: typeof devices[0]) {
    setSearch(d.id);
    setPage(0);
    setDropdownOpen(false);
  }

  function SortTh({ label, sk, className = "" }: { label: string; sk: SortKey; className?: string }) {
    const active = sortKey === sk;
    return (
      <th className={`px-4 py-3 text-left ${className}`}>
        <button
          className="flex items-center gap-1 text-[13px] font-medium uppercase tracking-widest transition-colors"
          style={{ color: active ? "#C0C7C0" : "#94A8BA" }}
          onClick={() => handleSort(sk)}
        >
          {label}
          <span className="text-[12px] opacity-70 ml-0.5">
            {active ? (sortDir === "asc" ? "↑" : "↓") : "⇅"}
          </span>
        </button>
      </th>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-[#0C0F0D]">
      <div className="max-w-[1440px] mx-auto px-8 py-6 fade-in">

        {/* ─── Topology panel ─── */}
        <div className="bg-[#0D100D] border border-[#1A1E1B] rounded-[12px] px-6 pt-4 pb-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[13px] mono text-[#94A8BA] uppercase tracking-widest">Network Topology · IoMT Testbed</span>
            <span className="text-[13px] text-[#94A8BA]">4 registered · 4 online</span>
          </div>
          <div className="flex items-start gap-0">
            <div className="flex flex-col items-center">
              <div className="bg-[#150606] border border-[#3A1010] rounded-[8px] px-3.5 py-2.5 flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-[#22C55E] shrink-0" />
                <div>
                  <div className="text-[17px] font-semibold text-[#C8CEC8]">Gateway-01</div>
                  <div className="text-[12px] mono text-[#EF4444] mt-0.5">CRITICAL · Core network</div>
                </div>
              </div>
              <div className="w-px h-4 bg-[#1E241E]" />
            </div>
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 w-px bg-[#1E241E]" style={{ height: "calc(100% - 18px)", top: 0 }} />
            </div>
            <div className="border-l border-[#1E241E] pl-0 ml-0">
              {[
                { name: "Broker-01", id: "BR-01", crit: "HIGH", role: "MQTT Broker", barColor: "#A03030" },
                { name: "Sensor-01", id: "SN-01", crit: "MED", role: "Medical Sensor", barColor: "#5A2424" },
                { name: "Sensor-02", id: "SN-02", crit: "LOW", role: "Medical Sensor", barColor: "#2E1616" },
              ].map((n, i, arr) => (
                <div key={n.id} className="flex items-center">
                  <div className="flex items-center">
                    <div className="w-5 h-px bg-[#1E241E]" />
                  </div>
                  <div className={`bg-[#0F120F] border border-[#1E241E] rounded-[6px] px-3 py-1.5 flex items-center gap-2 ${i < arr.length - 1 ? "mb-2" : ""}`}>
                    <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E] shrink-0" />
                    <span className="text-[14px] text-[#94A8BA] font-medium">{n.name}</span>
                    <span className="text-[12px] mono" style={{ color: CRIT[n.crit === "HIGH" ? "High" : n.crit === "MED" ? "Medium" : "Low"]?.text }}>{n.crit}</span>
                    <span className="text-[12px] text-[#94A8BA]">· {n.role}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Search bar with live dropdown ─── */}
        <div className="relative mb-3" ref={searchWrapRef}>
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" width="13" height="13" viewBox="0 0 13 13" fill="none">
            <circle cx="5.5" cy="5.5" r="4" stroke="#4A5249" strokeWidth="1.2" />
            <path d="M9 9l2.5 2.5" stroke="#4A5249" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); setDropdownOpen(true); }}
            onFocus={() => { if (search) setDropdownOpen(true); }}
            onKeyDown={e => {
              if (e.key === "Enter") { setDropdownOpen(false); }
              if (e.key === "Escape") { setSearch(""); setDropdownOpen(false); }
            }}
            placeholder="Search by device name, ID, type, or IP address…"
            className="w-full pl-9 pr-9 py-2.5 bg-[#0D100D] border border-[#1A1E1B] rounded-[8px] text-[17px] text-[#C8CEC8] placeholder:text-[#94A8BA] focus:outline-none focus:border-[#2E342E] transition-colors"
          />
          {search && (
            <button
              onMouseDown={e => { e.preventDefault(); setSearch(""); setDropdownOpen(false); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A8BA] hover:text-[#C8CEC8] transition-colors text-[15px]"
            >✕</button>
          )}

          {/* Live search dropdown */}
          {dropdownOpen && search && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-[#0D100D] border border-[#1A1E1B] rounded-[10px] shadow-2xl overflow-hidden">
              {previewShown.length === 0 ? (
                <div className="px-4 py-4 flex items-center gap-3">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="7" cy="7" r="5" stroke="#94A8BA" strokeWidth="1.2"/>
                    <path d="M11 11l3 3" stroke="#94A8BA" strokeWidth="1.2" strokeLinecap="round"/>
                    <path d="M5 9l2-2 2 2M7 7V5" stroke="#4A5249" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-[15px] text-[#94A8BA]">No devices match <span className="text-[#C8CEC8]">"{search}"</span></span>
                </div>
              ) : (
                <>
                  <div className="px-4 py-2 border-b border-[#131613]">
                    <span className="text-[12px] mono text-[#94A8BA] uppercase tracking-widest">
                      {previewResults.length} device{previewResults.length !== 1 ? "s" : ""} matching "{search}"
                    </span>
                  </div>
                  {previewShown.map(d => {
                    const cc = CRIT[d.criticality] ?? CRIT.Low;
                    return (
                      <button
                        key={d.id}
                        onMouseDown={e => { e.preventDefault(); selectDevice(d); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#111411] transition-colors text-left border-b border-[#131613] last:border-b-0"
                      >
                        <DeviceIcon type={d.type} />
                        <div className="flex-1 min-w-0">
                          <div className="text-[15px] font-semibold text-[#C8CEC8]">
                            <Hl text={d.name} q={search} />
                          </div>
                          <div className="text-[13px] mono text-[#94A8BA]">
                            <Hl text={d.id} q={search} /> · <Hl text={d.type} q={search} />
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-[13px] font-medium" style={{ color: cc.text }}>{d.criticality}</div>
                          <div className="text-[12px] mono text-[#94A8BA]">
                            <Hl text={d.ip} q={search} />
                          </div>
                        </div>
                        <svg width="9" height="9" viewBox="0 0 9 9" fill="none" className="text-[#94A8BA] shrink-0">
                          <path d="M3.5 2l4 3.5-4 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    );
                  })}
                  {hasMore && (
                    <button
                      onMouseDown={e => { e.preventDefault(); setPage(0); setDropdownOpen(false); }}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-[14px] text-[#94A8BA] border-t border-[#1A1E1B] hover:bg-[#111411] transition-colors"
                    >
                      <span>View all {previewResults.length} matching devices</span>
                      <span className="text-[12px] mono">Press Enter →</span>
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* ─── Filters + controls row ─── */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <div className="flex items-center gap-1">
            {(["All", "Critical", "High", "Medium", "Low"] as const).map(c => {
              const active = filterCrit === c;
              const cc = c !== "All" ? CRIT[c] : null;
              return (
                <button
                  key={c}
                  onClick={() => { setFilterCrit(c); setPage(0); }}
                  className="px-2.5 py-1.5 rounded-[6px] text-[14px] font-medium transition-all border"
                  style={{
                    background: active && cc ? cc.bg : active ? "#1A1E1B" : "transparent",
                    color: active && cc ? cc.text : active ? "#C8CEC8" : "#94A8BA",
                    borderColor: active && cc ? cc.bar + "55" : "#1A1E1B",
                  }}
                >
                  {c}
                </button>
              );
            })}
          </div>
          <div className="w-px h-4 bg-[#1A1E1B] mx-1" />
          <div className="flex items-center gap-1">
            {["All", "Online", "Offline"].map(s => (
              <button
                key={s}
                onClick={() => { setFilterStatus(s); setPage(0); }}
                className={`px-2.5 py-1.5 rounded-[6px] text-[14px] font-medium transition-all border ${
                  filterStatus === s
                    ? "bg-[#1A1E1B] text-[#C8CEC8] border-[#2E342E]"
                    : "bg-transparent text-[#94A8BA] border-[#1A1E1B] hover:text-[#94A8BA]"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center bg-[#0D100D] border border-[#1A1E1B] rounded-[6px] p-0.5 gap-0.5">
              {(["comfortable", "compact"] as const).map(d => (
                <button
                  key={d}
                  onClick={() => { setDensity(d); setPage(0); }}
                  title={d}
                  className={`px-2 py-1 rounded-[4px] text-[14px] transition-colors ${density === d ? "bg-[#1A1E1B] text-[#C8CEC8]" : "text-[#94A8BA] hover:text-[#94A8BA]"}`}
                >
                  {d === "comfortable" ? "▥" : "☰"}
                </button>
              ))}
            </div>
            <span className="text-[13px] mono text-[#94A8BA]">{filtered.length} device{filtered.length !== 1 ? "s" : ""}</span>
          </div>
        </div>

        {/* ─── Saved views ─── */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[13px] text-[#94A8BA]">Saved views:</span>
          {SAVED_VIEWS.map(v => (
            <button
              key={v.label}
              onClick={() => { setFilterCrit(v.crit); setFilterStatus(v.status); setPage(0); }}
              className="text-[13px] px-2 py-0.5 border border-[#1A1E1B] text-[#94A8BA] rounded-[4px] hover:border-[#2E342E] hover:text-[#94A8BA] transition-colors"
            >
              {v.label}
            </button>
          ))}
          <button className="text-[13px] text-[#94A8BA] hover:text-[#94A8BA] transition-colors">+ Pin current</button>
        </div>

        {/* ─── Table ─── */}
        <div className="bg-[#0D100D] border border-[#1A1E1B] rounded-[12px] overflow-hidden mb-3">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1A1E1B]">
                <th className="px-4 py-3 w-10" />
                <SortTh label="Device" sk="name" />
                <th className="px-4 py-3 text-left text-[13px] font-medium text-[#94A8BA] uppercase tracking-widest">Role</th>
                <SortTh label="Criticality" sk="criticality" />
                <th className="px-4 py-3 text-left text-[13px] font-medium text-[#94A8BA] uppercase tracking-widest">IP / ID</th>
                <th className="px-4 py-3 text-left text-[13px] font-medium text-[#94A8BA] uppercase tracking-widest">Protocol</th>
                <th className="px-4 py-3 text-left text-[13px] font-medium text-[#94A8BA] uppercase tracking-widest">Baseline · Current</th>
                <SortTh label="Status" sk="status" />
                <th className="px-3 py-3 w-8" />
              </tr>
            </thead>
            <tbody>
              {pageDevices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-10 text-center text-[15px] text-[#94A8BA]">
                    No devices match the current filters.
                  </td>
                </tr>
              ) : pageDevices.map(d => {
                const cc = CRIT[d.criticality] ?? CRIT.Low;
                return (
                  <tr
                    key={d.id}
                    className="border-b border-[#131613] cursor-pointer transition-colors group hover:bg-[#111411]"
                    style={{ borderLeft: `3px solid ${cc.bar}` }}
                    onClick={() => onNavigate("device-detail")}
                  >
                    <td className={`pl-3 pr-2 ${rowPy}`}><DeviceIcon type={d.type} /></td>
                    <td className={`px-4 ${rowPy}`}>
                      <div className="text-[19px] font-semibold text-[#C8CEC8] group-hover:text-[#E8EDE9] transition-colors">{d.name}</div>
                      <div className="text-[13px] mono text-[#94A8BA] mt-0.5">{d.id}</div>
                    </td>
                    <td className={`px-4 ${rowPy}`}><span className="text-[15px] text-[#94A8BA]">{d.type}</span></td>
                    <td className={`px-4 ${rowPy}`}><CritDot value={d.criticality} /></td>
                    <td className={`px-4 ${rowPy}`}><span className="text-[14px] mono text-[#94A8BA]">{d.ip}</span></td>
                    <td className={`px-4 ${rowPy}`}><span className="text-[14px] mono text-[#94A8BA]">{d.protocol}</span></td>
                    <td className={`px-4 ${rowPy}`}><BaselineMeter id={d.id} baseline={d.baseline} /></td>
                    <td className={`px-4 ${rowPy}`}>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${d.status === "Online" ? "bg-[#22C55E]" : "bg-[#EF4444]"}`} />
                        <span className={`text-[15px] ${d.status === "Online" ? "text-[#4A6A4A]" : "text-[#EF4444]"}`}>{d.status}</span>
                      </div>
                    </td>
                    <td className={`px-3 ${rowPy} text-[#94A8BA] group-hover:text-[#94A8BA] transition-colors`}>
                      <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                        <path d="M3.5 2l4 3.5-4 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ─── Pagination ─── */}
        <div className="flex items-center justify-between text-[13px] text-[#94A8BA] mono">
          <span>
            Showing {filtered.length === 0 ? 0 : page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                className="px-2 py-1 border border-[#1A1E1B] rounded-[4px] disabled:opacity-30 hover:border-[#2E342E] transition-colors">←</button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button key={i} onClick={() => setPage(i)}
                  className={`px-2 py-1 border rounded-[4px] transition-colors ${page === i ? "border-[#2E342E] text-[#C8CEC8]" : "border-[#1A1E1B] hover:border-[#2E342E]"}`}>{i + 1}</button>
              ))}
              <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
                className="px-2 py-1 border border-[#1A1E1B] rounded-[4px] disabled:opacity-30 hover:border-[#2E342E] transition-colors">→</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
