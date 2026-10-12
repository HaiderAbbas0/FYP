import { useEffect } from "react";

/**
 * Scroll-triggered reveal.
 *
 * Observes every `.reveal` element under the given root and adds `in` when it
 * enters the viewport, which index.css animates. Observes once, disconnects on
 * cleanup, and does nothing when the user prefers reduced motion because the
 * media query in index.css pins those elements to their final state.
 *
 * A JS-driven variant is included for the hero, which moves with scroll.
 */
export function useReveal(rootId?: string) {
  useEffect(() => {
    const root = rootId ? document.getElementById(rootId) ?? document : document;
    const targets = Array.from(root.querySelectorAll<HTMLElement>(".reveal"));
    if (targets.length === 0) return;

    if (typeof IntersectionObserver === "undefined") {
      targets.forEach((el) => el.classList.add("in"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target as HTMLElement;
          el.style.transitionDelay = `${Number(el.dataset.revealDelay ?? 0)}ms`;
          el.classList.add("in");
          observer.unobserve(el);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [rootId]);
}