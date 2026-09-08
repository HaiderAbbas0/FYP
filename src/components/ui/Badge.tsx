import React from "react";

type Variant = "default" | "success" | "danger" | "warning" | "violet" | "lime" | "dark" | "outline";

const variants: Record<Variant, string> = {
  default: "bg-[#1A1F1B] text-[#E8EDE9] border border-[#2A302B]",
  success: "bg-[#14291A] text-[#4ADE80] border border-[#1A3D22]",
  danger: "bg-[#2C1010] text-[#F87171] border border-[#3D1A1A]",
  warning: "bg-[#2C1E06] text-[#FBBF24] border border-[#3D2A0A]",
  violet: "bg-[#1E1A3D] text-[#A78BFA] border border-[#2A2450]",
  lime: "bg-[#B6FF3B] text-[#0C0F0D] border border-[#9EDE2E]",
  dark: "bg-[#E8EDE9] text-[#0C0F0D] border border-[#C0C8C1]",
  outline: "bg-transparent text-[#94A8BA] border border-[#2A302B]",
};

interface Props {
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md";
}

export default function Badge({ variant = "default", children, className = "", size = "sm" }: Props) {
  const sz = size === "sm" ? "px-2 py-0.5 text-[14px]" : "px-3 py-1 text-[15px]";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium mono uppercase tracking-wide whitespace-nowrap ${sz} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

export function CriticalityBadge({ value }: { value: string }) {
  const map: Record<string, "danger" | "warning" | "violet" | "outline"> = {
    Critical: "danger", High: "warning", Medium: "violet", Low: "outline",
  };
  return <Badge variant={map[value] || "default"}>{value}</Badge>;
}

export function RouteBadge({ value }: { value: string }) {
  const map: Record<string, "lime" | "warning" | "dark"> = {
    SHORT: "lime", PARTIAL: "warning", DEEP: "dark",
  };
  return <Badge variant={map[value] || "default"}>{value}</Badge>;
}

export function OutcomeBadge({ value }: { value: string }) {
  const map: Record<string, "success" | "warning" | "danger"> = {
    SUCCESS: "success", PARTIAL: "warning", FAILURE: "danger", HARMFUL: "danger",
  };
  return <Badge variant={map[value] || "default"}>{value}</Badge>;
}

export function StatusDot({ online }: { online: boolean }) {
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${online ? "bg-[#22C55E] lime-pulse" : "bg-[#EF4444]"}`} />
  );
}
