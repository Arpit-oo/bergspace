import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { GoalSheetView } from "@/components/goals/goal-sheet-view";

export default async function GoalsPage() {
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

  if (!profile || profile.role !== "employee") redirect("/dashboard");

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
          Contact your admin to set up a goal cycle.
        </p>
      </div>
    );
  }

  const { data: goalSheet } = await supabase
    .from("goal_sheets")
    .select("*, goals(*, thrust_area:thrust_areas(*))")
    .eq("employee_id", user.id)
    .eq("cycle_id", activeCycle.id)
    .single();

  const thrustAreaFilter = profile.department_id
    ? `is_global.eq.true,department_id.eq.${profile.department_id}`
    : `is_global.eq.true`;
  const { data: thrustAreas } = await supabase
    .from("thrust_areas")
    .select("*")
    .or(thrustAreaFilter);

  return (
    <GoalSheetView
      key={goalSheet?.id ?? "new"}
      profile={profile}
      cycle={activeCycle}
      goalSheet={goalSheet}
      thrustAreas={thrustAreas || []}
    />
  );
}
