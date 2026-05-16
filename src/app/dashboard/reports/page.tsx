import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ReportsView } from "@/components/reports/reports-view";

export default async function ReportsPage() {
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

  if (!profile || (profile.role !== "manager" && profile.role !== "admin"))
    redirect("/dashboard");

  // Fetch all cycles
  const { data: cycles } = await supabase
    .from("goal_cycles")
    .select("*")
    .order("year", { ascending: false })
    .order("quarter", { ascending: false });

  const activeCycle = cycles?.find((c) => c.is_active) || cycles?.[0] || null;

  // Fetch departments
  const { data: departments } = await supabase
    .from("departments")
    .select("*")
    .order("name");

  // Fetch all employees with their departments
  let employeesQuery = supabase
    .from("profiles")
    .select("*, department:departments(*)")
    .eq("role", "employee")
    .eq("is_active", true);

  // Managers only see their direct reports
  if (profile.role === "manager") {
    employeesQuery = employeesQuery.eq("manager_id", user.id);
  }

  const { data: employees } = await employeesQuery;

  const employeeIds = employees?.map((e) => e.id) || [];

  // Fetch goal sheets for the active cycle with goals and achievements
  let goalSheets: Record<string, unknown>[] = [];
  if (activeCycle && employeeIds.length > 0) {
    const { data } = await supabase
      .from("goal_sheets")
      .select(
        "*, employee:profiles!goal_sheets_employee_id_fkey(*, department:departments(*)), goals(*, thrust_area:thrust_areas(*), achievements(*))"
      )
      .in("employee_id", employeeIds)
      .eq("cycle_id", activeCycle.id);
    goalSheets = data || [];
  }

  // Fetch checkins for the active cycle
  let checkins: Record<string, unknown>[] = [];
  if (activeCycle && employeeIds.length > 0) {
    const { data } = await supabase
      .from("checkins")
      .select("*, employee:profiles!checkins_employee_id_fkey(*), manager:profiles!checkins_manager_id_fkey(*)")
      .in("employee_id", employeeIds)
      .eq("cycle_id", activeCycle.id);
    checkins = data || [];
  }

  // Fetch managers for completion dashboard
  let managers: Record<string, unknown>[] = [];
  if (profile.role === "admin") {
    const { data } = await supabase
      .from("profiles")
      .select("*, department:departments(*)")
      .eq("role", "manager")
      .eq("is_active", true);
    managers = data || [];
  }

  return (
    <ReportsView
      profile={profile}
      cycles={cycles || []}
      activeCycle={activeCycle}
      departments={departments || []}
      employees={employees || []}
      goalSheets={goalSheets}
      checkins={checkins}
      managers={managers}
    />
  );
}
