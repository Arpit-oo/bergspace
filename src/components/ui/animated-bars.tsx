"use client";
import { useEffect, useRef, useState } from "react";

export function AnimatedBar({ pct, color, delay = 0 }: { pct: number; color: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.unobserve(el);
      }
    }, { threshold: 0.3 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="h-2 rounded-full" style={{ backgroundColor: "rgba(255,255,255,.08)" }}>
      <div
        className="h-full rounded-full"
        style={{
          width: visible ? `${pct}%` : "0%",
          backgroundColor: color,
          transition: `width 1s ease-out ${delay}s`,
        }}
      />
    </div>
  );
}
