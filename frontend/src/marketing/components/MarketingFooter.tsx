import React from "react";
import { Link } from "react-router-dom";
import Logo from "../../components/Logo";

export default function MarketingFooter() {
  return (
    <footer className="border-t border-[var(--border)] pt-20 pb-12 bg-[#0C0F0D] text-white/80">
      <div className="max-w-[1520px] mx-auto px-6 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-16 mb-20">
          {/* Brand info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="mb-2">
              <Logo size="xl" clickable to="/" />
            </div>
            <p className="text-[18px] leading-relaxed max-w-[420px] text-white/85">
              MediSOC delivers specialized, clinical-aware cybersecurity operations for hospital networks and connected medical devices (IoMT), empowering security teams with safe detection and evidence-based response.
            </p>
            <div className="flex items-center gap-3 text-[15px] font-mono text-[var(--lime)] font-semibold pt-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--lime)] animate-pulse" />
              <span>SOC Testbed Status: Online & Monitoring</span>
            </div>
          </div>

          {/* Column 1: Platform & Capabilities */}
          <div>
            <h4 className="text-[18px] font-extrabold text-white uppercase tracking-wider mb-5">Platform</h4>
            <ul className="space-y-3.5 text-[17px]">
              <li><Link to="/platform" className="hover:text-white transition-colors">Overview</Link></li>
              <li><Link to="/platform#iomt" className="hover:text-white transition-colors">IoMT Device Inventory</Link></li>
              <li><Link to="/platform#detection" className="hover:text-white transition-colors">DoS/DDoS Detection</Link></li>
              <li><Link to="/platform#safereuse" className="hover:text-white transition-colors">Safe Reuse Case Memory</Link></li>
              <li><Link to="/platform#architecture" className="hover:text-white transition-colors">System Architecture</Link></li>
              <li><Link to="/dashboard" className="text-[var(--lime)] hover:underline inline-flex items-center gap-1 font-semibold">Open SOC App →</Link></li>
            </ul>
          </div>

          {/* Column 2: Solutions & Integrations */}
          <div>
            <h4 className="text-[18px] font-extrabold text-white uppercase tracking-wider mb-5">Solutions</h4>
            <ul className="space-y-3.5 text-[17px]">
              <li><Link to="/solutions" className="hover:text-white transition-colors">Hospital Network Defense</Link></li>
              <li><Link to="/solutions#devices" className="hover:text-white transition-colors">Medical Device Protection</Link></li>
              <li><Link to="/solutions#ddos" className="hover:text-white transition-colors">Critical Care DoS Resilience</Link></li>
              <li><Link to="/solutions#biomed" className="hover:text-white transition-colors">BioMed & Clinical Alignment</Link></li>
              <li><Link to="/integrations" className="hover:text-white transition-colors">Telemetry & SIEM Integrations</Link></li>
              <li><Link to="/security" className="hover:text-white transition-colors">Security & Compliance</Link></li>
            </ul>
          </div>

          {/* Column 3: Resources & Company */}
          <div>
            <h4 className="text-[18px] font-extrabold text-white uppercase tracking-wider mb-5">Company & Resources</h4>
            <ul className="space-y-3.5 text-[17px]">
              <li><Link to="/about" className="hover:text-white transition-colors">About MediSOC</Link></li>
              <li><Link to="/resources" className="hover:text-white transition-colors">Knowledge Base & Guides</Link></li>
              <li><Link to="/resources#faq" className="hover:text-white transition-colors">Clinical FAQ</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Request a Demonstration</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors font-semibold text-[var(--lime)]">Analyst Login →</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-10 border-t border-[var(--border)] flex flex-col md:flex-row items-center justify-between gap-6 text-[15.5px] text-white/75 font-medium">
          <div>
            © {new Date().getFullYear()} MediSOC Healthcare Cybersecurity. All rights reserved. Demonstration testbed environment.
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <span className="text-white font-mono">HIPAA-Aligned Architecture</span>
            <span className="text-white font-mono">Zero-PHI Ingestion</span>
            <span className="text-white font-mono">Safe Clinical Response Guarantee</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
