import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EmployeesView } from "@/components/admin/employees-view";

export default async function EmployeesPage() {
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

  const { data: employees } = await supabase
    .from("profiles")
    .select("*, department:departments(*)")
    .order("full_name");

  const { data: departments } = await supabase
    .from("departments")
    .select("*")
    .order("name");

  // Get all managers (role = manager or admin)
  const { data: allManagers } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("role", ["manager", "admin"])
    .order("full_name");

  const managerIds = [
    ...new Set(
      employees?.map((e) => e.manager_id).filter(Boolean) || []
    ),
  ];
  const { data: managers } =
    managerIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", managerIds)
      : { data: [] };
  const managerMap: Record<string, string> = {};
  (managers || []).forEach((m) => {
    managerMap[m.id] = m.full_name;
  });

  return (
    <EmployeesView
      employees={employees || []}
      departments={departments || []}
      managers={allManagers || []}
      managerMap={managerMap}
    />
  );
}
