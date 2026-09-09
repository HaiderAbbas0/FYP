import React from "react";
import type { ProbeSample } from "../../agents/types";

/**
 * Service availability, measured by an independent probe.
 *
 * The monitor sends 2 HTTP requests per second to the edge gateway's health
 * endpoint for the life of the incident. HTTP 200 means legitimate traffic is
 * being served; any other status, a timeout or a refused connection is an
 * outage. Nothing here is derived from the detector - that is the point. The
 * detector says an attack is happening; only this says whether the service
 * clinicians depend on came back.
 */
interface Props {
  probes: ProbeSample[];
  running: boolean;
  probeUrl: string;
}

function pct(xs: ProbeSample[]): number | null {
  if (!xs.length) return null;
  return Math.round((100 * xs.filter((p) => p.ok).length) / xs.length);
}

export default function AvailabilityStrip({ probes, running, probeUrl }: Props) {
  const firstOutage = probes.findIndex((p) => !p.ok);
  const lastOutage = probes.map((p) => p.ok).lastIndexOf(false);

  // Before anything has failed, every sample is still baseline - not "recovered".
  const noOutageYet = firstOutage < 0;
  const baseline = noOutageYet ? probes : probes.slice(0, firstOutage);
  const outage = noOutageYet ? [] : probes.slice(firstOutage, lastOutage + 1);
  const recovered = noOutageYet ? [] : probes.slice(lastOutage + 1);

  const recoveryLag =
    recovered.length && outage.length
      ? Math.round((recovered[0].t_offset_s - outage[outage.length - 1].t_offset_s) * 100) / 100
      : null;

  const errors = probes.filter((p) => !p.ok).length;
  const codes = [...new Set(probes.map((p) => p.status_code ?? 0))].filter(Boolean).sort();
  const live = probes.length > 0 && probes[probes.length - 1];

  const cells = [
    { k: "baseline", v: pct(baseline), n: baseline.length, color: "#4ADE80" },
    { k: "under attack", v: pct(outage), n: outage.length, color: "#F87171" },
    { k: "after recovery", v: pct(recovered), n: recovered.length, color: "#4ADE80" },
  ];

  return (
    <div className="bg-[#111511] border border-[#242924] rounded-[12px] p-4">
      <div className="flex items-baseline justify-between gap-4 flex-wrap mb-2">
        <div>
          <div className="mono text-[11px] uppercase tracking-wider text-[#4A5249]">
            Availability monitor · independent probe
          </div>
          <div className="text-[13px] text-[#8A918A] mt-0.5">
            <span className="mono">GET {probeUrl}</span> at 2 req/s · 200 = traffic healthy · anything else = outage
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <div className="mono text-[10px] uppercase tracking-wider text-[#4A5249]">requests</div>
            <div className="mono text-[16px] text-[#E8EDE9]">{probes.length}</div>
          </div>
          <div className="text-right">
            <div className="mono text-[10px] uppercase tracking-wider text-[#4A5249]">errors</div>
            <div className="mono text-[16px]" style={{ color: errors ? "#F87171" : "#4A5249" }}>{errors}</div>
          </div>
          <div className="text-right">
            <div className="mono text-[10px] uppercase tracking-wider text-[#4A5249]">time to recovery</div>
            <div className="mono text-[16px]" style={{ color: recoveryLag !== null ? "#B6FF3B" : "#4A5249" }}>
              {recoveryLag !== null ? `${recoveryLag}s` : running ? "waiting…" : "—"}
            </div>
          </div>
        </div>
      </div>

      {/* one tick per request */}
      <div className="flex items-end gap-[2px] h-[34px] mb-2">
        {probes.length === 0 && (
          <div className="text-[13px] text-[#4A5249] self-center">
            Run the simulation to start probing the gateway.
          </div>
        )}
        {probes.map((p) => (
          <div
            key={p.seq}
            title={`t+${p.t_offset_s}s · ${p.status_code ?? p.error ?? "no response"} · ${p.latency_ms}ms`}
            className="flex-1 min-w-[3px] max-w-[14px] rounded-[2px] fade-in"
            style={{
              height: p.ok ? "100%" : "58%",
              background: p.ok ? "#22C55E" : "#EF4444",
              opacity: p.ok ? 0.85 : 0.9,
            }}
          />
        ))}
        {running && (
          <div className="w-[3px] h-full bg-[#B6FF3B] lime-pulse rounded-[2px]" />
        )}
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-5">
          {cells.map((c) => (
            <div key={c.k}>
              <div className="mono text-[10px] uppercase tracking-wider text-[#4A5249]">{c.k}</div>
              <div className="mono text-[15px]" style={{ color: c.v === null ? "#4A5249" : c.color }}>
                {c.v === null ? "—" : `${c.v}%`}
                <span className="text-[#4A5249] text-[12px]"> · {c.n} probes</span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {codes.length > 0 && (
            <span className="mono text-[12px] text-[#8A918A]">
              codes seen: {codes.join(", ")}
            </span>
          )}
          {live && (
            <span className="mono text-[12px] px-2 py-0.5 rounded-full border"
              style={{
                borderColor: live.ok ? "#1F6E38" : "#8C2A2A",
                color: live.ok ? "#4ADE80" : "#F87171",
                background: live.ok ? "#0F1A12" : "#1E0D0D",
              }}>
              {live.ok ? `HTTP 200 · ${live.latency_ms}ms` : `HTTP ${live.status_code ?? "—"} · outage`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
