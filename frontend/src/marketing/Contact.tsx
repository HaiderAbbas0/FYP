import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useReveal } from "../hooks/useReveal";
import { MarketingPage, SectionTitle, GradText } from "./components/MarketingPage";
import Field from "../components/Field";

const STEPS = [
  { title: "Interactive Sandbox Access", desc: "Instant demonstration access to pre-configured hospital topologies." },
  { title: "Architecture Consultation", desc: "Review of your hospital SPAN port infrastructure and clinical VLAN layout." },
  { title: "Safe Pilot Deployment", desc: "100% passive optical tap deployment with guaranteed zero patient telemetry impact." },
];

export default function Contact() {
  useReveal();
  const [form, setForm] = useState({
    name: "",
    email: "",
    hospital: "",
    role: "SOC Analyst / Lead",
    beds: "200 – 500 Beds (Regional Hospital)",
    interest: "Full Platform Walkthrough",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Full name is required.";
    if (!form.email.trim()) e.email = "Work email is required.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Please enter a valid email address.";
    if (!form.hospital.trim()) e.hospital = "Hospital or healthcare organization is required.";
    return e;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    setErrors({});
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 1200);
  }

  return (
    <MarketingPage
      eyebrow="Interactive Demo & Engagement"
      title={<>Request a Custom <br /><GradText>MediSOC Demonstration</GradText></>}
      lead="See how MediSOC protects your hospital network against DoS attacks and secures connected IoMT devices with zero disruption to patient care."
    >
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <section className="card-elevated p-6 sm:p-9 lg:col-span-7" aria-label="Demonstration request form">
          {submitted ? (
            <div className="animate-in fade-in space-y-6 py-10 text-center">
              <div
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
                style={{ background: "var(--lime-soft)", border: "1px solid var(--lime-line)", color: "var(--lime)" }}
                aria-hidden
              >
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="t-h2 text-[var(--text)]">Demonstration Request Received</h3>
              <div className="alert-info space-y-2 p-4 text-left text-[13px]">
                <div className="t-label" style={{ color: "var(--info)" }}>Simulation notice &amp; next steps</div>
                <p className="leading-relaxed text-[var(--text-2)]">
                  Because this is an active demonstration web environment, no live email server is currently connected. Your request has been validated and recorded locally.
                </p>
                <p className="leading-relaxed text-[var(--text-2)]">
                  You can access the full operational SOC platform right now with our pre-loaded hospital demonstration datasets.
                </p>
              </div>
              <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
                <Link to="/login" className="btn btn-primary w-full justify-center sm:w-auto">Launch Interactive SOC Sandbox →</Link>
                <button type="button" onClick={() => setSubmitted(false)} className="btn btn-secondary w-full justify-center sm:w-auto">Submit Another Request</button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div>
                <h3 className="t-h3 text-[var(--text)]">Book an Architecture Demo</h3>
                <p className="mt-1 text-[13px] text-[var(--text-3)]">Fill in your clinical or IT details below</p>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field label="Full Name" marker="*" error={errors.name}>
                  {(p) => <input {...p} type="text" value={form.name} placeholder="Dr. Sarah Chen" onChange={(e) => setForm({ ...form, name: e.target.value })} />}
                </Field>
                <Field label="Work Email" marker="*" error={errors.email}>
                  {(p) => <input {...p} type="email" value={form.email} placeholder="s.chen@memorialhospital.org" onChange={(e) => setForm({ ...form, email: e.target.value })} />}
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field label="Hospital / Organization" marker="*" error={errors.hospital}>
                  {(p) => <input {...p} type="text" value={form.hospital} placeholder="St. Jude Medical Center" onChange={(e) => setForm({ ...form, hospital: e.target.value })} />}
                </Field>
                <Field label="Your Professional Role">
                  {(p) => (
                    <select {...p} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                      <option>CISO / Security Director</option>
                      <option>SOC Analyst / Lead</option>
                      <option>Clinical / BioMed Engineer</option>
                      <option>Network Infrastructure Lead</option>
                      <option>Hospital IT Director</option>
                    </select>
                  )}
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field label="Hospital Bed Capacity">
                  {(p) => (
                    <select {...p} value={form.beds} onChange={(e) => setForm({ ...form, beds: e.target.value })}>
                      <option>&lt; 200 Beds (Community Clinic)</option>
                      <option>200 – 500 Beds (Regional Hospital)</option>
                      <option>500 – 1,000 Beds (Major Medical Center)</option>
                      <option>1,000+ Beds (Multi-Campus Health System)</option>
                    </select>
                  )}
                </Field>
                <Field label="Primary Defense Focus">
                  {(p) => (
                    <select {...p} value={form.interest} onChange={(e) => setForm({ ...form, interest: e.target.value })}>
                      <option>IoMT Asset Visibility</option>
                      <option>DoS & DDoS Attack Defense</option>
                      <option>Case Memory & Safe Response</option>
                      <option>Full Platform Walkthrough</option>
                    </select>
                  )}
                </Field>
              </div>

              <Field label="Specific Architecture Inquiries (Optional)">
                {(p) => (
                  <textarea {...p} rows={3} value={form.message} placeholder="Tell us about your medical device fleet or switch topology…" onChange={(e) => setForm({ ...form, message: e.target.value })} />
                )}
              </Field>

              <button type="submit" disabled={isSubmitting} className="btn btn-primary btn-lg w-full justify-center">
                {isSubmitting ? (
                  <>
                    <span className="spinner" aria-hidden />
                    Validating Request…
                  </>
                ) : (
                  "Submit Demonstration Request"
                )}
              </button>
            </form>
          )}
        </section>

        <div className="space-y-4 lg:col-span-5">
          <section className="card-elevated p-6 sm:p-7" aria-label="What happens after requesting">
            <SectionTitle title="What Happens After Requesting?" center={false} />
            <ol className="space-y-5">
              {STEPS.map((s, i) => (
                <li key={s.title} className="flex items-start gap-3">
                  <span
                    className="mono flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold"
                    style={{ background: "var(--lime-soft)", border: "1px solid var(--lime-line)", color: "var(--lime)" }}
                    aria-hidden
                  >
                    {i + 1}
                  </span>
                  <span className="text-[13.5px] leading-relaxed text-[var(--text-3)]">
                    <strong className="block text-[var(--text)]">{s.title}</strong>
                    {s.desc}
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <section className="card-elevated p-6 sm:p-7" style={{ borderColor: "var(--lime-line)" }} aria-label="Direct demonstration access">
            <div className="mb-3 flex items-center gap-2 text-[var(--lime)]">
              <span className="h-2 w-2 rounded-full pulse-critical" style={{ background: "var(--lime)" }} aria-hidden />
              <span className="t-label" style={{ color: "var(--lime)" }}>Try the operational platform now</span>
            </div>
            <h4 className="t-h3 text-[var(--text)]">Want to skip straight to the SOC?</h4>
            <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--text-3)]">
              Log into our demonstration portal with our analyst profile to inspect active incident timelines and test safe DoS rate-limiting.
            </p>
            <Link to="/login" className="btn btn-secondary btn-sm mt-4">Go to Operational Sign In →</Link>
          </section>
        </div>
      </div>
    </MarketingPage>
  );
}