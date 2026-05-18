"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

function PeakMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M2 19.2 L8.4 8.2 L11.3 13 L15.3 6 L22 19.2 Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M14.05 8.2 L15.3 6 L16.55 8.2 L15.85 8.9 L15.3 8.3 L14.75 8.9 Z" fill="currentColor" stroke="none" />
      <path d="M7.5 9.7 L8.4 8.2 L9.3 9.7 L8.8 10.2 L8.4 9.7 L8 10.2 Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success("Account created! Check your email to verify.");
    router.push("/auth/login");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FEFCF9] px-4 py-12">
      {/* Background — matches hero section */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {/* Sunray glow */}
        <svg className="absolute top-[-120px] left-[-120px] w-[1400px] h-[900px] opacity-60" viewBox="0 0 1400 900">
          <defs>
            <radialGradient id="signupRayG" cx="15%" cy="15%" r="70%">
              <stop offset="0%" stopColor="#F5C49A" stopOpacity="0.8"/>
              <stop offset="60%" stopColor="#FEF3EE" stopOpacity="0"/>
            </radialGradient>
            <linearGradient id="signupRayL" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#F5C49A" stopOpacity="0.9"/>
              <stop offset="100%" stopColor="#FEF3EE" stopOpacity="0"/>
            </linearGradient>
          </defs>
          <circle cx="160" cy="150" r="540" fill="url(#signupRayG)"/>
          <g fill="url(#signupRayL)">
            <path d="M160 150 L1400 120 L1400 240 Z" opacity="0.65"/>
            <path d="M160 150 L1400 280 L1400 420 Z" opacity="0.45"/>
            <path d="M160 150 L1400 500 L1400 620 Z" opacity="0.25"/>
          </g>
        </svg>
        {/* Mountain watermark */}
        <svg className="absolute bottom-0 right-0 opacity-[0.04]" width="500" height="500" viewBox="0 0 24 24" fill="none">
          <path d="M2 19.2 L8.4 8.2 L11.3 13 L15.3 6 L22 19.2 Z" stroke="#1A1A1A" strokeWidth="0.3" strokeLinejoin="round" />
          <path d="M14.05 8.2 L15.3 6 L16.55 8.2 L15.85 8.9 L15.3 8.3 L14.75 8.9 Z" fill="#1A1A1A" />
          <path d="M7.5 9.7 L8.4 8.2 L9.3 9.7 L8.8 10.2 L8.4 9.7 L8 10.2 Z" fill="#1A1A1A" />
        </svg>
        {/* Floating shapes */}
        <div className="absolute top-[15%] left-[10%] w-20 h-20 rounded-full border-2 opacity-[0.05]" style={{ borderColor: "#C45A2D", animation: "drift 20s ease-in-out infinite alternate" }} />
        <div className="absolute top-[40%] right-[15%] w-12 h-12 border-2 opacity-[0.04]" style={{ borderColor: "#1A1A1A", transform: "rotate(45deg)", animation: "drift 15s ease-in-out infinite alternate-reverse" }} />
        <div className="absolute bottom-[20%] left-[20%] w-16 h-16 rounded-full border-2 opacity-[0.05]" style={{ borderColor: "#3B7DD8", animation: "drift 18s ease-in-out infinite alternate" }} />
        <div className="absolute top-[30%] right-[5%] w-32 h-px opacity-[0.06]" style={{ backgroundColor: "#C45A2D", transform: "rotate(-15deg)" }} />
        <div className="absolute bottom-[35%] right-[25%] w-24 h-px opacity-[0.05]" style={{ backgroundColor: "#1A1A1A", transform: "rotate(20deg)" }} />
        <svg className="absolute top-[10%] right-[5%] opacity-[0.025]" width="200" height="200" viewBox="0 0 24 24" fill="none">
          <path d="M2 19.2 L8.4 8.2 L11.3 13 L15.3 6 L22 19.2 Z" stroke="#C45A2D" strokeWidth="0.4" strokeLinejoin="round" />
        </svg>
        <div className="absolute bottom-0 left-0 right-0 h-[40%] opacity-[0.02]" style={{ backgroundImage: "radial-gradient(circle, #1A1A1A 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <svg className="absolute bottom-0 left-0 right-0 h-[200px] opacity-[0.04]" viewBox="0 0 1400 200" preserveAspectRatio="none">
          <path d="M0 120 Q200 80 400 110 T800 90 T1200 120 T1400 100" stroke="#C45A2D" strokeWidth="1" fill="none" />
          <path d="M0 150 Q200 120 400 140 T800 120 T1200 150 T1400 130" stroke="#1A1A1A" strokeWidth="0.8" fill="none" />
        </svg>
      </div>
      <div className="w-full max-w-[400px]">
        {/* Card */}
        <div className="rounded-xl border border-border bg-white px-8 pb-8 pt-10 shadow-sm">
          {/* Logo */}
          <div className="mb-8 flex items-center justify-center gap-2.5">
            <span className="text-brand"><PeakMark size={24} /></span>
            <span className="text-[17px] font-semibold tracking-tight text-foreground">BergSpace</span>
          </div>

          {/* Heading */}
          <h1 className="mb-1 text-center text-xl font-semibold tracking-tight text-foreground">
            Create your account
          </h1>
          <p className="mb-8 text-center text-sm text-muted-foreground">
            Get started with BergSpace for free
          </p>

          {/* Form */}
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium text-foreground">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground focus:ring-1 focus:ring-foreground"
              />
            </div>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-foreground">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground focus:ring-1 focus:ring-foreground"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-foreground">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground focus:ring-1 focus:ring-foreground"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="h-10 w-full rounded-lg bg-foreground text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          {/* Sign in link */}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-medium text-foreground underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
