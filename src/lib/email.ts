import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return false;

  try {
    await transporter.sendMail({
      from: `"BergSpace" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    return true;
  } catch (e) {
    console.error("Email send error:", e);
    return false;
  }
}

export function goalSubmittedEmail(employeeName: string, cycleName: string) {
  return {
    subject: `Goal Sheet Submitted — ${employeeName}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto;">
        <div style="padding: 24px 0; border-bottom: 1px solid #E8E2D6;">
          <strong style="font-size: 18px;">BergSpace</strong>
        </div>
        <div style="padding: 24px 0;">
          <h2 style="margin: 0 0 8px; font-size: 16px;">Goal Sheet Submitted</h2>
          <p style="color: #5C564C; margin: 0 0 16px;">${employeeName} submitted their goal sheet for <strong>${cycleName}</strong>.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/approvals" style="display: inline-block; padding: 10px 20px; background: #C45A2D; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">Review Now</a>
        </div>
        <div style="padding: 16px 0; border-top: 1px solid #E8E2D6; color: #8C8578; font-size: 12px;">
          BergSpace — Goal Setting & Tracking Portal
        </div>
      </div>
    `,
  };
}

export function goalApprovedEmail(cycleName: string) {
  return {
    subject: `Goal Sheet Approved — ${cycleName}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto;">
        <div style="padding: 24px 0; border-bottom: 1px solid #E8E2D6;">
          <strong style="font-size: 18px;">BergSpace</strong>
        </div>
        <div style="padding: 24px 0;">
          <h2 style="margin: 0 0 8px; font-size: 16px;">Goal Sheet Approved</h2>
          <p style="color: #5C564C; margin: 0 0 16px;">Your goal sheet for <strong>${cycleName}</strong> has been approved and locked.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/goals" style="display: inline-block; padding: 10px 20px; background: #C45A2D; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">View Goals</a>
        </div>
        <div style="padding: 16px 0; border-top: 1px solid #E8E2D6; color: #8C8578; font-size: 12px;">
          BergSpace — Goal Setting & Tracking Portal
        </div>
      </div>
    `,
  };
}

export function managerAssignedEmail(employeeName: string, managerName: string) {
  return {
    subject: `New Team Member — ${employeeName}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto;">
        <div style="padding: 24px 0; border-bottom: 1px solid #E8E2D6;">
          <strong style="font-size: 18px;">BergSpace</strong>
        </div>
        <div style="padding: 24px 0;">
          <h2 style="margin: 0 0 8px; font-size: 16px;">New Team Member Assigned</h2>
          <p style="color: #5C564C; margin: 0 0 16px;"><strong>${employeeName}</strong> has been assigned to your team.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/team" style="display: inline-block; padding: 10px 20px; background: #C45A2D; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">View Team</a>
        </div>
        <div style="padding: 16px 0; border-top: 1px solid #E8E2D6; color: #8C8578; font-size: 12px;">BergSpace — Goal Setting & Tracking Portal</div>
      </div>
    `,
  };
}

export function employeeManagerChangedEmail(managerName: string) {
  return {
    subject: `Manager Updated — ${managerName}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto;">
        <div style="padding: 24px 0; border-bottom: 1px solid #E8E2D6;">
          <strong style="font-size: 18px;">BergSpace</strong>
        </div>
        <div style="padding: 24px 0;">
          <h2 style="margin: 0 0 8px; font-size: 16px;">Manager Updated</h2>
          <p style="color: #5C564C; margin: 0 0 16px;">You have been assigned to <strong>${managerName}</strong> as your new manager.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display: inline-block; padding: 10px 20px; background: #C45A2D; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">Go to Dashboard</a>
        </div>
        <div style="padding: 16px 0; border-top: 1px solid #E8E2D6; color: #8C8578; font-size: 12px;">BergSpace — Goal Setting & Tracking Portal</div>
      </div>
    `,
  };
}

export function sharedGoalAssignedEmail(goalTitle: string) {
  return {
    subject: `Shared Goal Assigned — ${goalTitle}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto;">
        <div style="padding: 24px 0; border-bottom: 1px solid #E8E2D6;">
          <strong style="font-size: 18px;">BergSpace</strong>
        </div>
        <div style="padding: 24px 0;">
          <h2 style="margin: 0 0 8px; font-size: 16px;">Shared Goal Assigned</h2>
          <p style="color: #5C564C; margin: 0 0 16px;">A shared goal <strong>"${goalTitle}"</strong> has been added to your goal sheet. You can adjust the weightage.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/goals" style="display: inline-block; padding: 10px 20px; background: #C45A2D; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">View Goals</a>
        </div>
        <div style="padding: 16px 0; border-top: 1px solid #E8E2D6; color: #8C8578; font-size: 12px;">BergSpace — Goal Setting & Tracking Portal</div>
      </div>
    `,
  };
}

export function checkinReminderEmail(cycleName: string) {
  return {
    subject: `Check-in Window Open — ${cycleName}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto;">
        <div style="padding: 24px 0; border-bottom: 1px solid #E8E2D6;">
          <strong style="font-size: 18px;">BergSpace</strong>
        </div>
        <div style="padding: 24px 0;">
          <h2 style="margin: 0 0 8px; font-size: 16px;">Check-in Window Open</h2>
          <p style="color: #5C564C; margin: 0 0 16px;">The quarterly check-in window for <strong>${cycleName}</strong> is now open. Log your achievements before it closes.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/my-checkins" style="display: inline-block; padding: 10px 20px; background: #C45A2D; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">Log Check-in</a>
        </div>
        <div style="padding: 16px 0; border-top: 1px solid #E8E2D6; color: #8C8578; font-size: 12px;">BergSpace — Goal Setting & Tracking Portal</div>
      </div>
    `,
  };
}

export function escalationEmail(employeeName: string, triggerType: string) {
  const messages: Record<string, string> = {
    no_submission: `${employeeName} has not submitted their goal sheet within the deadline.`,
    no_approval: `Goal sheet approval is pending for ${employeeName}.`,
    missed_checkin: `${employeeName} has not completed their quarterly check-in.`,
  };
  return {
    subject: `Escalation Alert — ${employeeName}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto;">
        <div style="padding: 24px 0; border-bottom: 1px solid #E8E2D6;">
          <strong style="font-size: 18px;">BergSpace</strong>
        </div>
        <div style="padding: 24px 0;">
          <h2 style="margin: 0 0 8px; font-size: 16px;">Escalation Alert</h2>
          <p style="color: #5C564C; margin: 0 0 16px;">${messages[triggerType] || `Escalation triggered for ${employeeName}.`}</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/escalations" style="display: inline-block; padding: 10px 20px; background: #C45A2D; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">View Escalations</a>
        </div>
        <div style="padding: 16px 0; border-top: 1px solid #E8E2D6; color: #8C8578; font-size: 12px;">BergSpace — Goal Setting & Tracking Portal</div>
      </div>
    `,
  };
}

export function announcementEmail(subject: string, message: string) {
  return {
    subject: `BergSpace: ${subject}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto;">
        <div style="padding: 24px 0; border-bottom: 1px solid #E8E2D6;">
          <strong style="font-size: 18px;">BergSpace</strong>
        </div>
        <div style="padding: 24px 0;">
          <h2 style="margin: 0 0 8px; font-size: 16px;">${subject}</h2>
          <p style="color: #5C564C; margin: 0 0 16px; white-space: pre-wrap;">${message}</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/notifications" style="display: inline-block; padding: 10px 20px; background: #C45A2D; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">View in BergSpace</a>
        </div>
        <div style="padding: 16px 0; border-top: 1px solid #E8E2D6; color: #8C8578; font-size: 12px;">BergSpace — Goal Setting &amp; Tracking Portal</div>
      </div>
    `,
  };
}

export function goalReturnedEmail(cycleName: string, reason: string) {
  return {
    subject: `Goal Sheet Returned — ${cycleName}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto;">
        <div style="padding: 24px 0; border-bottom: 1px solid #E8E2D6;">
          <strong style="font-size: 18px;">BergSpace</strong>
        </div>
        <div style="padding: 24px 0;">
          <h2 style="margin: 0 0 8px; font-size: 16px;">Goal Sheet Returned</h2>
          <p style="color: #5C564C; margin: 0 0 8px;">Your goal sheet for <strong>${cycleName}</strong> was returned for rework.</p>
          <p style="color: #5C564C; margin: 0 0 16px; padding: 12px; background: #FDF0EE; border-radius: 8px; font-size: 14px;"><strong>Reason:</strong> ${reason}</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/goals" style="display: inline-block; padding: 10px 20px; background: #C45A2D; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">Edit Goals</a>
        </div>
        <div style="padding: 16px 0; border-top: 1px solid #E8E2D6; color: #8C8578; font-size: 12px;">
          BergSpace — Goal Setting & Tracking Portal
        </div>
      </div>
    `,
  };
}
