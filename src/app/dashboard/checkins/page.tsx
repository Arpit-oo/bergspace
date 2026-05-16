import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CheckinsView } from "@/components/manager/checkins-view";

export default async function CheckinsPage() {
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

  if (!activeCycle) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg font-semibold text-gray-900">
          No Active Goal Cycle
        </h2>
        <p className="text-gray-500 mt-2">
          Contact admin to set up a goal cycle.
        </p>
      </div>
    );
  }

  const { data: teamMembers } = await supabase
    .from("profiles")
    .select("id, full_name, email, department:departments(name)")
    .eq("manager_id", user.id);

  const teamIds = teamMembers?.map((m) => m.id) || [];

  if (teamIds.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg font-semibold">No Team Members</h2>
        <p className="text-gray-500 mt-2">No employees report to you.</p>
      </div>
    );
  }

  const { data: approvedSheets } = await supabase
    .from("goal_sheets")
    .select(
      "*, employee:profiles!goal_sheets_employee_id_fkey(id, full_name, email, department:departments(name)), goals(*, achievements(*)), cycle:goal_cycles(*)"
    )
    .in("employee_id", teamIds)
    .eq("cycle_id", activeCycle.id)
    .eq("status", "approved");

  const { data: existingCheckins } = await supabase
    .from("checkins")
    .select("*")
    .eq("manager_id", user.id)
    .eq("cycle_id", activeCycle.id);

  return (
    <CheckinsView
      cycle={activeCycle}
      sheets={approvedSheets || []}
      existingCheckins={existingCheckins || []}
      managerId={user.id}
    />
  );
}
