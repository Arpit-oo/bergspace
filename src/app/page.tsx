import Link from "next/link";
import dynamic from "next/dynamic";

const ScrollReveal = dynamic(() =>
  import("@/components/ui/scroll-reveal").then((m) => m.ScrollReveal)
);
const CountUp = dynamic(() =>
  import("@/components/ui/count-up").then((m) => m.CountUp)
);
const AnimatedSparkline = dynamic(() =>
  import("@/components/ui/animated-sparkline").then((m) => m.AnimatedSparkline)
);
const AnimatedBar = dynamic(() =>
  import("@/components/ui/animated-bars").then((m) => m.AnimatedBar)
);
const LandingNav = dynamic(() =>
  import("@/components/ui/landing-nav").then((m) => m.LandingNav)
);
const FAQ = dynamic(() =>
  import("@/components/ui/faq").then((m) => m.FAQ)
);

/* ─── Mountain Logo ─── */
function PeakMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M2 19.2 L8.4 8.2 L11.3 13 L15.3 6 L22 19.2 Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M14.05 8.2 L15.3 6 L16.55 8.2 L15.85 8.9 L15.3 8.3 L14.75 8.9 Z" fill="currentColor" stroke="none" />
      <path d="M7.5 9.7 L8.4 8.2 L9.3 9.7 L8.8 10.2 L8.4 9.7 L8 10.2 Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FEFCF9", color: "#1A1A1A" }}>
      <ScrollReveal />

      {/* ─── Animations ─── */}
      <style dangerouslySetInnerHTML={{ __html: `
        /* scroll reveal */
        .sr { opacity: 0; transform: translateY(32px); transition: opacity 0.7s cubic-bezier(.22,1,.36,1), transform 0.7s cubic-bezier(.22,1,.36,1); }
        .sr-visible { opacity: 1 !important; transform: translateY(0) !important; }
        .sr-d1 { transition-delay: .08s; }
        .sr-d2 { transition-delay: .16s; }
        .sr-d3 { transition-delay: .24s; }
        .sr-d4 { transition-delay: .32s; }
        .sr-d5 { transition-delay: .40s; }
        .sr-d6 { transition-delay: .48s; }

        /* pulse */
        @keyframes pulse-dot { 0%,100% { opacity: 1; } 50% { opacity: .4; } }
        .pulse-dot { animation: pulse-dot 2s ease-in-out infinite; }

        /* tilted cards */
        .tilt-card { transition: transform 0.35s ease, box-shadow 0.35s ease; }
        .tilt-card:hover { transform: rotate(0deg) translateY(-8px) !important; box-shadow: 0 32px 64px rgba(0,0,0,.16), 0 8px 20px rgba(0,0,0,.08); }

        /* hero text shimmer */
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }

        /* heatmap cell pulse */
        @keyframes heat-pulse { 0%,100% { opacity: .7; } 50% { opacity: 1; } }

        /* animated chart line draw */
        @keyframes drawLine {
          from { stroke-dashoffset: 2000; }
          to { stroke-dashoffset: 0; }
        }

        /* fade in */
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* grid dot bg */
        .dot-grid-bg {
          background-image: radial-gradient(circle, rgba(255,255,255,.08) 1px, transparent 1px);
          background-size: 24px 24px;
        }

        /* comparison table */
        .comp-table { border-collapse: separate; border-spacing: 0; }
        .comp-table th, .comp-table td { padding: 14px 20px; text-align: left; }
        .comp-table thead th { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; }
        .comp-table tbody tr { transition: background .2s; }
        .comp-table tbody tr:hover { background: rgba(196,90,45,.04); }
        .comp-table tbody td { border-top: 1px solid #E8E2D6; }

        /* geometric drift */
        @keyframes drift {
          0% { transform: translate(0, 0) rotate(0deg); }
          100% { transform: translate(30px, -20px) rotate(8deg); }
        }

        /* newsletter input */
        .nl-input { display: flex; gap: 0; }
        .nl-input input { flex: 1; padding: 10px 14px; border: 1px solid #3A352E; background: transparent; color: #FEFCF9; border-radius: 10px 0 0 10px; font-size: 14px; outline: none; }
        .nl-input input::placeholder { color: #6B6458; }
        .nl-input button { padding: 10px 18px; background: #C45A2D; color: white; border: none; border-radius: 0 10px 10px 0; font-weight: 700; font-size: 14px; cursor: pointer; }
      ` }} />

      {/* ══════════════ PILL NAV ══════════════ */}
      <LandingNav />

      {/* ══════════════ HERO ══════════════ */}
      <section id="home" className="relative overflow-hidden pt-36 pb-12 md:pt-44 md:pb-16">
        {/* sunray SVG */}
        <svg className="absolute top-[-120px] left-[-120px] w-[1400px] h-[900px] pointer-events-none z-0 opacity-60" viewBox="0 0 1400 900" aria-hidden="true">
          <defs>
            <radialGradient id="rayG" cx="15%" cy="15%" r="70%">
              <stop offset="0%" stopColor="#F5C49A" stopOpacity="0.8"/>
              <stop offset="60%" stopColor="#FEF3EE" stopOpacity="0"/>
            </radialGradient>
            <linearGradient id="rayL" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#F5C49A" stopOpacity="0.9"/>
              <stop offset="100%" stopColor="#FEF3EE" stopOpacity="0"/>
            </linearGradient>
          </defs>
          <circle cx="160" cy="150" r="540" fill="url(#rayG)"/>
          <g fill="url(#rayL)">
            <path d="M160 150 L1400 120 L1400 240 Z" opacity="0.65"/>
            <path d="M160 150 L1400 280 L1400 420 Z" opacity="0.45"/>
            <path d="M160 150 L1400 500 L1400 620 Z" opacity="0.25"/>
          </g>
        </svg>
        {/* radial glow */}
        <div className="pointer-events-none absolute top-[-300px] left-1/2 -translate-x-1/2 h-[800px] w-[1000px] rounded-full opacity-30 blur-3xl" style={{ background: "radial-gradient(circle, rgba(196,90,45,.3), transparent 65%)" }} />
        {/* Mountain logo — large subtle on left */}
        <div className="absolute left-8 top-1/2 -translate-y-1/2 opacity-[0.06] pointer-events-none" aria-hidden="true">
          <svg width="280" height="280" viewBox="0 0 24 24" fill="none">
            <path d="M2 19.2 L8.4 8.2 L11.3 13 L15.3 6 L22 19.2 Z" stroke="#1A1A1A" strokeWidth="0.8" strokeLinejoin="round" />
            <path d="M14.05 8.2 L15.3 6 L16.55 8.2 L15.85 8.9 L15.3 8.3 L14.75 8.9 Z" fill="#1A1A1A" stroke="none" />
            <path d="M7.5 9.7 L8.4 8.2 L9.3 9.7 L8.8 10.2 L8.4 9.7 L8 10.2 Z" fill="#1A1A1A" stroke="none" />
          </svg>
        </div>
        {/* Geometric shapes — hero */}
        <div className="absolute right-[10%] top-[20%] w-16 h-16 rounded-full border-2 opacity-[0.08] pointer-events-none" style={{ borderColor: "#C45A2D", animation: "drift 20s ease-in-out infinite alternate" }} aria-hidden="true" />
        <div className="absolute right-[25%] top-[60%] w-8 h-8 border-2 opacity-[0.06] pointer-events-none" style={{ borderColor: "#1A1A1A", transform: "rotate(45deg)", animation: "drift 15s ease-in-out infinite alternate-reverse" }} aria-hidden="true" />
        <div className="absolute left-[15%] bottom-[15%] w-12 h-12 rounded-full border-2 opacity-[0.05] pointer-events-none" style={{ borderColor: "#3B7DD8", animation: "drift 18s ease-in-out infinite alternate" }} aria-hidden="true" />
        <div className="relative mx-auto px-6 text-center" style={{ maxWidth: 1280 }}>
          <div className="sr mb-6 inline-flex items-center gap-2.5 rounded-full border px-4 py-1.5 text-sm font-medium" style={{ borderColor: "#E8E2D6", color: "#8C8578", backgroundColor: "#F5F1EA" }}>
            <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "#C45A2D" }} />
            Enterprise goal tracking, simplified
          </div>
          <h1
            className="sr sr-d1 mx-auto font-extrabold leading-[0.88] tracking-tighter"
            style={{ fontSize: "clamp(72px, 14vw, 200px)", color: "#1A1A1A", letterSpacing: "-0.04em" }}
          >
            BERGSPACE
          </h1>
          <div className="flex justify-center gap-4 mt-8 mb-6">
            <a href="/auth/signup" style={{ backgroundColor: "#C45A2D" }} className="inline-flex items-center gap-2 text-white font-bold text-base px-8 py-3.5 rounded-full hover:opacity-90 transition-opacity">
              Get Started
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </a>
            <a href="/auth/login" className="inline-flex items-center gap-2 font-bold text-base px-8 py-3.5 rounded-full border-2 hover:bg-[#F5F1EA] transition-colors" style={{ borderColor: "#1A1A1A", color: "#1A1A1A" }}>
              View Demo
            </a>
          </div>
          <div className="sr sr-d2 mt-6 flex items-center justify-center gap-2.5 text-sm font-medium" style={{ color: "#8C8578" }}>
            <span className="pulse-dot inline-block h-2 w-2 rounded-full" style={{ backgroundColor: "#22C55E" }} />
            Now onboarding teams &mdash; trusted by 50+ organizations
          </div>
        </div>
      </section>

      {/* ══════════════ STATS STRIP ══════════════ */}
      <section className="sr" style={{ backgroundColor: "#F5F1EA" }}>
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-6 py-16 md:grid-cols-4">
          {[
            { target: 100, suffix: "%", label: "Weighted Goals" },
            { target: 8, suffix: "", label: "Max per Sheet" },
            { target: 4, suffix: "", label: "Quarterly Cycles" },
            { target: 3, suffix: "", label: "User Roles" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-4xl font-extrabold tracking-tight md:text-5xl" style={{ color: "#1A1A1A", letterSpacing: "-0.02em" }}>
                <CountUp target={stat.target} suffix={stat.suffix} />
              </div>
              <div className="mt-2 text-sm font-medium" style={{ color: "#8C8578" }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Geometric accent — before work grid */}
      <div className="relative">
        <div className="absolute left-[8%] -top-4 w-6 h-6 rounded-full opacity-[0.08] pointer-events-none" style={{ backgroundColor: "#C45A2D", animation: "drift 22s ease-in-out infinite alternate" }} aria-hidden="true" />
      </div>

      {/* ══════════════ WORK GRID — THE MAIN EVENT ══════════════ */}
      <section className="py-20 md:py-28" style={{ backgroundColor: "#FEFCF9" }}>
        <div className="mx-auto max-w-6xl px-6">
          <div className="sr mb-4">
            <p className="text-sm font-bold uppercase tracking-widest" style={{ color: "#C45A2D" }}>from goals to results</p>
          </div>
          <h2 className="sr sr-d1 mb-14 max-w-xl text-3xl font-extrabold tracking-tight md:text-5xl" style={{ letterSpacing: "-0.03em" }}>What BergSpace does</h2>

          <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(12, 1fr)", gridAutoRows: "minmax(0, 1fr)" }}>

            {/* ── Card 1: Navy — Goal Tracking Dashboard (wide) ── */}
            <div
              className="sr sr-d1 tilt-card col-span-12 md:col-span-7 rounded-2xl p-7 md:p-8 flex flex-col"
              style={{ backgroundColor: "#1A2332", color: "#E8E2D6", minHeight: 440, transform: "rotate(-1.8deg)" }}
            >
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider opacity-60 mb-4">
                <span>Q2 2026 Goals</span>
                <span className="rounded-full px-2.5 py-0.5" style={{ backgroundColor: "rgba(78,255,212,.15)", color: "#4EFFD4" }}>Live</span>
              </div>
              <div className="text-5xl font-extrabold mb-1 tracking-tight" style={{ color: "#4EFFD4" }}>+34% <span className="text-lg font-bold opacity-60" style={{ color: "#E8E2D6" }}>&uarr;</span></div>
              <p className="text-sm opacity-50 mb-6">Completion rate vs last quarter</p>
              {/* animated progress bars */}
              <div className="space-y-4 flex-1">
                {[
                  { name: "Revenue Growth Target", pct: 78, color: "#4EFFD4", delay: 0.3 },
                  { name: "Customer Retention", pct: 92, color: "#4EFFD4", delay: 0.5 },
                  { name: "Product Launch Milestones", pct: 45, color: "#FFD400", delay: 0.7 },
                ].map((g) => (
                  <div key={g.name}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-medium opacity-80">{g.name}</span>
                      <span className="font-bold" style={{ color: g.color }}>{g.pct}%</span>
                    </div>
                    <AnimatedBar pct={g.pct} color={g.color} delay={g.delay} />
                  </div>
                ))}
              </div>
              {/* mini area chart — animated */}
              <div className="mt-4">
                <svg viewBox="0 0 600 80" preserveAspectRatio="none" style={{ width: "100%", height: 60 }}>
                  <defs>
                    <linearGradient id="areaTeal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4EFFD4" stopOpacity=".25" />
                      <stop offset="100%" stopColor="#4EFFD4" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0,60 C60,55 110,45 170,40 C220,36 260,50 310,42 C360,34 400,20 460,14 C510,9 560,6 600,4 L600,80 L0,80 Z" fill="url(#areaTeal)" style={{ opacity: 0, animation: "fadeIn 1s ease-out 1s forwards" }} />
                  <path d="M0,60 C60,55 110,45 170,40 C220,36 260,50 310,42 C360,34 400,20 460,14 C510,9 560,6 600,4" fill="none" stroke="#4EFFD4" strokeWidth="2" strokeLinecap="round" strokeDasharray="2000" strokeDashoffset="2000" style={{ animation: "drawLine 2s ease-out 0.5s forwards" }} />
                </svg>
              </div>
              <div className="mt-3 flex items-center gap-2 text-sm font-bold" style={{ color: "#E8E2D6" }}>
                <span>Goal Tracking Dashboard</span>
                <span style={{ color: "#4EFFD4" }}>{"↗"}</span>
              </div>
              <div className="text-xs opacity-40 mt-0.5">Progress &middot; Metrics &middot; Real-time</div>
            </div>

            {/* ── Card 2: Cream — Approval Flow ── */}
            <div
              className="sr sr-d2 tilt-card col-span-12 md:col-span-5 rounded-2xl p-7 flex flex-col"
              style={{ backgroundColor: "#EDE5D4", color: "#1A1A1A", minHeight: 440, transform: "rotate(2.2deg)" }}
            >
              <div className="text-xs font-bold uppercase tracking-wider mb-5" style={{ color: "#8C8578" }}>Approval Flow</div>
              {/* flow steps */}
              <div className="flex items-center gap-3 mb-6">
                {["Submitted", "Reviewing", "Approved"].map((step, i) => (
                  <div key={step} className="flex items-center gap-2">
                    <div className="rounded-full px-3 py-1.5 text-xs font-bold" style={{
                      backgroundColor: i === 2 ? "#22C55E" : i === 1 ? "#F59E0B" : "#8C8578",
                      color: "white"
                    }}>{step}</div>
                    {i < 2 && <span style={{ color: "#8C8578" }}>&rarr;</span>}
                  </div>
                ))}
              </div>
              {/* fake approval entries */}
              <div className="space-y-3 flex-1">
                {[
                  { name: "Sarah Chen", goal: "Increase NRR to 120%", status: "Approved", statusColor: "#22C55E", avatarBg: "linear-gradient(135deg,#6B8F5E,#4A6E40)" },
                  { name: "Marcus Webb", goal: "Launch mobile SDK v2", status: "Reviewing", statusColor: "#F59E0B", avatarBg: "linear-gradient(135deg,#6366F1,#4F46E5)" },
                  { name: "Priya Nair", goal: "Reduce churn to <3%", status: "Submitted", statusColor: "#8C8578", avatarBg: "linear-gradient(135deg,#EC4899,#BE185D)" },
                  { name: "James Liu", goal: "Hire 4 senior engineers", status: "Approved", statusColor: "#22C55E", avatarBg: "linear-gradient(135deg,#F59E0B,#D97706)" },
                ].map((entry) => (
                  <div key={entry.name} className="flex items-center gap-3 rounded-xl p-3" style={{ backgroundColor: "rgba(255,255,255,.5)" }}>
                    <div className="h-8 w-8 shrink-0 rounded-full" style={{ background: entry.avatarBg }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold truncate">{entry.name}</div>
                      <div className="text-xs truncate" style={{ color: "#8C8578" }}>{entry.goal}</div>
                    </div>
                    <span className="shrink-0 text-xs font-bold" style={{ color: entry.statusColor }}>{entry.status}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm font-bold">
                <span>Approval Workflows</span>
                <span style={{ color: "#C45A2D" }}>{"↗"}</span>
              </div>
              <div className="text-xs mt-0.5" style={{ color: "#8C8578" }}>Review &middot; Sign-off &middot; Audit Trail</div>
            </div>

            {/* ── Card 3: Terracotta — Achievement Metric (tall) ── */}
            <div
              className="sr sr-d3 tilt-card col-span-12 md:col-span-4 rounded-2xl p-7 flex flex-col items-center justify-center text-center relative overflow-hidden"
              style={{ backgroundColor: "#C45A2D", color: "white", minHeight: 480, transform: "rotate(1.4deg)" }}
            >
              {/* dotted bg */}
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, white 1.5px, transparent 1.5px)", backgroundSize: "20px 20px" }} />
              <div className="relative">
                <div className="text-8xl font-extrabold tracking-tighter md:text-9xl" style={{ lineHeight: 0.9 }}>92<span className="text-5xl">%</span></div>
                <p className="mt-4 text-sm font-medium opacity-80">Avg. goal completion</p>
                <p className="text-xs opacity-50 mt-1">First quarter &middot; across all departments</p>
                <div className="mt-8 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold" style={{ backgroundColor: "rgba(255,255,255,.2)" }}>
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  +12% vs previous cycle
                </div>
              </div>
              <div className="absolute bottom-6 left-7 right-7">
                <div className="flex items-center gap-2 text-sm font-bold">
                  <span>Achievement Rate</span>
                  <span>{"↗"}</span>
                </div>
                <div className="text-xs opacity-50 mt-0.5">Completion &middot; Benchmarks</div>
              </div>
            </div>

            {/* ── Card 4: Sand — Weekly Check-in ── */}
            <div
              className="sr sr-d4 tilt-card col-span-12 md:col-span-8 rounded-2xl p-7 md:p-8 flex flex-col"
              style={{ backgroundColor: "#F0E8D8", color: "#1A1A1A", minHeight: 480, transform: "rotate(-1.2deg)" }}
            >
              <div className="text-xs font-bold uppercase tracking-wider mb-5" style={{ color: "#8C8578" }}>Weekly Intelligence Brief</div>
              <div className="space-y-5 flex-1">
                {[
                  { label: "Net Revenue Retention", value: "118%", trend: "+6 pts", sparkPts: "0,20 15,18 30,16 45,18 60,14 75,13 90,10 105,8 120,4" },
                  { label: "Goals Met This Quarter", value: "24/30", trend: "+8", sparkPts: "0,22 15,20 30,22 45,18 60,15 75,12 90,14 105,10 120,6" },
                  { label: "On-Track Percentage", value: "89%", trend: "+4%", sparkPts: "0,16 15,14 30,16 45,12 60,10 75,8 90,10 105,6 120,4" },
                  { label: "Escalations Resolved", value: "12/14", trend: "86%", sparkPts: "0,24 15,22 30,18 45,20 60,16 75,14 90,12 105,8 120,5" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center gap-4 rounded-xl p-3" style={{ backgroundColor: "rgba(255,255,255,.45)" }}>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium" style={{ color: "#8C8578" }}>{row.label}</div>
                    </div>
                    <div className="w-28 shrink-0 hidden sm:block">
                      <AnimatedSparkline points={row.sparkPts} color="#C45A2D" />
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg font-extrabold tracking-tight">{row.value}</div>
                      <div className="text-xs font-bold" style={{ color: "#22C55E" }}>{row.trend}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm font-bold">
                <span>Quarterly Check-ins</span>
                <span style={{ color: "#C45A2D" }}>{"↗"}</span>
              </div>
              <div className="text-xs mt-0.5" style={{ color: "#8C8578" }}>KPIs &middot; Sparklines &middot; Trends</div>
            </div>

            {/* ── Card 5: Violet — Heatmap ── */}
            <div
              className="sr sr-d5 tilt-card col-span-12 md:col-span-5 rounded-2xl p-7 flex flex-col"
              style={{ backgroundColor: "#2A1B4A", color: "#E0D4F5", minHeight: 380, transform: "rotate(2deg)" }}
            >
              <div className="text-xs font-bold uppercase tracking-wider mb-4 opacity-60">Department completion rates</div>
              {/* heatmap grid with department labels */}
              <div className="flex-1 flex flex-col justify-center">
                {/* header row */}
                <div className="grid gap-1.5 mb-1.5" style={{ gridTemplateColumns: "56px repeat(4, 1fr)" }}>
                  <div />
                  {["Q1", "Q2", "Q3", "Q4"].map((q) => (
                    <div key={q} className="text-[10px] font-bold text-center opacity-50">{q}</div>
                  ))}
                </div>
                {/* data rows */}
                {[
                  { dept: "Eng", values: [92, 88, 95, null] },
                  { dept: "Product", values: [78, 84, 82, null] },
                  { dept: "Sales", values: [65, 72, 80, null] },
                  { dept: "HR", values: [90, 85, 88, null] },
                ].map((row) => (
                  <div key={row.dept} className="grid gap-1.5 mb-1.5" style={{ gridTemplateColumns: "56px repeat(4, 1fr)" }}>
                    <div className="text-[11px] font-bold opacity-60 flex items-center">{row.dept}</div>
                    {row.values.map((v, i) => {
                      if (v === null) return (
                        <div key={i} className="rounded-md flex items-center justify-center py-2" style={{ backgroundColor: "rgba(167,139,250,.1)" }}>
                          <span className="text-[10px] font-mono opacity-30">&mdash;</span>
                        </div>
                      );
                      const bg = v >= 80 ? "rgba(74,222,128,.35)" : v >= 60 ? "rgba(251,191,36,.35)" : "rgba(239,68,68,.35)";
                      const textColor = v >= 80 ? "#4ADE80" : v >= 60 ? "#FBBf24" : "#EF4444";
                      return (
                        <div
                          key={i}
                          className="rounded-md flex items-center justify-center py-2"
                          style={{
                            backgroundColor: bg,
                            animation: `heat-pulse ${2 + (i % 3) * 0.5}s ease-in-out infinite`,
                            animationDelay: `${i * 0.15}s`,
                          }}
                        >
                          <span className="text-[11px] font-mono font-bold" style={{ color: textColor }}>{v}%</span>
                        </div>
                      );
                    })}
                  </div>
                ))}
                {/* legend */}
                <div className="flex items-center gap-3 text-[10px] mt-3 opacity-50">
                  <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: "rgba(74,222,128,.5)" }} />&ge;80%</span>
                  <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: "rgba(251,191,36,.5)" }} />60-79%</span>
                  <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: "rgba(239,68,68,.5)" }} />&lt;60%</span>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm font-bold">
                <span>Analytics Heatmap</span>
                <span style={{ color: "#A78BFA" }}>{"↗"}</span>
              </div>
              <div className="text-xs opacity-40 mt-0.5">Heatmaps &middot; Segments &middot; Patterns</div>
            </div>

            {/* ── Card 6: Forest — Escalation Feed ── */}
            <div
              className="sr sr-d5 tilt-card col-span-12 md:col-span-7 rounded-2xl p-7 flex flex-col"
              style={{ backgroundColor: "#0F2A14", color: "#C8E6C9", minHeight: 380, transform: "rotate(-1.6deg)" }}
            >
              <div className="text-xs font-bold uppercase tracking-wider mb-5 opacity-60">Anomaly feed &middot; Last 30 days</div>
              <div className="flex-1 relative">
                {/* timeline axis */}
                <div className="absolute left-4 top-2 bottom-2 w-0.5 rounded-full" style={{ backgroundColor: "rgba(200,230,201,.15)" }} />
                <div className="space-y-4 pl-10">
                  {[
                    { date: "May 14", text: "Goal weightage exceeded 100%", type: "alert", color: "#EF4444" },
                    { date: "May 11", text: "3 goals pending approval > 7 days", type: "warning", color: "#F59E0B" },
                    { date: "May 08", text: "Check-in submitted late — Ops team", type: "info", color: "#60A5FA" },
                    { date: "May 03", text: "Spike in goal modifications detected", type: "alert", color: "#EF4444" },
                    { date: "Apr 28", text: "Department avg dropped below 70%", type: "warning", color: "#F59E0B" },
                  ].map((item, i) => (
                    <div key={i} className="relative flex items-start gap-3">
                      <div className="absolute -left-8 top-1 h-3 w-3 rounded-full border-2" style={{ backgroundColor: item.color, borderColor: "#0F2A14" }} />
                      <div>
                        <div className="text-xs font-bold opacity-50">{item.date}</div>
                        <div className="text-sm font-medium">{item.text}</div>
                      </div>
                      <span className="ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase" style={{ backgroundColor: `${item.color}22`, color: item.color }}>{item.type}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm font-bold">
                <span>Escalation Feed</span>
                <span style={{ color: "#4ADE80" }}>{"↗"}</span>
              </div>
              <div className="text-xs opacity-40 mt-0.5">Alerts &middot; Anomalies &middot; Real-time</div>
            </div>

            {/* ── Card 7: Lavender — AI Validator ── */}
            <div
              className="sr sr-d6 tilt-card col-span-12 rounded-2xl p-7 md:p-8 flex flex-col"
              style={{ backgroundColor: "#E8E0F0", color: "#1A1A1A", minHeight: 340, transform: "rotate(1deg)" }}
            >
              <div className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: "#6E5BA2" }}>SMART Goal Validator</div>
              <div className="flex flex-col md:flex-row gap-6 flex-1">
                <div className="flex-1">
                  <div className="rounded-xl p-4 text-sm leading-relaxed" style={{ backgroundColor: "rgba(255,255,255,.6)" }}>
                    <span className="text-xs font-bold uppercase tracking-wider block mb-2" style={{ color: "#8C8578" }}>Goal Input</span>
                    &ldquo;Increase quarterly revenue by 15% through expanding enterprise accounts, measured by ARR growth, to be achieved by Q3 2026.&rdquo;
                  </div>
                </div>
                <div className="md:w-72 shrink-0">
                  <div className="rounded-xl p-4" style={{ backgroundColor: "rgba(255,255,255,.6)" }}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#6E5BA2" }}>Score</span>
                      <span className="text-2xl font-extrabold" style={{ color: "#6E5BA2" }}>4<span className="text-sm opacity-50">/5</span></span>
                    </div>
                    <div className="space-y-2">
                      {[
                        { label: "Specific", pass: true },
                        { label: "Measurable", pass: true },
                        { label: "Achievable", pass: true },
                        { label: "Relevant", pass: true },
                        { label: "Time-bound", pass: false },
                      ].map((c) => (
                        <div key={c.label} className="flex items-center gap-2 text-sm">
                          <span style={{ color: c.pass ? "#22C55E" : "#EF4444" }}>
                            {c.pass ? <CheckIcon /> : <XIcon />}
                          </span>
                          <span className="font-medium">{c.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Goal 2 */}
                <div className="flex-1">
                  <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.5)", border: "1px solid rgba(42,31,69,0.15)" }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold" style={{ color: "#6E5BA2" }}>Goal 2</span>
                      <span className="font-mono text-xs font-bold" style={{ color: "#3D9A5F" }}>5/5</span>
                    </div>
                    <p className="text-sm font-medium" style={{ color: "#2A1F45" }}>Reduce customer churn rate from 8% to 4% by Q2 end through proactive outreach program</p>
                    <div className="flex gap-1 mt-2">
                      {["S","M","A","R","T"].map(c => <span key={c} className="w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center" style={{ backgroundColor: "#E6ECDE", color: "#3D9A5F" }}>&#10003;</span>)}
                    </div>
                  </div>
                  {/* Goal 3 - failing */}
                  <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.5)", border: "1px solid rgba(42,31,69,0.15)" }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold" style={{ color: "#6E5BA2" }}>Goal 3</span>
                      <span className="font-mono text-xs font-bold" style={{ color: "#D94F3D" }}>2/5</span>
                    </div>
                    <p className="text-sm font-medium" style={{ color: "#2A1F45" }}>Improve team morale</p>
                    <div className="flex gap-1 mt-2">
                      {["S","M","A","R","T"].map((c,i) => <span key={c} className="w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center" style={{ backgroundColor: i < 2 ? "#FDF0EE" : "#E6ECDE", color: i < 2 ? "#D94F3D" : "#3D9A5F" }}>{i < 2 ? "✗" : "✓"}</span>)}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm font-bold">
                <span>AI SMART Validator</span>
                <span style={{ color: "#6E5BA2" }}>{"↗"}</span>
              </div>
              <div className="text-xs mt-0.5" style={{ color: "#8C8578" }}>Validation &middot; Scoring &middot; Suggestions</div>
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════ NOTEBOOK SECTION ══════════════ */}
      <section className="py-20 px-8 max-w-6xl mx-auto sr">
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-center mb-12 text-[#1A1A1A]">WHAT BERGSPACE DOES,<br/>IN PLAIN ENGLISH</h2>
        <div className="flex rounded-2xl overflow-hidden shadow-lg" style={{ minHeight: "440px" }}>
          {/* Left - terracotta panel with sticky notes */}
          <div className="w-[42%] relative p-8" style={{ backgroundColor: "#C45A2D" }}>
            <div className="absolute top-6 right-6 bg-white px-3 py-2 rounded-lg text-xs font-semibold shadow-md" style={{ transform: "rotate(6deg)" }}>When spreadsheets<br/>fail you &#8805;</div>
            <div className="absolute top-36 left-6 px-4 py-3 rounded-lg text-white text-sm font-extrabold" style={{ backgroundColor: "#1A2332", transform: "rotate(-6deg)" }}>MANUAL TRACKING:<br/>ZERO<div className="text-[9px] font-normal mt-1 opacity-70">we don&apos;t make your team<br/>chase updates anymore</div></div>
            <div className="absolute bottom-10 left-10 bg-white px-3 py-2 rounded-lg text-xs font-semibold shadow-md" style={{ transform: "rotate(4deg)" }}><div className="font-bold">Ships quarterly</div><div className="text-lg font-extrabold" style={{ color: "#C45A2D" }}>insights &#8594;</div></div>
          </div>
          {/* Right - dotted paper with steps */}
          <div className="flex-1 p-10 relative" style={{ backgroundColor: "#FDFBF3", backgroundImage: "radial-gradient(circle, #D4CFC5 1px, transparent 1.5px)", backgroundSize: "18px 18px" }}>
            <div className="absolute left-0 top-0 bottom-0 w-3" style={{ background: "repeating-linear-gradient(to bottom, #C45A2D 0 3px, transparent 3px 9px)" }}></div>
            <ol className="space-y-6 pl-4">
              {["Create goals with weighted targets & thrust areas", "Manager reviews, edits inline, approves or returns", "Goals lock — no more edits, full audit trail", "Quarterly check-ins: actual vs planned tracking", "Reports, analytics, escalations — all automatic"].map((step, i) => (
                <li key={i} className="flex items-center gap-4 text-lg font-semibold text-[#1A1A1A]" style={{ fontFamily: "Georgia, serif" }}>
                  <span className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold shrink-0" style={{ borderColor: "#C45A2D", color: "#C45A2D" }}>{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Decorative separator */}
      <div className="relative max-w-5xl mx-auto px-8">
        <div className="flex items-center justify-center gap-3 py-2">
          <div className="h-[1px] flex-1" style={{ backgroundColor: "#E8E2D6" }} />
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#C45A2D", opacity: 0.15 }} />
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#C45A2D", opacity: 0.1 }} />
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#C45A2D", opacity: 0.15 }} />
          <div className="h-[1px] flex-1" style={{ backgroundColor: "#E8E2D6" }} />
        </div>
      </div>

      {/* Geometric accent — before features */}
      <div className="relative">
        <div className="absolute right-[12%] -top-3 w-5 h-5 opacity-[0.07] pointer-events-none" style={{ backgroundColor: "#1A1A1A", transform: "rotate(45deg)", animation: "drift 17s ease-in-out infinite alternate-reverse" }} aria-hidden="true" />
      </div>

      {/* ══════════════ FEATURES (DARK SECTION) ══════════════ */}
      <section id="features" className="relative overflow-hidden py-24 md:py-32" style={{ backgroundColor: "#1A2332" }}>
        <div className="dot-grid-bg absolute inset-0" />
        <div className="relative mx-auto max-w-5xl px-6 text-center">
          <p className="sr mb-3 text-sm font-bold uppercase tracking-widest" style={{ color: "#4EFFD4" }}>everything under the hood</p>
          <h2 className="sr sr-d1 mx-auto mb-6 max-w-2xl text-3xl font-extrabold tracking-tight text-white md:text-5xl" style={{ letterSpacing: "-0.03em" }}>
            Built for teams who need structure, not spreadsheets
          </h2>
          <p className="sr sr-d2 mx-auto mb-10 max-w-lg text-base" style={{ color: "rgba(255,255,255,.45)" }}>
            Six modules. One platform. Zero spreadsheets.
          </p>
          <div className="sr sr-d3 flex flex-wrap justify-center gap-2.5">
            {[
              { label: "Goals", color: "#1A2332" },
              { label: "Approvals", color: "#EDE5D4" },
              { label: "Check-ins", color: "#C45A2D" },
              { label: "Reports", color: "#F0E8D8" },
              { label: "Analytics", color: "#2A1B4A" },
              { label: "Escalations", color: "#0F2A14" },
            ].map((pill) => (
              <span key={pill.label} className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold text-white" style={{ borderColor: "rgba(255,255,255,.12)" }}>
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: pill.color, border: "1px solid rgba(255,255,255,.2)" }} />
                {pill.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ FAQ SECTION ══════════════ */}
      <section className="py-20 px-8 max-w-5xl mx-auto sr">
        <div className="text-center mb-12">
          <p className="text-sm text-[#8C8578] italic mb-3">the boring-but-important stuff</p>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#1A1A1A]">QUESTIONS?<br/>ANSWERS.</h2>
        </div>
        <FAQ />
      </section>

      {/* Decorative separator */}
      <div className="relative max-w-5xl mx-auto px-8">
        <div className="flex items-center justify-center gap-3 py-2">
          <div className="h-[1px] flex-1" style={{ backgroundColor: "#E8E2D6" }} />
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#C45A2D", opacity: 0.15 }} />
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#C45A2D", opacity: 0.1 }} />
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#C45A2D", opacity: 0.15 }} />
          <div className="h-[1px] flex-1" style={{ backgroundColor: "#E8E2D6" }} />
        </div>
      </div>

      {/* ══════════════ COMPARISON TABLE ══════════════ */}
      <section className="relative py-20 md:py-28" style={{ backgroundColor: "#FEFCF9", backgroundImage: "radial-gradient(circle, #E8E2D6 1px, transparent 1px)", backgroundSize: "24px 24px" }}>
        {/* Corner decorative elements */}
        <div className="absolute top-6 right-6 w-12 h-12 pointer-events-none opacity-[0.04]" style={{ background: "repeating-linear-gradient(45deg, #1A1A1A 0, #1A1A1A 1px, transparent 1px, transparent 8px)" }} aria-hidden="true" />
        <div className="absolute bottom-6 left-6 w-2 h-2 rounded-full pointer-events-none" style={{ backgroundColor: "#C45A2D", opacity: 0.15 }} aria-hidden="true" />
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="sr mb-12 text-center text-3xl font-extrabold tracking-tight md:text-4xl" style={{ letterSpacing: "-0.02em" }}>
            Why teams switch to BergSpace
          </h2>
          <div className="sr sr-d1 overflow-x-auto rounded-2xl border" style={{ borderColor: "#E8E2D6" }}>
            <table className="comp-table w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "#F5F1EA" }}>
                  <th style={{ color: "#8C8578" }}>Feature</th>
                  <th style={{ color: "#8C8578" }}>Spreadsheets</th>
                  <th style={{ color: "#C45A2D" }}>BergSpace</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "Setup time", old: "Days to weeks", berg: "Under 5 minutes" },
                  { feature: "Goal validation", old: "Manual review", berg: "AI SMART validator" },
                  { feature: "Approval workflow", old: "Email chains", berg: "Built-in flow" },
                  { feature: "Quarterly tracking", old: "Copy-paste reports", berg: "Automated check-ins" },
                  { feature: "Audit trail", old: "None", berg: "Full history" },
                ].map((row) => (
                  <tr key={row.feature} style={{ backgroundColor: "white" }}>
                    <td className="font-bold" style={{ color: "#1A1A1A" }}>{row.feature}</td>
                    <td>
                      <span className="inline-flex items-center gap-2" style={{ color: "#EF4444" }}>
                        <XIcon />
                        <span style={{ color: "#8C8578" }}>{row.old}</span>
                      </span>
                    </td>
                    <td>
                      <span className="inline-flex items-center gap-2" style={{ color: "#22C55E" }}>
                        <CheckIcon />
                        <span style={{ color: "#1A1A1A" }} className="font-medium">{row.berg}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Geometric accent — before testimonials */}
      <div className="relative">
        <div className="absolute left-[18%] -top-3 w-4 h-4 rounded-full opacity-[0.06] pointer-events-none" style={{ backgroundColor: "#3B7DD8", animation: "drift 19s ease-in-out infinite alternate" }} aria-hidden="true" />
      </div>

      {/* ══════════════ TESTIMONIALS ══════════════ */}
      <section id="roles" className="relative py-20 md:py-24" style={{ backgroundColor: "#F5F1EA", backgroundImage: "radial-gradient(circle, #E8E2D6 1px, transparent 1px)", backgroundSize: "24px 24px" }}>
        {/* Corner decorative elements */}
        <div className="absolute top-8 left-8 w-16 h-16 pointer-events-none opacity-[0.04]" style={{ background: "repeating-linear-gradient(45deg, #C45A2D 0, #C45A2D 1px, transparent 1px, transparent 8px)" }} aria-hidden="true" />
        <div className="absolute bottom-8 right-8 w-16 h-16 pointer-events-none opacity-[0.04]" style={{ background: "repeating-linear-gradient(-45deg, #C45A2D 0, #C45A2D 1px, transparent 1px, transparent 8px)" }} aria-hidden="true" />
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="sr mb-14 text-center text-3xl font-extrabold tracking-tight md:text-4xl" style={{ letterSpacing: "-0.02em" }}>
            Teams who stopped guessing
          </h2>
          <div className="space-y-6">
            {[
              {
                quote: "BergSpace surfaced a misalignment in our Q1 goals we would have missed until the quarterly review. It paid for itself in week one.",
                name: "Sarah K.",
                role: "VP People Ops, Relay",
                avatarBg: "linear-gradient(135deg,#6B8F5E,#4A6E40)",
                ml: "md:ml-0",
              },
              {
                quote: "Finally, a goal-tracking tool my exec team actually uses. The approval flow cut our review cycle from 2 weeks to 2 days.",
                name: "Marcus T.",
                role: "CEO, Flowbase",
                avatarBg: "linear-gradient(135deg,#6366F1,#4F46E5)",
                ml: "md:ml-16",
              },
              {
                quote: "We went from spreadsheet chaos to structured performance management in one afternoon. The SMART validator alone is worth it.",
                name: "Priya N.",
                role: "Head of HR, Stackr",
                avatarBg: "linear-gradient(135deg,#EC4899,#BE185D)",
                ml: "md:ml-8",
              },
            ].map((q, i) => (
              <blockquote
                key={q.name}
                className={`sr ${i === 0 ? "sr-d1" : i === 1 ? "sr-d2" : "sr-d3"} ${q.ml} rounded-2xl border bg-white p-7`}
                style={{ borderColor: "#E8E2D6", maxWidth: 640 }}
              >
                <p className="text-base leading-relaxed font-medium" style={{ color: "#1A1A1A" }}>
                  &ldquo;{q.quote}&rdquo;
                </p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full shrink-0" style={{ background: q.avatarBg }} />
                  <div>
                    <div className="text-sm font-bold">{q.name}</div>
                    <div className="text-xs" style={{ color: "#8C8578" }}>{q.role}</div>
                  </div>
                </div>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ ABOUT / CREATOR ══════════════ */}
      <section className="py-16 px-8" style={{ backgroundColor: "#F5F1EA" }}>
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-2xl font-bold text-[#1A1A1A] mb-4">Built by Arpit Walia</h3>
          <p className="text-[#5C564C] mb-6 max-w-2xl mx-auto">CS Engineering student at Thapar Institute (CGPA: 8.88), Samsung PRISM intern, MLSC Management Lead. Passionate about building products that bridge engineering and user needs.</p>
          <div className="flex justify-center gap-4">
            <a href="https://linkedin.com/in/arpit-walia" target="_blank" rel="noopener" className="px-4 py-2 rounded-full text-sm font-medium border border-[#E8E2D6] hover:bg-white transition-colors text-[#1A1A1A]">LinkedIn</a>
            <a href="https://github.com/Arpit-oo" target="_blank" rel="noopener" className="px-4 py-2 rounded-full text-sm font-medium border border-[#E8E2D6] hover:bg-white transition-colors text-[#1A1A1A]">GitHub</a>
            <a href="mailto:arpit13walia@gmail.com" className="px-4 py-2 rounded-full text-sm font-medium border border-[#E8E2D6] hover:bg-white transition-colors text-[#1A1A1A]">Email</a>
          </div>
          <p className="mt-8 text-xs text-[#A89F91]">Made with love by Arpit for ATOMQUEST Hackathon 1.0</p>
        </div>
      </section>

      {/* ══════════════ CTA ══════════════ */}
      <section style={{ backgroundColor: "#1A1714" }}>
        <div className="mx-auto max-w-4xl px-6 py-24 md:py-32 text-center">
          <div className="sr mb-8 flex justify-center" style={{ color: "#C45A2D" }}>
            <PeakMark size={40} />
          </div>
          <h2 className="sr sr-d1 text-3xl font-extrabold tracking-tight text-white md:text-5xl" style={{ letterSpacing: "-0.03em" }}>
            Ready to align your team?
          </h2>
          <p className="sr sr-d2 mx-auto mt-5 max-w-md text-base leading-relaxed" style={{ color: "#8C8578" }}>
            Join teams already using BergSpace to set goals, track progress, and drive real results across the organization.
          </p>
          <div className="sr sr-d3 mt-10">
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2.5 rounded-full px-10 py-4 text-base font-extrabold transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#1A1A1A", border: "1px solid #3A352E", color: "#C45A2D" }}
            >
              Start Using BergSpace
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
          <p className="sr sr-d4 mt-5 text-sm" style={{ color: "#6B6458" }}>
            No credit card required &middot; Setup in minutes
          </p>
        </div>
      </section>

      {/* ══════════════ FOOTER ══════════════ */}
      <footer style={{ backgroundColor: "#1A1714", borderTop: "1px solid #2A2520" }}>
        <div className="mx-auto max-w-6xl px-6 pt-16 pb-8">
          <div className="grid gap-10 md:grid-cols-4">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span style={{ color: "#C45A2D" }}><PeakMark size={20} /></span>
                <span className="text-base font-extrabold text-white tracking-tight">BergSpace</span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "#6B6458" }}>
                Goal setting &amp; tracking portal for teams that take performance seriously.
              </p>
            </div>
            {/* Product */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider mb-4 text-white">Product</h4>
              <ul className="space-y-2.5 text-sm" style={{ color: "#6B6458" }}>
                <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Integrations</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Changelog</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Roadmap</Link></li>
              </ul>
            </div>
            {/* Company */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider mb-4 text-white">Company</h4>
              <ul className="space-y-2.5 text-sm" style={{ color: "#6B6458" }}>
                <li><Link href="#" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            {/* Newsletter */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider mb-4 text-white">Stay in the loop</h4>
              <div className="nl-input">
                <input type="email" placeholder="you@company.com" aria-label="Email" />
                <button type="button">Subscribe</button>
              </div>
            </div>
          </div>
          {/* Bottom bar */}
          <div className="mt-14 flex flex-col md:flex-row items-center justify-between gap-4 border-t pt-6" style={{ borderColor: "#2A2520" }}>
            <p className="text-xs" style={{ color: "#6B6458" }}>&copy; 2026 BergSpace. All rights reserved.</p>
            <div className="flex items-center gap-4 text-sm" style={{ color: "#6B6458" }}>
              <a href="#" className="hover:text-white transition-colors" title="X / Twitter">&#x1D54F;</a>
              <a href="#" className="hover:text-white transition-colors" title="LinkedIn">in</a>
              <a href="#" className="hover:text-white transition-colors" title="GitHub">&lt;/&gt;</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
