import React, { useState } from "react";
import { services } from "../data/mock";
import type { Screen } from "../types";
import { useAuth } from "../auth/AuthContext";

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
    <div className="flex items-center justify-between py-4 border-b last:border-0" style={{ borderColor: "var(--border)" }}>
      <div>
        <div className="text-[14px] font-medium text-white">{label}</div>
        {sub && <div className="text-[12px] mt-0.5 text-white/60">{sub}</div>}
      </div>
      <button
        type="button"
        className="w-11 h-6 rounded-full relative transition-colors"
        style={{
          background: checked ? "var(--lime)" : "#1E2621",
          border: checked ? "1px solid var(--lime)" : "1px solid #2B3830",
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? "not-allowed" : "pointer",
        }}
        onClick={() => !disabled && onChange(!checked)}
      >
        <div
          className="absolute top-0.5 w-4 h-4 rounded-full transition-all shadow-sm"
          style={{
            background: checked ? "#0C0F0D" : "#718578",
            left: checked ? "calc(100% - 18px)" : "3px",
          }}
        />
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

  return (
    <div className="h-full overflow-y-auto bg-[#070908] text-white p-6 lg:p-8 font-sans">
      <div className="max-w-[1200px] mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-[12px] font-mono font-bold tracking-widest text-[#A8FF35] uppercase mb-1">
              SYSTEM CONFIGURATION & SECURITY
            </div>
            <h1 className="text-[28px] lg:text-[32px] font-bold text-white tracking-tight">
              System & Settings
            </h1>
            <p className="text-[14px] text-white/60 mt-1">
              Manage MediSOC telemetry services, automated response policies, and user account security.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1CC970] animate-pulse" />
            <span className="text-[13px] font-mono font-bold text-[#1CC970]">ALL MICROSERVICES NOMINAL</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#1B261F] pb-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setTab("settings")}
            className={`px-4 py-2 rounded-lg text-[14px] font-semibold transition-all whitespace-nowrap ${
              tab === "settings"
                ? "bg-[#16211A] text-[#A8FF35] border border-[#23382B]"
                : "text-white/70 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            System Settings
          </button>
          <button
            type="button"
            onClick={() => setTab("security")}
            className={`px-4 py-2 rounded-lg text-[14px] font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
              tab === "security"
                ? "bg-[#16211A] text-[#A8FF35] border border-[#23382B]"
                : "text-white/70 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <span>Change Password & Security</span>
            <span className="w-2 h-2 rounded-full bg-[#A8FF35]" />
          </button>
          <button
            type="button"
            onClick={() => setTab("health")}
            className={`px-4 py-2 rounded-lg text-[14px] font-semibold transition-all whitespace-nowrap ${
              tab === "health"
                ? "bg-[#16211A] text-[#A8FF35] border border-[#23382B]"
                : "text-white/70 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            Service Health Telemetry
          </button>
        </div>

        {/* TAB 1: CHANGE PASSWORD & ACCOUNT SECURITY */}
        {tab === "security" && (
          <div className="space-y-6">
            
            {/* User Profile Overview */}
            <div className="bg-[#0D120F] border border-[#1B261F] rounded-xl p-6 shadow-xl">
              <h2 className="text-[17px] font-semibold text-white mb-4">
                Active User Profile
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-[#080B09] border border-[#1B261F]">
                  <div className="text-[11px] font-mono uppercase text-white/50 mb-1">User Account</div>
                  <div className="text-[15px] font-bold text-white">{user?.name ?? "SOC Super Admin"}</div>
                  <div className="text-[13px] text-[#A8FF35] font-mono mt-0.5">{user?.email ?? "admin@iomt-testbed.local"}</div>
                </div>

                <div className="p-4 rounded-lg bg-[#080B09] border border-[#1B261F]">
                  <div className="text-[11px] font-mono uppercase text-white/50 mb-1">Access Role</div>
                  <div className="text-[15px] font-bold text-white capitalize">{user?.role?.replace("_", " ") ?? "Super Admin"}</div>
                  <div className="text-[12px] text-white/60 mt-0.5">Full SOC & Lab Simulation Permissions</div>
                </div>

                <div className="p-4 rounded-lg bg-[#080B09] border border-[#1B261F]">
                  <div className="text-[11px] font-mono uppercase text-white/50 mb-1">Session Status</div>
                  <div className="text-[15px] font-bold text-[#1CC970] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#1CC970]" />
                    Authenticated & Verified
                  </div>
                  <div className="text-[12px] text-white/60 mt-0.5">Token valid · TLS 1.3 encrypted</div>
                </div>
              </div>
            </div>

            {/* Change Password Card */}
            <div className="bg-[#0D120F] border border-[#1B261F] rounded-xl p-6 shadow-xl max-w-[760px]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-[#16211A] border border-[#23382B] flex items-center justify-center text-[#A8FF35]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-[18px] font-bold text-white">
                    Change Account Password
                  </h2>
                  <p className="text-[13px] text-white/60">
                    Update your MediSOC login credentials to secure your analyst session.
                  </p>
                </div>
              </div>

              {/* Success Banner */}
              {passSuccess && (
                <div className="mb-6 p-4 rounded-lg bg-[#0D2415] border border-[#1CC970]/40 text-[#1CC970] text-[14px] flex items-start gap-3">
                  <span className="text-[18px]">✓</span>
                  <div>
                    <div className="font-bold">Password Updated Successfully</div>
                    <div className="text-[13px] text-white/80 mt-0.5">{passSuccess}</div>
                  </div>
                </div>
              )}

              {/* Error Banner */}
              {passError && (
                <div className="mb-6 p-4 rounded-lg bg-[#2D1212] border border-[#FF5555]/40 text-[#FF5555] text-[14px] flex items-start gap-3">
                  <span className="text-[18px]">⚠️</span>
                  <div>
                    <div className="font-bold">Password Update Error</div>
                    <div className="text-[13px] text-white/80 mt-0.5">{passError}</div>
                  </div>
                </div>
              )}

              <form onSubmit={handlePasswordSubmit} className="space-y-5">
                
                {/* Current Password */}
                <div>
                  <label className="block text-[12px] font-mono font-bold uppercase tracking-wider text-white/70 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrent ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password (e.g. admin123)"
                      className="w-full bg-[#080B09] border border-[#1B261F] rounded-lg px-4 py-2.5 text-[14px] text-white placeholder-white/30 focus:outline-none focus:border-[#A8FF35] transition-colors pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors text-[12px] font-mono"
                    >
                      {showCurrent ? "HIDE" : "SHOW"}
                    </button>
                  </div>
                  <span className="text-[11px] text-white/40 mt-1 block">
                    Default demo passwords: <code className="text-[#A8FF35]">admin123</code> (Admin), <code className="text-[#A8FF35]">analyst123</code> (Analyst).
                  </span>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-[12px] font-mono font-bold uppercase tracking-wider text-white/70 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min. 6 chars)"
                      className="w-full bg-[#080B09] border border-[#1B261F] rounded-lg px-4 py-2.5 text-[14px] text-white placeholder-white/30 focus:outline-none focus:border-[#A8FF35] transition-colors pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors text-[12px] font-mono"
                    >
                      {showNew ? "HIDE" : "SHOW"}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {newPassword.length > 0 && (
                    <div className="mt-2.5 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-white/60">Password Strength:</span>
                        <span className={
                          strengthScore <= 1 ? "text-red-400 font-bold" :
                          strengthScore <= 2 ? "text-yellow-400 font-bold" :
                          "text-[#A8FF35] font-bold"
                        }>
                          {strengthScore <= 1 ? "Weak" : strengthScore <= 2 ? "Moderate" : "Strong"}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[#080B09] rounded-full overflow-hidden border border-[#1B261F]">
                        <div
                          className={`h-full transition-all duration-300 rounded-full ${
                            strengthScore <= 1 ? "w-1/3 bg-red-500" :
                            strengthScore <= 2 ? "w-2/3 bg-yellow-400" :
                            "w-full bg-[#A8FF35]"
                          }`}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-[12px] font-mono font-bold uppercase tracking-wider text-white/70 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full bg-[#080B09] border border-[#1B261F] rounded-lg px-4 py-2.5 text-[14px] text-white placeholder-white/30 focus:outline-none focus:border-[#A8FF35] transition-colors pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors text-[12px] font-mono"
                    >
                      {showConfirm ? "HIDE" : "SHOW"}
                    </button>
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <span className="text-[12px] text-red-400 mt-1 block font-mono">
                      Passwords do not match
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="pt-4 flex items-center justify-between border-t border-[#1B261F]">
                  <button
                    type="submit"
                    disabled={passLoading}
                    className="px-6 py-2.5 rounded-lg bg-[#A8FF35] hover:bg-[#b5ff4d] text-black font-extrabold text-[14px] transition-all shadow-[0_0_20px_rgba(168,255,53,0.25)] active:scale-95 disabled:opacity-50"
                  >
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
                    className="text-[13px] text-white/50 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>

              </form>
            </div>

            {/* 2FA & Session Security Card */}
            <div className="bg-[#0D120F] border border-[#1B261F] rounded-xl p-6 shadow-xl max-w-[760px]">
              <h3 className="text-[16px] font-semibold text-white mb-4">
                Two-Factor Authentication & Access Security
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3.5 rounded-lg bg-[#080B09] border border-[#1B261F]">
                  <div>
                    <div className="text-[14px] font-bold text-white">Two-Factor Authentication (2FA)</div>
                    <div className="text-[12px] text-white/60">Enforce TOTP authenticator token on analyst login</div>
                  </div>
                  <span className="px-2.5 py-1 rounded text-[11px] font-mono font-bold bg-[rgba(168,255,53,0.1)] text-[#A8FF35] border border-[#A8FF35]/30">
                    ENABLED
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-lg bg-[#080B09] border border-[#1B261F]">
                  <div>
                    <div className="text-[14px] font-bold text-white">Auto Session Inactivity Timeout</div>
                    <div className="text-[12px] text-white/60">Automatically locks terminal after 15 minutes of inactivity</div>
                  </div>
                  <span className="text-[12px] font-mono text-white/80">15 MIN</span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: SYSTEM SETTINGS */}
        {tab === "settings" && (
          <div className="space-y-6">
            
            {/* Automated Response Card */}
            <div className="bg-[#0D120F] border border-[#1B261F] rounded-xl p-6 shadow-xl max-w-[840px]">
              <div className="mb-6">
                <h2 className="text-[18px] font-bold text-white mb-1">Automated Response & Safety Policies</h2>
                <div className="text-[13px] text-white/60">Configure how MediSOC handles high-confidence DDoS detections and medical device isolations.</div>
              </div>
              
              <div className="space-y-2 mb-8">
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

              <div className="mb-6 pt-4 border-t border-[#1B261F]">
                <h2 className="text-[18px] font-bold text-white mb-1">Investigation & Case Memory Settings</h2>
                <div className="text-[13px] text-white/60">Tuning the Case-Based Reasoning (CBR) pipeline and similarity thresholds.</div>
              </div>

              <div className="space-y-2">
                <Toggle
                  label="Use Historical Case Memory (CBR)"
                  sub="Check past incidents to recommend safe reuse of successful mitigation playbooks."
                  checked={caseMemoryReuse}
                  onChange={setCaseMemoryReuse}
                />
                <Toggle
                  label="Critical Event Email & SIEM Notifications"
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

              <div className="mt-8 pt-4 border-t border-[#1B261F] flex items-center justify-between">
                <span className="text-[12px] font-mono text-[#A8FF35]">Config auto-saved to localStorage</span>
                <button
                  type="button"
                  onClick={() => setTab("security")}
                  className="text-[13px] font-semibold text-white/70 hover:text-white underline"
                >
                  Manage Account & Password →
                </button>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: SERVICE HEALTH TELEMETRY */}
        {tab === "health" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map((s) => (
              <div key={s.name} className="bg-[#0D120F] border border-[#1B261F] rounded-xl p-5 shadow-lg flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-[#16211A] text-[#A8FF35] border border-[#23382B]">
                      {serviceIcons[s.name] || <span className="font-mono">#</span>}
                    </div>
                    <span
                      className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold flex items-center gap-1.5"
                      style={{
                        background: s.status === "Online" ? "rgba(28,201,112,0.1)" : "rgba(245,56,56,0.1)",
                        color: s.status === "Online" ? "#1CC970" : "#F87171",
                        border: s.status === "Online" ? "1px solid rgba(28,201,112,0.3)" : "1px solid rgba(245,56,56,0.3)",
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: s.status === "Online" ? "#1CC970" : "#F53838" }}
                      />
                      {s.status}
                    </span>
                  </div>
                  
                  <h3 className="text-[16px] font-bold text-white mb-1">{s.name}</h3>
                  <div className="text-[12px] font-mono text-white/50 mb-4">{s.detail}</div>
                  
                  <div className="space-y-2 mb-4 bg-[#080B09] p-3 rounded-lg border border-[#1B261F]">
                    <div className="flex justify-between items-center text-[13px]">
                      <span className="text-white/50">Latency</span>
                      <span className="font-mono font-bold text-[#1CC970]">{s.latency}</span>
                    </div>
                    <div className="flex justify-between items-center text-[13px]">
                      <span className="text-white/50">Uptime</span>
                      <span className="font-mono font-bold text-white">99.98%</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#1B261F] text-[11px] leading-relaxed text-white/60">
                  {s.impact}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

