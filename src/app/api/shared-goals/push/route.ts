import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  // Verify the requesting user is a manager/admin
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || !["manager", "admin"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { templateId, employeeIds } = body;
  let { cycleId } = body;

  if (!templateId || !employeeIds?.length) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // If cycleId is not provided, fetch the active cycle
  if (!cycleId) {
    const { data: activeCycle } = await admin
      .from("goal_cycles")
      .select("id")
      .eq("is_active", true)
      .single();
    cycleId = activeCycle?.id;
  }
  if (!cycleId) {
    return NextResponse.json(
      { error: "No active cycle" },
      { status: 400 }
    );
  }

  // Get template
  const { data: template } = await admin
    .from("shared_goal_templates")
    .select("*")
    .eq("id", templateId)
    .single();
  if (!template) {
    return NextResponse.json(
      { error: "Template not found" },
      { status: 404 }
    );
  }

  console.log("[push] Received body:", { templateId, employeeIds, cycleId });
  console.log("[push] Template found:", template.id, template.title);

  const results: string[] = [];
  const errors: { empId: string; step: string; error: string }[] = [];

  for (const empId of employeeIds) {
    // Get or create goal sheet
    let { data: sheet, error: sheetFetchError } = await admin
      .from("goal_sheets")
      .select("id")
      .eq("employee_id", empId)
      .eq("cycle_id", cycleId)
      .maybeSingle();

    if (sheetFetchError) {
      console.error("[push] Sheet fetch error for", empId, sheetFetchError);
      errors.push({ empId, step: "fetch_sheet", error: sheetFetchError.message });
      continue;
    }

    if (!sheet) {
      const { data: newSheet, error: sheetCreateError } = await admin
        .from("goal_sheets")
        .insert({ employee_id: empId, cycle_id: cycleId, status: "draft" })
        .select("id")
        .single();

      if (sheetCreateError) {
        console.error("[push] Sheet create error for", empId, sheetCreateError);
        errors.push({ empId, step: "create_sheet", error: sheetCreateError.message });
        continue;
      }
      sheet = newSheet;
      console.log("[push] Created new sheet for", empId, ":", sheet?.id);
    }
    if (!sheet) {
      errors.push({ empId, step: "sheet_null", error: "Sheet is null after create" });
      continue;
    }

    // Check if already assigned
    const { data: existing } = await admin
      .from("goals")
      .select("id")
      .eq("goal_sheet_id", sheet.id)
      .eq("shared_template_id", templateId)
      .maybeSingle();
    if (existing) {
      console.log("[push] Goal already assigned for", empId, "skipping");
      continue;
    }

    // Get current goal count for sort_order
    const { count } = await admin
      .from("goals")
      .select("*", { count: "exact", head: true })
      .eq("goal_sheet_id", sheet.id);

    // Insert goal
    const { error: goalError } = await admin.from("goals").insert({
      goal_sheet_id: sheet.id,
      title: template.title,
      description: template.description,
      thrust_area_id: template.thrust_area_id,
      uom: template.uom,
      target_value: template.target_value,
      weightage: 0,
      is_from_shared: true,
      shared_template_id: templateId,
      sort_order: (count || 0) + 1,
    });
    if (goalError) {
      console.error("[push] Goal insert error for", empId, goalError);
      errors.push({ empId, step: "insert_goal", error: goalError.message });
      continue;
    }

    console.log("[push] Goal inserted for", empId);

    // Notify
    await admin.from("notifications").insert({
      user_id: empId,
      type: "shared_goal_assigned",
      title: "Shared Goal Assigned",
      message: `A shared goal "${template.title}" has been added to your goal sheet.`,
      link: "/dashboard/goals",
    });

    results.push(empId);
  }

  console.log("[push] Done. Pushed:", results.length, "Errors:", errors.length);
  return NextResponse.json({
    pushed: results.length,
    total: employeeIds.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}
