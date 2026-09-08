import React, { useState } from "react";
import Button from "../components/ui/Button";

interface Props {
  onLogin: () => void;
}

export default function Login({ onLogin }: Props) {
  const [showPass, setShowPass] = useState(false);
  const [email, setEmail] = useState("admin@iomt-testbed.local");
  const [pass, setPass] = useState("••••••••••");

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

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-[#B6FF3B] opacity-[0.03] blur-[120px] pointer-events-none"/>
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-[#7C6FF0] opacity-[0.04] blur-[100px] pointer-events-none"/>

      {/* Abstract packet-flow lines */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
        <line x1="0" y1="30%" x2="100%" y2="45%" stroke="#B6FF3B" strokeWidth="0.8" strokeDasharray="4 12"/>
        <line x1="0" y1="60%" x2="100%" y2="55%" stroke="#E8EDE9" strokeWidth="0.4" strokeDasharray="6 16"/>
        <line x1="20%" y1="0" x2="30%" y2="100%" stroke="#B6FF3B" strokeWidth="0.4" strokeDasharray="3 14"/>
        <line x1="75%" y1="0" x2="65%" y2="100%" stroke="#E8EDE9" strokeWidth="0.4" strokeDasharray="5 10"/>
      </svg>

      <div className="relative w-full max-w-[400px] px-6 fade-in">
        {/* Brand */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[#B6FF3B] rounded-[12px] mb-4 shadow-[0_0_30px_rgba(182,255,59,0.3)]">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M11 2L19 11L11 20L3 11L11 2Z" fill="#0C0F0D"/>
              <circle cx="11" cy="11" r="3.5" fill="#0C0F0D"/>
            </svg>
          </div>
          <h1 className="font-bold text-[37px] text-[#E8EDE9] leading-snug tracking-tight">
            MediSOC
          </h1>
          <p className="text-[19px] text-[#94A8BA] mt-1">for IoMT Networks</p>
        </div>

        {/* Card */}
        <div className="bg-[#111511] border border-[#242924] rounded-[16px] p-7 shadow-[0_8px_40px_rgba(0,0,0,0.6)]">
          <div className="mb-6">
            <label className="block text-[13px] font-semibold text-[#94A8BA] uppercase tracking-widest mb-2">Email / Username</label>
            <input
              type="text"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-[10px] border border-[#242924] text-[19px] text-[#E8EDE9] bg-[#0C0F0D] focus:outline-none focus:border-[#B6FF3B] transition-colors mono"
            />
          </div>
          <div className="mb-6">
            <label className="block text-[13px] font-semibold text-[#94A8BA] uppercase tracking-widest mb-2">Password</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={pass}
                onChange={e => setPass(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-[10px] border border-[#242924] text-[19px] text-[#E8EDE9] bg-[#0C0F0D] focus:outline-none focus:border-[#B6FF3B] transition-colors mono pr-10"
              />
              <button
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A8BA] hover:text-[#94A8BA] transition-colors"
              >
                {showPass ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.2"/><circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.2"/><line x1="3" y1="3" x2="13" y2="13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.2"/><circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.2"/></svg>
                )}
              </button>
            </div>
          </div>
          <Button onClick={onLogin} className="w-full justify-center py-3 text-[20px]">
            Sign In
          </Button>
          <p className="text-center text-[15px] text-[#94A8BA] mt-4 mono">Authorized access only · No account creation</p>
        </div>
      </div>
    </div>
  );
}
