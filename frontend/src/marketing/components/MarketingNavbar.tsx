import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Logo from "../../components/Logo";

export default function MarketingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setActiveDropdown(null);
  }, [location.pathname]);

  const navItems = [
    { label: "Home", path: "/" },
    {
      label: "Platform",
      path: "/platform",
      dropdown: [
        { label: "Platform Overview", path: "/platform", desc: "End-to-end healthcare SOC architecture" },
        { label: "IoMT Visibility", path: "/platform#iomt", desc: "Passive profiling of connected medical equipment" },
        { label: "Threat Detection", path: "/platform#detection", desc: "DoS/DDoS and anomaly behavior models" },
        { label: "Safe Reuse Engine", path: "/platform#safereuse", desc: "Case Memory and historical incident reasoning" },
      ],
    },
    {
      label: "Solutions",
      path: "/solutions",
      dropdown: [
        { label: "Hospital Network Security", path: "/solutions#hospital", desc: "Whole-campus telemetry and segmentation" },
        { label: "Connected Medical Devices", path: "/solutions#devices", desc: "Protection for infusion pumps & monitors" },
        { label: "DoS & DDoS Defense", path: "/solutions#ddos", desc: "Preserving clinical bandwidth in emergencies" },
        { label: "Clinical BioMed Alignment", path: "/solutions#biomed", desc: "Bridging SOC analysts with clinical engineering" },
      ],
    },
    { label: "Integrations", path: "/integrations" },
    { label: "Security & Compliance", path: "/security" },
    { label: "Resources", path: "/resources" },
    { label: "About", path: "/about" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#0C0F0D]/95 backdrop-blur-md border-b border-[var(--border)] py-3 shadow-2xl shadow-black/60"
          : "bg-[#0C0F0D]/75 backdrop-blur-md py-4.5 border-b border-white/[0.08]"
      }`}
    >
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-10 flex items-center justify-between gap-4">
        {/* Left Corner: Official MediSOC Logo + Healthcare SOC Text */}
        <div className="flex items-center shrink-0">
          <Link
            to="/"
            className="flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lime)] rounded-lg group py-1"
          >
            {/* Official Logo Component */}
            <Logo size="sm" variant="white" showText={true} />

            {/* Healthcare SOC badge */}
            <div className="hidden sm:flex items-center pl-2.5 border-l border-white/20">
              <span className="text-[12px] font-mono font-bold uppercase tracking-wider text-[var(--lime)] bg-[rgba(168,255,53,0.12)] border border-[rgba(168,255,53,0.3)] px-2.5 py-0.5 rounded-md whitespace-nowrap shadow-sm">
                Healthcare SOC
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Desktop Navigation Links with generous spacing */}
        <nav className="hidden xl:flex items-center gap-1.5 2xl:gap-3 text-[15.5px] font-medium" aria-label="Main Navigation">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const hasDropdown = Boolean(item.dropdown);

            return (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => hasDropdown && setActiveDropdown(item.label)}
                onMouseLeave={() => hasDropdown && setActiveDropdown(null)}
              >
                <Link
                  to={item.path}
                  className={`px-3 py-2 rounded-lg transition-all duration-150 inline-flex items-center gap-1 whitespace-nowrap ${
                    isActive
                      ? "text-white bg-white/[0.12] font-semibold shadow-inner"
                      : "text-white/85 hover:text-white hover:bg-white/[0.08]"
                  }`}
                >
                  <span>{item.label}</span>
                  {hasDropdown && (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      className={`transition-transform duration-200 opacity-70 ${activeDropdown === item.label ? "rotate-180 opacity-100" : ""}`}
                    >
                      <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </Link>

                {/* Dropdown Menu */}
                {hasDropdown && activeDropdown === item.label && (
                  <div className="absolute top-full left-0 w-84 pt-2.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="bg-[#131815] border border-[var(--border-2)] rounded-2xl p-3 shadow-2xl shadow-black/90 backdrop-blur-2xl">
                      {item.dropdown!.map((sub) => (
                        <Link
                          key={sub.label}
                          to={sub.path}
                          className="block px-4 py-3 rounded-xl hover:bg-white/[0.08] transition-colors group"
                        >
                          <div className="text-[15px] font-semibold text-white group-hover:text-[var(--lime)] flex items-center justify-between">
                            <span>{sub.label}</span>
                            <span className="text-[13px] text-[var(--lime)] opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                          </div>
                          <div className="text-[13px] text-white/70 mt-1 leading-snug">{sub.desc}</div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Right Corner: Action CTAs */}
        <div className="hidden xl:flex items-center gap-3 shrink-0">
          <Link
            to="/login"
            className="px-4 py-2 rounded-lg text-[15.5px] font-semibold text-white hover:bg-white/[0.1] transition-all whitespace-nowrap"
          >
            Sign In
          </Link>
          <Link
            to="/contact"
            className="px-5 py-2.5 rounded-lg bg-[var(--lime)] text-black text-[15.5px] font-extrabold hover:bg-[#b5ff4d] transition-all shadow-[0_0_20px_rgba(168,255,53,0.3)] hover:shadow-[0_0_30px_rgba(168,255,53,0.5)] active:scale-95 whitespace-nowrap"
          >
            Request a Demo
          </Link>
        </div>

        {/* Mobile Navigation Toggle */}
        <button
          className="xl:hidden text-white p-2.5 rounded-xl hover:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-[var(--lime)]"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            {mobileMenuOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Drawer — enlarged typography */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-[#0C0F0D]/98 border-b border-[var(--border)] px-8 py-8 flex flex-col gap-4 shadow-2xl backdrop-blur-2xl">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              className={`text-[20px] py-2.5 px-4 rounded-xl font-semibold transition-colors ${
                location.pathname === item.path
                  ? "text-white bg-white/[0.12]"
                  : "text-white/80 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <div className="h-px bg-white/10 my-3" />
          <Link
            to="/login"
            className="text-[20px] py-2.5 px-4 text-white font-semibold hover:bg-white/[0.06] rounded-xl"
          >
            Sign In to SOC Platform
          </Link>
          <Link
            to="/contact"
            className="w-full text-center py-4 rounded-xl bg-[var(--lime)] text-black text-[20px] font-extrabold shadow-xl mt-2"
          >
            Request a Demo
          </Link>
        </div>
      )}
    </header>
  );
}
