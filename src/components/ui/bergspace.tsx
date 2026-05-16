import React from "react";

/* ------------------------------------------------------------------ */
/*  PeakMark — Mountain logo SVG                                      */
/* ------------------------------------------------------------------ */
export function PeakMark({
  size = 22,
  color = "currentColor",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M2 19.2 L8.4 8.2 L11.3 13 L15.3 6 L22 19.2 Z"
        stroke={color}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M14.05 8.2 L15.3 6 L16.55 8.2 L15.85 8.9 L15.3 8.3 L14.75 8.9 Z"
        fill={color}
        stroke="none"
      />
      <path
        d="M7.5 9.7 L8.4 8.2 L9.3 9.7 L8.8 10.2 L8.4 9.7 L8 10.2 Z"
        fill={color}
        stroke="none"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Wordmark — PeakMark + "BERGSPACE" text                            */
/* ------------------------------------------------------------------ */
export function Wordmark({
  size = 22,
  color,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "10px",
      }}
    >
      <PeakMark
        size={size}
        color={color || "var(--accent-color)"}
      />
      <span
        style={{
          fontWeight: 600,
          fontSize: size * 0.68,
          letterSpacing: "0.02em",
          color: color || "var(--text)",
          lineHeight: 1,
        }}
      >
        BERGSPACE
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  ContourBg — Decorative SVG contour lines for login background     */
/* ------------------------------------------------------------------ */
export function ContourBg() {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 600 800"
      fill="none"
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        opacity: 0.12,
        pointerEvents: "none",
      }}
    >
      {/* Topographic contour lines */}
      <path
        d="M-20 200 Q150 140 300 190 Q450 240 620 180"
        stroke="var(--accent-color)"
        strokeWidth="1"
        fill="none"
      />
      <path
        d="M-20 260 Q120 200 280 250 Q440 300 620 230"
        stroke="var(--accent-color)"
        strokeWidth="1"
        fill="none"
      />
      <path
        d="M-20 320 Q160 270 320 310 Q480 350 620 290"
        stroke="var(--accent-color)"
        strokeWidth="1"
        fill="none"
      />
      <path
        d="M-20 400 Q100 350 260 390 Q420 430 620 370"
        stroke="var(--accent-color)"
        strokeWidth="1"
        fill="none"
      />
      <path
        d="M-20 460 Q140 410 300 450 Q460 490 620 420"
        stroke="var(--accent-color)"
        strokeWidth="1"
        fill="none"
      />
      <path
        d="M-20 540 Q180 490 340 530 Q500 570 620 500"
        stroke="var(--accent-color)"
        strokeWidth="1"
        fill="none"
      />
      <path
        d="M-20 600 Q130 560 290 590 Q450 620 620 570"
        stroke="var(--accent-color)"
        strokeWidth="1"
        fill="none"
      />
      {/* Mountain silhouettes */}
      <path
        d="M100 700 L200 450 L260 550 L340 380 L420 520 L500 420 L600 700 Z"
        stroke="var(--accent-color)"
        strokeWidth="0.8"
        fill="none"
      />
      <path
        d="M50 700 L180 500 L240 580 L320 430 L400 560 L480 470 L620 700 Z"
        stroke="var(--accent-color)"
        strokeWidth="0.6"
        fill="none"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  StatusPill — Pill with leading dot and tonal background            */
/* ------------------------------------------------------------------ */
const toneMap: Record<string, { bg: string; color: string }> = {
  good: { bg: "var(--good-soft)", color: "var(--good)" },
  warn: { bg: "var(--warn-soft)", color: "var(--warn)" },
  bad: { bg: "var(--bad-soft)", color: "var(--bad)" },
  neutral: { bg: "var(--surface)", color: "var(--text-soft)" },
  accent: { bg: "var(--accent-soft)", color: "var(--accent-text)" },
};

export function StatusPill({
  tone = "neutral",
  children,
}: {
  tone?: "good" | "warn" | "bad" | "neutral" | "accent";
  children: React.ReactNode;
}) {
  const t = toneMap[tone] || toneMap.neutral;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "3px 10px 3px 8px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: 500,
        lineHeight: 1.4,
        background: t.bg,
        color: t.color,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: "currentColor",
          flexShrink: 0,
        }}
      />
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  RoleBadge — Monospace code-style badge                             */
/* ------------------------------------------------------------------ */
const roleBadgeMap: Record<string, { bg: string; color: string; label: string }> = {
  employee: { bg: "var(--surface)", color: "var(--text-soft)", label: "EMP" },
  manager: { bg: "var(--good-soft)", color: "var(--good)", label: "MGR" },
  admin: { bg: "var(--accent-soft)", color: "var(--accent-text)", label: "ADMIN" },
};

export function RoleBadge({ role }: { role: string }) {
  const r = roleBadgeMap[role] || roleBadgeMap.employee;
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: "4px",
        fontSize: "11px",
        fontWeight: 500,
        fontFamily: "var(--font-geist-mono), monospace",
        letterSpacing: "0.02em",
        textTransform: "uppercase",
        background: r.bg,
        color: r.color,
        lineHeight: 1.5,
      }}
    >
      {r.label}
    </span>
  );
}
