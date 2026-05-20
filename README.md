# BergSpace — In-House Goal Setting & Performance Tracking Portal

> Built for **ATOMQUEST Hackathon 1.0** by Atomberg

**[Live Demo](https://atomquest-sand.vercel.app)** · **[Source Code](https://github.com/Arpit-oo/bergspace)**

---

## Quick Start

| Role | Email | Password |
|------|-------|----------|
| Employee | employee@bergspace.com | demo123456 |
| Manager | manager@bergspace.com | demo123456 |
| Admin | admin@bergspace.com | demo123456 |

Microsoft Entra ID SSO also available — sign in with any Microsoft account.

---

## Architecture

### System Overview
![System Architecture](./architecture.png)

### Entity Relationship Diagram
![ER Diagram](./docs/architecture-er.png)

### Goal Lifecycle Sequence
![Sequence Diagram](./docs/architecture-sequence.png)

### Combined View (ER + State Machine + Sequence)
![Combined Diagram](./docs/architecture-combined.png)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, shadcn/ui |
| Backend | Supabase (PostgreSQL 17, Auth, Row Level Security, Triggers) |
| AI | OpenAI GPT-4o-mini (SMART validation with fallback) |
| Bot | Telegram Bot API (interactive inline buttons) |
| Email | Nodemailer + Gmail SMTP (10 branded HTML templates) |
| Notifications | 4 channels: In-app, Email, MS Teams webhooks, Telegram |
| Auth | Supabase Auth + Microsoft Entra ID SSO (multi-tenant) |
| Charts | Recharts (animated sparklines, heatmaps, donut/bar charts) |
| State | Zustand (zero-boilerplate client state) |
| Export | SheetJS (CSV + Excel generation) |
| Testing | Playwright (54 E2E tests across all 3 roles) |
| Deploy | Vercel (production) |

---

## Security Model

> BergSpace enforces security at the **database level**, not just application code. Even if a server-side bug exists, PostgreSQL Row Level Security blocks unauthorized data access.

| Layer | Implementation |
|-------|---------------|
| **Database** | **45+ RLS policies** — row-level access enforced by PostgreSQL itself |
| **Auth** | Supabase Auth + JWT sessions via secure httpOnly cookies |
| **SSO** | Microsoft Entra ID (multi-tenant) — auto-creates profile on first login |
| **API** | Every endpoint auth-guarded — 401/403 on unauthorized access |
| **Audit** | Immutable trail — every post-lock change logged with actor, timestamp, before/after diff |
| **Locking** | Approved goal sheets locked — admin-only unlock prevents tampering |
| **Scoring** | `compute_progress_score()` — server-side PostgreSQL function, not client-computed |

---

## Database

**15 tables · 45+ RLS policies · 4 DB triggers · 1 server-side scoring function**

| Table | Purpose |
|-------|---------|
| `profiles` | Users with roles, departments, manager hierarchy |
| `departments` | Organizational structure |
| `goal_cycles` | Quarterly windows with 3 presets (calendar, fiscal, custom) |
| `goal_sheets` | Employee submissions with approval state machine |
| `goals` | Individual goals with UoM, targets, weightage |
| `thrust_areas` | Department/global initiative groupings |
| `shared_goal_templates` | Manager-created KPI templates |
| `achievements` | Quarterly actual vs planned tracking |
| `checkins` | Manager progress reviews with scores |
| `audit_log_entries` | Immutable change log (field-level diffs) |
| `escalation_rules` | Configurable trigger rules |
| `escalation_logs` | Trigger events with notification chains |
| `notifications` | In-app notification queue (6 event types) |
| `telegram_accounts` | Bot ↔ user linkage for mobile notifications |
| `teams_config` | MS Teams webhook configuration |

**Triggers:** auto profile creation on signup, shared goal achievement sync, weighted progress scoring, updated_at timestamps.

---

## Features

### Core Goal Management
- Goal creation with weighted validation (sum = 100%, min 5% per goal, max 8 goals)
- 4 UoM types: Numeric, Percentage, Timeline, Zero-based
- Thrust areas (department-scoped + global)
- Goal sheet state machine: `Draft → Submitted → Approved / Returned`
- Manager approval with inline per-goal editing and return with reason
- Goal locking on approval + admin-only unlock
- Shared goals: push KPI templates, read-only title/target, achievement sync via DB trigger
- Quarterly check-ins with configurable open/close windows
- Manager check-in module: structured comments, progress scores, delta analysis
- Reports with CSV/Excel export (SheetJS)
- Server-side weighted progress scoring (`compute_progress_score`)

### AI-Powered
- **SMART Goal Validator** — scores each goal against Specific, Measurable, Achievable, Relevant, Time-bound criteria with animated per-criterion feedback. Rewrites weak goals into concrete versions. Graceful fallback when API unavailable.

### 4-Channel Notification System
- **In-app** — real-time notification center with 6 event types
- **Email** — 10 branded HTML templates via Nodemailer + Gmail SMTP
- **Microsoft Teams** — adaptive card webhooks for all lifecycle events
- **Telegram Bot (@BergSpacebot)** — approve/return goals from chat, one-tap check-ins, interactive inline buttons, account linking via `/link` command

### Enterprise Features
- **Microsoft Entra ID SSO** — multi-tenant, any Microsoft account, auto-creates profile on first login
- **Escalation Engine** — configurable rules (no_submission, no_approval, missed_checkin), threshold days, chain notifications (employee → manager → skip-level → HR), intervention dashboard
- **Broadcast/Announcements** — multi-channel (in-app + email + Telegram) with audience targeting
- **Immutable Audit Trail** — human-readable field-level diffs, actor identity, timestamps, post-lock changes only

### Analytics & Reporting
- QoQ trend charts (line + bar)
- Department completion heatmaps
- Status distribution donut charts
- Manager effectiveness scoring
- Achievement reports with export
- Animated sparklines + count-up animations

### Accessibility & UX
- Font size control (small/medium/large)
- Reduce animations toggle
- High contrast mode
- Mobile responsive
- Role-aware dashboard routing
- Dark sidebar with mountain peak branding

---

## How to Use BergSpace

### As an Employee
1. **Login** → Dashboard shows goal status + current cycle
2. **My Goals** → Create goal sheet with thrust areas, targets, weightages
3. **AI validates** goals against SMART criteria before submission
4. **Submit** → Manager notified across all 4 channels simultaneously
5. **After approval** → Goals lock. Track progress in **My Check-ins** during quarterly window
6. **Telegram** → Link account, receive mobile notifications, tap to view status

### As a Manager
1. **Dashboard** → Team stats, pending approvals, recent activity
2. **Approvals** → Review submitted sheets, inline edit any goal, approve or return with reason
3. **Check-ins** → View team's planned vs actual, add structured comments, override scores
4. **Shared Goals** → Create KPI templates, push to team members
5. **Announcements** → Broadcast messages via in-app + email + Telegram
6. **Telegram** → Approve/return goals directly from chat with inline buttons

### As an Admin
1. **Dashboard** → Org-wide stats, escalation alerts, audit entries
2. **Employees** → Full CRUD: assign roles, departments, managers. View/delete goal sheets
3. **Goal Cycles** → Create quarterly windows with 3 presets (calendar year, fiscal Apr-Mar, custom)
4. **Escalations** → Configure trigger rules, view chain notifications, intervention dashboard
5. **Reports** → Org-wide achievement + completion data with CSV/Excel export
6. **Analytics** → Heatmaps, donut charts, QoQ trends, distribution analysis
7. **Settings** → SSO config, email integration status, Telegram bot, Teams webhook
8. **Audit Log** → Browse immutable field-level change history

---

## Goal Sheet State Machine

```
┌───────┐    submit     ┌───────────┐    approve    ┌──────────┐
│ Draft │──────────────▶│ Submitted │──────────────▶│ Approved │──▶ LOCKED
└───────┘               └───────────┘               └──────────┘
    ▲                        │                           │
    │         return         │                     admin unlock
    └────────────────────────┘                           │
                                                         ▼
                                                    ┌──────────┐
                                                    │ Unlocked │
                                                    └──────────┘
```

---

## Setup

```bash
git clone https://github.com/Arpit-oo/bergspace.git
cd bergspace
npm install
cp .env.example .env.local
# Fill in Supabase, OpenAI, SMTP, Telegram keys
npm run dev
```

## Testing

```bash
npx playwright test
# 54 E2E tests covering all roles, pages, and feature workflows
```

---

Built by **Arpit Walia** · [LinkedIn](https://linkedin.com/in/arpit-walia) · [GitHub](https://github.com/Arpit-oo)

Made with love for ATOMQUEST Hackathon 1.0
