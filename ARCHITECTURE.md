# BergSpace — Architecture

## System Architecture
![System Architecture](./architecture.png)

## Entity Relationship Diagram
![ER Diagram](./docs/architecture-er.png)

## Goal Lifecycle Sequence
![Sequence Diagram](./docs/architecture-sequence.png)

## Combined View
![Combined](./docs/architecture-combined.png)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind |
| UI | shadcn/ui, Plus Jakarta Sans, Caveat, DM Mono |
| Charts | Recharts |
| Export | SheetJS (xlsx) |
| Backend | Supabase (PostgreSQL 17, Auth, RLS) |
| AI | OpenAI GPT-4o-mini |
| Bot | Telegram Bot API |
| Email | Nodemailer + Gmail SMTP |
| Auth | Supabase Auth + Microsoft Entra ID |
| Deploy | Vercel |

## Database

15 tables · 45+ RLS policies · 4 DB triggers

## Security

- Row Level Security on every table
- Employees see own data, managers see team, admins see all
- Post-approval goals locked
- All post-lock changes audit-logged
- Service role key server-only
