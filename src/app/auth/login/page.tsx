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

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  function fillDemo(demoEmail: string) {
    setEmail(demoEmail);
    setPassword("demo123456");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FEFCF9] px-4 py-12">
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
            Sign in to BergSpace
          </h1>
          <p className="mb-8 text-center text-sm text-muted-foreground">
            Enter your credentials to continue
          </p>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
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
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground focus:ring-1 focus:ring-foreground"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="h-10 w-full rounded-lg bg-foreground text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Microsoft SSO */}
          <button
            type="button"
            onClick={async () => {
              const { error } = await supabase.auth.signInWithOAuth({
                provider: "azure",
                options: {
                  scopes: "openid profile email",
                  redirectTo: `${window.location.origin}/api/auth/callback`,
                },
              });
              if (error) toast.error(error.message);
            }}
            className="flex h-10 w-full items-center justify-center gap-2.5 rounded-lg border border-border bg-white text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <rect x="1" y="1" width="6.5" height="6.5" fill="#F25022" />
              <rect x="8.5" y="1" width="6.5" height="6.5" fill="#7FBA00" />
              <rect x="1" y="8.5" width="6.5" height="6.5" fill="#00A4EF" />
              <rect x="8.5" y="8.5" width="6.5" height="6.5" fill="#FFB900" />
            </svg>
            Sign in with Microsoft
          </button>

          {/* Google SSO */}
          <button
            type="button"
            onClick={async () => {
              const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                  redirectTo: `${window.location.origin}/api/auth/callback`,
                },
              });
              if (error) toast.error(error.message);
            }}
            className="mt-2 flex h-10 w-full items-center justify-center gap-2.5 rounded-lg border border-border bg-white text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M15.68 8.18c0-.57-.05-1.12-.15-1.64H8v3.1h4.31a3.68 3.68 0 0 1-1.6 2.42v2.01h2.59c1.51-1.39 2.38-3.44 2.38-5.89Z" fill="#4285F4"/>
              <path d="M8 16c2.16 0 3.97-.72 5.3-1.94l-2.59-2.01c-.72.48-1.63.76-2.71.76-2.09 0-3.86-1.41-4.49-3.31H.84v2.08A8 8 0 0 0 8 16Z" fill="#34A853"/>
              <path d="M3.51 9.5a4.81 4.81 0 0 1 0-3.01V4.42H.84a8 8 0 0 0 0 7.16l2.67-2.08Z" fill="#FBBC05"/>
              <path d="M8 3.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A7.97 7.97 0 0 0 8 0 8 8 0 0 0 .84 4.42l2.67 2.08C4.14 4.59 5.91 3.18 8 3.18Z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>

          {/* Create account link */}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" className="font-medium text-foreground underline-offset-4 hover:underline">
              Create an account
            </Link>
          </p>
        </div>

        {/* Demo accounts — outside card */}
        <div className="mt-6 rounded-xl border border-dashed border-border bg-white/60 px-6 py-5">
          <p className="mb-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Demo Accounts
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { role: "Employee", email: "employee@bergspace.com" },
              { role: "Manager", email: "manager@bergspace.com" },
              { role: "Admin", email: "admin@bergspace.com" },
            ].map((demo) => (
              <button
                key={demo.role}
                type="button"
                onClick={() => fillDemo(demo.email)}
                className="rounded-lg border border-border bg-white px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
              >
                {demo.role}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
