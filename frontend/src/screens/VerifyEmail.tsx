import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function VerifyEmail() {
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate token verification on load
    const verifyToken = async () => {
      await new Promise(r => setTimeout(r, 1500)); // Simulate network
      setLoading(false);
      setSuccess(true);
    };
    verifyToken();
  }, []);

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
          <h1 className="font-bold text-[32px] text-[#E8EDE9] leading-snug tracking-tight">Verify Email</h1>
          <p className="text-[15px] text-[#94A8BA] mt-2">Confirming your identity securely.</p>
        </div>

        <div className="bg-[#111511] border border-[#242924] rounded-[16px] p-7 shadow-[0_8px_40px_rgba(0,0,0,0.6)]">
          {loading ? (
             <div className="text-center py-6">
                <svg className="animate-spin mx-auto mb-4" width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="#242924" strokeWidth="3" strokeOpacity="1"/>
                  <path d="M12 2a10 10 0 0110 10" stroke="#B6FF3B" strokeWidth="3" strokeLinecap="round"/>
                </svg>
                <div className="text-[15px] text-[#E8EDE9] font-medium">Verifying link...</div>
                <div className="text-[13px] text-[#94A8BA] mt-1">Please wait a moment.</div>
             </div>
          ) : success ? (
            <div className="text-center">
               <div className="inline-flex items-center justify-center w-12 h-12 bg-[#14291A] border border-[#1A3D22] rounded-full mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="#4ADE80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
               </div>
               <div className="text-[17px] font-semibold text-[#E8EDE9] mb-2">Email Verified</div>
               <div className="text-[14px] text-[#94A8BA] mb-6">
                 Your email address has been successfully verified. Your account is now active.
               </div>
               
               <Link to="/login"
                 className="w-full flex items-center justify-center gap-2 py-3 rounded-[10px] text-[16px] font-bold mono uppercase tracking-widest transition-all bg-[#B6FF3B] text-[#0C0F0D]"
               >
                 Proceed to Sign In
               </Link>
            </div>
          ) : (
            <div className="text-center">
               <div className="inline-flex items-center justify-center w-12 h-12 bg-[#1C0808] border border-[#3A1010] rounded-full mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke="#F87171" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
               </div>
               <div className="text-[17px] font-semibold text-[#E8EDE9] mb-2">Verification Failed</div>
               <div className="text-[14px] text-[#94A8BA] mb-6">
                 {error || "The verification link is invalid or has expired."}
               </div>
               
               <button
                 onClick={() => window.location.reload()}
                 className="w-full flex items-center justify-center gap-2 py-3 rounded-[10px] text-[16px] font-bold mono uppercase tracking-widest transition-all bg-[#1A1E1B] text-[#E8EDE9] border border-[#242924]"
               >
                 Try Again
               </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
