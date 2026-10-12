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

/** All tones come from the token set so the dialog matches the rest of the app. */
const variantStyles = {
  warning: { icon: "var(--medium)", border: "var(--medium-line)", bg: "var(--surface)", confirmBg: "var(--medium-bg)", confirmBorder: "var(--medium-line)", confirmText: "var(--medium)", confirmHover: "var(--medium-soft)" },
  danger:  { icon: "var(--critical)", border: "var(--critical-line)", bg: "var(--surface)", confirmBg: "var(--critical-bg)", confirmBorder: "var(--critical-line)", confirmText: "var(--critical)", confirmHover: "var(--critical-soft)" },
  info:    { icon: "var(--text-3)", border: "var(--border-2)", bg: "var(--surface)", confirmBg: "var(--surface-3)", confirmBorder: "var(--border-3)", confirmText: "var(--text)", confirmHover: "var(--surface-4)" },
};

const icons = {
  warning: (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
      <path d="M11 3L20 19H2L11 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M11 9v5M11 16v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  danger: (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path d="M11 7v5M11 14v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  info: (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
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
  const panelRef = useRef<HTMLDivElement>(null);

  // Focus cancel button on open (safer default for destructive dialogs)
  useEffect(() => {
    if (open) {
      setTimeout(() => cancelRef.current?.focus(), 50);
    }
  }, [open]);

  // Close on Escape; keep focus inside the dialog while it is open
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
        return;
      }
      if (e.key !== "Tab") return;
      const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        ref={panelRef}
        className="animate-in fade-in slide-in-from-top-1 w-full max-w-[440px] overflow-hidden rounded-[14px]"
        style={{ background: s.bg, border: `1px solid ${s.border}`, boxShadow: "var(--shadow-xl)" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        {/* Header */}
        <div className="flex items-start gap-4 px-6 pt-6 pb-4">
          <div style={{ color: s.icon }} className="shrink-0 mt-0.5">{icons[variant]}</div>
          <div>
            <div id="confirm-dialog-title" className="text-[17px] font-semibold mb-1 text-[var(--text)]">
              {title}
            </div>
            <div className="text-[14px] leading-relaxed text-[var(--text-3)]">{description}</div>
          </div>
        </div>

        {/* Optional additional content */}
        {children && <div className="px-6 pb-4 text-[var(--text-3)]">{children}</div>}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: `1px solid ${s.border}` }}>
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="btn"
            style={{ background: s.confirmBg, color: s.confirmText, border: `1px solid ${s.confirmBorder}` }}
            onMouseEnter={(e) => { e.currentTarget.style.background = s.confirmHover; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = s.confirmBg; }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}