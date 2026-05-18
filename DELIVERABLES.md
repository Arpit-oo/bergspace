# BergSpace — Submission Deliverables

## 1. Live Demo URL
**https://atomquest-sand.vercel.app**

## 2. Source Code Repository
**https://github.com/Arpit-oo/bergspace**

## 3. Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Employee | employee@bergspace.com | demo123456 |
| Manager | manager@bergspace.com | demo123456 |
| Admin | admin@bergspace.com | demo123456 |

Microsoft SSO available on login page.

## 4. Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                      │
│  Next.js 16 · TypeScript · Tailwind · shadcn/ui         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ Employee  │  │ Manager  │  │  Admin   │              │
│  │ Goals     │  │ Approvals│  │ Employees│              │
│  │ Check-ins │  │ Check-ins│  │ Cycles   │              │
│  │ Notifs    │  │ Reports  │  │ Analytics│              │
│  └──────────┘  └──────────┘  └──────────┘              │
├─────────────────────────────────────────────────────────┤
│                  API ROUTES (Server)                     │
│  /validate-goals · /telegram/webhook · /notifications    │
│  /shared-goals/push · /admin/delete-sheet               │
├─────────────────────────────────────────────────────────┤
│                SUPABASE (PostgreSQL 17)                   │
│  15 Tables · 45+ RLS Policies · Auth + SSO              │
│  Triggers: profile creation, achievement sync, scoring   │
├─────────────────────────────────────────────────────────┤
│               EXTERNAL INTEGRATIONS                      │
│  OpenAI (AI Validator) · Telegram Bot · Gmail SMTP       │
│  Microsoft Entra ID (SSO) · MS Teams (Webhooks)         │
├─────────────────────────────────────────────────────────┤
│                    DEPLOYMENT                            │
│  Vercel (Edge) · Supabase Cloud (ap-south-1)            │
└─────────────────────────────────────────────────────────┘
```

## 5. Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | Next.js 16, TypeScript, Tailwind, shadcn/ui, Recharts |
| Backend | Supabase (Postgres 17, Auth, RLS) |
| AI | OpenAI GPT-4o-mini |
| Bot | Telegram Bot API |
| Email | Nodemailer + Gmail SMTP |
| Auth | Supabase Auth + Microsoft Entra ID |
| Deploy | Vercel |
| Tests | Playwright (52 E2E tests) |

## 6. Built By

**Arpit Walia** · CS Engineering, Thapar Institute
[LinkedIn](https://linkedin.com/in/arpit-walia) · [GitHub](https://github.com/Arpit-oo)
