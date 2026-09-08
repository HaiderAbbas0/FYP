import React from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost" | "dark";

const base = "inline-flex items-center gap-2 rounded-[10px] font-semibold text-[19px] transition-all duration-150 cursor-pointer select-none focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed";

const variants: Record<Variant, string> = {
  primary: "bg-[#B6FF3B] text-[#0C0F0D] hover:bg-[#CAFF6A] active:scale-[0.98] px-4 py-2",
  secondary: "bg-[#1A1F1B] text-[#E8EDE9] border border-[#2A302B] hover:border-[#B6FF3B] hover:bg-[#1E241F] active:scale-[0.98] px-4 py-2",
  danger: "bg-[#EF4444] text-white hover:bg-[#DC2626] active:scale-[0.98] px-4 py-2",
  ghost: "bg-transparent text-[#94A8BA] hover:text-[#E8EDE9] hover:bg-[#1A1F1B] px-3 py-2",
  dark: "bg-[#E8EDE9] text-[#0C0F0D] hover:bg-white active:scale-[0.98] px-4 py-2",
};

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: React.ReactNode;
}

export default function Button({ variant = "primary", children, className = "", ...props }: Props) {
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
