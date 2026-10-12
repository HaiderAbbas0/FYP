/**
 * Shared shell for the five authentication pages.
 *
 * Login, Forgot Password, Reset Password, Accept Invitation and Verify Email
 * previously each carried their own copy of the same grid pattern, glow blob
 * and card markup. The layout is identical on every page, so it lives here
 * once; each page supplies only its own heading, copy and form.
 */
import React from "react";

/** Show / hide password toggle, shared by every password field on these pages. */
export function PasswordField({
  fieldProps,
  value,
  onChange,
  show,
  onToggle,
  placeholder,
  disabled,
  autoComplete = "new-password",
  onValidMatch,
}: {
  fieldProps: { id: string; className: string; "aria-describedby"?: string; "aria-invalid"?: boolean };
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  placeholder?: string;
  disabled?: boolean;
  autoComplete?: string;
  /** Rendered at the right of the control when the confirmation matches. */
  onValidMatch?: boolean;
}) {
  return (
    <div className="relative">
      <input
        {...fieldProps}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
        className={`${fieldProps.className} mono pr-11 disabled:opacity-50`}
      />
      {onValidMatch ? (
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--success)" }} aria-hidden>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </span>
      ) : (
        <button
          type="button"
          onClick={onToggle}
          aria-label={show ? "Hide password" : "Show password"}
          aria-pressed={show}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--text-4)] transition-colors hover:text-[var(--text-2)]"
        >
          {show ? (
            <svg width="17" height="17" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.2" />
              <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.2" />
              <line x1="3" y1="3" x2="13" y2="13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="17" height="17" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.2" />
              <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}

/** Three-segment rule meter shown under every new-password field. */
export function StrengthMeter({ value }: { value: string }) {
  const rules = [value.length >= 8, /[A-Z]/.test(value), /[0-9]/.test(value)];
  return (
    <div className="flex gap-1.5" role="img" aria-label={`Password rules met: ${rules.filter(Boolean).length} of 3 — at least 8 characters, one capital letter, one number`}>
      {rules.map((ok, i) => (
        <span
          key={i}
          className="h-1.5 flex-1 rounded-full transition-colors duration-200"
          style={{ background: value && ok ? "var(--success)" : "var(--surface-4)" }}
        />
      ))}
    </div>
  );
}

/** Check-mark disc used by every success state on these pages. */
export function ResultDisc({ tone }: { tone: "success" | "critical" }) {
  const success = tone === "success";
  return (
    <div
      className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full"
      style={{
        background: success ? "var(--low-bg)" : "var(--critical-bg)",
        border: `1px solid ${success ? "var(--low-line)" : "var(--critical-line)"}`,
      }}
      aria-hidden
    >
      {success ? (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M5 13l4 4L19 7" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M18 6L6 18M6 6l12 12" stroke="var(--critical)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}

/** Inline error banner shared by all five pages. */
export function AuthError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="alert-critical mb-5 flex items-start gap-3 text-[13.5px]" role="alert">
      <svg width="16" height="16" viewBox="0 0 14 14" fill="none" className="mt-0.5 shrink-0" aria-hidden>
        <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" />
        <path d="M7 4.5v3M7 9v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
      <span className="text-[var(--text-2)]">{message}</span>
    </div>
  );
}

export default function AuthShell({
  title,
  subtitle,
  children,
  width = "max-w-[440px]",
}: {
  /** Omit when the page renders its own brand block above the card. */
  title?: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  width?: string;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden" style={{ background: "var(--bg)" }}>
      {/* Grid */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <defs>
          <pattern id="auth-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#A8FF35" strokeWidth="0.4" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#auth-grid)" />
      </svg>

      {/* Soft brand wash, kept faint so text contrast stays well above 4.5:1 */}
      <div
        className="pointer-events-none absolute left-1/4 top-1/4 h-[400px] w-[400px] rounded-full opacity-[0.03] blur-[120px]"
        style={{ background: "var(--lime)" }}
        aria-hidden
      />

      <div className={`animate-in fade-in relative w-full ${width} px-6 py-12`}>
        {title && (
          <div className="mb-7 text-center">
            <h1 className="t-h1 text-[var(--text)]">{title}</h1>
            {subtitle && <p className="t-lead mt-2 text-[var(--text-3)]">{subtitle}</p>}
          </div>
        )}
        <div className="card-elevated p-7">{children}</div>
      </div>
    </div>
  );
}