import React from "react";

interface Props {
  children: React.ReactNode;
  className?: string;
  /** Slightly raised surface for priority panels. */
  elevated?: boolean;
  hover?: boolean;
  onClick?: () => void;
}

export default function Card({ children, className = "", elevated = false, hover = false, onClick }: Props) {
  const base = elevated ? "card-elevated" : "card";
  const hov = hover ? "transition-colors duration-150 hover:border-[var(--border-2)] hover:bg-[var(--surface-2)]" : "";
  return (
    <div className={`${base} ${hov} ${className}`.trim()} onClick={onClick}>
      {children}
    </div>
  );
}