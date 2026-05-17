"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

function PeakMark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M2 19.2 L8.4 8.2 L11.3 13 L15.3 6 L22 19.2 Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M14.05 8.2 L15.3 6 L16.55 8.2 L15.85 8.9 L15.3 8.3 L14.75 8.9 Z" fill="currentColor" stroke="none" />
      <path d="M7.5 9.7 L8.4 8.2 L9.3 9.7 L8.8 10.2 L8.4 9.7 L8 10.2 Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function SelectRolePage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function selectRole(role: "employee" | "manager") {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth/login"); return; }

    const { error } = await supabase.from("profiles").update({ role }).eq("id", user.id);
    if (error) { toast.error(error.message); setLoading(false); return; }

    toast.success(`Role set to ${role}`);
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FEFCF9] px-4">
      <div className="w-full max-w-md text-center">
        <div className="flex items-center justify-center gap-2.5 mb-8" style={{ color: "#C45A2D" }}>
          <PeakMark size={28} />
          <span className="text-xl font-semibold text-[#1A1A1A]">BergSpace</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#1A1A1A] mb-2">Welcome to BergSpace</h1>
        <p className="text-[#8C8578] mb-8">Select your role to get started</p>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => selectRole("employee")}
            disabled={loading}
            className="rounded-xl border-2 border-[#E8E2D6] bg-white p-6 hover:border-[#C45A2D] transition-colors text-left disabled:opacity-50"
          >
            <div className="text-2xl mb-3">👤</div>
            <h3 className="font-semibold text-[#1A1A1A] mb-1">Employee</h3>
            <p className="text-xs text-[#8C8578]">Create goals, submit for approval, log check-ins</p>
          </button>
          <button
            onClick={() => selectRole("manager")}
            disabled={loading}
            className="rounded-xl border-2 border-[#E8E2D6] bg-white p-6 hover:border-[#C45A2D] transition-colors text-left disabled:opacity-50"
          >
            <div className="text-2xl mb-3">👥</div>
            <h3 className="font-semibold text-[#1A1A1A] mb-1">Manager</h3>
            <p className="text-xs text-[#8C8578]">Review team goals, approve sheets, run check-ins</p>
          </button>
        </div>
      </div>
    </div>
  );
}
