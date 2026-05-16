import { createClient } from "@supabase/supabase-js";
import {
  sendMessage,
  buildApprovalMessage,
  buildCheckinMessage,
  buildNotificationMessage,
} from "./telegram";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function getTelegramChatId(userId: string): Promise<number | null> {
  const supabase = getAdminClient();
  const { data } = await supabase
    .from("telegram_links")
    .select("chat_id")
    .eq("user_id", userId)
    .single();
  return data?.chat_id ?? null;
}

export async function telegramNotifyGoalSubmitted(
  managerId: string,
  employeeName: string,
  cycleName: string,
  goalCount: number,
  sheetId: string
) {
  const chatId = await getTelegramChatId(managerId);
  if (!chatId) return;

  const { text, keyboard } = buildApprovalMessage(
    employeeName,
    cycleName,
    goalCount,
    sheetId
  );
  await sendMessage(chatId, text, keyboard);
}

export async function telegramNotifyGoalApproved(
  employeeId: string,
  cycleName: string
) {
  const chatId = await getTelegramChatId(employeeId);
  if (!chatId) return;

  const { text, keyboard } = buildNotificationMessage(
    "Goal Sheet Approved",
    `Your goal sheet for ${cycleName} has been approved and locked.`,
    "/dashboard/goals"
  );
  await sendMessage(chatId, text, keyboard);
}

export async function telegramNotifyGoalReturned(
  employeeId: string,
  cycleName: string,
  reason: string
) {
  const chatId = await getTelegramChatId(employeeId);
  if (!chatId) return;

  const { text, keyboard } = buildNotificationMessage(
    "Goal Sheet Returned",
    `Your goal sheet for ${cycleName} was returned: ${reason}`,
    "/dashboard/goals"
  );
  await sendMessage(chatId, text, keyboard);
}

export async function telegramNotifyCheckinOpen(
  employeeId: string,
  cycleName: string,
  goals: { id: string; title: string; target: number; uom: string }[]
) {
  const chatId = await getTelegramChatId(employeeId);
  if (!chatId) return;

  const { text, keyboard } = buildCheckinMessage(cycleName, goals);
  await sendMessage(chatId, text, keyboard);
}

export async function telegramNotifyGeneric(
  userId: string,
  title: string,
  message: string,
  link?: string
) {
  const chatId = await getTelegramChatId(userId);
  if (!chatId) return;

  const { text, keyboard } = buildNotificationMessage(title, message, link);
  await sendMessage(chatId, text, keyboard);
}
