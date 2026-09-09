import React from "react";
import {
  Area, Bar, CartesianGrid, ComposedChart, Line, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import type { TrafficWindow } from "../../agents/types";

/**
 * Live detection view over replayed CICIoMT2024 capture windows.
 *
 * Bars are the model's per-window verdict (how many of the 40 scored flows it
 * classified as TCP_Flood); the line is the mean attack probability that the
 * Planner actually routes on. Both are real `predict_proba` output, which is
 * why the baseline windows sit flat near zero and the onset is a step rather
 * than a ramp - the captures are separate benign and attack files.
 */
interface Props {
  windows: TrafficWindow[];
  expected: number;
  detectThreshold: number;
  fastPathFloor: number;
  running: boolean;
}

export default function DetectionChart({
  windows, expected, detectThreshold, fastPathFloor, running,
}: Props) {
  const data = windows.map((w) => ({
    t: w.t_offset_s,
    idx: w.index,
    attack: w.predicted_attack_rows,
    benign: w.rows - w.predicted_attack_rows,
    p: w.p_mean,
    detection: w.is_detection,
  }));

  const trigger = windows.find((w) => w.is_detection);
  const rows = windows[0]?.rows ?? 40;
  // keep the x-axis at full width from the start so the series grows into it
  const domain: [number, number] = [0, Math.max(1, expected - 1)];

  return (
    <div className="bg-[#111511] border border-[#242924] rounded-[12px] p-4">
      <div className="flex items-baseline justify-between mb-1 gap-4 flex-wrap">
        <div>
          <div className="mono text-[11px] uppercase tracking-wider text-[#4A5249]">
            Live detection · RandomForest over CICIoMT2024 capture windows
          </div>
          <div className="text-[13px] text-[#8A918A] mt-0.5">
            {rows} flows scored per {windows[0] ? "2.0" : "2.0"}s window · bars = flows classified TCP_Flood ·
            line = mean attack probability
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <div className="mono text-[10px] uppercase tracking-wider text-[#4A5249]">windows</div>
            <div className="mono text-[16px] text-[#E8EDE9]">{windows.length}<span className="text-[#4A5249]">/{expected}</span></div>
          </div>
          <div className="text-right">
            <div className="mono text-[10px] uppercase tracking-wider text-[#4A5249]">detection</div>
            <div className="mono text-[16px]" style={{ color: trigger ? "#EF4444" : "#4A5249" }}>
              {trigger ? `w${trigger.index} · p=${trigger.p_mean.toFixed(3)}` : running ? "monitoring…" : "—"}
            </div>
          </div>
        </div>
      </div>

      <div style={{ height: 168 }}>
        {windows.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[13px] text-[#4A5249]">
            Run the simulation to replay capture traffic through the detector.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 12, right: 8, bottom: 4, left: -18 }}>
              <CartesianGrid stroke="#1E241F" vertical={false} />
              <XAxis
                dataKey="idx" type="number" domain={domain} allowDecimals={false}
                tick={{ fill: "#4A5249", fontSize: 11 }} stroke="#242924"
                tickFormatter={(v) => `w${v}`}
              />
              <YAxis
                yAxisId="flows" domain={[0, rows]} tick={{ fill: "#4A5249", fontSize: 11 }} stroke="#242924"
              />
              <YAxis
                yAxisId="p" orientation="right" domain={[0, 1]} tick={{ fill: "#4A5249", fontSize: 11 }} stroke="#242924"
              />
              <Tooltip
                contentStyle={{ background: "#0A0D0A", border: "1px solid #242924", borderRadius: 8, fontSize: 12 }}
                labelFormatter={(v) => `window ${v}`}
                formatter={(value, name) => {
                  const n = Number(value ?? 0);
                  if (name === "p") return [n.toFixed(4), "mean attack probability"];
                  return [n, name === "attack" ? "flows classified TCP_Flood" : "flows classified benign"];
                }}
              />
              {/* A numeric XAxis gives Recharts no band to size bars from, so
                  barSize is explicit; without it the bars render zero-width. */}
              <Bar yAxisId="flows" dataKey="benign" stackId="f" fill="#1E4D2B" barSize={24} isAnimationActive={false} />
              <Bar yAxisId="flows" dataKey="attack" stackId="f" fill="#9B2C2C" barSize={24} radius={[2, 2, 0, 0]} isAnimationActive={false} />
              <Area yAxisId="p" dataKey="p" stroke="none" fill="#B6FF3B" fillOpacity={0.07} />
              <Line
                yAxisId="p" dataKey="p" stroke="#B6FF3B" strokeWidth={2} dot={{ r: 2, fill: "#B6FF3B" }}
                isAnimationActive={false}
              />
              <ReferenceLine
                yAxisId="p" y={detectThreshold} stroke="#F59E0B" strokeDasharray="4 4"
                label={{ value: `detect ${detectThreshold}`, fill: "#B4830E", fontSize: 10, position: "insideBottomRight" }}
              />
              <ReferenceLine
                yAxisId="p" y={fastPathFloor} stroke="#3F5C7A" strokeDasharray="4 4"
                label={{ value: `fast-path ${fastPathFloor}`, fill: "#5C7B99", fontSize: 10, position: "insideTopRight" }}
              />
              {trigger && (
                <ReferenceLine yAxisId="p" x={trigger.index} stroke="#EF4444" strokeWidth={1.5} />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
