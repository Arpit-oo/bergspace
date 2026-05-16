import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ApprovalsView } from "@/components/manager/approvals-view";

export default async function ApprovalsPage() {
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

  const { data: teamMembers } = await supabase
    .from("profiles")
    .select("id")
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

  const { data: pendingSheets } = await supabase
    .from("goal_sheets")
    .select(
      "*, employee:profiles!goal_sheets_employee_id_fkey(*, department:departments(*)), goals(*, thrust_area:thrust_areas(*)), cycle:goal_cycles(*)"
    )
    .in("employee_id", teamIds)
    .in("status", ["submitted", "approved", "returned"])
    .order("submitted_at", { ascending: false });

  return <ApprovalsView sheets={pendingSheets || []} managerId={user.id} />;
}
