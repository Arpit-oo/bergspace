import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { sheetId } = await request.json();
  if (!sheetId) return NextResponse.json({ error: "Missing sheetId" }, { status: 400 });

  const admin = createAdminClient();

  // Delete achievements first, then goals, then sheet
  const { data: goals } = await admin.from("goals").select("id").eq("goal_sheet_id", sheetId);
  if (goals?.length) {
    const goalIds = goals.map(g => g.id);
    await admin.from("achievements").delete().in("goal_id", goalIds);
  }
  await admin.from("goals").delete().eq("goal_sheet_id", sheetId);
  const { error } = await admin.from("goal_sheets").delete().eq("id", sheetId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
