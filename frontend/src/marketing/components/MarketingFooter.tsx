import React from "react";
import { Link } from "react-router-dom";
import Logo from "../../components/Logo";

const COLUMNS: { title: string; links: { label: string; to: string; accent?: boolean }[] }[] = [
  {
    title: "Platform",
    links: [
      { label: "Overview", to: "/platform" },
      { label: "IoMT Device Inventory", to: "/platform#iomt" },
      { label: "DoS/DDoS Detection", to: "/platform#detection" },
      { label: "Safe Reuse Case Memory", to: "/platform#safereuse" },
      { label: "System Architecture", to: "/platform#architecture" },
      { label: "Open SOC App →", to: "/dashboard", accent: true },
    ],
  },
  {
    title: "Solutions",
    links: [
      { label: "Hospital Network Defense", to: "/solutions" },
      { label: "Medical Device Protection", to: "/solutions#devices" },
      { label: "Critical Care DoS Resilience", to: "/solutions#ddos" },
      { label: "BioMed & Clinical Alignment", to: "/solutions#biomed" },
      { label: "Telemetry & SIEM Integrations", to: "/integrations" },
      { label: "Security & Compliance", to: "/security" },
    ],
  },
  {
    title: "Company & Resources",
    links: [
      { label: "About MediSOC", to: "/about" },
      { label: "Knowledge Base & Guides", to: "/resources" },
      { label: "Clinical FAQ", to: "/resources#faq" },
      { label: "Request a Demonstration", to: "/contact" },
      { label: "Analyst Login →", to: "/login", accent: true },
    ],
  },
];

export default function MarketingFooter() {
  return (
    <footer style={{ background: "var(--bg)", borderTop: "1px solid var(--border)" }}>
      <div className="mx-auto max-w-[1600px] px-6 pt-20 pb-10 sm:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-5 lg:gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="mb-5">
              <Logo size="md" clickable to="/" />
            </div>
            <p className="max-w-[420px] text-[13.5px] leading-relaxed text-[var(--text-3)]">
              MediSOC delivers specialized, clinical-aware cybersecurity operations for hospital networks and connected medical devices (IoMT), empowering security teams with safe detection and evidence-based response.
            </p>
            <div className="mt-6 inline-flex items-center gap-2.5 rounded-md px-3 py-2" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <span className="dot status-pulse" style={{ background: "var(--success)" }} aria-hidden />
              <span className="mono text-[11.5px] font-semibold text-[var(--text-3)]">
                SOC Testbed Status: Online &amp; Monitoring
              </span>
            </div>
          </div>

          {/* Link columns */}
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="t-label mb-4">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="inline-flex items-center gap-1.5 text-[13px] transition-colors duration-150"
                      style={{ color: link.accent ? "var(--lime)" : "var(--text-3)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = link.accent ? "var(--lime)" : "var(--text-3)")}
                    >
                      {link.accent && (
                        <span className="font-semibold" style={{ color: "var(--lime)" }}>
                          {link.label}
                        </span>
                      )}
                      {!link.accent && link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="mt-16 flex flex-col items-center justify-between gap-5 pt-7 md:flex-row"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <div className="text-[12.5px] text-[var(--text-4)]">
            © {new Date().getFullYear()} MediSOC Healthcare Cybersecurity. All rights reserved. Demonstration testbed environment.
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {["HIPAA-Aligned Architecture", "Zero-PHI Ingestion", "Safe Clinical Response Guarantee"].map((item) => (
              <span key={item} className="mono text-[11px] uppercase tracking-wider text-[var(--text-4)]">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}