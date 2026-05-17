import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/shell";
import { AccessibilityProvider } from "@/components/ui/accessibility-provider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, department:departments(*)")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/auth/login");

  return (
    <AccessibilityProvider>
      <DashboardShell profile={profile}>
        <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="h-6 w-6 border-2 border-[#E8E2D6] border-t-[#C45A2D] rounded-full animate-spin" /></div>}>
          {children}
        </Suspense>
      </DashboardShell>
    </AccessibilityProvider>
  );
}
