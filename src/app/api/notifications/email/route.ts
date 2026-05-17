import { NextResponse } from "next/server";
import { sendEmail, goalSubmittedEmail, goalApprovedEmail, goalReturnedEmail } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const body = await request.json();
  const { type, recipientId, employeeName, cycleName, reason } = body;

  const admin = createAdminClient();
  const { data: recipient } = await admin
    .from("profiles")
    .select("email")
    .eq("id", recipientId)
    .single();

  if (!recipient?.email) {
    return NextResponse.json({ sent: false, reason: "no recipient email" });
  }

  let emailContent;
  if (type === "goal_submitted") {
    emailContent = goalSubmittedEmail(employeeName, cycleName);
  } else if (type === "goal_approved") {
    emailContent = goalApprovedEmail(cycleName);
  } else if (type === "goal_returned") {
    emailContent = goalReturnedEmail(cycleName, reason || "Please review and resubmit.");
  }

  if (!emailContent) {
    return NextResponse.json({ sent: false, reason: "unknown type" });
  }

  const sent = await sendEmail(recipient.email, emailContent.subject, emailContent.html);
  return NextResponse.json({ sent });
}
