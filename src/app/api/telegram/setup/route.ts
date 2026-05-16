import { NextResponse } from "next/server";
import { setWebhook } from "@/lib/telegram";

export async function POST(request: Request) {
  const { url } = await request.json();

  if (!url) {
    return NextResponse.json({ error: "URL required" }, { status: 400 });
  }

  const webhookUrl = `${url}/api/telegram/webhook`;
  const result = await setWebhook(webhookUrl);

  return NextResponse.json(result);
}

export async function GET() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return NextResponse.json({ configured: false });
  }

  const res = await fetch(
    `https://api.telegram.org/bot${token}/getWebhookInfo`
  );
  const data = await res.json();

  return NextResponse.json({
    configured: true,
    webhook: data.result,
  });
}
