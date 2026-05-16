import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CyclesView } from "@/components/admin/cycles-view";

export default async function CyclesPage() {
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

  const { data: cycles } = await supabase
    .from("goal_cycles")
    .select("*")
    .order("year", { ascending: false })
    .order("quarter", { ascending: false });

  return <CyclesView cycles={cycles || []} userId={user.id} />;
}
