import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Logo from "../../components/Logo";

export default function MarketingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setActiveDropdown(null);
  }, [location.pathname]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setActiveDropdown(null);
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

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
      className="fixed top-0 left-0 right-0 z-50 transition-[background-color,border-color,box-shadow] duration-300"
      style={{
        background: scrolled ? "rgba(7, 10, 9, 0.97)" : "rgba(7, 10, 9, 0.62)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderBottom: `1px solid ${scrolled ? "var(--border)" : "transparent"}`,
        boxShadow: scrolled ? "var(--shadow)" : "none",
      }}
    >
      <div className="mx-auto w-full max-w-[1600px] flex items-center justify-between gap-6 px-5 sm:px-8" style={{ height: 64 }}>
        {/* Brand */}
        <Link to="/" className="flex shrink-0 items-center gap-3 rounded-md">
          <Logo size="sm" variant="white" showText={true} />
          <span
            className="mono hidden rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider sm:inline-flex"
            style={{ background: "var(--lime-soft)", border: "1px solid var(--lime-line)", color: "var(--lime)" }}
          >
            Healthcare SOC
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden flex-1 items-center justify-center gap-0.5 xl:flex" aria-label="Main">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const hasDropdown = Boolean(item.dropdown);
            const isOpen = activeDropdown === item.label;

            return (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => hasDropdown && setActiveDropdown(item.label)}
                onMouseLeave={() => hasDropdown && setActiveDropdown(null)}
              >
                <Link
                  to={item.path}
                  aria-current={isActive ? "page" : undefined}
                  aria-expanded={hasDropdown ? isOpen : undefined}
                  className="inline-flex items-center gap-1 whitespace-nowrap rounded-md px-3 py-2 text-[13.5px] font-medium transition-colors duration-150"
                  style={{ color: isActive ? "var(--text)" : "var(--text-3)" }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.color = "var(--text)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.color = "var(--text-3)";
                  }}
                >
                  <span>{item.label}</span>
                  {hasDropdown && (
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 12 12"
                      fill="none"
                      aria-hidden
                      style={{
                        transform: isOpen ? "rotate(180deg)" : "none",
                        transition: "transform 180ms var(--ease)",
                        opacity: 0.7,
                      }}
                    >
                      <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {isActive && (
                    <span
                      className="absolute inset-x-3 -bottom-[13px] h-px"
                      style={{ background: "var(--lime)" }}
                      aria-hidden
                    />
                  )}
                </Link>

                {hasDropdown && isOpen && (
                  <div className="absolute left-0 top-full z-50 w-[336px] pt-3 animate-in fade-in slide-in-from-top-1">
                    <div
                      className="rounded-xl p-1.5"
                      style={{ background: "var(--surface)", border: "1px solid var(--border-2)", boxShadow: "var(--shadow-xl)" }}
                    >
                      {item.dropdown!.map((sub) => (
                        <Link
                          key={sub.label}
                          to={sub.path}
                          className="group block rounded-lg px-3.5 py-2.5 transition-colors duration-150"
                          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-3)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-[13px] font-semibold text-[var(--text)] group-hover:text-[var(--lime)]">
                              {sub.label}
                            </span>
                            <span className="text-[12px] text-[var(--lime)] opacity-0 transition-opacity group-hover:opacity-100" aria-hidden>
                              →
                            </span>
                          </div>
                          <div className="mt-0.5 text-[12.5px] leading-snug text-[var(--text-4)]">{sub.desc}</div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* CTAs */}
        <div className="hidden shrink-0 items-center gap-2 xl:flex">
          <Link
            to="/login"
            className="rounded-md px-3.5 py-2 text-[13.5px] font-semibold text-[var(--text-2)] transition-colors duration-150 hover:text-[var(--text)]"
          >
            Sign In
          </Link>
          <Link to="/contact" className="btn btn-primary btn-sm">
            Request a Demo
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          className="rounded-md p-2 text-[var(--text-2)] transition-colors hover:bg-[var(--surface-3)] xl:hidden"
          onClick={() => setMobileMenuOpen((v) => !v)}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
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

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div
          className="animate-in fade-in slide-in-from-top-1 xl:hidden"
          style={{ background: "rgba(7, 10, 9, 0.97)", borderTop: "1px solid var(--border)", backdropFilter: "blur(16px)" }}
        >
          <div className="flex flex-col gap-1 px-5 py-5">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className="rounded-md px-3 py-2.5 text-[15px] font-medium transition-colors"
                  style={{
                    color: isActive ? "var(--text)" : "var(--text-3)",
                    background: isActive ? "var(--surface-2)" : "transparent",
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
            <div className="my-3 h-px" style={{ background: "var(--border)" }} />
            <Link to="/login" className="rounded-md px-3 py-2.5 text-[15px] font-semibold text-[var(--text-2)]">
              Sign In to SOC Platform
            </Link>
            <Link to="/contact" className="btn btn-primary mt-1 w-full py-3">
              Request a Demo
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}