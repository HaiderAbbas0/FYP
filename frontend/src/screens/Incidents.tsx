import React, { useState, useMemo, useRef, useEffect } from "react";
import { incidents } from "../data/mock";
import { acknowledgeIncident, escalateIncident } from "../api/apiService";
import ConfirmDialog from "../components/ConfirmDialog";
import type { Screen } from "../types";

interface Props { onNavigate: (s: Screen) => void; }

/* ── Severity & status helpers ───────────────────────────────────── */
function sevStyle(crit: string) {
  if (crit === "Critical") return { bg: "rgba(245,56,56,0.12)", text: "#F87171", bar: "#F53838", border: "rgba(245,56,56,0.3)" };
  if (crit === "High")     return { bg: "rgba(232,101,12,0.12)", text: "#FB923C", bar: "#E8650C", border: "rgba(232,101,12,0.3)" };
  if (crit === "Medium")   return { bg: "rgba(232,194,12,0.1)",  text: "#FBBF24", bar: "#E8C20C", border: "rgba(232,194,12,0.25)" };
  return                          { bg: "rgba(12,184,107,0.1)",  text: "#4ADE80", bar: "#0CB86B", border: "rgba(12,184,107,0.25)" };
}

function statusStyle(status: string) {
  if (status === "Investigating") return { bg: "rgba(245,56,56,0.1)",   color: "#F87171", label: "Investigating" };
  if (status === "Escalated")     return { bg: "rgba(240,160,32,0.12)", color: "#F0A020", label: "Escalated" };
  if (status === "Resolved")      return { bg: "rgba(28,201,112,0.1)",  color: "#1CC970", label: "Resolved" };
  if (status === "New")           return { bg: "rgba(12,154,232,0.1)",  color: "#0C9AE8", label: "New" };
  return                                 { bg: "rgba(78,130,160,0.1)", color: "#8EA5B0", label: status };
}

function routeStyle(route: string) {
  if (route === "SHORT")   return { color: "#1CC970", label: "Short" };
  if (route === "PARTIAL") return { color: "#F0A020", label: "Partial" };
  if (route === "DEEP")    return { color: "#8B72F0", label: "Deep" };
  return                          { color: "var(--text-2)", label: route };
}

function outcomeStyle(outcome: string) {
  if (outcome === "SUCCESS") return { color: "#1CC970", label: "Resolved" };
  if (outcome === "PARTIAL") return { color: "#F0A020", label: "Partial" };
  if (outcome === "FAILURE") return { color: "#F53838", label: "Failed" };
  if (outcome === "HARMFUL") return { color: "#F53838", label: "⚠ Harmful" };
  return                            { color: "var(--text-2)", label: outcome };
}

/* ── Search highlight ─────────────────────────────────────────────── */
function Hl({ text, q }: { text: string; q: string }) {
  if (!q) return <>{text}</>;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark style={{ background: "rgba(168,255,53,0.15)", color: "#A8FF35", borderRadius: 2, padding: "0 2px" }}>
        {text.slice(i, i + q.length)}
      </mark>
      {text.slice(i + q.length)}
    </>
  );
}

/* ── Row actions ────────────────────────────────────────────────────── */
function RowActions({ incId }: { incId: string }) {
  const [ackOpen, setAckOpen]   = useState(false);
  const [escOpen, setEscOpen]   = useState(false);
  const [ackDone, setAckDone]   = useState(false);
  const [escDone, setEscDone]   = useState(false);
  const [loading, setLoading]   = useState(false);

  async function handleAck() {
    setLoading(true);
    await acknowledgeIncident(incId, "Acknowledged by analyst");
    setLoading(false);
    setAckOpen(false);
    setAckDone(true);
  }
  async function handleEsc() {
    setLoading(true);
    await escalateIncident(incId, "Escalated for senior review");
    setLoading(false);
    setEscOpen(false);
    setEscDone(true);
  }

  return (
    <>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          title={ackDone ? "Acknowledged" : "Acknowledge incident"}
          disabled={ackDone}
          onClick={e => { e.stopPropagation(); setAckOpen(true); }}
          className="flex items-center gap-1 px-2 py-1 text-[11px] rounded-[4px] border transition-all disabled:opacity-50 mono"
          style={{
            background: ackDone ? "rgba(28,201,112,0.1)" : "var(--surface-3)",
            borderColor: ackDone ? "rgba(28,201,112,0.3)" : "var(--border-2)",
            color: ackDone ? "#1CC970" : "var(--text-3)",
          }}
        >
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
            <path d="M1.5 4.5l2.5 2.5 3.5-4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {ackDone ? "ACK'd" : "ACK"}
        </button>
        <button
          title={escDone ? "Escalated" : "Escalate to senior analyst"}
          disabled={escDone}
          onClick={e => { e.stopPropagation(); setEscOpen(true); }}
          className="flex items-center gap-1 px-2 py-1 text-[11px] rounded-[4px] border transition-all disabled:opacity-50 mono"
          style={{
            background: escDone ? "rgba(240,160,32,0.1)" : "var(--surface-3)",
            borderColor: escDone ? "rgba(240,160,32,0.3)" : "var(--border-2)",
            color: escDone ? "#F0A020" : "var(--text-3)",
          }}
        >
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
            <path d="M4.5 7.5V2M2 4l2.5-2.5L7 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {escDone ? "ESC'd" : "ESC"}
        </button>
      </div>

      <ConfirmDialog
        open={ackOpen}
        title={`Acknowledge ${incId}`}
        variant="info"
        confirmLabel={loading ? "Acknowledging…" : "Acknowledge"}
        cancelLabel="Cancel"
        description={`Confirm you have reviewed incident ${incId}. This action will be recorded in the Audit Log.`}
        onConfirm={handleAck}
        onCancel={() => setAckOpen(false)}
      />
      <ConfirmDialog
        open={escOpen}
        title={`Escalate ${incId}`}
        variant="warning"
        confirmLabel={loading ? "Escalating…" : "Escalate"}
        cancelLabel="Cancel"
        description={`Escalate incident ${incId} to a senior analyst or administrator. This action will be recorded in the Audit Log.`}
        onConfirm={handleEsc}
        onCancel={() => setEscOpen(false)}
      />
    </>
  );
}

type SortKey = "confidence" | "time" | "criticality";
const CRIT_ORDER: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
const PAGE_SIZE = 8;

const SAVED_VIEWS = [
  { label: "Active incidents",      status: "Investigating", crit: "All", route: "All", outcome: "All" },
  { label: "Critical unresolved",   status: "All",           crit: "Critical", route: "All", outcome: "All" },
  { label: "Deep investigations",   status: "All",           crit: "All", route: "DEEP", outcome: "All" },
];

export default function Incidents({ onNavigate }: Props) {
  const [search, setSearch]             = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [filterCrit, setFilterCrit]     = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterRoute, setFilterRoute]   = useState("All");
  const [filterOutcome, setFilterOutcome] = useState("All");
  const [sortKey, setSortKey]           = useState<SortKey>("time");
  const [sortDir, setSortDir]           = useState<"asc" | "desc">("desc");
  const [page, setPage]                 = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
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

  // Quick search preview
  const previewResults = useMemo(() => {
    if (!search) return [];
    const q = search.toLowerCase();
    return incidents.filter(x =>
      x.id.toLowerCase().includes(q) ||
      x.attack.toLowerCase().includes(q) ||
      x.target.toLowerCase().includes(q) ||
      x.type.toLowerCase().includes(q)
    ).slice(0, 5);
  }, [search]);

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
    if (filterCrit !== "All")    d = d.filter(x => x.criticality === filterCrit);
    if (filterStatus !== "All")  d = d.filter(x => x.status === filterStatus);
    if (filterRoute !== "All")   d = d.filter(x => x.route === filterRoute);
    if (filterOutcome !== "All") d = d.filter(x => x.outcome === filterOutcome);
    d.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "confidence")  cmp = a.confidence - b.confidence;
      else if (sortKey === "time")   cmp = a.time.localeCompare(b.time);
      else if (sortKey === "criticality") cmp = (CRIT_ORDER[a.criticality] ?? 4) - (CRIT_ORDER[b.criticality] ?? 4);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return d;
  }, [search, filterCrit, filterStatus, filterRoute, filterOutcome, sortKey, sortDir]);

  const pageItems = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const hasActiveFilters = filterCrit !== "All" || filterStatus !== "All" || filterRoute !== "All" || filterOutcome !== "All" || search;

  function clearFilters() {
    setFilterCrit("All");
    setFilterStatus("All");
    setFilterRoute("All");
    setFilterOutcome("All");
    setSearch("");
    setPage(0);
  }

  function SortTh({ label, sk }: { label: string; sk: SortKey }) {
    const isActive = sortKey === sk;
    return (
      <th className="px-4 py-2.5 text-left">
        <button
          className="flex items-center gap-1 text-[11px] font-semibold mono uppercase tracking-widest transition-colors"
          style={{ color: isActive ? "var(--text)" : "var(--text-3)" }}
          onClick={() => handleSort(sk)}
        >
          {label}
          <span className="text-[10px] opacity-60 ml-0.5">
            {isActive ? (sortDir === "asc" ? "↑" : "↓") : "⇅"}
          </span>
        </button>
      </th>
    );
  }

  return (
    <div className="h-full overflow-y-auto fade-in" style={{ background: "var(--bg)" }}>
      <div className="px-6 py-5 max-w-[1440px] mx-auto">

        {/* ─── Page header ─── */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-[20px] font-bold" style={{ color: "var(--text)" }}>Incidents</h1>
            <p className="text-[13px] mt-0.5" style={{ color: "var(--text-3)" }}>
              Security incidents detected on this session · Demonstration data
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="text-[12px] mono px-2.5 py-1 rounded-[6px]"
              style={{ background: "var(--surface-2)", color: "var(--text-3)", border: "1px solid var(--border)" }}
            >
              {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* ─── Search with live dropdown ─── */}
        <div className="relative mb-3" ref={searchRef}>
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4.5" stroke="var(--text-3)" strokeWidth="1.2"/>
            <path d="M10 10l2.5 2.5" stroke="var(--text-3)" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); setDropdownOpen(true); }}
            onFocus={() => { if (search) setDropdownOpen(true); }}
            onKeyDown={e => {
              if (e.key === "Enter") setDropdownOpen(false);
              if (e.key === "Escape") { setSearch(""); setDropdownOpen(false); }
            }}
            placeholder="Search incidents — ID, attack type, target device…"
            className="w-full pl-10 pr-9 py-2.5 text-[13px] transition-colors"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              color: "var(--text)",
              outline: "none",
            }}
            onFocus={e => (e.currentTarget.style.borderColor = "var(--border-3)")}
            onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
          />
          {search && (
            <button
              onMouseDown={e => { e.preventDefault(); setSearch(""); setDropdownOpen(false); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors text-[14px]"
              style={{ color: "var(--text-3)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--text-2)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--text-3)")}
            >
              ✕
            </button>
          )}

          {/* Live search dropdown */}
          {dropdownOpen && search && (
            <div
              className="absolute top-full left-0 right-0 z-50 mt-1 rounded-[10px] shadow-2xl overflow-hidden"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border-2)" }}
            >
              {previewResults.length === 0 ? (
                <div className="px-4 py-4 text-[13px]" style={{ color: "var(--text-3)" }}>
                  No incidents match "{search}"
                </div>
              ) : (
                <>
                  <div
                    className="px-4 py-2 border-b text-[11px] mono uppercase tracking-widest"
                    style={{ borderColor: "var(--border)", color: "var(--text-3)" }}
                  >
                    {previewResults.length} match{previewResults.length !== 1 ? "es" : ""}
                  </div>
                  {previewResults.map(inc => {
                    const sv = sevStyle(inc.criticality);
                    return (
                      <button
                        key={inc.id}
                        onMouseDown={e => { e.preventDefault(); setSearch(inc.id); setDropdownOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left border-b last:border-b-0 transition-colors"
                        style={{ borderColor: "var(--border)" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-3)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      >
                        <div className="w-1 h-9 rounded-full shrink-0" style={{ background: sv.bar }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] mono font-semibold" style={{ color: "var(--text)" }}>
                              <Hl text={inc.id} q={search} />
                            </span>
                            <span className="badge" style={{ background: sv.bg, color: sv.text, borderColor: sv.border }}>
                              {inc.criticality}
                            </span>
                          </div>
                          <div className="text-[12px] truncate mt-0.5" style={{ color: "var(--text-2)" }}>
                            <Hl text={inc.attack} q={search} />
                          </div>
                          <div className="text-[11px] mono" style={{ color: "var(--text-3)" }}>
                            <Hl text={inc.target} q={search} />
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-[12px] mono" style={{ color: "var(--text-3)" }}>{inc.confidence}%</div>
                          <div className="text-[11px]" style={{ color: "var(--text-3)" }}>{inc.time}</div>
                        </div>
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </div>

        {/* ─── Filters ─── */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {/* Severity filters */}
          <div className="flex items-center gap-1">
            {(["All", "Critical", "High", "Medium", "Low"] as const).map(c => {
              const sv = c !== "All" ? sevStyle(c) : null;
              return (
                <button
                  key={c}
                  onClick={() => { setFilterCrit(c); setPage(0); }}
                  className="filter-chip"
                  style={{
                    background: filterCrit === c && sv ? sv.bg : filterCrit === c ? "var(--surface-3)" : "transparent",
                    color: filterCrit === c && sv ? sv.text : filterCrit === c ? "var(--text)" : "var(--text-3)",
                    borderColor: filterCrit === c && sv ? sv.border : filterCrit === c ? "var(--border-2)" : "var(--border)",
                  }}
                >
                  {c}
                </button>
              );
            })}
          </div>

          <div className="w-px h-4" style={{ background: "var(--border)" }} />

          {/* Status filters */}
          <div className="flex items-center gap-1">
            {(["All", "Investigating", "Escalated", "Resolved"] as const).map(s => {
              const ss = s !== "All" ? statusStyle(s) : null;
              return (
                <button
                  key={s}
                  onClick={() => { setFilterStatus(s); setPage(0); }}
                  className="filter-chip"
                  style={{
                    background: filterStatus === s && ss ? ss.bg : filterStatus === s ? "var(--surface-3)" : "transparent",
                    color: filterStatus === s && ss ? ss.color : filterStatus === s ? "var(--text)" : "var(--text-3)",
                    borderColor: filterStatus === s ? "var(--border-2)" : "var(--border)",
                  }}
                >
                  {s}
                </button>
              );
            })}
          </div>

          <div className="w-px h-4" style={{ background: "var(--border)" }} />

          {/* Route filters */}
          <div className="flex items-center gap-1">
            {(["All", "SHORT", "PARTIAL", "DEEP"] as const).map(r => (
              <button
                key={r}
                onClick={() => { setFilterRoute(r); setPage(0); }}
                className="filter-chip mono"
                style={{
                  background: filterRoute === r ? "var(--surface-3)" : "transparent",
                  color: filterRoute === r ? "var(--text)" : "var(--text-3)",
                  borderColor: filterRoute === r ? "var(--border-2)" : "var(--border)",
                }}
              >
                {r === "All" ? "All routes" : r}
              </button>
            ))}
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="ml-auto text-[12px] px-2.5 py-1 rounded-[6px] border transition-colors"
              style={{ color: "var(--text-3)", borderColor: "var(--border)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--text-2)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--text-3)")}
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Saved views */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[12px]" style={{ color: "var(--text-3)" }}>Quick views:</span>
          {SAVED_VIEWS.map(v => (
            <button
              key={v.label}
              onClick={() => {
                setFilterStatus(v.status);
                setFilterCrit(v.crit);
                setFilterRoute(v.route);
                setFilterOutcome(v.outcome);
                setPage(0);
              }}
              className="text-[12px] px-2.5 py-1 rounded-[6px] border transition-all"
              style={{ borderColor: "var(--border)", color: "var(--text-3)" }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-3)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--text-2)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--text-3)";
              }}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* Active filter pills */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 mb-3 text-[12px]">
            <span style={{ color: "var(--text-3)" }}>Active:</span>
            {search && (
              <span className="px-2 py-0.5 rounded-[4px]" style={{ background: "var(--surface-2)", color: "var(--text-2)", border: "1px solid var(--border)" }}>
                "{search}"
              </span>
            )}
            {filterCrit !== "All" && (
              <span className="px-2 py-0.5 rounded-[4px]" style={{ background: "var(--surface-2)", color: "var(--text-2)", border: "1px solid var(--border)" }}>
                Severity: {filterCrit}
              </span>
            )}
            {filterStatus !== "All" && (
              <span className="px-2 py-0.5 rounded-[4px]" style={{ background: "var(--surface-2)", color: "var(--text-2)", border: "1px solid var(--border)" }}>
                Status: {filterStatus}
              </span>
            )}
            {filterRoute !== "All" && (
              <span className="px-2 py-0.5 rounded-[4px]" style={{ background: "var(--surface-2)", color: "var(--text-2)", border: "1px solid var(--border)" }}>
                Route: {filterRoute}
              </span>
            )}
          </div>
        )}

        {/* ─── Incidents table ─── */}
        <div
          className="overflow-hidden mb-3"
          style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)" }}
        >
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold mono uppercase tracking-widest w-[110px]" style={{ color: "var(--text-3)" }}>ID</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold mono uppercase tracking-widest" style={{ color: "var(--text-3)" }}>Attack</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold mono uppercase tracking-widest" style={{ color: "var(--text-3)" }}>Target</th>
                <SortTh label="Severity" sk="criticality" />
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold mono uppercase tracking-widest" style={{ color: "var(--text-3)" }}>Status</th>
                <SortTh label="Confidence" sk="confidence" />
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold mono uppercase tracking-widest" style={{ color: "var(--text-3)" }}>Route</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold mono uppercase tracking-widest" style={{ color: "var(--text-3)" }}>Outcome</th>
                <SortTh label="Time" sk="time" />
                <th className="px-4 py-2.5 w-[110px]" />
              </tr>
            </thead>
            <tbody>
              {pageItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-5 py-12 text-center text-[14px]" style={{ color: "var(--text-3)" }}>
                    <div>No incidents match the current filters.</div>
                    <button
                      onClick={clearFilters}
                      className="mt-2 text-[13px] underline transition-colors"
                      style={{ color: "var(--text-3)" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "var(--text-2)")}
                      onMouseLeave={e => (e.currentTarget.style.color = "var(--text-3)")}
                    >
                      Clear filters
                    </button>
                  </td>
                </tr>
              ) : pageItems.map((inc, i) => {
                const sv = sevStyle(inc.criticality);
                const st = statusStyle(inc.status);
                const rt = routeStyle(inc.route);
                const out = outcomeStyle(inc.outcome);
                const lowConf = inc.confidence < 90;

                return (
                  <tr
                    key={inc.id}
                    className="border-b cursor-pointer transition-colors group"
                    style={{
                      borderColor: "var(--border)",
                      borderLeft: `3px solid ${sv.bar}`,
                      borderBottom: i < pageItems.length - 1 ? `1px solid var(--border)` : "none",
                    }}
                    onClick={() => onNavigate("incident-overview")}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-2)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <td className="px-4 py-3">
                      <div className="text-[13px] mono font-semibold" style={{ color: "var(--text)" }}>{inc.id}</div>
                      <div className="text-[11px] mono mt-0.5" style={{ color: "var(--text-3)" }}>{inc.type}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-[13px] font-medium" style={{ color: "var(--text-2)" }}>{inc.attack}</div>
                    </td>
                    <td className="px-4 py-3 mono text-[12px]" style={{ color: "var(--text-3)" }}>
                      {inc.target}
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge" style={{ background: sv.bg, color: sv.text, borderColor: sv.border }}>
                        <span className="w-1 h-1 rounded-full" style={{ background: sv.bar }} />
                        {inc.criticality}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-[11px] font-semibold mono px-2 py-0.5 rounded-[4px]"
                        style={{ background: st.bg, color: st.color }}
                      >
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {lowConf && (
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" title="Below 90% threshold">
                            <path d="M5 1L9 8.5H1L5 1Z" stroke="#F0A020" strokeWidth="1" strokeLinejoin="round"/>
                            <path d="M5 4.5v2" stroke="#F0A020" strokeWidth="1" strokeLinecap="round"/>
                          </svg>
                        )}
                        <span className="text-[13px] mono font-semibold" style={{ color: lowConf ? "#F0A020" : "var(--text)" }}>
                          {inc.confidence}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[12px] font-semibold mono" style={{ color: rt.color }}>{rt.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[12px] font-medium" style={{ color: out.color }}>{out.label}</span>
                    </td>
                    <td className="px-4 py-3 mono text-[12px]" style={{ color: "var(--text-3)" }}>
                      {inc.time}
                    </td>
                    <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                      <RowActions incId={inc.id} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ─── Pagination ─── */}
        <div className="flex items-center justify-between text-[12px] mono" style={{ color: "var(--text-3)" }}>
          <div className="flex items-center gap-3">
            <span>
              Showing {filtered.length === 0 ? 0 : page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            {filtered.some(i => i.confidence < 90) && (
              <span className="flex items-center gap-1" style={{ color: "#7A6030" }}>
                <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                  <path d="M4.5 1L8.5 8H0.5L4.5 1Z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/>
                </svg>
                {filtered.filter(i => i.confidence < 90).length} below 90% confidence
              </span>
            )}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
                className="px-2.5 py-1 border rounded-[5px] disabled:opacity-30 transition-colors"
                style={{ borderColor: "var(--border)" }}
                onMouseEnter={e => { if (!e.currentTarget.disabled) (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-3)"; }}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
              >
                ←
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className="px-2.5 py-1 border rounded-[5px] transition-colors"
                  style={{
                    borderColor: page === i ? "var(--border-3)" : "var(--border)",
                    color: page === i ? "var(--text)" : "var(--text-3)",
                    background: page === i ? "var(--surface-3)" : "transparent",
                  }}
                >
                  {i + 1}
                </button>
              ))}
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
                className="px-2.5 py-1 border rounded-[5px] disabled:opacity-30 transition-colors"
                style={{ borderColor: "var(--border)" }}
                onMouseEnter={e => { if (!e.currentTarget.disabled) (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-3)"; }}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
              >
                →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
