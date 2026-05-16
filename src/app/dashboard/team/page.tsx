import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TeamView } from "@/components/manager/team-view";

export default async function TeamPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "manager") redirect("/dashboard");

  const { data: activeCycle } = await supabase
    .from("goal_cycles")
    .select("*")
    .eq("is_active", true)
    .single();

  const { data: teamMembers } = await supabase
    .from("profiles")
    .select("*, department:departments(*)")
    .eq("manager_id", user.id)
    .eq("is_active", true);

  const teamIds = teamMembers?.map((m) => m.id) || [];

  let teamSheets: Record<string, unknown>[] = [];
  if (activeCycle && teamIds.length > 0) {
    const { data } = await supabase
      .from("goal_sheets")
      .select("*, goals(count)")
      .in("employee_id", teamIds)
      .eq("cycle_id", activeCycle.id);
    teamSheets = data || [];
  }

  return (
    <TeamView
      teamMembers={teamMembers || []}
      teamSheets={teamSheets}
      activeCycle={activeCycle}
    />
  );
}
