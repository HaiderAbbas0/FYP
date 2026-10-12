import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) { setError("Please enter your email address."); return; }
    setError(null);
    setLoading(true);

    // Mock network request
    await new Promise(r => setTimeout(r, 600));
    setLoading(false);
    
    // In a mock environment, any email gives a success message to prevent user enumeration
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

      <div className="relative w-full max-w-[400px] px-6 fade-in">
        <div className="mb-8 text-center">
          <h1 className="font-bold text-[32px] text-[#E8EDE9] leading-snug tracking-tight">Recover Password</h1>
          <p className="text-[15px] text-[#94A8BA] mt-2">Enter your email to receive reset instructions.</p>
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
               <div className="text-[17px] font-semibold text-[#E8EDE9] mb-2">Check your email</div>
               <div className="text-[14px] text-[#94A8BA] mb-6">
                 If an account exists for <strong className="text-[#E8EDE9]">{email}</strong>, we have sent password reset instructions.
               </div>
               
               {/* Note for reviewers */}
               <div className="mb-6 p-3 bg-[#0A0E14] border border-[#1A2A3A] rounded-[8px] text-[12px] text-[#5A8AAA] text-left">
                 <strong>Mock Note:</strong> No email was actually sent. Click below to continue the simulated flow.
               </div>

               <Link to="/reset-password"
                 className="w-full flex items-center justify-center py-3 rounded-[10px] text-[15px] font-bold mono uppercase tracking-widest transition-all bg-[#1A1E1B] text-[#C8CEC8] border border-[#2A302B] hover:bg-[#242924]"
               >
                 Simulate Email Link →
               </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <label htmlFor="forgot-email" className="block text-[12px] font-semibold text-[#94A8BA] uppercase tracking-widest mb-2">
                  Email Address
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="w-full px-3.5 py-2.5 rounded-[10px] border border-[#242924] text-[16px] text-[#E8EDE9] bg-[#0C0F0D] focus:outline-none focus:border-[#B6FF3B] transition-colors mono disabled:opacity-50"
                  placeholder="admin@iomt-testbed.local"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 mb-4 rounded-[10px] text-[16px] font-bold mono uppercase tracking-widest transition-all disabled:opacity-60"
                style={{
                  background: loading ? "#8AB82A" : "#B6FF3B",
                  color: "#0C0F0D",
                  boxShadow: loading ? "none" : "0 0 20px rgba(182,255,59,0.25)",
                }}
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>

              <div className="text-center">
                <Link to="/login" className="text-[13px] font-medium text-[#94A8BA] hover:text-[#C8CEC8] transition-colors">
                  ← Back to Sign In
                </Link>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
