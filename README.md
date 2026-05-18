# BergSpace — Goal Setting & Tracking Portal

> Built for **ATOMQUEST Hackathon 1.0** by Atomberg

**[Live Demo](https://atomquest-sand.vercel.app)** · **[Source Code](https://github.com/Arpit-oo/bergspace)**

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Employee | employee@bergspace.com | demo123456 |
| Manager | manager@bergspace.com | demo123456 |
| Admin | admin@bergspace.com | demo123456 |

Microsoft SSO also available on login page.

---

## Architecture

![BergSpace Architecture](./architecture.png)

---

## Features

### Core (Must-Have)
- Goal creation with weighted validation (100% total, 10% min, 8 max)
- Thrust areas, UoM (Numeric/Percentage/Timeline/Zero-based)
- Manager approval workflow (approve, inline edit, return with reason)
- Goal locking on approval + admin unlock
- Shared goals (push KPI, read-only title/target, achievement sync via DB trigger)
- Quarterly check-ins (actual vs planned, configurable windows)
- Manager check-in module (structured comments, progress scores)
- Reports with CSV/Excel export
- Completion dashboard
- Audit trail (human-readable, every post-lock change)

### Bonus
- **Microsoft Entra ID SSO** — multi-tenant, any Microsoft account
- **Email notifications** — Gmail SMTP, 6 event types, branded HTML
- **Microsoft Teams** — adaptive card webhooks for all events
- **Telegram Bot (@BergSpacebot)** — approve/return from chat, one-tap check-ins
- **Escalation module** — configurable rules, chain, intervention dashboard
- **Analytics** — QoQ trends, donut charts, bar charts, manager effectiveness

### Beyond Requirements
- AI SMART Goal Validator (OpenAI GPT-4o-mini, sequential S-M-A-R-T animation)
- Broadcast/Announcement system (multi-channel: in-app + email + Telegram)
- Role selection for SSO users
- Admin employee editor (assign roles, departments, managers)
- Accessibility settings (font size, reduce animations, high contrast)
- Mobile responsive
- 52 E2E tests (Playwright)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, TypeScript, Tailwind, shadcn/ui, Recharts |
| Backend | Supabase (PostgreSQL 17, Auth, RLS) |
| AI | OpenAI GPT-4o-mini |
| Bot | Telegram Bot API |
| Email | Nodemailer + Gmail SMTP |
| Auth | Supabase Auth + Microsoft Entra ID |
| Deploy | Vercel |
| Tests | Playwright (52 E2E) |

---

## Setup

```bash
git clone https://github.com/Arpit-oo/bergspace.git
cd bergspace
npm install
cp .env.example .env.local
# Fill in keys
npm run dev
```

## Testing

```bash
npx playwright test
# 52 tests covering all roles, pages, features
```

---

## Database

15 tables · 45+ RLS policies · 4 DB triggers

Key triggers: auto profile creation on signup, shared goal achievement sync, weighted progress score computation.

---

Built by **Arpit Walia** · [LinkedIn](https://linkedin.com/in/arpit-walia) · [GitHub](https://github.com/Arpit-oo)

Made with love for ATOMQUEST Hackathon 1.0
