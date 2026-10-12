import React from "react";

interface Props {
  children: React.ReactNode;
  className?: string;
  dark?: boolean;
  onClick?: () => void;
  hover?: boolean;
}

export default function Card({ children, className = "", dark = false, onClick, hover = false }: Props) {
  const base = dark
    ? "bg-[#0A0D0A] border border-[#1A1F1B] text-[#E8EDE9]"
    : "bg-[#111511] border border-[#242924] text-[#E8EDE9]";
  const hov = hover
    ? "cursor-pointer transition-all duration-150 hover:border-[#2A302B] hover:bg-[#141814]"
    : "";
  return (
    <div
      className={`rounded-[12px] ${base} ${hov} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
