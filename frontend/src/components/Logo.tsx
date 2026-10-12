import React from "react";
import { Link } from "react-router-dom";

interface LogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "white" | "dark" | "auto";
  showText?: boolean;
  stacked?: boolean;
  clickable?: boolean;
  to?: string;
  className?: string;
}

export default function Logo({
  size = "md",
  variant = "white",
  showText = true,
  stacked = false,
  clickable = false,
  to = "/",
  className = "",
}: LogoProps) {
  // Height configurations
  const heightMap = {
    xs: "h-6",
    sm: "h-8",
    md: "h-9",
    lg: "h-12",
    xl: "h-16",
  };

  const currentHeight = heightMap[size] || heightMap.md;

  // Render the exact image asset provided by the user
  const content = stacked ? (
    <div className={`inline-flex flex-col items-center select-none group ${className}`}>
      <img
        src="/medisoc-logo.png"
        alt="MediSOC Official Logo"
        className={`${heightMap[size] === "h-16" ? "h-24" : heightMap[size] === "h-12" ? "h-16" : "h-12"} w-auto object-contain transition-transform duration-200 group-hover:scale-105`}
      />
    </div>
  ) : (
    <div className={`inline-flex items-center select-none group ${className}`}>
      <img
        src={variant === "dark" ? "/medisoc-logo.png" : "/medisoc-nav-logo.png"}
        alt="MediSOC"
        className={`${currentHeight} w-auto object-contain shrink-0 transition-transform duration-200 group-hover:scale-105`}
        onError={(e) => {
          // Fallback to medisoc-logo.png
          e.currentTarget.src = "/medisoc-logo.png";
        }}
      />
    </div>
  );

  if (clickable) {
    return (
      <Link
        to={to}
        className="inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lime)] rounded-md transition-opacity hover:opacity-90 shrink-0"
      >
        {content}
      </Link>
    );
  }

  return content;
}


