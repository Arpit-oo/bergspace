import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const code = randomBytes(4).toString("hex").toUpperCase();

  const { data, error } = await supabase
    .from("telegram_link_codes")
    .insert({
      user_id: user.id,
      code,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    code: data.code,
    expires_at: data.expires_at,
    instructions: `Open Telegram, search for @BergSpaceBot, and send: /link ${data.code}`,
  });
}
