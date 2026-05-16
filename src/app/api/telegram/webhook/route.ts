import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  TelegramUpdate,
  sendMessage,
  answerCallbackQuery,
  editMessageText,
} from "@/lib/telegram";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: Request) {
  try {
    const update: TelegramUpdate = await request.json();

    if (update.message) {
      await handleMessage(update.message);
    }

    if (update.callback_query) {
      await handleCallback(update.callback_query);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}

async function handleMessage(message: TelegramUpdate["message"]) {
  if (!message?.text || !message.chat) return;

  const chatId = message.chat.id;
  const text = message.text.trim();

  if (text === "/start") {
    await sendMessage(
      chatId,
      `👋 <b>Welcome to BergSpace Bot!</b>\n\n` +
        `Link your portal account to receive notifications and take actions from Telegram.\n\n` +
        `To link: go to BergSpace Portal → Settings or Profile, generate a link code, then send it here as:\n` +
        `<code>/link YOUR_CODE</code>`
    );
    return;
  }

  if (text.startsWith("/link ")) {
    const code = text.replace("/link ", "").trim();
    await handleLinkCode(chatId, code, message.from?.username);
    return;
  }

  if (text === "/status") {
    await handleStatus(chatId);
    return;
  }

  if (text === "/help") {
    await sendMessage(
      chatId,
      `<b>BergSpace Bot Commands</b>\n\n` +
        `/start - Welcome message\n` +
        `/link CODE - Link your portal account\n` +
        `/status - View your current goal status\n` +
        `/help - Show this help`
    );
    return;
  }

  await sendMessage(
    chatId,
    `Unknown command. Send /help for available commands.`
  );
}

async function handleLinkCode(
  chatId: number,
  code: string,
  username?: string
) {
  const { data: linkCode } = await supabase
    .from("telegram_link_codes")
    .select("*")
    .eq("code", code)
    .eq("used", false)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (!linkCode) {
    await sendMessage(chatId, "❌ Invalid or expired link code. Generate a new one from the portal.");
    return;
  }

  const existing = await supabase
    .from("telegram_links")
    .select("id")
    .eq("user_id", linkCode.user_id)
    .single();

  if (existing.data) {
    await supabase
      .from("telegram_links")
      .update({ chat_id: chatId, username: username || null })
      .eq("user_id", linkCode.user_id);
  } else {
    await supabase.from("telegram_links").insert({
      user_id: linkCode.user_id,
      chat_id: chatId,
      username: username || null,
    });
  }

  await supabase
    .from("telegram_link_codes")
    .update({ used: true })
    .eq("id", linkCode.id);

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", linkCode.user_id)
    .single();

  await sendMessage(
    chatId,
    `✅ <b>Account linked!</b>\n\n` +
      `Welcome, <b>${profile?.full_name}</b> (${profile?.role})\n` +
      `You'll now receive goal notifications here.`
  );
}

async function handleStatus(chatId: number) {
  const { data: link } = await supabase
    .from("telegram_links")
    .select("user_id")
    .eq("chat_id", chatId)
    .single();

  if (!link) {
    await sendMessage(chatId, "❌ Account not linked. Use /link CODE first.");
    return;
  }

  const { data: activeCycle } = await supabase
    .from("goal_cycles")
    .select("*")
    .eq("is_active", true)
    .single();

  if (!activeCycle) {
    await sendMessage(chatId, "No active goal cycle.");
    return;
  }

  const { data: sheet } = await supabase
    .from("goal_sheets")
    .select("*, goals(title, status, weightage, target_value)")
    .eq("employee_id", link.user_id)
    .eq("cycle_id", activeCycle.id)
    .single();

  if (!sheet) {
    await sendMessage(chatId, `📋 <b>${activeCycle.name}</b>\n\nNo goal sheet created yet.`);
    return;
  }

  let text = `📋 <b>${activeCycle.name}</b>\nStatus: <b>${sheet.status.toUpperCase()}</b>\n\n`;

  interface GoalInfo {
    title: string;
    status: string;
    weightage: number;
    target_value: number;
  }

  (sheet.goals as GoalInfo[]).forEach((g: GoalInfo, i: number) => {
    const icon = g.status === "completed" ? "✅" : g.status === "on_track" ? "🟡" : "⬜";
    text += `${icon} <b>${i + 1}.</b> ${g.title}\n   Weight: ${g.weightage}% | Target: ${g.target_value}\n\n`;
  });

  await sendMessage(chatId, text);
}

async function handleCallback(callback: TelegramUpdate["callback_query"]) {
  if (!callback?.data || !callback.from || !callback.message) return;

  const chatId = callback.message.chat.id;
  const messageId = callback.message.message_id;
  const data = callback.data;

  const { data: link } = await supabase
    .from("telegram_links")
    .select("user_id")
    .eq("chat_id", chatId)
    .single();

  if (!link) {
    await answerCallbackQuery(callback.id, "Account not linked!");
    return;
  }

  if (data.startsWith("approve:")) {
    const sheetId = data.replace("approve:", "");
    await handleApprove(chatId, messageId, callback.id, link.user_id, sheetId);
    return;
  }

  if (data.startsWith("return:")) {
    const sheetId = data.replace("return:", "");
    await handleReturn(chatId, messageId, callback.id, link.user_id, sheetId);
    return;
  }

  if (data.startsWith("checkin:")) {
    const parts = data.split(":");
    const goalId = parts[1];
    const status = parts[2];
    await handleCheckin(chatId, messageId, callback.id, link.user_id, goalId, status);
    return;
  }

  await answerCallbackQuery(callback.id, "Unknown action");
}

async function handleApprove(
  chatId: number,
  messageId: number,
  callbackId: string,
  managerId: string,
  sheetId: string
) {
  const { data: sheet } = await supabase
    .from("goal_sheets")
    .select("*, employee:profiles!goal_sheets_employee_id_fkey(full_name)")
    .eq("id", sheetId)
    .single();

  if (!sheet || sheet.status !== "submitted") {
    await answerCallbackQuery(callbackId, "Sheet no longer pending");
    return;
  }

  const { error } = await supabase
    .from("goal_sheets")
    .update({
      status: "approved",
      approved_at: new Date().toISOString(),
      approved_by: managerId,
      is_locked: true,
    })
    .eq("id", sheetId);

  if (error) {
    await answerCallbackQuery(callbackId, "Failed to approve");
    return;
  }

  await supabase.from("notifications").insert({
    user_id: sheet.employee_id,
    type: "goal_approved",
    title: "Goal Sheet Approved",
    message: "Your goal sheet has been approved and locked.",
    link: "/dashboard/goals",
  });

  const employeeName = (sheet.employee as { full_name: string })?.full_name || "Employee";

  await editMessageText(
    chatId,
    messageId,
    `✅ <b>APPROVED</b>\n\n${employeeName}'s goal sheet has been approved and locked.`
  );
  await answerCallbackQuery(callbackId, "Approved!");

  const { data: empLink } = await supabase
    .from("telegram_links")
    .select("chat_id")
    .eq("user_id", sheet.employee_id)
    .single();

  if (empLink) {
    await sendMessage(
      empLink.chat_id,
      `✅ <b>Goal Sheet Approved!</b>\n\nYour goal sheet has been approved and locked by your manager.`
    );
  }
}

async function handleReturn(
  chatId: number,
  messageId: number,
  callbackId: string,
  managerId: string,
  sheetId: string
) {
  void managerId;

  const { data: sheet } = await supabase
    .from("goal_sheets")
    .select("*, employee:profiles!goal_sheets_employee_id_fkey(full_name)")
    .eq("id", sheetId)
    .single();

  if (!sheet || sheet.status !== "submitted") {
    await answerCallbackQuery(callbackId, "Sheet no longer pending");
    return;
  }

  const { error } = await supabase
    .from("goal_sheets")
    .update({
      status: "returned",
      returned_at: new Date().toISOString(),
      return_reason: "Returned via Telegram — please review and resubmit.",
    })
    .eq("id", sheetId);

  if (error) {
    await answerCallbackQuery(callbackId, "Failed to return");
    return;
  }

  await supabase.from("notifications").insert({
    user_id: sheet.employee_id,
    type: "goal_returned",
    title: "Goal Sheet Returned",
    message: "Your goal sheet was returned. Please review and resubmit.",
    link: "/dashboard/goals",
  });

  const employeeName = (sheet.employee as { full_name: string })?.full_name || "Employee";

  await editMessageText(
    chatId,
    messageId,
    `↩️ <b>RETURNED</b>\n\n${employeeName}'s goal sheet has been returned for rework.`
  );
  await answerCallbackQuery(callbackId, "Returned!");

  const { data: empLink } = await supabase
    .from("telegram_links")
    .select("chat_id")
    .eq("user_id", sheet.employee_id)
    .single();

  if (empLink) {
    await sendMessage(
      empLink.chat_id,
      `↩️ <b>Goal Sheet Returned</b>\n\nYour manager returned your goal sheet. Please review and resubmit.`
    );
  }
}

async function handleCheckin(
  chatId: number,
  messageId: number,
  callbackId: string,
  userId: string,
  goalId: string,
  status: string
) {
  const { data: goal } = await supabase
    .from("goals")
    .select("*, goal_sheet:goal_sheets!inner(employee_id, cycle_id)")
    .eq("id", goalId)
    .single();

  if (!goal) {
    await answerCallbackQuery(callbackId, "Goal not found");
    return;
  }

  const sheet = goal.goal_sheet as { employee_id: string; cycle_id: string };
  if (sheet.employee_id !== userId) {
    await answerCallbackQuery(callbackId, "Not your goal");
    return;
  }

  const actualValue = status === "completed" ? goal.target_value : Math.round(goal.target_value * 0.7);

  await supabase.from("achievements").upsert(
    {
      goal_id: goalId,
      cycle_id: sheet.cycle_id,
      actual_value: actualValue,
      status: status as "not_started" | "on_track" | "completed",
      notes: `Updated via Telegram`,
      updated_by: userId,
    },
    { onConflict: "goal_id,cycle_id" }
  );

  const statusLabel = status === "completed" ? "✅ Completed" : "🟡 On Track";
  await answerCallbackQuery(callbackId, `Updated: ${statusLabel}`);

  const currentText = messageId ? "" : "";
  void currentText;

  await sendMessage(
    chatId,
    `${statusLabel}\n\n<b>${goal.title}</b> updated to ${status.replace("_", " ")}.`
  );
}
