import React, { useState, useMemo, useRef, useEffect } from "react";
import type { Screen } from "../types";
import { acknowledgeIncident, escalateIncident } from "../api/apiService";
import ConfirmDialog from "../components/ConfirmDialog";
import Field from "../components/Field";
import {
  SEVERITY_ORDER,
  outcomeTone,
  routeTone,
  severityTone,
  statusTone,
} from "../components/severity";

interface Props { onNavigate: (s: Screen) => void; }

import { incidents } from "../data/mock";

type SortKey = "confidence" | "time" | "criticality";
const PAGE_SIZE = 8;

const SAVED_VIEWS = [
  { label: "Active incidents", status: "Investigating", crit: "All", route: "All", outcome: "All" },
  { label: "Critical unresolved", status: "All", crit: "Critical", route: "All", outcome: "All" },
  { label: "Deep investigations", status: "All", crit: "All", route: "DEEP", outcome: "All" },
];

/** Highlights the matched substring of a search query. */
function Hl({ text, q }: { text: string; q: string }) {
  if (!q) return <>{text}</>;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark
        style={{
          background: "var(--lime-soft)",
          color: "var(--lime)",
          borderRadius: 2,
          padding: "0 2px",
        }}
      >
        {text.slice(i, i + q.length)}
      </mark>
      {text.slice(i + q.length)}
    </>
  );
}

function RowActions({ incId }: { incId: string }) {
  const [ackOpen, setAckOpen] = useState(false);
  const [escOpen, setEscOpen] = useState(false);
  const [ackDone, setAckDone] = useState(false);
  const [escDone, setEscDone] = useState(false);
  const [loading, setLoading] = useState(false);

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
      <div className="flex items-center gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-within:opacity-100">
        <button
          type="button"
          title={ackDone ? "Acknowledged" : "Acknowledge incident"}
          aria-label={ackDone ? `${incId} acknowledged` : `Acknowledge ${incId}`}
          disabled={ackDone}
          onClick={(e) => {
            e.stopPropagation();
            setAckOpen(true);
          }}
          className="badge transition-colors duration-150 disabled:opacity-100"
          style={{
            background: ackDone ? "var(--low-bg)" : "var(--surface-3)",
            borderColor: ackDone ? "var(--low-line)" : "var(--border-2)",
            color: ackDone ? "var(--success)" : "var(--text-3)",
          }}
        >
          {ackDone ? "ACK'd" : "ACK"}
        </button>
        <button
          type="button"
          title={escDone ? "Escalated" : "Escalate to senior analyst"}
          aria-label={escDone ? `${incId} escalated` : `Escalate ${incId}`}
          disabled={escDone}
          onClick={(e) => {
            e.stopPropagation();
            setEscOpen(true);
          }}
          className="badge transition-colors duration-150 disabled:opacity-100"
          style={{
            background: escDone ? "var(--high-bg)" : "var(--surface-3)",
            borderColor: escDone ? "var(--high-line)" : "var(--border-2)",
            color: escDone ? "var(--high)" : "var(--text-3)",
          }}
        >
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

export default function Incidents({ onNavigate }: Props) {
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [filterCrit, setFilterCrit] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterRoute, setFilterRoute] = useState("All");
  const [filterOutcome, setFilterOutcome] = useState("All");
  const [sortKey, setSortKey] = useState<SortKey>("time");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setDropdownOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "time" ? "desc" : "asc");
    }
  }

  const previewResults = useMemo(() => {
    if (!search) return [];
    const q = search.toLowerCase();
    return incidents
      .filter(
        (x) =>
          x.id.toLowerCase().includes(q) ||
          x.attack.toLowerCase().includes(q) ||
          x.target.toLowerCase().includes(q) ||
          x.type.toLowerCase().includes(q),
      )
      .slice(0, 5);
  }, [search]);

  const filtered = useMemo(() => {
    let d = [...incidents];
    if (search) {
      const q = search.toLowerCase();
      d = d.filter(
        (x) =>
          x.id.toLowerCase().includes(q) ||
          x.attack.toLowerCase().includes(q) ||
          x.target.toLowerCase().includes(q) ||
          x.type.toLowerCase().includes(q),
      );
    }
    if (filterCrit !== "All") d = d.filter((x) => x.criticality === filterCrit);
    if (filterStatus !== "All") d = d.filter((x) => x.status === filterStatus);
    if (filterRoute !== "All") d = d.filter((x) => x.route === filterRoute);
    if (filterOutcome !== "All") d = d.filter((x) => x.outcome === filterOutcome);
    d.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "confidence") cmp = a.confidence - b.confidence;
      else if (sortKey === "time") cmp = a.time.localeCompare(b.time);
      else cmp = (SEVERITY_ORDER[a.criticality] ?? 4) - (SEVERITY_ORDER[b.criticality] ?? 4);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return d;
  }, [search, filterCrit, filterStatus, filterRoute, filterOutcome, sortKey, sortDir]);

  const pageItems = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const hasActiveFilters =
    filterCrit !== "All" || filterStatus !== "All" || filterRoute !== "All" || filterOutcome !== "All" || search;

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
          type="button"
          onClick={() => handleSort(sk)}
          className="th-sort"
          style={{ color: isActive ? "var(--text-2)" : "var(--text-4)" }}
          aria-label={`Sort by ${label}`}
        >
          {label}
          <span className="ml-0.5 text-[10px] opacity-60" aria-hidden>
            {isActive ? (sortDir === "asc" ? "↑" : "↓") : "⇅"}
          </span>
        </button>
      </th>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Incidents</h1>
            <p className="page-sub">Security incidents detected on this session · Demonstration data</p>
          </div>
          <span
            className="mono rounded-md px-2.5 py-1.5 text-[12px]"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-3)" }}
          >
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Search */}
        <div className="relative mb-3" ref={searchRef}>
          <svg
            className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2"
            width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden
          >
            <circle cx="6" cy="6" r="4.5" stroke="var(--text-4)" strokeWidth="1.2" />
            <path d="M10 10l2.5 2.5" stroke="var(--text-4)" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <Field label="Search incidents" className="sr-only">
            {(p) => (
              <input
                {...p}
                type="search"
                placeholder="Search incidents — ID, attack type, target device…"
                className={`${p.className} pl-10 pr-9`}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                  setDropdownOpen(true);
                }}
                onFocus={() => {
                  if (search) setDropdownOpen(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setDropdownOpen(false);
                  if (e.key === "Escape") {
                    setSearch("");
                    setDropdownOpen(false);
                  }
                }}
              />
            )}
          </Field>
          {search && (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setSearch("");
                setDropdownOpen(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[14px] text-[var(--text-4)] transition-colors hover:text-[var(--text-2)]"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}

          {dropdownOpen && search && (
            <div
              className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg animate-in fade-in slide-in-from-top-1"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border-2)", boxShadow: "var(--shadow-lg)" }}
            >
              {previewResults.length === 0 ? (
                <div className="px-4 py-4 text-[13px] text-[var(--text-4)]">No incidents match &quot;{search}&quot;</div>
              ) : (
                <>
                  <div className="t-label border-b px-4 py-2" style={{ borderColor: "var(--border)" }}>
                    {previewResults.length} match{previewResults.length !== 1 ? "es" : ""}
                  </div>
                  {previewResults.map((inc) => {
                    const sv = severityTone(inc.criticality);
                    return (
                      <button
                        key={inc.id}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setSearch(inc.id);
                          setDropdownOpen(false);
                        }}
                        className="flex w-full items-center gap-3 border-b px-4 py-2.5 text-left transition-colors last:border-b-0"
                        style={{ borderColor: "var(--border)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-3)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <span className="h-9 w-1 shrink-0 rounded-full" style={{ background: sv.solid }} aria-hidden />
                        <span className="min-w-0 flex-1">
                          <span className="mb-0.5 flex items-center gap-2">
                            <span className="mono text-[13px] font-semibold text-[var(--text)]">
                              <Hl text={inc.id} q={search} />
                            </span>
                            <span className="badge" style={{ background: sv.bg, color: sv.text, borderColor: sv.line }}>
                              {inc.criticality}
                            </span>
                          </span>
                          <span className="block truncate text-[12.5px] text-[var(--text-2)]">
                            <Hl text={inc.attack} q={search} />
                          </span>
                          <span className="mono block text-[11.5px] text-[var(--text-4)]">
                            <Hl text={inc.target} q={search} />
                          </span>
                        </span>
                        <span className="shrink-0 text-right">
                          <span className="mono block text-[12px] text-[var(--text-3)]">{inc.confidence}%</span>
                          <span className="mono block text-[11px] text-[var(--text-4)]">{inc.time}</span>
                        </span>
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {(["All", "Critical", "High", "Medium", "Low"] as const).map((c) => {
              const sv = c !== "All" ? severityTone(c) : null;
              const on = filterCrit === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setFilterCrit(c);
                    setPage(0);
                  }}
                  className="filter-chip"
                  style={{
                    background: on && sv ? sv.bg : on ? "var(--surface-4)" : "transparent",
                    color: on && sv ? sv.text : on ? "var(--text)" : "var(--text-3)",
                    borderColor: on && sv ? sv.line : on ? "var(--border-3)" : "var(--border)",
                  }}
                >
                  {c}
                </button>
              );
            })}
          </div>

          <span className="h-4 w-px" style={{ background: "var(--border)" }} aria-hidden />

          <div className="flex flex-wrap items-center gap-1.5">
            {(["All", "Investigating", "Escalated", "Resolved"] as const).map((s) => {
              const st = s !== "All" ? statusTone(s) : null;
              const on = filterStatus === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setFilterStatus(s);
                    setPage(0);
                  }}
                  className="filter-chip"
                  style={{
                    background: on && st ? st.bg : on ? "var(--surface-4)" : "transparent",
                    color: on && st ? st.text : on ? "var(--text)" : "var(--text-3)",
                    borderColor: on && st ? st.line : on ? "var(--border-3)" : "var(--border)",
                  }}
                >
                  {s}
                </button>
              );
            })}
          </div>

          <span className="h-4 w-px" style={{ background: "var(--border)" }} aria-hidden />

          <div className="flex flex-wrap items-center gap-1.5">
            {(["All", "SHORT", "PARTIAL", "DEEP"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setFilterRoute(r);
                  setPage(0);
                }}
                className="filter-chip mono"
                style={{
                  background: filterRoute === r ? "var(--surface-4)" : "transparent",
                  color: filterRoute === r ? "var(--text)" : "var(--text-3)",
                  borderColor: filterRoute === r ? "var(--border-3)" : "var(--border)",
                }}
              >
                {r === "All" ? "All routes" : r}
              </button>
            ))}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="ml-auto rounded-md border px-2.5 py-1 text-[12px] text-[var(--text-3)] transition-colors hover:text-[var(--text-2)]"
              style={{ borderColor: "var(--border)" }}
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Saved views */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-[12px] text-[var(--text-4)]">Quick views:</span>
          {SAVED_VIEWS.map((v) => (
            <button
              key={v.label}
              type="button"
              onClick={() => {
                setFilterStatus(v.status);
                setFilterCrit(v.crit);
                setFilterRoute(v.route);
                setFilterOutcome(v.outcome);
                setPage(0);
              }}
              className="rounded-md border px-2.5 py-1 text-[12px] text-[var(--text-3)] transition-colors duration-150 hover:text-[var(--text-2)]"
              style={{ borderColor: "var(--border)" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border-3)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* Active filter pills */}
        {hasActiveFilters && (
          <div className="mb-3 flex flex-wrap items-center gap-2 text-[12px]">
            <span className="text-[var(--text-4)]">Active:</span>
            {search && (
              <span className="rounded px-2 py-0.5" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-2)" }}>
                &quot;{search}&quot;
              </span>
            )}
            {filterCrit !== "All" && (
              <span className="rounded px-2 py-0.5" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-2)" }}>
                Severity: {filterCrit}
              </span>
            )}
            {filterStatus !== "All" && (
              <span className="rounded px-2 py-0.5" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-2)" }}>
                Status: {filterStatus}
              </span>
            )}
            {filterRoute !== "All" && (
              <span className="rounded px-2 py-0.5" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-2)" }}>
                Route: {filterRoute}
              </span>
            )}
          </div>
        )}

        {/* Table */}
        <div className="table-wrap mb-3">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-[120px]">ID</th>
                  <th>Attack</th>
                  <th>Target</th>
                  <SortTh label="Severity" sk="criticality" />
                  <th>Status</th>
                  <SortTh label="Confidence" sk="confidence" />
                  <th>Route</th>
                  <th>Outcome</th>
                  <SortTh label="Time" sk="time" />
                  <th className="w-[110px]">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-14 text-center text-[14px] text-[var(--text-4)]">
                      <div>No incidents match the current filters.</div>
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="mt-2 text-[13px] underline transition-colors hover:text-[var(--text-2)]"
                      >
                        Clear filters
                      </button>
                    </td>
                  </tr>
                ) : (
                  pageItems.map((inc) => {
                    const sv = severityTone(inc.criticality);
                    const st = statusTone(inc.status);
                    const rt = routeTone(inc.route);
                    const out = outcomeTone(inc.outcome);
                    const lowConf = inc.confidence < 90;
                    return (
                      <tr
                        key={inc.id}
                        className="group cursor-pointer"
                        style={{ boxShadow: `inset 3px 0 0 ${sv.solid}` }}
                        onClick={() => onNavigate("incident-overview")}
                      >
                        <td>
                          <div className="mono text-[13px] font-semibold text-[var(--text)]">{inc.id}</div>
                          <div className="mono mt-0.5 text-[11px] text-[var(--text-4)]">{inc.type}</div>
                        </td>
                        <td className="font-medium text-[var(--text-2)]">{inc.attack}</td>
                        <td className="mono text-[12.5px] text-[var(--text-4)]">{inc.target}</td>
                        <td>
                          <span className="badge" style={{ background: sv.bg, color: sv.text, borderColor: sv.line }}>
                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: sv.solid }} aria-hidden />
                            {inc.criticality}
                          </span>
                        </td>
                        <td>
                          <span className="badge" style={{ background: st.bg, color: st.text, borderColor: st.line }}>
                            {st.label}
                          </span>
                        </td>
                        <td>
                          <span
                            className="inline-flex items-center gap-1.5 font-mono text-[12.5px]"
                            style={{ color: lowConf ? "var(--warning)" : "var(--text)" }}
                          >
                            {!lowConf && (
                              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
                                <path d="M2.5 6.2l2.4 2.4 4.6-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                            {inc.confidence}%
                          </span>
                        </td>
                        <td className="mono text-[12px]" style={{ color: rt.text }}>{rt.label}</td>
                        <td className="font-medium" style={{ color: out.text }}>{out.label}</td>
                        <td className="mono text-[12.5px] text-[var(--text-4)]">{inc.time}</td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <RowActions incId={inc.id} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="mono flex flex-wrap items-center justify-between gap-3 text-[12px] text-[var(--text-4)]">
          <div className="flex items-center gap-3">
            <span>
              Showing {filtered.length === 0 ? 0 : page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            {filtered.some((i) => i.confidence < 90) && (
              <span className="flex items-center gap-1" style={{ color: "var(--warning)" }}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                  <path d="M5 1.4L9 8.6H1L5 1.4Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
                </svg>
                {filtered.filter((i) => i.confidence < 90).length} below 90% confidence
              </span>
            )}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="rounded border px-2.5 py-1 transition-colors disabled:opacity-30"
                style={{ borderColor: "var(--border)" }}
                aria-label="Previous page"
              >
                ←
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPage(i)}
                  className="rounded border px-2.5 py-1 transition-colors"
                  style={{
                    borderColor: page === i ? "var(--border-3)" : "var(--border)",
                    color: page === i ? "var(--text)" : "var(--text-4)",
                    background: page === i ? "var(--surface-3)" : "transparent",
                  }}
                  aria-label={`Page ${i + 1}`}
                  aria-current={page === i ? "page" : undefined}
                >
                  {i + 1}
                </button>
              ))}
              <button
                type="button"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="rounded border px-2.5 py-1 transition-colors disabled:opacity-30"
                style={{ borderColor: "var(--border)" }}
                aria-label="Next page"
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