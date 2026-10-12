import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import Logo from "../components/Logo";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("admin@iomt-testbed.local");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !pass) { setError("Please enter your email and password."); return; }
    setError(null);
    setLoading(true);
    const result = await login(email.trim(), pass);
    setLoading(false);
    if (!result.success) setError(result.error ?? "Login failed.");
    // On success, AuthContext updates → App re-renders to authenticated shell
  }

  return (
    <div className="min-h-screen bg-[#0C0F0D] flex items-center justify-center relative overflow-hidden">
      {/* Grid background */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#B6FF3B" strokeWidth="0.4"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)"/>
      </svg>

      {/* Cyber Network Mesh Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none opacity-30"
        style={{
          backgroundImage: "url('/cyber-network-bg.png')",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#050706]/70 via-[#050706]/40 to-[#050706] pointer-events-none" />

      <div className="relative w-full max-w-[480px] px-6 fade-in">
        {/* Brand */}
        <div className="mb-8 text-center flex flex-col items-center">
          <Logo size="xl" clickable to="/" />
          <p className="text-[16px] text-white/90 mt-2 font-semibold">Healthcare Cybersecurity SOC Portal</p>
          <Link
            to="/"
            className="text-[14px] font-mono text-[var(--lime)] hover:underline mt-2 inline-flex items-center gap-1 font-bold"
          >
            ← Return to Public Website
          </Link>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-[#111511] border border-[#242924] rounded-[20px] p-8 shadow-[0_12px_50px_rgba(0,0,0,0.7)]"
          noValidate
        >
          {/* Error message */}
          {error && (
            <div className="flex items-center gap-3 px-4 py-3 mb-6 rounded-[10px] text-[16px]"
              style={{ background: "#1C0808", border: "1px solid #3A1010", color: "#F87171" }}>
              <svg width="18" height="18" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M7 4.5v3M7 9v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              {error}
            </div>
          )}

          {/* Email */}
          <div className="mb-6">
            <label
              htmlFor="login-email"
              className="block text-[15px] font-bold text-white uppercase tracking-wider mb-2"
            >
              Email / Username
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3.5 rounded-xl border border-[#242924] text-[18px] text-white bg-[#0C0F0D] focus:outline-none focus:border-[var(--lime)] transition-colors mono disabled:opacity-50"
            />
          </div>

          {/* Password */}
          <div className="mb-7">
            <label
              htmlFor="login-password"
              className="block text-[15px] font-bold text-white uppercase tracking-wider mb-2"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPass ? "text" : "password"}
                autoComplete="current-password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                disabled={loading}
                placeholder="Enter your password"
                className="w-full px-4 py-3.5 rounded-xl border border-[#242924] text-[18px] text-white bg-[#0C0F0D] focus:outline-none focus:border-[var(--lime)] transition-colors mono pr-12 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                tabIndex={-1}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors p-1"
              >
                {showPass ? (
                  <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.2"/><circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.2"/><line x1="3" y1="3" x2="13" y2="13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.2"/><circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.2"/></svg>
                )}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-[18px] font-extrabold mono uppercase tracking-widest transition-all disabled:opacity-60 bg-[var(--lime)] text-black hover:bg-[#b5ff4d] shadow-[0_0_20px_rgba(168,255,53,0.3)]"
          >
            {loading ? (
              <>
                <svg className="animate-spin" width="18" height="18" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="5" stroke="#0C0F0D" strokeWidth="2" strokeOpacity="0.3"/>
                  <path d="M7 2a5 5 0 015 5" stroke="#0C0F0D" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Authenticating…
              </>
            ) : "Sign In"}
          </button>

          <div className="flex items-center justify-between mt-5">
             <Link to="/forgot-password" className="text-[15px] font-medium text-white/90 hover:text-[var(--lime)] transition-colors">
               Forgot Password?
             </Link>
             <Link to="/accept-invitation" className="text-[15px] font-medium text-white/90 hover:text-[var(--lime)] transition-colors">
               Accept Invitation
             </Link>
          </div>

          <p className="text-center text-[14px] text-white/70 mt-5 mono">
            Authorized access only · Account provisioning by administrator only
          </p>
        </form>

        {/* Demo credentials hint */}
        <div className="mt-6 px-5 py-4 rounded-[12px] text-[15px] mono"
          style={{ background: "#111713", border: "1px solid var(--border)", color: "#FFFFFF" }}>
          <div className="mb-2 text-[12px] uppercase tracking-widest text-[var(--lime)] font-bold">DEMO CREDENTIALS</div>
          <div className="text-white"><span className="text-white font-medium">admin@iomt-testbed.local</span> · <span className="text-[var(--lime)] font-bold">admin123</span></div>
          <div className="text-white mt-1"><span className="text-white font-medium">analyst@iomt-testbed.local</span> · <span className="text-[var(--lime)] font-bold">analyst123</span></div>
        </div>
      </div>
    </div>
  );
}
