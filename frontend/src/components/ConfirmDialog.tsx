import React, { useEffect, useRef } from "react";

interface Props {
  open: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "warning" | "danger" | "info";
  onConfirm: () => void;
  onCancel: () => void;
  /** Optional additional content rendered below description */
  children?: React.ReactNode;
}

const variantStyles = {
  warning: {
    icon: "#F59E0B",
    border: "#2A2010",
    bg: "#0F0D08",
    confirmBg: "#2A1E08",
    confirmBorder: "#3A2A10",
    confirmText: "#F59E0B",
    confirmHover: "#3A2A10",
  },
  danger: {
    icon: "#EF4444",
    border: "#2A1010",
    bg: "#0F0808",
    confirmBg: "#2A1010",
    confirmBorder: "#3A1818",
    confirmText: "#EF4444",
    confirmHover: "#3A1818",
  },
  info: {
    icon: "#94A8BA",
    border: "#1A1E1B",
    bg: "#0D100D",
    confirmBg: "#1A1E1B",
    confirmBorder: "#2A302B",
    confirmText: "#E8EDE9",
    confirmHover: "#2A302B",
  },
};

const icons = {
  warning: (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M11 3L20 19H2L11 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M11 9v5M11 16v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  danger: (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path d="M11 7v5M11 14v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  info: (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path d="M11 10v5M11 8v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
};

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "warning",
  onConfirm,
  onCancel,
  children,
}: Props) {
  const s = variantStyles[variant];
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Focus cancel button on open (safer default for destructive dialogs)
  useEffect(() => {
    if (open) {
      setTimeout(() => cancelRef.current?.focus(), 50);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        className="w-full max-w-[440px] mx-4 rounded-[14px] shadow-2xl fade-in"
        style={{ background: s.bg, border: `1px solid ${s.border}` }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        {/* Header */}
        <div className="flex items-start gap-4 px-6 pt-6 pb-4">
          <div style={{ color: s.icon }} className="shrink-0 mt-0.5">{icons[variant]}</div>
          <div>
            <div
              id="confirm-dialog-title"
              className="text-[17px] font-semibold mb-1"
              style={{ color: "#E8EDE9" }}
            >
              {title}
            </div>
            <div className="text-[14px] leading-relaxed" style={{ color: "#94A8BA" }}>
              {description}
            </div>
          </div>
        </div>

        {/* Optional additional content */}
        {children && (
          <div className="px-6 pb-4" style={{ color: "#94A8BA" }}>
            {children}
          </div>
        )}

        {/* Actions */}
        <div
          className="flex items-center justify-end gap-3 px-6 py-4"
          style={{ borderTop: `1px solid ${s.border}` }}
        >
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="px-4 py-2 text-[14px] font-medium rounded-[8px] transition-colors"
            style={{
              background: "transparent",
              color: "#94A8BA",
              border: "1px solid #1A1E1B",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#2A302B"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#1A1E1B"; }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-[14px] font-semibold rounded-[8px] transition-colors mono"
            style={{
              background: s.confirmBg,
              color: s.confirmText,
              border: `1px solid ${s.confirmBorder}`,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = s.confirmHover; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = s.confirmBg; }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
