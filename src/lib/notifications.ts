import { SupabaseClient } from "@supabase/supabase-js";

export async function notifyGoalSubmitted(
  supabase: SupabaseClient,
  employeeName: string,
  managerId: string,
  cycleName: string
) {
  await supabase.from("notifications").insert({
    user_id: managerId,
    type: "goal_submitted",
    title: "Goal Sheet Submitted",
    message: `${employeeName} submitted their goal sheet for ${cycleName}`,
    link: "/dashboard/approvals",
  });
}

export async function notifyGoalApproved(
  supabase: SupabaseClient,
  employeeId: string,
  cycleName: string
) {
  await supabase.from("notifications").insert({
    user_id: employeeId,
    type: "goal_approved",
    title: "Goal Sheet Approved",
    message: `Your goal sheet for ${cycleName} has been approved and locked.`,
    link: "/dashboard/goals",
  });
}

export async function notifyGoalReturned(
  supabase: SupabaseClient,
  employeeId: string,
  cycleName: string,
  reason: string
) {
  await supabase.from("notifications").insert({
    user_id: employeeId,
    type: "goal_returned",
    title: "Goal Sheet Returned",
    message: `Your goal sheet for ${cycleName} was returned: ${reason}`,
    link: "/dashboard/goals",
  });
}

export async function notifyCheckinReminder(
  supabase: SupabaseClient,
  userId: string,
  cycleName: string
) {
  await supabase.from("notifications").insert({
    user_id: userId,
    type: "checkin_reminder",
    title: "Check-in Reminder",
    message: `Quarterly check-in window for ${cycleName} is now open.`,
    link: "/dashboard/my-checkins",
  });
}

export async function notifySharedGoalAssigned(
  supabase: SupabaseClient,
  employeeId: string,
  goalTitle: string,
  cycleName: string
) {
  await supabase.from("notifications").insert({
    user_id: employeeId,
    type: "shared_goal_assigned",
    title: "Shared Goal Assigned",
    message: `A shared goal "${goalTitle}" has been added to your sheet for ${cycleName}.`,
    link: "/dashboard/goals",
  });
}

export async function notifyEscalation(
  supabase: SupabaseClient,
  userId: string,
  triggerType: string,
  employeeName: string
) {
  const messages: Record<string, string> = {
    no_submission: `${employeeName} has not submitted their goal sheet within the deadline.`,
    no_approval: `Goal sheet approval pending for ${employeeName}.`,
    missed_checkin: `${employeeName} has not completed their quarterly check-in.`,
  };

  await supabase.from("notifications").insert({
    user_id: userId,
    type: "escalation",
    title: "Escalation Alert",
    message: messages[triggerType] || `Escalation triggered for ${employeeName}.`,
    link: "/dashboard/escalations",
  });
}

export interface TeamsWebhookPayload {
  "@type": "MessageCard";
  "@context": "http://schema.org/extensions";
  summary: string;
  themeColor: string;
  title: string;
  sections: {
    activityTitle: string;
    activitySubtitle: string;
    facts: { name: string; value: string }[];
  }[];
  potentialAction?: {
    "@type": "OpenUri";
    name: string;
    targets: { os: string; uri: string }[];
  }[];
}

export function buildTeamsCard(
  title: string,
  subtitle: string,
  facts: { name: string; value: string }[],
  actionUrl?: string
): TeamsWebhookPayload {
  const card: TeamsWebhookPayload = {
    "@type": "MessageCard",
    "@context": "http://schema.org/extensions",
    summary: title,
    themeColor: "0076D7",
    title,
    sections: [
      {
        activityTitle: title,
        activitySubtitle: subtitle,
        facts,
      },
    ],
  };

  if (actionUrl) {
    card.potentialAction = [
      {
        "@type": "OpenUri",
        name: "View in BergSpace",
        targets: [{ os: "default", uri: actionUrl }],
      },
    ];
  }

  return card;
}

export async function sendTeamsNotification(
  webhookUrl: string,
  payload: TeamsWebhookPayload
): Promise<boolean> {
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return response.ok;
  } catch {
    return false;
  }
}
