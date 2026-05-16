const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

export interface InlineKeyboardButton {
  text: string;
  callback_data?: string;
  url?: string;
}

export interface TelegramMessage {
  message_id: number;
  chat: { id: number; type: string; first_name?: string; username?: string };
  text?: string;
  from?: { id: number; first_name?: string; username?: string };
}

export interface TelegramCallbackQuery {
  id: string;
  from: { id: number; first_name?: string; username?: string };
  message?: TelegramMessage;
  data?: string;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

async function apiCall(method: string, body: Record<string, unknown>) {
  const res = await fetch(`${API_BASE}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function sendMessage(
  chatId: number,
  text: string,
  inlineKeyboard?: InlineKeyboardButton[][]
) {
  return apiCall("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    ...(inlineKeyboard && {
      reply_markup: { inline_keyboard: inlineKeyboard },
    }),
  });
}

export async function answerCallbackQuery(
  callbackQueryId: string,
  text?: string
) {
  return apiCall("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text,
  });
}

export async function editMessageText(
  chatId: number,
  messageId: number,
  text: string
) {
  return apiCall("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: "HTML",
  });
}

export async function setWebhook(url: string) {
  return apiCall("setWebhook", { url });
}

export function buildApprovalMessage(
  employeeName: string,
  cycleName: string,
  goalCount: number,
  sheetId: string
): { text: string; keyboard: InlineKeyboardButton[][] } {
  const text =
    `📋 <b>Goal Sheet Submitted</b>\n\n` +
    `<b>From:</b> ${employeeName}\n` +
    `<b>Cycle:</b> ${cycleName}\n` +
    `<b>Goals:</b> ${goalCount} | Weightage: 100%\n\n` +
    `Review and take action:`;

  const keyboard = [
    [
      { text: "✅ Approve", callback_data: `approve:${sheetId}` },
      { text: "↩️ Return", callback_data: `return:${sheetId}` },
    ],
    [
      {
        text: "🔗 View in Portal",
        url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/approvals`,
      },
    ],
  ];

  return { text, keyboard };
}

export function buildCheckinMessage(
  cycleName: string,
  goals: { id: string; title: string; target: number; uom: string }[]
): { text: string; keyboard: InlineKeyboardButton[][] } {
  let text = `⏰ <b>Check-in Window Open</b>\n<b>Cycle:</b> ${cycleName}\n\n`;

  goals.forEach((g, i) => {
    text += `<b>${i + 1}.</b> ${g.title}\n   Target: ${g.target} (${g.uom})\n\n`;
  });

  text += "Update your goal status:";

  const keyboard = goals.map((g) => [
    { text: `🟡 On Track: ${g.title.slice(0, 20)}...`, callback_data: `checkin:${g.id}:on_track` },
    { text: `✅ Done`, callback_data: `checkin:${g.id}:completed` },
  ]);

  return { text, keyboard };
}

export function buildNotificationMessage(
  title: string,
  message: string,
  link?: string
): { text: string; keyboard?: InlineKeyboardButton[][] } {
  const text = `🔔 <b>${title}</b>\n\n${message}`;

  const keyboard = link
    ? [
        [
          {
            text: "🔗 Open in BergSpace",
            url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}${link}`,
          },
        ],
      ]
    : undefined;

  return { text, keyboard };
}
