"use client";
import { useEffect, useRef, useState } from "react";

export function AnimatedSparkline({ points, color = "#1A1A1A" }: { points: string; color?: string }) {
  const ref = useRef<SVGSVGElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.unobserve(el);
      }
    }, { threshold: 0.5 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <svg ref={ref} viewBox="0 0 120 28" preserveAspectRatio="none" style={{ width: "100%", height: 28 }}>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinejoin="round"
        points={points}
        strokeDasharray="300"
        strokeDashoffset={visible ? "0" : "300"}
        style={{ transition: "stroke-dashoffset 1.5s ease-out" }}
      />
    </svg>
  );
}
