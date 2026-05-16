"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

function PeakMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M2 19.2 L8.4 8.2 L11.3 13 L15.3 6 L22 19.2 Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M14.05 8.2 L15.3 6 L16.55 8.2 L15.85 8.9 L15.3 8.3 L14.75 8.9 Z" fill="currentColor" stroke="none" />
      <path d="M7.5 9.7 L8.4 8.2 L9.3 9.7 L8.8 10.2 L8.4 9.7 L8 10.2 Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

const sections = [
  { id: "home", label: "Home" },
  { id: "features", label: "Features" },
  { id: "roles", label: "Roles" },
];

export function LandingNav() {
  const [active, setActive] = useState("home");

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY + 200;
      for (const section of [...sections].reverse()) {
        const el = document.getElementById(section.id);
        if (el && el.offsetTop <= scrollY) {
          setActive(section.id);
          break;
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="fixed top-5 left-0 right-0 flex justify-center z-50 pointer-events-none">
      <nav
        className="pointer-events-auto inline-flex items-center gap-1 rounded-full border px-2 py-1.5"
        style={{
          background: "rgba(254,252,249,0.85)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderColor: "#E8E2D6",
          boxShadow: "0 10px 30px rgba(0,0,0,0.06), 0 2px 6px rgba(0,0,0,0.04)",
          fontSize: "14px",
          fontWeight: 500,
        }}
      >
        <div className="flex items-center gap-2 px-3" style={{ color: "#C45A2D" }}>
          <PeakMark size={20} />
          <span style={{ fontWeight: 700, color: "#1A1A1A", fontSize: "14px" }}>BergSpace</span>
        </div>
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            onClick={() => setActive(s.id)}
            className="px-4 py-2 rounded-full transition-all duration-200"
            style={{
              background: active === s.id ? "#1A1A1A" : "transparent",
              color: active === s.id ? "#FEFCF9" : "#1A1A1A",
            }}
          >
            {s.label}
          </a>
        ))}
        <Link
          href="/auth/signup"
          className="px-5 py-2 rounded-full text-white font-bold ml-1 transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#C45A2D" }}
        >
          Get Started
        </Link>
      </nav>
    </div>
  );
}
