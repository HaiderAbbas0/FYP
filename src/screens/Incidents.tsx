import React, { useState, useMemo, useRef, useEffect } from "react";
import { incidents } from "../data/mock";
import type { Screen } from "../types";

interface Props { onNavigate: (s: Screen) => void; }

const CRIT: Record<string, { bar: string; text: string; bg: string }> = {
  Critical: { bar: "#EF4444", text: "#F87171", bg: "#1C0808" },
  High:     { bar: "#A03030", text: "#C06060", bg: "#160606" },
  Medium:   { bar: "#5A2424", text: "#8A5050", bg: "#120505" },
  Low:      { bar: "#2E1616", text: "#5A3A3A", bg: "#0F0404" },
};
const CRIT_ORDER: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
const CONFIDENCE_THRESHOLD = 90;
const PREVIEW_MAX = 6;

function Hl({ text, q }: { text: string; q: string }) {
  if (!q) return <>{text}</>;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark style={{ background: "#1A2A3A", color: "#94C8E8", borderRadius: 2, padding: "0 2px" }}>
        {text.slice(i, i + q.length)}
      </mark>
      {text.slice(i + q.length)}
    </>
  );
}

function ConfidenceCell({ value }: { value: number }) {
  const low = value < CONFIDENCE_THRESHOLD;
  return (
    <div className="flex items-center gap-1.5">
      {low && (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" title="Below confidence threshold">
          <path d="M5 1L9 8.5H1L5 1Z" stroke="#D97706" strokeWidth="1" strokeLinejoin="round"/>
          <path d="M5 4.5v2" stroke="#D97706" strokeWidth="1" strokeLinecap="round"/>
          <circle cx="5" cy="7.5" r="0.4" fill="#D97706"/>
        </svg>
      )}
      <span className="text-[17px] mono font-semibold" style={{ color: low ? "#D97706" : "#94A8BA" }}>
        {value}%
      </span>
    </div>
  );
}

function RouteOutcomeCell({ route, outcome }: { route: string; outcome: string }) {
  const outcomeColor: Record<string, { text: string }> = {
    SUCCESS: { text: "#4A6A4A" },
    PARTIAL: { text: "#8A6A30" },
    FAILURE: { text: "#8A3A3A" },
    HARMFUL: { text: "#EF4444" },
  };
  const oc = outcomeColor[outcome] ?? { text: "#94A8BA" };
  return (
    <div>
      <div className="flex items-center gap-1.5">
        <span className="text-[13px] mono text-[#94A8BA]">{route}</span>
        <span className="text-[12px] text-[#94A8BA]">→</span>
        <span className="text-[14px] font-medium" style={{ color: oc.text }}>
          {outcome === "SUCCESS" ? "Resolved" : outcome === "PARTIAL" ? "Partial" : outcome === "FAILURE" ? "Failed" : "⚠ Harmful"}
        </span>
      </div>
    </div>
  );
}

function RowActions({ incId }: { incId: string }) {
  return (
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        title="Acknowledge"
        onClick={e => e.stopPropagation()}
        className="flex items-center gap-1 px-2 py-1 text-[13px] rounded-[4px] bg-[#1A1E1B] border border-[#242924] text-[#94A8BA] hover:text-[#4ADE80] hover:border-[#2A3A2A] transition-colors"
      >
        <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
          <path d="M1.5 4.5l2.5 2.5 3.5-4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        ACK
      </button>
      <button
        title="Escalate"
        onClick={e => e.stopPropagation()}
        className="flex items-center gap-1 px-2 py-1 text-[13px] rounded-[4px] bg-[#1A1E1B] border border-[#242924] text-[#94A8BA] hover:text-[#FBBF24] hover:border-[#3A3020] transition-colors"
      >
        <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
          <path d="M4.5 7.5V2M2 4l2.5-2.5L7 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        ESC
      </button>
      <button
        title="Export"
        onClick={e => e.stopPropagation()}
        className="flex items-center gap-1 px-2 py-1 text-[13px] rounded-[4px] bg-[#1A1E1B] border border-[#242924] text-[#94A8BA] hover:text-[#7A8A9A] hover:border-[#2A3040] transition-colors"
      >
        <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
          <path d="M4.5 1v5M2.5 4.5l2 2 2-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M1 7h7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
}

const SAVED_VIEWS = [
  { label: "Critical + unresolved", route: "All", outcome: "PARTIAL", crit: "Critical" },
  { label: "Deep investigations", route: "DEEP", outcome: "All", crit: "All" },
  { label: "Low confidence", route: "All", outcome: "All", crit: "All" },
];

type SortKey = "confidence" | "time" | "criticality";

export default function Incidents({ onNavigate }: Props) {
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [filterRoute, setFilterRoute] = useState("All");
  const [filterOutcome, setFilterOutcome] = useState("All");
  const [filterCrit, setFilterCrit] = useState("All");
  const [sortKey, setSortKey] = useState<SortKey>("time");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [page, setPage] = useState(0);
  const searchWrapRef = useRef<HTMLDivElement>(null);

  const PAGE_SIZE = density === "compact" ? 10 : 6;

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
    else { setSortKey(key); setSortDir(key === "time" ? "desc" : "asc"); }
  }

  const routeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    incidents.forEach(i => { counts[i.route] = (counts[i.route] ?? 0) + 1; });
    return counts;
  }, []);
  const outcomeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    incidents.forEach(i => { counts[i.outcome] = (counts[i.outcome] ?? 0) + 1; });
    return counts;
  }, []);

  // Preview: search all incidents regardless of other active filters
  const previewResults = useMemo(() => {
    if (!search) return [];
    const q = search.toLowerCase();
    return incidents.filter(x =>
      x.id.toLowerCase().includes(q) ||
      x.attack.toLowerCase().includes(q) ||
      x.target.toLowerCase().includes(q) ||
      x.type.toLowerCase().includes(q)
    );
  }, [search]);
  const previewShown = previewResults.slice(0, PREVIEW_MAX);
  const hasMore = previewResults.length > PREVIEW_MAX;

  const filtered = useMemo(() => {
    let d = [...incidents];
    if (search) {
      const q = search.toLowerCase();
      d = d.filter(x =>
        x.id.toLowerCase().includes(q) ||
        x.attack.toLowerCase().includes(q) ||
        x.target.toLowerCase().includes(q) ||
        x.type.toLowerCase().includes(q)
      );
    }
    if (filterRoute !== "All") d = d.filter(x => x.route === filterRoute);
    if (filterOutcome !== "All") d = d.filter(x => x.outcome === filterOutcome);
    if (filterCrit !== "All") d = d.filter(x => x.criticality === filterCrit);
    d.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "confidence") cmp = a.confidence - b.confidence;
      else if (sortKey === "time") cmp = a.time.localeCompare(b.time);
      else if (sortKey === "criticality") cmp = (CRIT_ORDER[a.criticality] ?? 4) - (CRIT_ORDER[b.criticality] ?? 4);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return d;
  }, [search, filterRoute, filterOutcome, filterCrit, sortKey, sortDir]);

  const pageIncidents = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const rowPy = density === "compact" ? "py-2.5" : "py-3.5";

  function selectIncident(inc: typeof incidents[0]) {
    setSearch(inc.id);
    setPage(0);
    setDropdownOpen(false);
  }

  function critBadgeColor(crit: string) {
    const c = CRIT[crit];
    return c ? c.text : "#94A8BA";
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
            placeholder="Search incidents — ID, attack type, target device…"
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
                  </svg>
                  <span className="text-[15px] text-[#94A8BA]">No incidents match <span className="text-[#C8CEC8]">"{search}"</span></span>
                </div>
              ) : (
                <>
                  <div className="px-4 py-2 border-b border-[#131613]">
                    <span className="text-[12px] mono text-[#94A8BA] uppercase tracking-widest">
                      {previewResults.length} incident{previewResults.length !== 1 ? "s" : ""} matching "{search}"
                    </span>
                  </div>
                  {previewShown.map(inc => {
                    const cc = CRIT[inc.criticality] ?? CRIT.Low;
                    return (
                      <button
                        key={inc.id}
                        onMouseDown={e => { e.preventDefault(); selectIncident(inc); }}
                        className="w-full flex items-center gap-4 px-4 py-2.5 hover:bg-[#111411] transition-colors text-left border-b border-[#131613] last:border-b-0"
                      >
                        {/* Crit bar */}
                        <div className="w-[3px] h-9 rounded-full shrink-0" style={{ background: cc.bar }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[14px] mono font-semibold text-[#9D8BF4]">
                              <Hl text={inc.id} q={search} />
                            </span>
                            <span className="text-[12px] font-medium" style={{ color: cc.text }}>{inc.criticality}</span>
                          </div>
                          <div className="text-[15px] text-[#C0C7C0] truncate">
                            <Hl text={inc.attack} q={search} />
                          </div>
                          <div className="text-[13px] mono text-[#94A8BA]">
                            <Hl text={inc.target} q={search} />
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-[13px] mono text-[#94A8BA]">{inc.confidence}%</div>
                          <div className="text-[12px] text-[#94A8BA]">{inc.time}</div>
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
                      <span>View all {previewResults.length} matching incidents</span>
                      <span className="text-[12px] mono">Press Enter →</span>
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* ─── Filter row ─── */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <div className="flex items-center gap-1">
            {(["All", "SHORT", "PARTIAL", "DEEP"] as const).map(r => {
              const active = filterRoute === r;
              const count = r === "All" ? incidents.length : (routeCounts[r] ?? 0);
              return (
                <button
                  key={r}
                  onClick={() => { setFilterRoute(r); setPage(0); }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] text-[14px] font-medium transition-all border ${
                    active ? "bg-[#1A1E1B] text-[#C8CEC8] border-[#2E342E]" : "bg-transparent text-[#94A8BA] border-[#1A1E1B] hover:text-[#94A8BA]"
                  }`}
                >
                  {r}
                  {r !== "All" && (
                    <span className={`text-[12px] rounded px-1 ${active ? "bg-[#2E342E] text-[#94A8BA]" : "bg-[#131613] text-[#94A8BA]"}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="w-px h-4 bg-[#1A1E1B]" />

          <div className="flex items-center gap-1">
            {(["All", "SUCCESS", "PARTIAL", "FAILURE", "HARMFUL"] as const).map(o => {
              const active = filterOutcome === o;
              const count = o === "All" ? incidents.length : (outcomeCounts[o] ?? 0);
              const accentColor = o === "HARMFUL" ? "#EF4444" : o === "FAILURE" ? "#C06060" : undefined;
              return (
                <button
                  key={o}
                  onClick={() => { setFilterOutcome(o); setPage(0); }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] text-[14px] font-medium transition-all border ${
                    active ? "bg-[#1A1E1B] border-[#2E342E]" : "bg-transparent border-[#1A1E1B] hover:text-[#94A8BA]"
                  }`}
                  style={{ color: active && accentColor ? accentColor : active ? "#C8CEC8" : "#94A8BA" }}
                >
                  {o}
                  {o !== "All" && count > 0 && (
                    <span className={`text-[12px] rounded px-1 ${active ? "bg-[#2E342E] text-[#94A8BA]" : "bg-[#131613] text-[#94A8BA]"}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="w-px h-4 bg-[#1A1E1B]" />

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

          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center bg-[#0D100D] border border-[#1A1E1B] rounded-[6px] p-0.5 gap-0.5">
              {(["comfortable", "compact"] as const).map(d => (
                <button key={d} onClick={() => { setDensity(d); setPage(0); }} title={d}
                  className={`px-2 py-1 rounded-[4px] text-[14px] transition-colors ${density === d ? "bg-[#1A1E1B] text-[#C8CEC8]" : "text-[#94A8BA] hover:text-[#94A8BA]"}`}>
                  {d === "comfortable" ? "▥" : "☰"}
                </button>
              ))}
            </div>
            <span className="text-[13px] mono text-[#94A8BA]">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
          </div>
        </div>

        {/* Active filter summary */}
        {(filterRoute !== "All" || filterOutcome !== "All" || filterCrit !== "All" || search) && (
          <div className="flex items-center gap-2 mb-3 text-[13px]">
            <span className="text-[#94A8BA]">Active:</span>
            {search && <span className="bg-[#1A1E1B] text-[#94A8BA] px-2 py-0.5 rounded-[4px]">"{search}"</span>}
            {filterRoute !== "All" && <span className="bg-[#1A1E1B] text-[#94A8BA] px-2 py-0.5 rounded-[4px]">Route: {filterRoute}</span>}
            {filterOutcome !== "All" && <span className="bg-[#1A1E1B] text-[#94A8BA] px-2 py-0.5 rounded-[4px]">Outcome: {filterOutcome}</span>}
            {filterCrit !== "All" && <span className="bg-[#1A1E1B] text-[#94A8BA] px-2 py-0.5 rounded-[4px]">Criticality: {filterCrit}</span>}
            <button onClick={() => { setFilterRoute("All"); setFilterOutcome("All"); setFilterCrit("All"); setSearch(""); }}
              className="text-[#94A8BA] hover:text-[#94A8BA] transition-colors ml-1">Clear all</button>
          </div>
        )}

        {/* ─── Saved views ─── */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[13px] text-[#94A8BA]">Saved views:</span>
          {SAVED_VIEWS.map(v => (
            <button key={v.label}
              onClick={() => { setFilterRoute(v.route); setFilterOutcome(v.outcome); setFilterCrit(v.crit); setPage(0); }}
              className="text-[13px] px-2 py-0.5 border border-[#1A1E1B] text-[#94A8BA] rounded-[4px] hover:border-[#2E342E] hover:text-[#94A8BA] transition-colors">
              {v.label}
            </button>
          ))}
          <button className="text-[13px] text-[#94A8BA] hover:text-[#94A8BA] transition-colors">+ Pin current</button>
        </div>

        {/* ─── Date/Session grouping header ─── */}
        <div className="flex items-center gap-3 mb-3">
          <div className="h-px flex-1 bg-[#1A1E1B]" />
          <span className="text-[13px] mono text-[#94A8BA] whitespace-nowrap">
            TODAY · Sep 6, 2026 · Session 12:55 – 14:32 · {filtered.length} incident{filtered.length !== 1 ? "s" : ""}
          </span>
          <div className="h-px flex-1 bg-[#1A1E1B]" />
        </div>

        {/* ─── Table ─── */}
        <div className="bg-[#0D100D] border border-[#1A1E1B] rounded-[12px] overflow-hidden mb-3">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1A1E1B]">
                <th className="px-4 py-3 text-left text-[13px] font-medium text-[#94A8BA] uppercase tracking-widest w-[110px]">ID</th>
                <th className="px-4 py-3 text-left text-[13px] font-medium text-[#94A8BA] uppercase tracking-widest">Attack</th>
                <th className="px-4 py-3 text-left text-[13px] font-medium text-[#94A8BA] uppercase tracking-widest">Target</th>
                <SortTh label="Criticality" sk="criticality" />
                <SortTh label="Confidence" sk="confidence" />
                <th className="px-4 py-3 text-left text-[13px] font-medium text-[#94A8BA] uppercase tracking-widest">Response</th>
                <SortTh label="Time" sk="time" />
                <th className="px-4 py-3 w-[130px]" />
              </tr>
            </thead>
            <tbody>
              {pageIncidents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-[15px] text-[#94A8BA]">
                    No incidents match the current filters.
                  </td>
                </tr>
              ) : pageIncidents.map(inc => {
                const cc = CRIT[inc.criticality] ?? CRIT.Low;
                const lowConf = inc.confidence < CONFIDENCE_THRESHOLD;
                return (
                  <tr
                    key={inc.id}
                    className="border-b border-[#131613] cursor-pointer transition-colors group hover:bg-[#111411]"
                    style={{ borderLeft: `3px solid ${cc.bar}` }}
                    onClick={() => onNavigate("incident-overview")}
                  >
                    <td className={`px-4 ${rowPy}`}>
                      <div className="text-[14px] mono font-semibold text-[#8A818A] group-hover:text-[#C8BEE8] transition-colors">{inc.id}</div>
                      <div className="text-[12px] mono text-[#94A8BA] mt-0.5">{inc.type}</div>
                    </td>
                    <td className={`px-4 ${rowPy}`}>
                      <div className="text-[18px] text-[#C0C7C0] font-medium">{inc.attack}</div>
                    </td>
                    <td className={`px-4 ${rowPy}`}>
                      <span className="text-[15px] text-[#94A8BA] mono">{inc.target}</span>
                    </td>
                    <td className={`px-4 ${rowPy}`}>
                      <div className="flex items-center gap-1.5">
                        <div className="w-[5px] h-[5px] rounded-full shrink-0" style={{ background: cc.bar }} />
                        <span className="text-[14px] font-medium" style={{ color: cc.text }}>{inc.criticality}</span>
                      </div>
                    </td>
                    <td className={`px-4 ${rowPy}`}>
                      <ConfidenceCell value={inc.confidence} />
                      {lowConf && (
                        <div className="text-[12px] text-[#7A6030] mt-0.5">below threshold</div>
                      )}
                    </td>
                    <td className={`px-4 ${rowPy}`}>
                      <RouteOutcomeCell route={inc.route} outcome={inc.outcome} />
                    </td>
                    <td className={`px-4 ${rowPy}`}>
                      <span className="text-[14px] mono text-[#94A8BA]">{inc.time}</span>
                    </td>
                    <td className={`px-3 ${rowPy}`} onClick={e => e.stopPropagation()}>
                      <RowActions incId={inc.id} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ─── Pagination ─── */}
        <div className="flex items-center justify-between text-[13px] text-[#94A8BA] mono">
          <div className="flex items-center gap-3">
            <span>
              Showing {filtered.length === 0 ? 0 : page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            {filtered.some(i => i.confidence < CONFIDENCE_THRESHOLD) && (
              <span className="flex items-center gap-1 text-[#7A6030]">
                <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                  <path d="M4.5 1L8.5 8H0.5L4.5 1Z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/>
                </svg>
                {filtered.filter(i => i.confidence < CONFIDENCE_THRESHOLD).length} below {CONFIDENCE_THRESHOLD}% confidence
              </span>
            )}
          </div>
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
