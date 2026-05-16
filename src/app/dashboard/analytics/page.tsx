import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AnalyticsView } from "@/components/analytics/analytics-view";

export default async function AnalyticsPage() {
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

  if (!profile || profile.role !== "admin") redirect("/dashboard");

  // Fetch all cycles
  const { data: cycles } = await supabase
    .from("goal_cycles")
    .select("*")
    .order("year", { ascending: true })
    .order("quarter", { ascending: true });

  // Fetch departments
  const { data: departments } = await supabase
    .from("departments")
    .select("*")
    .order("name");

  // Fetch all goal sheets with goals, achievements, and employee info
  const { data: goalSheets } = await supabase
    .from("goal_sheets")
    .select(
      "*, employee:profiles!goal_sheets_employee_id_fkey(*, department:departments(*)), goals(*, thrust_area:thrust_areas(*), achievements(*))"
    );

  // Fetch thrust areas
  const { data: thrustAreas } = await supabase
    .from("thrust_areas")
    .select("*")
    .order("name");

  // Fetch all checkins
  const { data: checkins } = await supabase
    .from("checkins")
    .select("*, manager:profiles!checkins_manager_id_fkey(full_name)")
    .order("created_at", { ascending: false });

  // Fetch managers
  const { data: managers } = await supabase
    .from("profiles")
    .select("*, department:departments(*)")
    .eq("role", "manager")
    .eq("is_active", true);

  // Fetch all employees
  const { data: employees } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "employee")
    .eq("is_active", true);

  return (
    <AnalyticsView
      cycles={cycles || []}
      departments={departments || []}
      goalSheets={goalSheets || []}
      thrustAreas={thrustAreas || []}
      checkins={checkins || []}
      managers={managers || []}
      employees={employees || []}
    />
  );
}
