import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EscalationsView } from "@/components/admin/escalations-view";

export default async function EscalationsPage() {
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

  // Fetch escalation rules
  const { data: rules } = await supabase
    .from("escalation_rules")
    .select("*")
    .order("trigger_type")
    .order("days_threshold");

  // Fetch escalation log with related data
  const { data: escalationLog } = await supabase
    .from("escalation_log")
    .select(
      "*, employee:profiles!escalation_log_employee_id_fkey(full_name, email, department:departments(name)), rule:escalation_rules(*)"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  // Fetch cycles for reference
  const { data: cycles } = await supabase
    .from("goal_cycles")
    .select("*")
    .order("year", { ascending: false })
    .order("quarter", { ascending: false });

  // Fetch intervention data: all goal sheets with employee profiles
  const { data: allSheets } = await supabase
    .from("goal_sheets")
    .select(
      "*, employee:profiles!goal_sheets_employee_id_fkey(id, full_name, email, role, manager_id, department_id, department:departments(name))"
    );

  // Fetch all profiles to map managers
  const { data: allProfiles } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, department_id, manager_id, department:departments(name)")
    .eq("is_active", true);

  // Fetch all checkins
  const { data: allCheckins } = await supabase
    .from("checkins")
    .select("id, employee_id, cycle_id");

  return (
    <EscalationsView
      rules={rules || []}
      escalationLog={escalationLog || []}
      cycles={cycles || []}
      allSheets={allSheets || []}
      allProfiles={allProfiles || []}
      allCheckins={allCheckins || []}
    />
  );
}
