import { NextResponse } from "next/server";
import { buildTeamsCard, sendTeamsNotification } from "@/lib/notifications";

export async function POST(request: Request) {
  const webhookUrl = process.env.TEAMS_WEBHOOK_URL;
  if (!webhookUrl)
    return NextResponse.json({ sent: false, reason: "no webhook configured" });

  const body = await request.json();
  const { type, employeeName, cycleName, goalCount, reason } = body;

  let card;
  if (type === "goal_submitted") {
    card = buildTeamsCard(
      "Goal Sheet Submitted",
      `${employeeName} submitted their goal sheet`,
      [
        { name: "Employee", value: employeeName || "" },
        { name: "Cycle", value: cycleName || "" },
        { name: "Goals", value: String(goalCount || 0) },
      ],
      `${process.env.NEXT_PUBLIC_APP_URL || ""}/dashboard/approvals`
    );
  } else if (type === "goal_approved") {
    card = buildTeamsCard(
      "Goal Sheet Approved",
      `${employeeName}'s goal sheet has been approved`,
      [
        { name: "Employee", value: employeeName || "" },
        { name: "Cycle", value: cycleName || "" },
      ],
      `${process.env.NEXT_PUBLIC_APP_URL || ""}/dashboard/goals`
    );
  } else if (type === "goal_returned") {
    card = buildTeamsCard(
      "Goal Sheet Returned",
      `${employeeName}'s goal sheet was returned`,
      [
        { name: "Employee", value: employeeName || "" },
        { name: "Reason", value: reason || "Review needed" },
      ],
      `${process.env.NEXT_PUBLIC_APP_URL || ""}/dashboard/goals`
    );
  }

  if (card) {
    const sent = await sendTeamsNotification(webhookUrl, card);
    return NextResponse.json({ sent });
  }

  return NextResponse.json({ sent: false });
}
