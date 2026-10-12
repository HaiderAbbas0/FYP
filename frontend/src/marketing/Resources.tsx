import React, { useState } from "react";
import { Link } from "react-router-dom";

interface ResourceItem {
  title: string;
  category: "guides" | "research" | "technical" | "faq";
  type: string;
  readTime: string;
  desc: string;
  badge: string;
}

export default function Resources() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const resources: ResourceItem[] = [
    {
      title: "The Hospital SOC Guide to IoMT DDoS Defense",
      category: "guides",
      type: "Implementation Guide",
      readTime: "12 min read",
      desc: "A step-by-step engineering handbook on deploying passive SPAN taps, calibrating NetFlow thresholds, and defending smart infusion fleets without active scanning.",
      badge: "FEATURED GUIDE",
    },
    {
      title: "Case-Based Reasoning for Medical IoT Incident Triage",
      category: "technical",
      type: "Technical Whitepaper",
      readTime: "18 min read",
      desc: "An architectural deep-dive into how MediSOC's k-NN Case Memory retrieves verified historical hospital incident playbooks with quantified confidence scores.",
      badge: "ARCHITECTURE SPEC",
    },
    {
      title: "Analyzing MQTT and DICOM DoS Vectors in Critical Care",
      category: "research",
      type: "Threat Research Briefing",
      readTime: "9 min read",
      desc: "Empirical analysis of volumetric SYN floods vs low-and-slow MQTT connection exhaustion attacks against connected medical equipment.",
      badge: "LAB RESEARCH",
    },
    {
      title: "Zero-PHI Network Telemetry: A HIPAA-Compliant Model",
      category: "guides",
      type: "Compliance Whitepaper",
      readTime: "10 min read",
      desc: "How hospital security teams can analyze raw packet metadata for cyber anomalies while mathematically guaranteeing zero Electronic Health Record ingestion.",
      badge: "COMPLIANCE",
    },
    {
      title: "MediSOC API & Telemetry Ingestion Specification v2.0",
      category: "technical",
      type: "Developer Documentation",
      readTime: "15 min read",
      desc: "Comprehensive JSON schema definitions for streaming NetFlow, Zeek logs, and switch telemetry into the MediSOC detection pipeline.",
      badge: "DEVELOPER DOCS",
    },
    {
      title: "2026 Connected Medical Device Threat Landscape",
      category: "research",
      type: "Hospital Threat Index",
      readTime: "14 min read",
      desc: "Statistical breakdown of top exploited IoMT communication protocols, firmware vulnerabilities, and clinical impact distributions.",
      badge: "THREAT INDEX",
    },
  ];

  const faqs = [
    {
      q: "Does MediSOC actively scan or ping medical devices on the hospital network?",
      a: "No. MediSOC is 100% passive. It ingests mirrored network traffic via SPAN/mirror ports or optical network TAPs. It never transmits active probes or port sweeps that could disrupt sensitive medical equipment such as infusion pumps or ventilators.",
    },
    {
      q: "Can MediSOC automatically isolate or disconnect a patient's medical device?",
      a: "No. MediSOC enforces a strict Clinical Safety Allowlist and Human-In-The-Loop policy. Automated quarantining of critical medical equipment is fundamentally blocked. Any network mitigation (such as upstream IP rate limiting) requires explicit authorization by a SOC analyst.",
    },
    {
      q: "Does MediSOC capture or store Patient Health Information (PHI)?",
      a: "No. MediSOC inspects only packet headers and connection metadata (flow duration, byte counts, TCP flags, port distributions). No patient names, medical records, or sensitive clinical payloads are ever parsed, stored, or processed.",
    },
    {
      q: "What is the difference between this demonstration and production hospital deployment?",
      a: "The current web application is an interactive demonstration environment powered by realistic hospital testbed datasets and simulated incident workflows. It is ready for architectural review and testing prior to connecting live campus network taps.",
    },
    {
      q: "How does MediSOC's Case Memory assist hospital security analysts?",
      a: "Case-Based Reasoning (CBR) matches new incoming alerts against a repository of verified historical incidents. It shows the analyst how similar attacks were safely resolved in the past, including the exact mitigation playbook and clinical stability score.",
    },
  ];

  const filtered = resources.filter((item) => activeCategory === "all" || item.category === activeCategory);

  return (
    <div className="w-full text-white pt-28 pb-20 relative overflow-hidden">
      {/* Cyber Network Mesh Background */}
      <div
        className="absolute top-0 left-0 right-0 h-[680px] bg-cover bg-center bg-no-repeat pointer-events-none opacity-45"
        style={{
          backgroundImage: "url('/cyber-network-bg.png')",
          backgroundPosition: "center top",
        }}
      />
      <div className="absolute top-0 left-0 right-0 h-[680px] bg-gradient-to-b from-[#0C0F0D]/60 via-[#0C0F0D]/30 to-[#0C0F0D] pointer-events-none" />

      {/* ── Hero ── */}
      <section className="relative z-10 px-6 max-w-[1280px] mx-auto text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(168,255,53,0.08)] border border-[rgba(168,255,53,0.25)] mb-6">
          <span className="w-2 h-2 rounded-full bg-[var(--lime)]" />
          <span className="text-[11px] font-mono font-bold text-[var(--lime)] uppercase tracking-widest">
            KNOWLEDGE BASE & TECHNICAL RESOURCES
          </span>
        </div>

        <h1 className="text-[40px] sm:text-[56px] font-extrabold tracking-tight leading-[1.1] mb-6">
          Healthcare Cybersecurity <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--lime)] to-[#8B72F0]">
            Research & Documentation
          </span>
        </h1>

        <p className="text-[17px] sm:text-[20px] text-[var(--text-3)] max-w-[760px] mx-auto leading-relaxed mb-8">
          Explore technical whitepapers, deployment guides, threat research, and frequently asked questions on clinical IoMT network defense.
        </p>
      </section>

      {/* ── Filter Tabs ── */}
      <section className="px-6 max-w-[1280px] mx-auto mb-12">
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {[
            { id: "all", label: "All Resources" },
            { id: "guides", label: "Deployment Guides" },
            { id: "technical", label: "Architecture Specs" },
            { id: "research", label: "Threat Research" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id)}
              className={`px-4 py-2 rounded-xl text-[13px] font-semibold transition-all ${
                activeCategory === tab.id
                  ? "bg-[var(--lime)] text-black"
                  : "bg-[#121814] text-[var(--text-3)] hover:text-white border border-[var(--border)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Resources Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item, idx) => (
            <div
              key={idx}
              className="p-8 rounded-2xl bg-[#111713] border border-[var(--border)] flex flex-col justify-between hover:border-[var(--lime)]/30 transition-all group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-mono font-bold text-[var(--lime)] bg-[rgba(168,255,53,0.1)] px-2.5 py-0.5 rounded">
                    {item.badge}
                  </span>
                  <span className="text-[11px] font-mono text-[var(--text-4)]">{item.readTime}</span>
                </div>
                <h3 className="text-[18px] font-bold text-white mb-3 group-hover:text-[var(--lime)] transition-colors">
                  {item.title}
                </h3>
                <p className="text-[13px] text-[var(--text-3)] leading-relaxed mb-6">{item.desc}</p>
              </div>

              <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between text-[12px]">
                <span className="text-[var(--text-4)] font-mono">{item.type}</span>
                <span className="text-[var(--lime)] font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Read Briefing →
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Frequently Asked Questions (Accordion) ── */}
      <section id="faq" className="px-6 max-w-[960px] mx-auto mt-24 mb-24">
        <div className="text-center mb-12">
          <h2 className="text-[30px] sm:text-[40px] font-bold text-white mb-3">
            Frequently Asked Clinical Questions
          </h2>
          <p className="text-[15px] text-[var(--text-3)]">
            Answers to common clinical engineering, network architecture, and patient safety questions.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => {
            const isOpen = openFaq === i;
            return (
              <div key={i} className="rounded-2xl border border-[var(--border)] bg-[#111713] overflow-hidden">
                <button
                  onClick={() => setOpenFaq(isOpen ? null : i)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                >
                  <span className="font-semibold text-[16px] text-white">{faq.q}</span>
                  <span className="text-[var(--lime)] font-mono text-[18px] shrink-0">{isOpen ? "−" : "+"}</span>
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 text-[14px] text-[var(--text-3)] leading-relaxed border-t border-white/5 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Closing CTA ── */}
      <section className="px-6 max-w-[800px] mx-auto text-center border-t border-[var(--border)] pt-20">
        <h2 className="text-[30px] font-bold text-white mb-4">Need specific testbed documentation?</h2>
        <p className="text-[15px] text-[var(--text-3)] mb-8">
          Contact our technical team for custom network schema definitions and protocol capture guides.
        </p>
        <Link to="/contact" className="px-8 py-3.5 rounded-xl bg-[var(--lime)] text-black font-bold text-[14px]">
          Request Technical Docs Packet
        </Link>
      </section>
    </div>
  );
}
