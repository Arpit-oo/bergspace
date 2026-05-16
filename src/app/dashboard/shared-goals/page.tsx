import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SharedGoalsView } from "@/components/shared-goals/shared-goals-view";

export default async function SharedGoalsPage() {
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

  // Fetch active cycle
  const { data: activeCycle } = await supabase
    .from("goal_cycles")
    .select("*")
    .eq("is_active", true)
    .single();

  // Fetch all cycles for filtering
  const { data: cycles } = await supabase
    .from("goal_cycles")
    .select("*")
    .order("year", { ascending: false })
    .order("quarter", { ascending: false });

  // Fetch departments
  const { data: departments } = await supabase
    .from("departments")
    .select("*")
    .order("name");

  // Fetch thrust areas
  const { data: thrustAreas } = await supabase
    .from("thrust_areas")
    .select("*")
    .order("name");

  // Fetch employees (for manager: only their reports; for admin: all)
  let employeesQuery = supabase
    .from("profiles")
    .select("*, department:departments(*)")
    .eq("role", "employee")
    .eq("is_active", true);

  if (profile.role === "manager") {
    employeesQuery = employeesQuery.eq("manager_id", user.id);
  }

  const { data: employees } = await employeesQuery;

  // Fetch existing shared goal templates
  let templatesQuery = supabase
    .from("shared_goal_templates")
    .select("*, thrust_area:thrust_areas(*), department:departments(*)")
    .order("created_at", { ascending: false });

  if (profile.role === "manager" && profile.department_id) {
    templatesQuery = templatesQuery.or(
      `department_id.eq.${profile.department_id},department_id.is.null`
    );
  }

  const { data: templates } = await templatesQuery;

  // Fetch goals linked to shared templates to see which employees have them
  const templateIds = templates?.map((t) => t.id) || [];
  let linkedGoals: Record<string, unknown>[] = [];
  if (templateIds.length > 0) {
    const { data } = await supabase
      .from("goals")
      .select(
        "*, goal_sheet:goal_sheets(*, employee:profiles!goal_sheets_employee_id_fkey(full_name, email, department:departments(name)))"
      )
      .in("shared_template_id", templateIds);
    linkedGoals = data || [];
  }

  return (
    <SharedGoalsView
      profile={profile}
      activeCycle={activeCycle}
      cycles={cycles || []}
      departments={departments || []}
      thrustAreas={thrustAreas || []}
      employees={employees || []}
      templates={templates || []}
      linkedGoals={linkedGoals}
    />
  );
}
