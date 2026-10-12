import React, { useState } from "react";
import { services } from "../data/mock";
import type { Screen } from "../types";
import { useAuth } from "../auth/AuthContext";
import Field from "../components/Field";

interface Props {
  onNavigate: (s: Screen) => void;
}

// ── Icons ──
const serviceIcons: Record<string, React.ReactNode> = {
  "Edge Gateway": (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.2">
      <rect x="2" y="5" width="14" height="8" rx="2" />
      <path d="M6 9h6M9 7v4" strokeLinecap="round" />
    </svg>
  ),
  "Detector": (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.2">
      <circle cx="9" cy="9" r="6" />
      <path d="M6 9l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  "Controller": (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M3 6h12M3 9h8M3 12h6" strokeLinecap="round" />
    </svg>
  ),
  "Case Memory": (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.2">
      <rect x="3" y="3" width="12" height="12" rx="2" />
      <path d="M6 7h6M6 10h4" strokeLinecap="round" />
    </svg>
  ),
  "MQTT Broker": (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M2 9h2M14 9h2M9 2v2M9 14v2M4.93 4.93l1.41 1.41M11.66 11.66l1.41 1.41M4.93 13.07l1.41-1.41M11.66 6.34l1.41-1.41" strokeLinecap="round" />
      <circle cx="9" cy="9" r="2.5" />
    </svg>
  ),
  "Database": (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.2">
      <ellipse cx="9" cy="5.5" rx="6" ry="2.5" />
      <path d="M3 5.5v7c0 1.38 2.69 2.5 6 2.5s6-1.12 6-2.5v-7" />
      <path d="M3 9c0 1.38 2.69 2.5 6 2.5S15 10.38 15 9" />
    </svg>
  ),
};

function Toggle({ label, sub, checked, onChange, disabled }: any) {
  return (
    <div
      className="flex items-center justify-between gap-4 py-3.5 last:pb-0"
      style={{ borderBottom: "1px solid var(--border)" }}
    >
      <div className="min-w-0">
        <div className="text-[14px] font-medium text-[var(--text)]">{label}</div>
        {sub && <div className="mt-0.5 max-w-[520px] text-[12.5px] leading-relaxed text-[var(--text-4)]">{sub}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        className="relative h-6 w-11 shrink-0 rounded-full transition-colors"
        style={{
          background: checked ? "var(--lime)" : "var(--surface-4)",
          border: `1px solid ${checked ? "var(--lime)" : "var(--border-2)"}`,
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? "not-allowed" : "pointer",
        }}
        onClick={() => !disabled && onChange(!checked)}
      >
        <span
          className="absolute top-0.5 h-4 w-4 rounded-full transition-all"
          style={{
            background: checked ? "var(--on-lime)" : "#718578",
            left: checked ? "calc(100% - 18px)" : "3px",
          }}
          aria-hidden
        />
      </button>
    </div>
  );
}

function PasswordInput({
  fieldProps,
  value,
  onChange,
  show,
  onToggle,
  placeholder,
}: any) {
  return (
    <div className="relative">
      <input
        {...fieldProps}
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete="off"
        className={`${fieldProps.className} pr-14`}
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={show ? "Hide password" : "Show password"}
        aria-pressed={show}
        className="mono absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[var(--text-4)] transition-colors hover:text-[var(--text-2)]"
      >
        {show ? "HIDE" : "SHOW"}
      </button>
    </div>
  );
}

export default function SystemHealth({ onNavigate }: Props) {
  const { user, changePassword } = useAuth();
  const [tab, setTab] = useState<"health" | "settings" | "security">("settings");

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);

  // Settings Toggles State
  const [activeContainment, setActiveContainment] = useState(true);
  const [autoCritical, setAutoCritical] = useState(false);
  const [caseMemoryReuse, setCaseMemoryReuse] = useState(true);
  const [allowlistCheck, setAllowlistCheck] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [auditExport, setAuditExport] = useState(true);

  // Password strength calculation
  const hasMinLength = newPassword.length >= 8;
  const hasNumber = /\d/.test(newPassword);
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const strengthScore = [hasMinLength, hasNumber, hasUpper, hasSpecial].filter(Boolean).length;
  const strengthLabel = strengthScore <= 1 ? "Weak" : strengthScore <= 2 ? "Moderate" : "Strong";
  const strengthColor = strengthScore <= 1 ? "var(--critical)" : strengthScore <= 2 ? "var(--medium)" : "var(--lime)";
  const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    if (!currentPassword) {
      setPassError("Please enter your current password.");
      return;
    }
    if (!newPassword) {
      setPassError("Please enter a new password.");
      return;
    }
    if (newPassword.length < 6) {
      setPassError("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError("New password and confirmation do not match.");
      return;
    }

    setPassLoading(true);
    try {
      const res = await changePassword(currentPassword, newPassword);
      if (res.success) {
        setPassSuccess("Password updated successfully! Your next login will use your new password.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPassError(res.error || "Failed to update password. Please verify current password.");
      }
    } catch (err: any) {
      setPassError(err.message || "An unexpected error occurred.");
    } finally {
      setPassLoading(false);
    }
  }

  const TABS = [
    { id: "settings" as const, label: "System Settings" },
    { id: "security" as const, label: "Change Password & Security", dot: true },
    { id: "health" as const, label: "Service Health Telemetry" },
  ];

  return (
    <div className="h-full overflow-y-auto">
      <div className="page max-w-[1200px]">
        <div className="page-header">
          <div>
            <div className="t-label mb-1.5" style={{ color: "var(--lime)" }}>SYSTEM CONFIGURATION &amp; SECURITY</div>
            <h1 className="page-title">System &amp; Settings</h1>
            <p className="page-sub">
              Manage MediSOC telemetry services, automated response policies, and user account security.
            </p>
          </div>

          <span className="badge shrink-0" style={{ background: "var(--low-bg)", borderColor: "var(--low-line)", color: "var(--success)" }}>
            <span className="dot dot-online" aria-hidden />
            ALL MICROSERVICES NOMINAL
          </span>
        </div>

        <div className="tab-nav mb-5" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`tab-btn ${tab === t.id ? "active" : ""}`}
            >
              <span className="flex items-center gap-2">
                {t.label}
                {t.dot && <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--lime)" }} aria-hidden />}
              </span>
            </button>
          ))}
        </div>

        {/* TAB: CHANGE PASSWORD & ACCOUNT SECURITY */}
        {tab === "security" && (
          <div className="space-y-5">
            <div className="panel">
              <div className="panel-head">
                <h2>Active User Profile</h2>
              </div>
              <div className="panel-body grid grid-cols-1 gap-3 md:grid-cols-3">
                {[
                  { label: "User Account", value: user?.name ?? "SOC Super Admin", sub: user?.email ?? "admin@iomt-testbed.local", subColor: "var(--lime)" },
                  { label: "Access Role", value: user?.role?.replace("_", " ") ?? "Super Admin", sub: "Full SOC & Lab Simulation Permissions", subColor: "var(--text-4)" },
                  { label: "Session Status", value: "Authenticated & Verified", sub: "Token valid · TLS 1.3 encrypted", subColor: "var(--success)", dot: true },
                ].map((c) => (
                  <div key={c.label} className="rounded-lg p-4" style={{ background: "var(--well)", border: "1px solid var(--border)" }}>
                    <div className="t-label mb-1.5">{c.label}</div>
                    <div className="flex items-center gap-2 text-[15px] font-bold text-[var(--text)]">
                      {c.dot && <span className="dot dot-online" aria-hidden />}
                      {c.value}
                    </div>
                    <div className="mono mt-1 text-[12.5px]" style={{ color: c.subColor }}>{c.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel max-w-[760px]">
              <div className="panel-head">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: "var(--lime-soft)", border: "1px solid var(--lime-line)", color: "var(--lime)" }}
                    aria-hidden
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-[17px] font-bold text-[var(--text)]">Change Account Password</h2>
                    <p className="mt-0.5 text-[13px] text-[var(--text-4)]">
                      Update your MediSOC login credentials to secure your analyst session.
                    </p>
                  </div>
                </div>
              </div>

              <div className="panel-body">
                {passSuccess && (
                  <div className="alert-success mb-5 text-[13.5px]">
                    <span className="font-semibold">Password Updated Successfully</span>
                    <div className="mt-0.5 text-[13px] text-[var(--text-3)]">{passSuccess}</div>
                  </div>
                )}
                {passError && (
                  <div className="alert-critical mb-5 text-[13.5px]">
                    <span className="font-semibold">Password Update Error</span>
                    <div className="mt-0.5 text-[13px] text-[var(--text-3)]">{passError}</div>
                  </div>
                )}

                <form onSubmit={handlePasswordSubmit} className="space-y-5">
                  <Field label="Current Password">
                    {(p) => (
                      <PasswordInput
                        fieldProps={p}
                        value={currentPassword}
                        onChange={(e: any) => setCurrentPassword(e.target.value)}
                        show={showCurrent}
                        onToggle={() => setShowCurrent(!showCurrent)}
                        placeholder="Enter current password (e.g. admin123)"
                      />
                    )}
                  </Field>
                  <p className="-mt-3 text-[11.5px] text-[var(--text-4)]">
                    Default demo passwords: <code style={{ color: "var(--lime)" }}>admin123</code> (Admin),{" "}
                    <code style={{ color: "var(--lime)" }}>analyst123</code> (Analyst).
                  </p>

                  <Field label="New Password">
                    {(p) => (
                      <PasswordInput
                        fieldProps={p}
                        value={newPassword}
                        onChange={(e: any) => setNewPassword(e.target.value)}
                        show={showNew}
                        onToggle={() => setShowNew(!showNew)}
                        placeholder="Enter new password (min. 6 chars)"
                      />
                    )}
                  </Field>

                  {newPassword.length > 0 && (
                    <div className="animate-in fade-in -mt-2.5 space-y-1.5">
                      <div className="mono flex items-center justify-between text-[11.5px]">
                        <span className="text-[var(--text-4)]">Password Strength:</span>
                        <span style={{ color: strengthColor }}>{strengthLabel}</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "var(--surface-3)" }}>
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${(Math.max(strengthScore, 1) / 4) * 100}%`,
                            background: strengthColor,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <Field label="Confirm New Password" error={mismatch ? "Passwords do not match" : null}>
                    {(p) => (
                      <PasswordInput
                        fieldProps={p}
                        value={confirmPassword}
                        onChange={(e: any) => setConfirmPassword(e.target.value)}
                        show={showConfirm}
                        onToggle={() => setShowConfirm(!showConfirm)}
                        placeholder="Re-enter new password"
                      />
                    )}
                  </Field>

                  <div
                    className="flex items-center justify-between gap-4 border-t pt-4"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <button type="submit" disabled={passLoading} className="btn btn-primary">
                      {passLoading ? "Updating Password..." : "Save New Password"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentPassword("");
                        setNewPassword("");
                        setConfirmPassword("");
                        setPassError(null);
                        setPassSuccess(null);
                      }}
                      className="text-[13px] text-[var(--text-4)] transition-colors hover:text-[var(--text-2)]"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="panel max-w-[760px]">
              <div className="panel-head">
                <h2>Two-Factor Authentication &amp; Access Security</h2>
              </div>
              <div className="panel-body space-y-3">
                <div
                  className="flex items-center justify-between gap-4 rounded-lg p-3.5"
                  style={{ background: "var(--well)", border: "1px solid var(--border)" }}
                >
                  <div>
                    <div className="text-[14px] font-bold text-[var(--text)]">Two-Factor Authentication (2FA)</div>
                    <div className="mt-0.5 text-[12.5px] text-[var(--text-4)]">Enforce TOTP authenticator token on analyst login</div>
                  </div>
                  <span className="badge shrink-0" style={{ background: "var(--lime-soft)", borderColor: "var(--lime-line)", color: "var(--lime)" }}>
                    ENABLED
                  </span>
                </div>

                <div
                  className="flex items-center justify-between gap-4 rounded-lg p-3.5"
                  style={{ background: "var(--well)", border: "1px solid var(--border)" }}
                >
                  <div>
                    <div className="text-[14px] font-bold text-[var(--text)]">Auto Session Inactivity Timeout</div>
                    <div className="mt-0.5 text-[12.5px] text-[var(--text-4)]">Automatically locks terminal after 15 minutes of inactivity</div>
                  </div>
                  <span className="mono shrink-0 text-[12.5px] text-[var(--text-2)]">15 MIN</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: SYSTEM SETTINGS */}
        {tab === "settings" && (
          <div className="panel max-w-[840px]">
            <div className="panel-head">
              <div>
                <h2 className="text-[17px] font-bold text-[var(--text)]">Automated Response &amp; Safety Policies</h2>
                <p className="mt-1 text-[13px] text-[var(--text-4)]">
                  Configure how MediSOC handles high-confidence DDoS detections and medical device isolations.
                </p>
              </div>
            </div>
            <div className="panel-body">
              <div className="space-y-3">
                <Toggle
                  label="Enable Active Containment"
                  sub="Allow Controller to propose real-time network modifications (requires manual approval by default)."
                  checked={activeContainment}
                  onChange={setActiveContainment}
                />
                <Toggle
                  label="Auto-Execute Critical Mitigation"
                  sub="Skip manual approval for Critical severity incidents with > 98% confidence score."
                  checked={autoCritical}
                  onChange={setAutoCritical}
                />
                <Toggle
                  label="BioMed Clinical Safeguard Validation"
                  sub="Verify device tier with BioMed database before applying packet filters to prevent clinical downtime."
                  checked={allowlistCheck}
                  onChange={setAllowlistCheck}
                />
              </div>

              <div className="mb-4 mt-6 border-t pt-5" style={{ borderColor: "var(--border)" }}>
                <h2 className="text-[17px] font-bold text-[var(--text)]">Investigation &amp; Case Memory Settings</h2>
                <p className="mt-1 text-[13px] text-[var(--text-4)]">
                  Tuning the Case-Based Reasoning (CBR) pipeline and similarity thresholds.
                </p>
              </div>

              <div className="space-y-3">
                <Toggle
                  label="Use Historical Case Memory (CBR)"
                  sub="Check past incidents to recommend safe reuse of successful mitigation playbooks."
                  checked={caseMemoryReuse}
                  onChange={setCaseMemoryReuse}
                />
                <Toggle
                  label="Critical Event Email &amp; SIEM Notifications"
                  sub="Transmit automated webhooks to hospital SIEM / Splunk upon incident triage."
                  checked={emailAlerts}
                  onChange={setEmailAlerts}
                />
                <Toggle
                  label="Immutable Audit Trail Logging"
                  sub="Maintain cryptographic hash chain for all analyst actions and simulation records."
                  checked={auditExport}
                  onChange={setAuditExport}
                />
              </div>

              <div
                className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-4"
                style={{ borderColor: "var(--border)" }}
              >
                <span className="mono text-[12px]" style={{ color: "var(--lime)" }}>Config auto-saved to localStorage</span>
                <button type="button" onClick={() => setTab("security")} className="btn btn-secondary btn-sm">
                  Manage Account &amp; Password →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB: SERVICE HEALTH TELEMETRY */}
        {tab === "health" && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {services.map((s) => {
              const online = s.status === "Online";
              return (
                <div key={s.name} className="panel flex flex-col justify-between p-5">
                  <div>
                    <div className="mb-4 flex items-start justify-between">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                        style={{ background: "var(--surface-3)", border: "1px solid var(--border-2)", color: "var(--text-3)" }}
                        aria-hidden
                      >
                        {serviceIcons[s.name] || <span className="mono">#</span>}
                      </div>
                      <span
                        className="badge shrink-0"
                        style={{
                          background: online ? "var(--low-bg)" : "var(--critical-bg)",
                          borderColor: online ? "var(--low-line)" : "var(--critical-line)",
                          color: online ? "var(--success)" : "var(--critical)",
                        }}
                      >
                        <span className="dot" style={{ background: online ? "var(--success)" : "var(--critical)" }} aria-hidden />
                        {s.status}
                      </span>
                    </div>

                    <h3 className="mb-1 text-[16px] font-bold text-[var(--text)]">{s.name}</h3>
                    <div className="mono mb-4 text-[12px] text-[var(--text-4)]">{s.detail}</div>

                    <div className="mb-4 space-y-2 rounded-lg p-3" style={{ background: "var(--well)", border: "1px solid var(--border)" }}>
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="text-[var(--text-4)]">Latency</span>
                        <span className="mono font-bold" style={{ color: online ? "var(--success)" : "var(--critical)" }}>{s.latency}</span>
                      </div>
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="text-[var(--text-4)]">Uptime</span>
                        <span className="mono font-bold text-[var(--text)]">99.98%</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-3 text-[11.5px] leading-relaxed text-[var(--text-4)]" style={{ borderColor: "var(--border)" }}>
                    {s.impact}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}