import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function AcceptInvitation() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // In a real flow, this email would come from the invitation token in the URL
  const inviteEmail = "new.analyst@iomt-testbed.local";

  const isStrong = pass.length >= 8 && /[A-Z]/.test(pass) && /[0-9]/.test(pass);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !pass || !confirm) { setError("Please fill in all fields."); return; }
    if (pass !== confirm) { setError("Passwords do not match."); return; }
    if (!isStrong) { setError("Password does not meet requirements."); return; }
    
    setError(null);
    setLoading(true);

    // Mock network request
    await new Promise(r => setTimeout(r, 800));
    setLoading(false);
    setSuccess(true);
  }

  return (
    <div className="min-h-screen bg-[#0C0F0D] flex items-center justify-center relative overflow-hidden">
      {/* Background decorations matching Login */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#B6FF3B" strokeWidth="0.4"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)"/>
      </svg>
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-[#B6FF3B] opacity-[0.03] blur-[120px] pointer-events-none"/>

      <div className="relative w-full max-w-[400px] px-6 fade-in py-12">
        <div className="mb-8 text-center">
          <h1 className="font-bold text-[32px] text-[#E8EDE9] leading-snug tracking-tight">Accept Invitation</h1>
          <p className="text-[15px] text-[#94A8BA] mt-2">You have been invited to join MediSOC as an Analyst.</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[#111511] border border-[#242924] rounded-[16px] p-7 shadow-[0_8px_40px_rgba(0,0,0,0.6)]"
          noValidate
        >
          {error && (
            <div className="flex items-center gap-2.5 px-3 py-2.5 mb-5 rounded-[8px] text-[14px]"
              style={{ background: "#1C0808", border: "1px solid #3A1010", color: "#F87171" }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2"/><path d="M7 4.5v3M7 9v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
              {error}
            </div>
          )}

          {success ? (
            <div className="text-center">
               <div className="inline-flex items-center justify-center w-12 h-12 bg-[#14291A] border border-[#1A3D22] rounded-full mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="#4ADE80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
               </div>
               <div className="text-[17px] font-semibold text-[#E8EDE9] mb-2">Account Created</div>
               <div className="text-[14px] text-[#94A8BA] mb-6">
                 Your account has been set up successfully. We sent a verification link to your email to verify your identity.
               </div>
               
               {/* Note for reviewers */}
               <div className="mb-6 p-3 bg-[#0A0E14] border border-[#1A2A3A] rounded-[8px] text-[12px] text-[#5A8AAA] text-left">
                 <strong>Mock Note:</strong> Account creation is simulated. Proceeding will simulate clicking the email verification link.
               </div>

               <Link to="/verify-email"
                 className="w-full flex items-center justify-center py-3 rounded-[10px] text-[15px] font-bold mono uppercase tracking-widest transition-all bg-[#1A1E1B] text-[#C8CEC8] border border-[#2A302B] hover:bg-[#242924]"
               >
                 Simulate Verification Link →
               </Link>
            </div>
          ) : (
            <>
              {/* Email (Read-only) */}
              <div className="mb-4">
                <label className="block text-[12px] font-semibold text-[#94A8BA] uppercase tracking-widest mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  disabled
                  className="w-full px-3.5 py-2.5 rounded-[10px] border border-[#242924] text-[16px] text-[#94A8BA] bg-[#1A1E1B] focus:outline-none mono opacity-70"
                />
              </div>

              {/* Full Name */}
              <div className="mb-4">
                <label htmlFor="invite-name" className="block text-[12px] font-semibold text-[#94A8BA] uppercase tracking-widest mb-2">
                  Full Name
                </label>
                <input
                  id="invite-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  placeholder="e.g. Dr. Sarah Jenkins"
                  className="w-full px-3.5 py-2.5 rounded-[10px] border border-[#242924] text-[16px] text-[#E8EDE9] bg-[#0C0F0D] focus:outline-none focus:border-[#B6FF3B] transition-colors disabled:opacity-50"
                />
              </div>

              {/* Password */}
              <div className="mb-4">
                <label className="block text-[12px] font-semibold text-[#94A8BA] uppercase tracking-widest mb-2">
                  Create Password
                </label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    disabled={loading}
                    className="w-full px-3.5 py-2.5 rounded-[10px] border border-[#242924] text-[16px] text-[#E8EDE9] bg-[#0C0F0D] focus:outline-none focus:border-[#B6FF3B] transition-colors mono pr-10 disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A8BA] hover:text-[#C8CEC8]"
                  >
                    {showPass ? (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.2"/><circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.2"/><line x1="3" y1="3" x2="13" y2="13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.2"/><circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.2"/></svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Password strength indicators */}
              <div className="flex gap-2 mb-4">
                <div className={`h-1.5 flex-1 rounded-full ${pass.length >= 8 ? 'bg-[#22C55E]' : 'bg-[#242924]'}`}/>
                <div className={`h-1.5 flex-1 rounded-full ${/[A-Z]/.test(pass) ? 'bg-[#22C55E]' : 'bg-[#242924]'}`}/>
                <div className={`h-1.5 flex-1 rounded-full ${/[0-9]/.test(pass) ? 'bg-[#22C55E]' : 'bg-[#242924]'}`}/>
              </div>

              {/* Confirm Password */}
              <div className="mb-6">
                <label className="block text-[12px] font-semibold text-[#94A8BA] uppercase tracking-widest mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    disabled={loading}
                    className="w-full px-3.5 py-2.5 rounded-[10px] border border-[#242924] text-[16px] text-[#E8EDE9] bg-[#0C0F0D] focus:outline-none focus:border-[#B6FF3B] transition-colors mono pr-10 disabled:opacity-50"
                  />
                  {confirm.length > 0 && confirm === pass && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#22C55E]">
                       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-[10px] text-[16px] font-bold mono uppercase tracking-widest transition-all disabled:opacity-60"
                style={{
                  background: loading ? "#8AB82A" : "#B6FF3B",
                  color: "#0C0F0D",
                  boxShadow: loading ? "none" : "0 0 20px rgba(182,255,59,0.25)",
                }}
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
