import React, { useCallback, useEffect, useRef, useState } from "react";

type View = "dashboard" | "runs" | "cases" | "evaluation" | "health" | "devices";
type Row = Record<string, unknown>;
const API = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8099";
const ACTIVE = new Set(["queued", "running", "cancelling"]);
const TERMINAL = new Set(["completed", "failed", "cancelled", "safe_hold", "escalated", "interrupted"]);
const BUTTON = "rounded-lg border border-[#303931] bg-[#172019] px-3 py-2 text-sm text-[#E8EDE9] hover:border-[#B6FF3B] disabled:opacity-40 disabled:cursor-not-allowed";
const CARD = "rounded-xl border border-[#263027] bg-[#101611] p-5";
const TITLES: Record<View, string> = { dashboard: "Runtime overview", runs: "Incident runs", cases: "Case memory", evaluation: "Architecture evaluation", health: "Runtime health", devices: "Registered devices" };

function text(value: unknown): string { return value == null ? "Not measured" : typeof value === "object" ? JSON.stringify(value) : String(value); }
function rows(value: unknown): Row[] { return Array.isArray(value) ? value as Row[] : []; }
function Json({ value }: { value: unknown }) { return <pre className="mt-3 max-h-[420px] overflow-auto rounded-lg border border-[#263027] bg-[#090D0A] p-4 font-mono text-xs leading-relaxed text-[#A9B3AA]">{JSON.stringify(value, null, 2)}</pre>; }
function Status({ value }: { value: unknown }) { return <span className="inline-flex rounded-full border border-[#3B483D] px-2 py-1 font-mono text-[11px] text-[#B6FF3B]">{text(value)}</span>; }
function Empty({ message }: { message: string }) { return <div className={`${CARD} text-sm text-[#94A198]`}>{message}</div>; }

async function request(path: string, options: RequestInit = {}, allowUnavailable = false): Promise<Row> {
  const response = await fetch(`${API}${path}`, { ...options, credentials: "include" });
  let data: Row;
  try { data = await response.json() as Row; } catch { throw new Error(`Runtime returned an unreadable response (${response.status}).`); }
  if (!response.ok && !(allowUnavailable && response.status === 503)) throw new Error(`${response.status}: ${text(data.detail ?? response.statusText)}`);
  return data;
}

export default function RuntimeWorkspace({ view }: { view: View }) {
  const [data, setData] = useState<Row>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [updated, setUpdated] = useState<string | null>(null);
  const [key, setKey] = useState("");
  const [role, setRole] = useState<string | null>(null);
  const [selected, setSelected] = useState<Row | null>(null);
  const [journal, setJournal] = useState<Row[] | null>(null);
  const [detailBusy, setDetailBusy] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const refreshGeneration = useRef(0);
  const detailGeneration = useRef(0);
  const actionGeneration = useRef(0);
  const currentView = useRef(view);
  currentView.current = view;

  const refresh = useCallback(async () => {
    const generation = ++refreshGeneration.current;
    const current = () => generation === refreshGeneration.current && currentView.current === view;
    setBusy(true); setError("");
    try {
      const paths: Record<View, Array<[string, string]>> = {
        dashboard: [["health", "/api/health"], ["runs", "/api/runs"], ["ready", "/api/ready"]],
        runs: [["runs", "/api/runs"]], cases: [["cases", "/api/memory/cases"]],
        evaluation: [["experiments", "/api/evaluation/experiments"]],
        health: [["health", "/api/health"], ["ready", "/api/ready"]], devices: [["scenarios", "/api/scenarios"]],
      };
      const [session, entries] = await Promise.all([request("/api/auth/session"), Promise.all(paths[view].map(async ([name, path]) => [name, await request(path, {}, path === "/api/ready")]))]);
      if (!current()) return;
      setRole(text(session.role));
      setData(Object.fromEntries(entries)); setUpdated(new Date().toLocaleTimeString());
    } catch (failure) { if (current()) { setData({}); setRole(null); setUpdated(null); setError(failure instanceof Error ? failure.message : "Runtime request failed."); } }
    finally { if (current()) setBusy(false); }
  }, [view]);

  useEffect(() => {
    setSelected(null); setJournal(null); setData({}); setUpdated(null); setActionBusy(false); setDetailBusy(false); void refresh();
    return () => { refreshGeneration.current++; detailGeneration.current++; actionGeneration.current++; };
  }, [refresh]);

  async function connect(event: React.FormEvent) {
    const generation = ++actionGeneration.current;
    const current = () => generation === actionGeneration.current && currentView.current === view;
    event.preventDefault(); setActionBusy(true); setError("");
    const supplied = key; setKey("");
    try {
      const session = await request("/api/auth/session", { method: "POST", headers: { Authorization: `Bearer ${supplied}` } });
      if (!current()) return;
      setRole(text(session.role)); await refresh();
    } catch (failure) { if (current()) { setRole(null); setError(failure instanceof Error ? failure.message : "Session creation failed."); } }
    finally { if (current()) setActionBusy(false); }
  }

  async function selectRun(run: Row) {
    const generation = ++detailGeneration.current;
    const current = () => generation === detailGeneration.current && currentView.current === view;
    setDetailBusy(true); setSelected(run); setJournal(null); setError("");
    try {
      const id = encodeURIComponent(text(run.run_id));
      const [detail, events] = await Promise.all([request(`/api/runs/${id}`), request(`/api/runs/${id}/journal`)]);
      if (!current()) return;
      setSelected(detail); setJournal(rows(events.events));
    } catch (failure) { if (current()) setError(failure instanceof Error ? failure.message : "Run detail unavailable."); }
    finally { if (current()) setDetailBusy(false); }
  }

  async function cancel(run: Row) {
    const generation = ++actionGeneration.current;
    const detail = detailGeneration.current;
    const current = () => generation === actionGeneration.current && currentView.current === view;
    setActionBusy(true); setError("");
    try { await request(`/api/runs/${encodeURIComponent(text(run.run_id))}/cancel`, { method: "POST" }); if (!current()) return; await refresh(); if (current() && detail === detailGeneration.current) await selectRun(run); }
    catch (failure) { if (current()) setError(failure instanceof Error ? failure.message : "Cancellation failed."); }
    finally { if (current()) setActionBusy(false); }
  }

  async function evaluate() {
    const generation = ++actionGeneration.current;
    const detail = detailGeneration.current;
    const current = () => generation === actionGeneration.current && currentView.current === view;
    setActionBusy(true); setError("");
    try { const report = await request("/api/evaluation/experiments", { method: "POST" }); if (!current()) return; await refresh(); if (current() && detail === detailGeneration.current) setSelected(report); }
    catch (failure) { if (current()) setError(failure instanceof Error ? failure.message : "Evaluation failed."); }
    finally { if (current()) setActionBusy(false); }
  }

  async function runFixture() {
    const generation = ++actionGeneration.current;
    const detail = detailGeneration.current;
    const current = () => generation === actionGeneration.current && currentView.current === view;
    setActionBusy(true); setError("");
    try {
      const run = await request("/api/runs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scenario: "medium", source_mode: "fixture", faults: { llmDown: true }, speed: 20 }) });
      if (!current()) return;
      await refresh(); if (current() && detail === detailGeneration.current) await selectRun(run);
    } catch (failure) { if (current()) setError(failure instanceof Error ? failure.message : "Fixture submission failed."); }
    finally { if (current()) setActionBusy(false); }
  }

  async function reconcile(run: Row) {
    const generation = ++actionGeneration.current;
    const detail = detailGeneration.current;
    const current = () => generation === actionGeneration.current && currentView.current === view;
    setActionBusy(true); setError("");
    try {
      await request(`/api/runs/${encodeURIComponent(text(run.run_id))}/reconcile`, { method: "POST" });
      if (!current()) return;
      await refresh(); if (current() && detail === detailGeneration.current) await selectRun(run);
    } catch (failure) { if (current()) setError(failure instanceof Error ? failure.message : "Receipt inspection failed."); }
    finally { if (current()) setActionBusy(false); }
  }

  function selectRecord(record: Row | null) { detailGeneration.current++; setDetailBusy(false); setSelected(record); setJournal(null); }

  const health = (data.health ?? {}) as Row;
  const ready = (data.ready ?? {}) as Row;
  const runs = rows((data.runs as Row | undefined)?.runs);
  const cases = rows((data.cases as Row | undefined)?.cases);
  const experiments = rows((data.experiments as Row | undefined)?.experiments);
  const scenarios = rows((data.scenarios as Row | undefined)?.scenarios);

  const runTable = <div className={`${CARD} overflow-x-auto`}><table className="w-full text-left text-sm"><thead className="text-xs uppercase tracking-wide text-[#748277]"><tr>{["Run", "Status", "State", "Source", "Actions"].map(label => <th key={label} className="pb-3 pr-4">{label}</th>)}</tr></thead><tbody>{runs.map(run => <tr key={text(run.run_id)} className="border-t border-[#253027]"><td className="py-3 pr-4"><button className="font-mono text-[#B6FF3B] hover:underline" onClick={() => void selectRun(run)}>{text(run.run_id)}</button></td><td className="pr-4"><Status value={run.status} /></td><td className="pr-4 text-[#A9B3AA]">{text(run.current_state)}</td><td className="pr-4 text-[#A9B3AA]">{text(run.source_mode ?? (run.request as Row | undefined)?.source_mode)}</td><td>{ACTIVE.has(text(run.status)) && <button className={BUTTON} disabled={actionBusy} onClick={() => void cancel(run)}>Cancel</button>}</td></tr>)}</tbody></table>{runs.length === 0 && <p className="mt-4 text-[#94A198]">No persisted runs available.</p>}</div>;

  return <div className="h-full overflow-y-auto bg-[#0A0C0A] p-6 text-[#E8EDE9] md:p-8">
    <div className="mx-auto max-w-[1500px] space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4"><div><div className="mb-2 font-mono text-xs uppercase tracking-[.2em] text-[#B6FF3B]">MediSOC / operational runtime</div><h1 className="text-3xl font-semibold">{TITLES[view]}</h1><p className="mt-2 text-sm text-[#87988C]">{API} · {updated ? `Refreshed ${updated}` : "Awaiting runtime response"}</p></div><button className={BUTTON} disabled={busy} onClick={() => void refresh()}>{busy ? "Refreshing…" : "Refresh"}</button></div>
      <form onSubmit={event => void connect(event)} className={`${CARD} flex flex-wrap items-center gap-3`}><label className="text-sm text-[#A9B3AA]" htmlFor="runtime-session-key">Runtime session {role && `· ${role}`}</label><input id="runtime-session-key" type="password" autoComplete="off" value={key} onChange={event => setKey(event.target.value)} placeholder="API key" className="min-w-48 rounded-lg border border-[#303931] bg-[#090D0A] px-3 py-2 text-sm outline-none focus:border-[#B6FF3B]"/><button type="submit" className={BUTTON} disabled={actionBusy || !key}>{actionBusy ? "Working…" : "Connect"}</button><span className="text-xs text-[#748277]">The key creates an HttpOnly session and is cleared from this form.</span></form>
      {error && <div role="alert" className="rounded-xl border border-[#713B36] bg-[#2A1715] p-4 text-sm text-[#FFB7AD]">{error}</div>}
      {view === "dashboard" && <div className={`${CARD} flex flex-wrap items-center justify-between gap-4`}><div><h2 className="text-lg">Exercise the pipeline</h2><p className="mt-2 text-sm text-[#87988C]">Submit a synthetic medium incident with deterministic agent fallbacks. Operator role required.</p></div><button className={BUTTON} disabled={actionBusy || (role !== "operator" && role !== "admin")} onClick={() => void runFixture()}>{actionBusy ? "Working…" : "Run fixture"}</button></div>}
      {(view === "dashboard" || view === "health") && <><div className="grid gap-4 md:grid-cols-3">{[["Service", health.status], ["Readiness", ready.ready == null ? null : ready.ready ? "Ready" : "Unavailable"], ["Actuator", health.executor_mode]].map(([label, value]) => <div key={text(label)} className={CARD}><p className="mb-3 text-xs uppercase tracking-wide text-[#87988C]">{text(label)}</p><Status value={value}/></div>)}</div><div className="grid gap-4 lg:grid-cols-2"><div className={CARD}><h2 className="text-lg font-medium">Service configuration</h2><Json value={Object.keys(health).length ? health : "No health response"}/></div><div className={CARD}><h2 className="text-lg font-medium">Readiness checks</h2><Json value={Object.keys(ready).length ? ready : "No readiness response"}/></div></div></>}
      {(view === "runs" || view === "dashboard") && runTable}
      {view === "cases" && (cases.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{cases.map(item => <button key={text(item.case_id)} onClick={() => selectRecord(item)} className={`${CARD} text-left hover:border-[#B6FF3B]`}><div className="flex items-center justify-between gap-3"><span className="font-mono text-sm text-[#B6FF3B]">{text(item.case_id)}</span><Status value={item.outcome}/></div><p className="mt-3 text-lg">{text(item.attack_family)} / {text(item.attack_subtype)}</p><p className="mt-2 text-sm text-[#87988C]">{text(item.device_type)} · {text(item.device_criticality)}</p><p className="mt-3 text-sm text-[#A9B3AA]">{text(item.investigation_summary)}</p></button>)}</div> : <Empty message="No cases returned by the runtime."/>)}
      {view === "devices" && (scenarios.length ? <div className="grid gap-4 md:grid-cols-3">{scenarios.map(scenario => { const device = (scenario.device ?? {}) as Row; return <div key={text(device.device_id)} className={CARD}><div className="flex justify-between"><span className="font-mono text-[#B6FF3B]">{text(device.device_id)}</span><Status value={device.criticality}/></div><h2 className="mt-4 text-xl">{text(device.name)}</h2><p className="mt-2 text-sm text-[#A9B3AA]">{text(device.device_type)} · {text(device.ip)}</p><p className="mt-4 text-sm text-[#87988C]">{text(device.clinical_role)}</p><p className="mt-4 text-xs text-[#748277]">Registry metadata; device online status is not measured by this endpoint.</p></div>; })}</div> : <Empty message="Device registry unavailable."/>)}
      {view === "evaluation" && <><div className={`${CARD} flex flex-wrap items-center justify-between gap-4`}><div><h2 className="text-lg">Paired architecture experiment</h2><p className="mt-2 text-sm text-[#87988C]">Run three synthetic incidents across three routing profiles. Reports use persisted events. Admin role required.</p></div><button className={BUTTON} disabled={actionBusy || role !== "admin"} onClick={() => void evaluate()}>{actionBusy ? "Experiment running…" : "Run evaluation"}</button></div>{experiments.length ? experiments.map(experiment => <div key={text(experiment.experiment_id)} className={CARD}><button onClick={() => selectRecord(experiment)} className="font-mono text-[#B6FF3B] hover:underline">{text(experiment.experiment_id)}</button><p className="mt-2 text-xs text-[#87988C]">Recorded {text(experiment.created_at)}</p><Json value={(experiment.report as Row | undefined)?.summary ?? "Report pending"}/></div>) : <Empty message="No persisted experiments returned."/>}</>}
      {selected && <section className={CARD}><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl">{view === "runs" || view === "dashboard" ? "Run evidence" : "Record details"}</h2><div className="flex gap-2">{selected.run_id != null && TERMINAL.has(text(selected.status)) && text((selected.request as Row | undefined)?.source_mode ?? selected.source_mode) === "live_lab" && role === "admin" && <button className={BUTTON} disabled={actionBusy || detailBusy} onClick={() => void reconcile(selected)}>Inspect gateway receipts</button>}<button className={BUTTON} onClick={() => selectRecord(null)}>Close</button></div></div>{detailBusy ? <p className="mt-4 text-[#87988C]">Loading persisted evidence…</p> : <><Json value={selected}/>{journal && <><h3 className="mt-5 text-sm text-[#B6FF3B]">Persisted event journal · {journal.length} rows</h3><Json value={journal}/></>}</>}</section>}
    </div>
  </div>;
}
