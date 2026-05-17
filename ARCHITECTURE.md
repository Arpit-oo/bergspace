# BergSpace — Architecture

## Tech Stack
- **Frontend:** Next.js 16 (App Router), TypeScript, Tailwind CSS
- **UI:** shadcn/ui (Base UI), Plus Jakarta Sans, Caveat, DM Mono
- **Charts:** Recharts
- **Backend:** Supabase (PostgreSQL 17, Auth, RLS, Edge Functions)
- **AI:** OpenAI GPT-4o-mini (SMART goal validation)
- **Bot:** Telegram Bot API
- **Deploy:** Vercel
- **Region:** ap-south-1 (Mumbai)

## Directory Structure
```
src/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── layout.tsx                  # Root layout (fonts, toaster)
│   ├── middleware.ts               # Auth middleware
│   ├── auth/
│   │   ├── login/page.tsx          # Login (email + Microsoft SSO)
│   │   └── signup/page.tsx         # Registration
│   ├── api/
│   │   ├── auth/callback/          # OAuth callback
│   │   ├── telegram/               # Bot webhook + setup + link codes
│   │   ├── validate-goals/         # AI SMART validator
│   │   ├── shared-goals/push/      # Shared goals (admin client)
│   │   └── notifications/teams/    # Teams webhook sender
│   └── dashboard/
│       ├── layout.tsx              # Dashboard shell wrapper
│       ├── page.tsx                # Role-based dashboard home
│       ├── goals/                  # Employee goal CRUD
│       ├── my-checkins/            # Employee check-in logging
│       ├── team/                   # Manager team overview
│       ├── approvals/              # Manager approval workflow
│       ├── checkins/               # Manager check-in review
│       ├── shared-goals/           # Shared goal templates
│       ├── employees/              # Admin employee directory + editor
│       ├── cycles/                 # Admin goal cycle management
│       ├── escalations/            # Admin escalation rules + log
│       ├── reports/                # Reports + CSV/Excel export
│       ├── analytics/              # Charts + dashboards
│       ├── audit/                  # Audit trail viewer
│       ├── notifications/          # In-app notifications
│       ├── accessibility/          # Accessibility settings
│       └── settings/               # Admin SSO + integrations config
├── components/
│   ├── dashboard/shell.tsx         # Sidebar + topbar layout
│   ├── goals/                      # Goal sheet view + SMART validator
│   ├── manager/                    # Team, approvals, checkins views
│   ├── admin/                      # Employees, cycles, escalations, settings
│   ├── reports/                    # Report tables + charts
│   ├── analytics/                  # Analytics charts
│   ├── shared-goals/               # Shared goal management
│   └── ui/                         # shadcn + custom components
├── lib/
│   ├── supabase/                   # Client, server, admin, middleware
│   ├── types.ts                    # TypeScript interfaces
│   ├── constants.ts                # Business rules
│   ├── telegram.ts                 # Bot API helpers
│   ├── telegram-notify.ts          # High-level notification senders
│   ├── notifications.ts            # Teams webhook + notification helpers
│   └── ai-validator.ts            # OpenAI SMART goal validation
└── scripts/
    └── seed-users.ts               # Demo data seeding
```

## Database (15 tables)
profiles, departments, thrust_areas, goal_cycles, goal_sheets, goals,
shared_goal_templates, achievements, checkins, audit_log,
escalation_rules, escalation_log, notifications,
telegram_links, telegram_link_codes

## Security
- Row Level Security on every table (45+ policies)
- Employees see own data, managers see team, admins see all
- Post-approval goals locked (is_locked flag)
- All post-lock changes audit-logged
- Service role key never exposed to client

## Key Flows
1. Goal: Create → Validate (AI) → Submit → Approve/Return → Lock → Check-in
2. Shared: Template → Push to employees → Read-only title → Achievement sync
3. Escalation: Rules → Threshold check → Chain notification
4. Telegram: Link account → Receive notifications → Approve/Check-in inline
