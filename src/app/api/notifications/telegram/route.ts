import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMessage, buildApprovalMessage, buildNotificationMessage } from "@/lib/telegram";

export async function POST(request: Request) {
  const body = await request.json();
  const { type, recipientId, employeeName, cycleName, goalCount, sheetId, reason } = body;

  console.log("[telegram-notify] Request:", JSON.stringify(body));

  if (!recipientId) return NextResponse.json({ sent: false, reason: "no recipientId" });

  const admin = createAdminClient();

  // Find telegram chat_id for recipient
  const { data: link } = await admin
    .from("telegram_links")
    .select("chat_id")
    .eq("user_id", recipientId)
    .maybeSingle();

  console.log("[telegram-notify]", { type, recipientId, hasLink: !!link?.chat_id });

  if (!link?.chat_id) return NextResponse.json({ sent: false, reason: "not linked" });

  try {
    if (type === "goal_submitted" && sheetId) {
      const { text, keyboard } = buildApprovalMessage(employeeName || "Employee", cycleName || "", goalCount || 0, sheetId);
      await sendMessage(link.chat_id, text, keyboard);
    } else if (type === "goal_approved") {
      const { text, keyboard } = buildNotificationMessage("Goal Sheet Approved", `Your goal sheet for ${cycleName || "this cycle"} has been approved and locked.`, "/dashboard/goals");
      await sendMessage(link.chat_id, text, keyboard);
    } else if (type === "goal_returned") {
      const { text, keyboard } = buildNotificationMessage("Goal Sheet Returned", `Your goal sheet was returned: ${reason || "Please review and resubmit."}`, "/dashboard/goals");
      await sendMessage(link.chat_id, text, keyboard);
    } else if (type === "manager_assigned") {
      const { text, keyboard } = buildNotificationMessage("New Team Member", `${employeeName || "An employee"} has been assigned to your team.`, "/dashboard/team");
      await sendMessage(link.chat_id, text, keyboard);
    } else if (type === "employee_manager_changed") {
      const { text, keyboard } = buildNotificationMessage("Manager Updated", `You have been assigned to ${employeeName || "a new manager"}.`, "/dashboard");
      await sendMessage(link.chat_id, text, keyboard);
    } else if (type === "shared_goal_assigned") {
      const { text, keyboard } = buildNotificationMessage("Shared Goal Assigned", `A shared goal "${employeeName || ""}" has been added to your goal sheet.`, "/dashboard/goals");
      await sendMessage(link.chat_id, text, keyboard);
    } else if (type === "escalation") {
      const { text, keyboard } = buildNotificationMessage("Escalation Alert", `${employeeName || "An employee"} triggered an escalation.`, "/dashboard/escalations");
      await sendMessage(link.chat_id, text, keyboard);
    } else {
      const { text, keyboard } = buildNotificationMessage(type || "Notification", employeeName || "You have a new notification.", "/dashboard/notifications");
      await sendMessage(link.chat_id, text, keyboard);
    }

    return NextResponse.json({ sent: true });
  } catch (e) {
    console.error("Telegram notify error:", e);
    return NextResponse.json({ sent: false, reason: "send failed" });
  }
}
