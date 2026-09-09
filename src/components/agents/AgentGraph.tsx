import React from "react";
import { ALL_NODES, CANVAS, NODE_BY_ID, PLANNER, STATIC_EDGES, SUB_CLUSTER, type GraphNode } from "../../agents/graph";
import type { NodeId, NodeStatus } from "../../agents/types";
import type { ActiveEdge } from "../../agents/engine";

interface Box { x: number; y: number; w: number; h: number; cx: number; cy: number; }

function box(id: NodeId): Box {
  const n = id === "planner" ? PLANNER : NODE_BY_ID[id];
  const b = n as { x: number; y: number; w: number; h: number };
  return { x: b.x, y: b.y, w: b.w, h: b.h, cx: b.x + b.w / 2, cy: b.y + b.h / 2 };
}

/** Anchor-aware cubic path between two node boxes. */
export function edgePath(from: NodeId, to: NodeId): string {
  const a = box(from);
  const b = box(to);

  if (from === "planner") {
    const sx = Math.min(Math.max(b.cx, a.x + 40), a.x + a.w - 40);
    return `M ${sx} ${a.y + a.h} C ${sx} ${a.y + a.h + 34}, ${b.cx} ${b.y - 34}, ${b.cx} ${b.y}`;
  }
  if (to === "planner") {
    const ex = Math.min(Math.max(a.cx, b.x + 40), b.x + b.w - 40);
    return `M ${a.cx} ${a.y} C ${a.cx} ${a.y - 34}, ${ex} ${b.y + b.h + 34}, ${ex} ${b.y + b.h}`;
  }
  if (Math.abs(a.cy - b.cy) < 24) {
    const d = Math.max(24, (b.x - (a.x + a.w)) * 0.55);
    return `M ${a.x + a.w} ${a.cy} C ${a.x + a.w + d} ${a.cy}, ${b.x - d} ${b.cy}, ${b.x} ${b.cy}`;
  }
  if (b.cy > a.cy) {
    const dy = Math.max(40, (b.y - (a.y + a.h)) * 0.6);
    return `M ${a.cx} ${a.y + a.h} C ${a.cx} ${a.y + a.h + dy}, ${b.cx} ${b.y - dy}, ${b.cx} ${b.y}`;
  }
  const dy = Math.max(40, (a.y - (b.y + b.h)) * 0.6);
  return `M ${a.cx} ${a.y} C ${a.cx} ${a.y - dy}, ${b.cx} ${b.y + b.h + dy}, ${b.cx} ${b.y + b.h}`;
}

const STATUS_STYLE: Record<NodeStatus, { border: string; bg: string; glow: string; text: string }> = {
  idle: { border: "#242924", bg: "#111511", glow: "none", text: "#8A918A" },
  active: { border: "#B6FF3B", bg: "#16210F", glow: "0 0 0 1px #B6FF3B, 0 0 22px rgba(182,255,59,0.28)", text: "#E8EDE9" },
  ok: { border: "#1F6E38", bg: "#0F1A12", glow: "none", text: "#E8EDE9" },
  degraded: { border: "#8A6212", bg: "#1C1608", glow: "0 0 14px rgba(245,158,11,0.18)", text: "#FBBF24" },
  failed: { border: "#8C2A2A", bg: "#1E0D0D", glow: "0 0 14px rgba(239,68,68,0.22)", text: "#F87171" },
  skipped: { border: "#242924", bg: "#0C0F0D", glow: "none", text: "#4A5249" },
};

const OWNER_TAG: Record<GraphNode["owner"], { label: string; color: string }> = {
  partner: { label: "detection track", color: "#6B7A8F" },
  core: { label: "agent track", color: "#B6FF3B" },
  sub: { label: "sub-agent", color: "#7C6FF0" },
};

function StatusMark({ s }: { s: NodeStatus }) {
  if (s === "active") return <span className="w-2 h-2 rounded-full bg-[#B6FF3B] stage-dot-active inline-block" />;
  if (s === "ok") return <span className="text-[#22C55E] text-[13px] leading-none">✓</span>;
  if (s === "degraded") return <span className="text-[#F59E0B] text-[13px] leading-none">▲</span>;
  if (s === "failed") return <span className="text-[#EF4444] text-[13px] leading-none">✕</span>;
  if (s === "skipped") return <span className="text-[#4A5249] text-[12px] leading-none mono">SKIP</span>;
  return <span className="w-2 h-2 rounded-full bg-[#2A302B] inline-block" />;
}

interface Props {
  nodeStatus: Record<string, NodeStatus>;
  nodeLabel: Record<string, string>;
  activeEdges: ActiveEdge[];
  selected: NodeId | null;
  onSelect: (n: NodeId) => void;
  plannerActive: boolean;
  controllerState: string | null;
}

export default function AgentGraph({
  nodeStatus, nodeLabel, activeEdges, selected, onSelect, plannerActive, controllerState,
}: Props) {
  const st = (id: string): NodeStatus => nodeStatus[id] ?? "idle";

  return (
    <div className="relative overflow-auto rounded-[12px] border border-[#1A1F1B] bg-[#0A0D0A]">
      <div className="relative" style={{ width: CANVAS.w, height: CANVAS.h }}>
        {/* dotted canvas backdrop */}
        <svg width={CANVAS.w} height={CANVAS.h} className="absolute inset-0 pointer-events-none">
          <defs>
            <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="#161B17" />
            </pattern>
            <marker id="arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
              <path d="M0,0 L7,3.5 L0,7 z" fill="#2A302B" />
            </marker>
            <marker id="arrow-live" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
              <path d="M0,0 L7,3.5 L0,7 z" fill="#B6FF3B" />
            </marker>
            <marker id="arrow-wb" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
              <path d="M0,0 L7,3.5 L0,7 z" fill="#7C6FF0" />
            </marker>
          </defs>
          <rect width={CANVAS.w} height={CANVAS.h} fill="url(#dots)" />

          {/* static skeleton */}
          {STATIC_EDGES.map((e, i) => (
            <path key={i} d={edgePath(e.from, e.to)} stroke="#1E241F" strokeWidth={1.5} fill="none" markerEnd="url(#arrow)" />
          ))}
          {/* planner control tethers, always faintly visible */}
          {(["detector", "memory", "investigator", "explainer", "response"] as NodeId[]).map((n) => (
            <path key={`p-${n}`} d={edgePath("planner", n)} stroke="#1A1F1B" strokeWidth={1.2} strokeDasharray="3 5" fill="none" />
          ))}
          {/* investigator sub-agent cluster boundary */}
          <rect x={SUB_CLUSTER.x} y={SUB_CLUSTER.y} width={SUB_CLUSTER.w} height={SUB_CLUSTER.h}
            rx={12} fill="#0C100C" stroke="#1A1F1B" strokeWidth={1} strokeDasharray="5 5" />
          {(["sub.log", "sub.threat", "sub.device", "sub.traffic", "sub.history"] as NodeId[]).map((n) => (
            <path key={`i-${n}`} d={edgePath("investigator", n)} stroke="#1A1F1B" strokeWidth={1.2} strokeDasharray="3 5" fill="none" />
          ))}
          <path d={edgePath("actuator", "memory")} stroke="#1A1F1B" strokeWidth={1.2} strokeDasharray="4 6" fill="none" />

          {/* live edges */}
          {activeEdges.map((e, i) => {
            const color = e.kind === "writeback" ? "#7C6FF0" : e.kind === "control" ? "#8FD62B" : "#B6FF3B";
            const marker = e.kind === "writeback" ? "url(#arrow-wb)" : "url(#arrow-live)";
            return (
              <g key={`${e.from}-${e.to}-${e.at}-${i}`}>
                <path d={edgePath(e.from, e.to)} stroke={color} strokeWidth={2} fill="none" markerEnd={marker} opacity={0.9} />
                <path d={edgePath(e.from, e.to)} stroke={color} strokeWidth={3.5} fill="none" opacity={0.22}
                  strokeDasharray="10 340" >
                  <animate attributeName="stroke-dashoffset" from="350" to="0" dur="1.1s" repeatCount="indefinite" />
                </path>
              </g>
            );
          })}
        </svg>

        {/* edge labels for live edges */}
        {activeEdges.filter((e) => e.label).map((e, i) => {
          const a = box(e.from); const b = box(e.to);
          return (
            <div key={`lbl-${i}`} className="absolute mono text-[11px] px-1.5 py-[1px] rounded bg-[#0A0D0A] border pointer-events-none whitespace-nowrap fade-in"
              style={{
                left: (a.cx + b.cx) / 2 - 40, top: (a.cy + b.cy) / 2 - 10,
                borderColor: e.kind === "writeback" ? "#3B3470" : "#2F3D22",
                color: e.kind === "writeback" ? "#A78BFA" : "#B6FF3B",
              }}>
              {e.label}
            </div>
          );
        })}

        {/* ---- Planner orchestration bar ---- */}
        <div
          onClick={() => onSelect("planner")}
          className="absolute rounded-[12px] cursor-pointer transition-all duration-200"
          style={{
            left: PLANNER.x, top: PLANNER.y, width: PLANNER.w, height: PLANNER.h,
            background: plannerActive ? "linear-gradient(180deg,#18240F 0%,#111511 100%)" : "#0E120E",
            border: `1px solid ${selected === "planner" ? "#B6FF3B" : plannerActive ? "#6E9C1E" : "#242924"}`,
            boxShadow: plannerActive ? "0 0 28px rgba(182,255,59,0.15)" : "none",
          }}
        >
          <div className="h-full flex items-center justify-between px-5">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <StatusMark s={st("planner")} />
                <span className="text-[19px] font-bold text-[#E8EDE9]">{PLANNER.title}</span>
                <span className="mono text-[11px] px-2 py-0.5 rounded-full border border-[#2F3D22] text-[#B6FF3B]">MANAGER</span>
                <span className="mono text-[11px] px-2 py-0.5 rounded-full border border-[#2A302B] text-[#8A918A]">LLM optional</span>
              </div>
              <div className="text-[14px] text-[#8A918A] mt-1">{PLANNER.subtitle}</div>
            </div>
            <div className="text-right shrink-0 pl-4">
              <div className="mono text-[11px] text-[#4A5249] uppercase tracking-wider">controller state</div>
              <div className="mono text-[17px] text-[#B6FF3B] font-semibold">{controllerState ?? "—"}</div>
              <div className="text-[12px] text-[#8A918A] mt-0.5">{nodeLabel["planner"] ?? "idle"}</div>
            </div>
          </div>
        </div>

        {/* ---- Nodes ---- */}
        {ALL_NODES.map((n) => {
          const s = st(n.id);
          const style = STATUS_STYLE[s];
          const isSub = n.owner === "sub";
          const tag = OWNER_TAG[n.owner];
          return (
            <div
              key={n.id}
              onClick={() => onSelect(n.id)}
              className="absolute rounded-[10px] cursor-pointer transition-all duration-200"
              style={{
                left: n.x, top: n.y, width: n.w, height: n.h,
                background: style.bg,
                border: `1px ${s === "skipped" ? "dashed" : "solid"} ${selected === n.id ? "#B6FF3B" : style.border}`,
                boxShadow: style.glow,
                opacity: s === "skipped" ? 0.5 : 1,
              }}
            >
              <div className={`h-full flex flex-col justify-center ${isSub ? "px-2.5" : "px-3"}`}>
                <div className="flex items-center gap-1.5">
                  <StatusMark s={s} />
                  <span className={`font-semibold text-[#E8EDE9] truncate ${isSub ? "text-[13.5px]" : "text-[15px]"}`}>{n.title}</span>
                </div>
                <div className={`text-[#8A918A] truncate ${isSub ? "text-[12px] mt-0.5" : "text-[13px] mt-0.5"}`}>
                  {nodeLabel[n.id] && s !== "idle" ? nodeLabel[n.id] : n.subtitle}
                </div>
                {!isSub && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="mono text-[10px] px-1.5 rounded-sm" style={{ color: tag.color, border: `1px solid ${tag.color}44` }}>
                      {tag.label}
                    </span>
                    {n.llm !== "none" && (
                      <span className="mono text-[10px] px-1.5 rounded-sm text-[#A78BFA] border border-[#2A2450]">
                        {n.llm === "primary" ? "LLM" : "LLM?"}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* sub-agent cluster caption */}
        <div className="absolute mono text-[11px] text-[#4A5249] uppercase tracking-wider" style={{ left: SUB_CLUSTER.x + 12, top: SUB_CLUSTER.y + 5 }}>
          Investigator sub-agents · 5 concurrent specialist evidence workers
        </div>
      </div>
    </div>
  );
}
