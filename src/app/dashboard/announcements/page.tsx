import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AnnouncementsView } from "@/components/announcements/announcements-view";

export default async function AnnouncementsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile || profile.role === "employee") redirect("/dashboard");

  // Fetch all active users
  const { data: allUsers } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, department_id, departments(name)")
    .eq("is_active", true)
    .order("full_name");

  // Fetch departments
  const { data: departments } = await supabase.from("departments").select("*");

  return <AnnouncementsView profile={profile} users={allUsers || []} departments={departments || []} />;
}
