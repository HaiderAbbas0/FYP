import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import Logo from "../components/Logo";
import Field from "../components/Field";
import AuthShell, { AuthError, PasswordField } from "../components/auth/AuthShell";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("admin@iomt-testbed.local");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !pass) {
      setError("Please enter your email and password.");
      return;
    }
    setError(null);
    setLoading(true);
    const result = await login(email.trim(), pass);
    setLoading(false);
    if (!result.success) setError(result.error ?? "Login failed.");
    // On success, AuthContext updates → App re-renders to authenticated shell
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden" style={{ background: "var(--bg)" }}>
      {/* Grid */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <defs>
          <pattern id="auth-grid-login" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#A8FF35" strokeWidth="0.4" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#auth-grid-login)" />
      </svg>
      <div
        className="pointer-events-none absolute left-1/4 top-1/4 h-[400px] w-[400px] rounded-full opacity-[0.03] blur-[120px]"
        style={{ background: "var(--lime)" }}
        aria-hidden
      />

      {/* Single column: brand, then card, vertically centred as one block */}
      <div className="animate-in fade-in relative w-full max-w-[480px] px-6 py-12">
        <div className="mb-7 flex flex-col items-center text-center">
          <Logo size="xl" clickable to="/" />
          <p className="mt-2.5 text-[15px] font-semibold text-[var(--text-2)]">Healthcare Cybersecurity SOC Portal</p>
          <Link
            to="/"
            className="mono mt-2 inline-flex items-center gap-1 text-[13px] font-bold text-[var(--lime)] transition-colors hover:text-[var(--lime-dim)]"
          >
            ← Return to Public Website
          </Link>
        </div>

        <AuthShell width="max-w-[480px]">
          <form onSubmit={handleSubmit} noValidate>
            <AuthError message={error} />

            <Field label="Email / Username" className="mb-5">
              {(p) => (
                <input {...p} type="email" autoComplete="username" value={email} disabled={loading}
                  onChange={(e) => setEmail(e.target.value)} className={`${p.className} mono disabled:opacity-50`} />
              )}
            </Field>

            <Field label="Password" className="mb-6">
              {(p) => (
                <PasswordField
                  fieldProps={p}
                  value={pass}
                  onChange={setPass}
                  show={showPass}
                  onToggle={() => setShowPass(!showPass)}
                  placeholder="Enter your password"
                  disabled={loading}
                  autoComplete="current-password"
                />
              )}
            </Field>

            <button type="submit" disabled={loading} className="btn btn-primary btn-lg w-full justify-center">
              {loading ? (
                <>
                  <span className="spinner" aria-hidden />
                  Authenticating…
                </>
              ) : (
                "Sign In"
              )}
            </button>

            <div className="mt-5 flex items-center justify-between">
              <Link to="/forgot-password" className="text-[13.5px] font-medium text-[var(--text-3)] transition-colors hover:text-[var(--lime)]">
                Forgot Password?
              </Link>
              <Link to="/accept-invitation" className="text-[13.5px] font-medium text-[var(--text-3)] transition-colors hover:text-[var(--lime)]">
                Accept Invitation
              </Link>
            </div>

            <p className="mono mt-5 text-center text-[12.5px] leading-relaxed text-[var(--text-4)]">
              Authorized access only · Account provisioning by administrator only
            </p>
          </form>

          {/* Demo credentials hint */}
          <div className="demo-banner mt-6 text-[13px] mono">
            <div className="t-label mb-2" style={{ color: "var(--lime)" }}>DEMO CREDENTIALS</div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="text-[var(--text-2)]">admin@iomt-testbed.local</span>
              <span style={{ color: "var(--text-4)" }}>·</span>
              <span className="font-bold" style={{ color: "var(--lime)" }}>admin123</span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="text-[var(--text-2)]">analyst@iomt-testbed.local</span>
              <span style={{ color: "var(--text-4)" }}>·</span>
              <span className="font-bold" style={{ color: "var(--lime)" }}>analyst123</span>
            </div>
          </div>
        </AuthShell>
      </div>
    </div>
  );
}