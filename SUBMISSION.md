# ATOMQUEST Hackathon 1.0 — Submission

## Project: BergSpace
**In-House Goal Setting & Tracking Portal**

---

## Live Demo
**URL:** https://atomquest-sand.vercel.app

## Source Code
**Repository:** https://github.com/Arpit-oo/bergspace

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Employee | employee@bergspace.com | demo123456 |
| Manager | manager@bergspace.com | demo123456 |
| Admin | admin@bergspace.com | demo123456 |

Microsoft SSO also available on login page (any Microsoft account).

---

## User Journeys

### Employee Journey
1. Login → Dashboard (goal status, cycle info, notifications)
2. My Goals → Add goals (thrust area, UoM, target, weightage)
3. System validates: total = 100%, min 10% per goal, max 8 goals
4. AI SMART Validator checks each goal before submission (S-M-A-R-T criteria with sequential animation)
5. Submit → Manager notified (in-app + email + Telegram)
6. After approval → goals locked
7. My Check-ins → log actual achievements during check-in window
8. Notifications → view all alerts + link Telegram bot

### Manager Journey
1. Login → Dashboard (team stats, pending approvals, activity)
2. Team Goals → see all direct reports with goal status
3. Approvals → review submitted sheets, inline edit targets/weightages, approve or return with reason
4. Check-ins → view planned vs actual per employee, add structured comments, see progress scores
5. Shared Goals → create template KPIs, push to employees
6. Announcements → broadcast to team via in-app, email, Telegram
7. Reports → achievement data, CSV/Excel export

### Admin Journey
1. Login → Dashboard (org stats, escalations, audit entries)
2. Employees → full directory, click to edit role/department/manager, view/delete goal sheets
3. Goal Cycles → create quarterly windows with presets (calendar year, fiscal, custom)
4. Escalations → configurable rules, intervention dashboard (bottleneck managers, department health)
5. Shared Goals → org-wide KPI templates
6. Reports → org-wide achievement + completion dashboards
7. Analytics → QoQ trends, goal distribution (donut charts), department completion (bar charts), manager effectiveness
8. Audit Log → every post-lock change with human-readable labels
9. Settings → Microsoft Entra SSO config, email status, Telegram bot info, Teams webhook
10. Announcements → broadcast to all users

---

## Features Implemented

### Phase 1 — Goal Creation & Approval (Must-Have) ✅
- Employee-facing goal sheet with Thrust Area, UoM (Numeric/Percentage/Timeline/Zero-based), Targets, Weightage
- System-enforced validation: total weightage = 100%, minimum 10% per goal, maximum 8 goals
- Manager (L1) approval workflow: review, inline edit targets/weightages, approve or return with reason
- Goals locked on approval — no edits without Admin intervention
- Shared Goals: Admin/Manager push departmental KPI to multiple employees
- Recipients adjust weightage only; Goal Title and Target are read-only
- Achievement sync across linked goal sheets via database trigger

### Phase 2 — Achievement Tracking & Quarterly Check-ins (Must-Have) ✅
- Quarterly update interface for employees to log Actual Achievement against Planned Targets
- Status selection per goal: Not Started / On Track / Completed
- Manager Check-in module: view Planned vs Achievement, add structured Check-in Comment
- System-computed progress scores (weighted formula based on actual/target × weightage)
- Configurable quarterly windows with presets (Calendar Year, Fiscal Apr-Mar, Custom)

### Reporting & Governance (Must-Have) ✅
- Achievement Report: exportable CSV/Excel showing Planned vs Actual for all employees
- Completion Dashboard: real-time view of check-in completion status
- Audit Trail: logs all post-lock changes — who changed what, when, old value → new value
- Human-readable labels (not technical jargon)

### Bonus: Microsoft Entra ID (Azure AD) Integration ✅
- Single Sign-On via Microsoft Entra ID (multi-tenant, any Microsoft account)
- Admin assigns roles/departments/managers to SSO users via employee editor
- Role selection screen for first-time SSO users

### Bonus: Email & Microsoft Teams Integration ✅
- Automated email notifications via Gmail SMTP for: goal submission, approval, rejection, check-in reminders, shared goal assignment, manager/employee assignment
- Branded HTML emails with BergSpace styling and action buttons
- Microsoft Teams adaptive card notifications via webhook for all events
- Deep-link support from notifications to relevant portal pages

### Bonus: Escalation Module (Rule-Based) ✅
- Configurable escalation rules: no submission in N days, no approval in N days, missed check-in
- Escalation chain: employee → manager → skip-level → HR
- Escalation log visible to Admin/HR
- Intervention dashboard: bottleneck managers (pending > 48hrs), department health heatmap
- Admin can create new rules and resolve escalations

### Bonus: Analytics Module ✅
- Quarter-on-Quarter achievement trends (line charts)
- Goal distribution by Thrust Area and UoM type (donut charts)
- Department completion rates (bar charts)
- Manager effectiveness dashboard (check-in completion comparison)

### Beyond Requirements — Differentiators
- **AI SMART Goal Validator** — OpenAI GPT-4o-mini evaluates goals against Specific, Measurable, Achievable, Relevant, Time-bound criteria with sequential animation. Suggests concrete rewrites for both title and description.
- **Telegram Bot (@BergSpacebot)** — Account linking, actionable inline keyboards (managers approve/return directly from Telegram), employees update check-in status with one tap, `/status` command
- **Broadcast/Announcement System** — Managers and admins send notifications to selected users via in-app, email, and Telegram simultaneously
- **Accessibility Settings** — Font size (A/A+/A++), reduce animations, high contrast. Persists in localStorage. Available to all roles.
- **Role-based Dashboards** — Employee, Manager, Admin each get tailored home pages with relevant stats, quick actions, and recent activity
- **Mobile Responsive** — Hamburger sidebar, stacking grids, scrollable tables
- **52 E2E Tests** — Playwright test suite covering all roles, pages, and features (51 passing)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS |
| UI Components | shadcn/ui (Base UI), Plus Jakarta Sans, Caveat, DM Mono |
| Charts | Recharts (donut, bar, line) |
| Export | SheetJS (xlsx) for CSV/Excel |
| Backend/Database | Supabase (PostgreSQL 17, Auth, Row Level Security) |
| AI | OpenAI GPT-4o-mini (SMART goal validation) |
| Bot | Telegram Bot API (@BergSpacebot) |
| Email | Nodemailer + Gmail SMTP |
| Auth | Supabase Auth + Microsoft Entra ID (Azure AD) |
| Deploy | Vercel (Edge) |
| Testing | Playwright (52 E2E tests) |

---

## Architecture

```
Client (Browser)
├── Landing Page (SSR, animated, Lumen-inspired)
├── Auth (Email/Password + Microsoft Entra SSO)
└── Dashboard (Role-based: Employee / Manager / Admin)
    ├── 16 dashboard pages
    └── shadcn/ui + Tailwind + Recharts

Next.js 16 App Router
├── Server Components (data fetching + RLS)
├── Client Components (interactive UI)
├── API Routes (/api/telegram, /api/validate-goals, /api/notifications)
└── Middleware (auth guard)

Supabase Platform
├── PostgreSQL 17 (15 tables, 45+ RLS policies)
├── Auth Service (Email + Entra SSO)
├── PostgREST (auto REST API)
└── DB Triggers (profile creation, achievement sync, progress scores)

External Services
├── OpenAI GPT-4o-mini (AI validation)
├── Telegram Bot API (notifications + actions)
├── Gmail SMTP (email notifications)
├── Microsoft Teams (webhook cards)
└── Microsoft Entra ID (SSO)
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for full directory structure and detailed flows.

---

## Database

15 tables with 45+ Row Level Security policies:
- `profiles`, `departments`, `thrust_areas`
- `goal_sheets`, `goals`, `achievements`
- `goal_cycles`, `checkins`, `audit_log`
- `shared_goal_templates`, `escalation_rules`, `escalation_log`
- `notifications`, `telegram_links`, `telegram_link_codes`

Key triggers:
- `handle_new_user()` — auto-creates profile on signup
- `sync_shared_achievement()` — syncs achievement from primary owner to all linked goals
- `compute_progress_score()` — weighted progress calculation

---

## Security Model

- Row Level Security on every table
- Employees see only their own data
- Managers see their direct reports
- Admins see everything
- Post-approval goals immutable (locked via `is_locked` flag)
- All post-lock changes logged in audit trail
- Service role key never exposed to client
- JWT-based auth with automatic token refresh

---

## Testing

52 E2E tests with Playwright:
- Landing page (hero, stats, FAQ, comparison, about)
- Authentication (login, signup, SSO, demo accounts, auth guard)
- Employee flows (dashboard, goals, add goal, dropdowns, check-ins, notifications, accessibility)
- Manager flows (dashboard, team, approvals, check-ins, shared goals, announcements)
- Admin flows (dashboard, employees, cycles, escalations, reports, analytics, audit, settings)
- Mobile responsive (375px viewport)

Run: `npx playwright test`

---

## Setup Instructions

```bash
git clone https://github.com/Arpit-oo/bergspace.git
cd bergspace
npm install
cp .env.example .env.local
# Fill in Supabase URL, keys, Telegram token, OpenAI key, SMTP credentials
npm run dev
```

---

## Built By

**Arpit Walia**
- CS Engineering, Thapar Institute (CGPA: 8.88)
- Samsung PRISM Intern | MLSC Management Lead
- [LinkedIn](https://linkedin.com/in/arpit-walia) | [GitHub](https://github.com/Arpit-oo) | arpit13walia@gmail.com

Made with love for ATOMQUEST Hackathon 1.0
