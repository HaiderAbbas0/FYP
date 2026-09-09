import React from "react";
import Badge from "../ui/Badge";
import type { CacheStats, MemoryTiers as Tiers } from "../../agents/types";

/**
 * The two memory tiers, and which one answered.
 *
 * Primary is the authoritative case store and is scored against every case, so
 * its cost grows with the store. Secondary is a bounded queue of copies of
 * recently-useful cases: at most 10 entries, each surviving 5 attacks unless a
 * hit refreshes it. It is checked first, so a repeat attack family answers
 * without paying for the full scan.
 */
interface Props {
  tiers: Tiers | null;
  cache: CacheStats | null;
  primaryCases: number | null;
}

export default function MemoryTiers({ tiers, cache, primaryCases }: Props) {
  const stats = tiers?.cache ?? cache;
  const answered = tiers?.answered_by ?? null;

  return (
    <div>
      {/* --- which tier answered ------------------------------------- */}
      <div className="mono text-[11px] uppercase tracking-wider text-[#4A5249] mb-1.5">
        Answered by
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        {(["cache", "primary"] as const).map((t) => {
          const on = answered === t;
          const us = t === "cache" ? tiers?.cache_lookup_us : tiers?.primary_lookup_us;
          return (
            <div key={t} className="rounded-[8px] border p-2.5"
              style={{
                borderColor: on ? "#B6FF3B" : "#1E241F",
                background: on ? "#141A10" : "#0E120E",
              }}>
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium" style={{ color: on ? "#B6FF3B" : "#8A918A" }}>
                  {t === "cache" ? "Secondary · cache" : "Primary · case store"}
                </span>
                {on && (
                  <span className="mono text-[10px] text-[#B6FF3B]">
                    {t === "cache" ? "HIT" : "ANSWERED"}
                  </span>
                )}
              </div>
              <div className="mono text-[15px] text-[#E8EDE9] mt-1">
                {us != null ? `${us}µs` : answered ? "not scanned" : "—"}
              </div>
              <div className="text-[11px] text-[#8A918A] mt-0.5">
                {t === "cache"
                  ? `${tiers?.cache_entries_scored ?? stats?.size ?? 0} entries scored`
                  : tiers?.primary_scan_skipped != null
                    ? `${tiers.primary_scan_skipped} cases skipped`
                    : `${tiers?.primary_cases_scanned ?? primaryCases ?? 0} cases scored`}
              </div>
            </div>
          );
        })}
      </div>

      {tiers?.promotion && (
        <div className="rounded-[8px] border border-[#2F3D22] bg-[#141A10] p-2.5 mb-3">
          <div className="mono text-[10px] uppercase tracking-wider text-[#B6FF3B] mb-1">
            Promoted to secondary
          </div>
          <div className="text-[12px] text-[#A9B3AA] leading-relaxed">
            A copy of <span className="mono text-[#E8EDE9]">{tiers.promotion.promoted}</span> was{" "}
            {tiers.promotion.action} with a {tiers.promotion.ttl}-attack lifetime, so the next
            comparable incident answers from cache instead of rescanning the store.
            {tiers.promotion.evicted_for_capacity && (
              <> Evicted <span className="mono">{tiers.promotion.evicted_for_capacity}</span> to make room.</>
            )}
          </div>
        </div>
      )}

      {tiers?.expired_this_incident?.length ? (
        <div className="rounded-[8px] border border-[#8A6212] bg-[#1C1608] p-2.5 mb-3">
          <div className="mono text-[10px] uppercase tracking-wider text-[#FBBF24] mb-1">Aged out</div>
          <div className="text-[12px] text-[#A9B3AA]">
            <span className="mono">{tiers.expired_this_incident.join(", ")}</span> went 5 attacks
            without matching anything and were dropped from the cache.
          </div>
        </div>
      ) : null}

      {/* --- the queue ------------------------------------------------ */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="mono text-[11px] uppercase tracking-wider text-[#4A5249]">
          Secondary memory · queue
        </span>
        <span className="mono text-[11px] text-[#8A918A]">
          {stats?.size ?? 0}/{stats?.capacity ?? 10} · ttl {stats?.ttl_attacks ?? 5} attacks
        </span>
      </div>

      {!stats || stats.entries.length === 0 ? (
        <p className="text-[13px] text-[#4A5249] mb-3">
          Cache is empty. It fills when a primary lookup confirms a match.
        </p>
      ) : (
        <div className="space-y-1.5 mb-3">
          {stats.entries.map((e) => (
            <div key={e.case_id} className="rounded-[8px] border border-[#1E241F] bg-[#0E120E] p-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="mono text-[13px] text-[#E8EDE9]">{e.case_id}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {e.hits > 0 && <Badge variant="success">{e.hits} hit{e.hits > 1 ? "s" : ""}</Badge>}
                  <span className="mono text-[11px] text-[#8A918A]">ttl {e.ttl_attacks_remaining}</span>
                </div>
              </div>
              {/* lives remaining, as pips */}
              <div className="flex gap-[3px] my-1.5">
                {Array.from({ length: stats.ttl_attacks }).map((_, i) => (
                  <span key={i} className="h-[3px] flex-1 rounded-full"
                    style={{ background: i < e.ttl_attacks_remaining ? "#B6FF3B" : "#242924" }} />
                ))}
              </div>
              <div className="text-[11px] text-[#8A918A]">
                {e.attack_subtype} · {e.device_type} · {e.outcome} · reliability {e.reliability}
              </div>
            </div>
          ))}
        </div>
      )}

      {stats && (
        <div className="rounded-[8px] border border-[#1E241F] p-3 space-y-1.5">
          {[
            ["Incidents seen", String(stats.incidents_seen)],
            ["Cache hit rate", stats.hit_rate_pct != null ? `${stats.hit_rate_pct}% (${stats.hits}/${stats.lookups})` : "—"],
            ["Promotions", String(stats.promotions)],
            ["Aged out / evicted", `${stats.evictions_ttl} / ${stats.evictions_capacity}`],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between text-[13px]">
              <span className="text-[#8A918A]">{k}</span>
              <span className="mono text-[#E8EDE9]">{v}</span>
            </div>
          ))}
        </div>
      )}

      <p className="text-[12px] text-[#8A918A] leading-relaxed mt-2">
        The cache is a performance tier, never a safety one. Entries are copies of already-validated
        cases and pass exactly the same reuse gate — similarity, context compatibility, reliability —
        as a primary hit, so a cached case can never authorise something the store would refuse.
      </p>
    </div>
  );
}
