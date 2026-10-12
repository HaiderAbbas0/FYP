import React, { useState } from "react";
import { Link } from "react-router-dom";
import Logo from "../components/Logo";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    hospital: "",
    role: "SOC Analyst",
    beds: "200-500 Beds",
    interest: "Full Platform Demo",
    message: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = "Full name is required.";
    if (!formData.email.trim()) {
      errs.email = "Work email is required.";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errs.email = "Please enter a valid email address.";
    }
    if (!formData.hospital.trim()) errs.hospital = "Hospital or healthcare organization is required.";
    return errs;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 1200);
  };

  return (
    <div className="w-full text-white pt-28 pb-20">
      {/* ── Hero ── */}
      <section className="px-6 max-w-[1280px] mx-auto text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(168,255,53,0.08)] border border-[rgba(168,255,53,0.25)] mb-6">
          <span className="w-2 h-2 rounded-full bg-[var(--lime)]" />
          <span className="text-[11px] font-mono font-bold text-[var(--lime)] uppercase tracking-widest">
            INTERACTIVE DEMO & ENGAGEMENT
          </span>
        </div>

        <h1 className="text-[40px] sm:text-[56px] font-extrabold tracking-tight leading-[1.1] mb-6">
          Request a Custom <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--lime)] to-[#8B72F0]">
            MediSOC Demonstration
          </span>
        </h1>

        <p className="text-[17px] sm:text-[20px] text-[var(--text-3)] max-w-[760px] mx-auto leading-relaxed">
          See how MediSOC protects your hospital network against DoS attacks and secures connected IoMT devices with zero disruption to patient care.
        </p>
      </section>

      {/* ── Form & Side Panel Layout ── */}
      <section className="px-6 max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Form Area (7 Cols) */}
          <div className="lg:col-span-7 p-8 sm:p-10 rounded-3xl bg-[#111713] border border-[var(--border)] shadow-2xl relative">
            {submitted ? (
              <div className="py-12 text-center space-y-6 animate-in fade-in duration-300">
                <div className="w-16 h-16 rounded-full bg-[rgba(168,255,53,0.15)] text-[var(--lime)] mx-auto flex items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3 className="text-[26px] font-bold text-white">Demonstration Request Received</h3>
                <div className="p-4 rounded-xl bg-[#141B16] border border-[var(--border)] text-[13px] text-[var(--text-3)] text-left space-y-2">
                  <div className="font-mono text-[var(--lime)] font-bold text-[11px] uppercase">
                    SIMULATION NOTICE & NEXT STEPS
                  </div>
                  <p>
                    Because this is an active demonstration web environment, no live email server is currently connected. Your request has been validated and recorded locally.
                  </p>
                  <p>
                    You can access the full operational SOC platform right now with our pre-loaded hospital demonstration datasets:
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                  <Link
                    to="/dashboard"
                    className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[var(--lime)] text-black font-bold text-[14px] hover:bg-[#b5ff4d] transition-all"
                  >
                    Launch Interactive SOC Sandbox →
                  </Link>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#18201B] border border-[var(--border)] text-white text-[14px]"
                  >
                    Submit Another Request
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <h3 className="text-[22px] font-bold text-white mb-1">Book an Architecture Demo</h3>
                  <p className="text-[13px] text-[var(--text-3)]">Fill in your clinical or IT details below</p>
                </div>

                {/* Name & Email Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[12px] font-mono text-[var(--text-3)] uppercase mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Dr. Sarah Chen"
                      className={`w-full px-4 py-3 rounded-xl bg-[#0B0F0C] border ${
                        errors.name ? "border-[var(--danger)]" : "border-[var(--border)]"
                      } text-white text-[14px] focus:outline-none focus:border-[var(--lime)]`}
                    />
                    {errors.name && <span className="text-[11px] text-[var(--danger)] mt-1 block">{errors.name}</span>}
                  </div>

                  <div>
                    <label className="block text-[12px] font-mono text-[var(--text-3)] uppercase mb-2">
                      Work Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="s.chen@memorialhospital.org"
                      className={`w-full px-4 py-3 rounded-xl bg-[#0B0F0C] border ${
                        errors.email ? "border-[var(--danger)]" : "border-[var(--border)]"
                      } text-white text-[14px] focus:outline-none focus:border-[var(--lime)]`}
                    />
                    {errors.email && <span className="text-[11px] text-[var(--danger)] mt-1 block">{errors.email}</span>}
                  </div>
                </div>

                {/* Hospital & Role Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[12px] font-mono text-[var(--text-3)] uppercase mb-2">
                      Hospital / Organization *
                    </label>
                    <input
                      type="text"
                      value={formData.hospital}
                      onChange={(e) => setFormData({ ...formData, hospital: e.target.value })}
                      placeholder="St. Jude Medical Center"
                      className={`w-full px-4 py-3 rounded-xl bg-[#0B0F0C] border ${
                        errors.hospital ? "border-[var(--danger)]" : "border-[var(--border)]"
                      } text-white text-[14px] focus:outline-none focus:border-[var(--lime)]`}
                    />
                    {errors.hospital && (
                      <span className="text-[11px] text-[var(--danger)] mt-1 block">{errors.hospital}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-[12px] font-mono text-[var(--text-3)] uppercase mb-2">
                      Your Professional Role
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-[#0B0F0C] border border-[var(--border)] text-white text-[14px] focus:outline-none focus:border-[var(--lime)]"
                    >
                      <option value="CISO / Security Director">CISO / Security Director</option>
                      <option value="SOC Analyst / Lead">SOC Analyst / Lead</option>
                      <option value="Clinical / BioMed Engineer">Clinical / BioMed Engineer</option>
                      <option value="Network Infrastructure Lead">Network Infrastructure Lead</option>
                      <option value="Hospital IT Director">Hospital IT Director</option>
                    </select>
                  </div>
                </div>

                {/* Hospital Scale & Primary Interest */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[12px] font-mono text-[var(--text-3)] uppercase mb-2">
                      Hospital Bed Capacity
                    </label>
                    <select
                      value={formData.beds}
                      onChange={(e) => setFormData({ ...formData, beds: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-[#0B0F0C] border border-[var(--border)] text-white text-[14px] focus:outline-none focus:border-[var(--lime)]"
                    >
                      <option value="Under 200 Beds">&lt; 200 Beds (Community Clinic)</option>
                      <option value="200-500 Beds">200 – 500 Beds (Regional Hospital)</option>
                      <option value="500-1000 Beds">500 – 1,000 Beds (Major Medical Center)</option>
                      <option value="1000+ Beds">1,000+ Beds (Multi-Campus Health System)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[12px] font-mono text-[var(--text-3)] uppercase mb-2">
                      Primary Defense Focus
                    </label>
                    <select
                      value={formData.interest}
                      onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-[#0B0F0C] border border-[var(--border)] text-white text-[14px] focus:outline-none focus:border-[var(--lime)]"
                    >
                      <option value="IoMT Asset Visibility">IoMT Asset Visibility</option>
                      <option value="DoS & DDoS Defense">DoS & DDoS Attack Defense</option>
                      <option value="Case Memory & Response">Case Memory & Safe Response</option>
                      <option value="Full Platform Demo">Full Platform Walkthrough</option>
                    </select>
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-[12px] font-mono text-[var(--text-3)] uppercase mb-2">
                    Specific Architecture Inquiries (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Tell us about your medical device fleet or switch topology..."
                    className="w-full px-4 py-3 rounded-xl bg-[#0B0F0C] border border-[var(--border)] text-white text-[14px] focus:outline-none focus:border-[var(--lime)]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-xl bg-[var(--lime)] text-black font-bold text-[15px] hover:bg-[#b5ff4d] transition-all shadow-[0_0_25px_rgba(168,255,53,0.25)] flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Validating Request...</span>
                    </>
                  ) : (
                    <span>Submit Demonstration Request</span>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Right Supporting Panel (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-8 rounded-3xl bg-[#111713] border border-[var(--border)] space-y-6">
              <h3 className="text-[20px] font-bold text-white">What Happens After Requesting?</h3>
              <ul className="space-y-4 text-[13.5px] text-[var(--text-3)]">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[rgba(168,255,53,0.15)] text-[var(--lime)] font-mono font-bold text-[12px] flex items-center justify-center shrink-0">
                    1
                  </span>
                  <span>
                    <strong className="text-white block">Interactive Sandbox Access:</strong> Instant demonstration access to pre-configured hospital topologies.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[rgba(168,255,53,0.15)] text-[var(--lime)] font-mono font-bold text-[12px] flex items-center justify-center shrink-0">
                    2
                  </span>
                  <span>
                    <strong className="text-white block">Architecture Consultation:</strong> Review of your hospital SPAN port infrastructure and clinical VLAN layout.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[rgba(168,255,53,0.15)] text-[var(--lime)] font-mono font-bold text-[12px] flex items-center justify-center shrink-0">
                    3
                  </span>
                  <span>
                    <strong className="text-white block">Safe Pilot Deployment:</strong> 100% passive optical tap deployment with guaranteed zero patient telemetry impact.
                  </span>
                </li>
              </ul>
            </div>

            {/* Direct Demonstration Access Card */}
            <div className="p-8 rounded-3xl bg-[#151D17] border border-[var(--lime)]/30 space-y-4 shadow-xl">
              <div className="flex items-center gap-2 text-[var(--lime)] text-[12px] font-mono font-bold">
                <span className="w-2 h-2 rounded-full bg-[var(--lime)] animate-pulse" />
                <span>TRY THE OPERATIONAL PLATFORM NOW</span>
              </div>
              <h4 className="text-[18px] font-bold text-white">Want to skip straight to the SOC?</h4>
              <p className="text-[13px] text-[var(--text-3)] leading-relaxed">
                Log into our demonstration portal with our analyst profile to inspect active incident timelines and test safe DoS rate-limiting.
              </p>
              <div className="pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-[14px] font-bold text-[var(--lime)] hover:underline"
                >
                  <span>Go to Operational Sign In</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
