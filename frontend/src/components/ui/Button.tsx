import React from "react";

type Variant = "primary" | "secondary" | "danger" | "warning" | "ghost";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

/**
 * Shared button. `type` defaults to "button" so a Button placed inside a form
 * no longer submits it implicitly — 91 buttons in the app relied on the
 * browser default of "submit".
 */
export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  children,
  ...props
}: Props) {
  const sizeClass = size === "sm" ? "btn-sm" : size === "lg" ? "btn-lg" : "";
  return (
    <button type={type} className={`btn btn-${variant} ${sizeClass} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}