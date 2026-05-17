"use client";
import { useState } from "react";

const faqs = [
  { q: "How does the goal approval workflow work?", a: "Employees create goals with weighted targets. Once submitted, their manager reviews and can approve, edit inline, or return with feedback. Approved goals are locked and tracked quarterly." },
  { q: "What happens during quarterly check-ins?", a: "During the check-in window, employees log actual achievements against planned targets. Managers review progress, add structured comments, and the system computes weighted progress scores." },
  { q: "Can goals be modified after approval?", a: "No. Approved goals are locked to maintain integrity. Only an admin can unlock a goal sheet, and every post-lock change is logged in the audit trail." },
  { q: "How does the AI SMART validator work?", a: "Before submission, each goal is evaluated against SMART criteria (Specific, Measurable, Achievable, Relevant, Time-bound). If a goal is vague, the AI suggests a rewritten version." },
  { q: "What integrations are supported?", a: "Microsoft Entra ID for SSO, Telegram bot for mobile notifications and approvals, Microsoft Teams webhook for channel alerts, and CSV/Excel export for reports." },
  { q: "Is my data secure?", a: "Yes. Row-level security policies enforce that employees see only their data, managers see their team, and admins see everything. All post-lock changes are audit-logged." },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="max-w-3xl mx-auto">
      {faqs.map((faq, i) => (
        <div key={i} className="border-b" style={{ borderColor: "rgba(255,255,255,0.1)", ...(i === 0 ? { borderTop: "1px solid rgba(255,255,255,0.1)" } : {}) }}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between gap-4 py-5 text-left"
          >
            <span className="font-semibold text-base text-white">{faq.q}</span>
            <span className="text-xl shrink-0 transition-transform duration-300" style={{ color: "rgba(255,255,255,0.4)", transform: open === i ? "rotate(45deg)" : "none" }}>+</span>
          </button>
          <div className="overflow-hidden transition-all duration-300" style={{ maxHeight: open === i ? "200px" : "0" }}>
            <p className="pb-5 text-[15px] leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>{faq.a}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
