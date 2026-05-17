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
      <DashboardShell profile={profile}>{children}</DashboardShell>
    </AccessibilityProvider>
  );
}
