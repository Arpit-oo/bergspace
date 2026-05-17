"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    function revealAll() {
      const els = document.querySelectorAll(".sr");
      if (!els.length) return;

      // Immediately show elements already in viewport
      els.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          el.classList.add("sr-visible");
        }
      });

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("sr-visible");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1, rootMargin: "0px 0px -20px 0px" }
      );

      els.forEach((el) => {
        if (!el.classList.contains("sr-visible")) {
          observer.observe(el);
        }
      });

      return () => observer.disconnect();
    }

    // Run immediately
    const cleanup = revealAll();

    // Also run after a short delay for client-side navigation
    const timer = setTimeout(() => {
      revealAll();
    }, 100);

    return () => {
      cleanup?.();
      clearTimeout(timer);
    };
  }, [pathname]);

  return null;
}
