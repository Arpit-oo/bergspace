# BergSpace — Goal Setting & Tracking Portal

> Built for **ATOMQUEST Hackathon 1.0** by Atomberg

**Live Demo:** [atomquest-sand.vercel.app](https://atomquest-sand.vercel.app)

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Employee | employee@bergspace.com | demo123456 |
| Manager | manager@bergspace.com | demo123456 |
| Admin | admin@bergspace.com | demo123456 |

## What is BergSpace?

A structured, digital Goal Setting & Tracking Portal that supports the full lifecycle of employee goals — from creation and alignment to quarterly check-ins and performance visibility.

## Core Features (Must-Have)

### Phase 1 — Goal Creation & Approval
- Employee-facing goal sheet with Thrust Area, UoM (Numeric/Percentage/Timeline/Zero-based), targets, and weightage
- System-enforced validation: total weightage = 100%, minimum 10% per goal, max 8 goals
- Manager (L1) approval workflow: review, inline edit targets/weightages, approve or return with reason
- Goals locked on approval — no edits without Admin intervention
- Shared Goals: Admin/Manager push KPI to employees, recipients adjust weightage only, achievement syncs via DB trigger

### Phase 2 — Achievement Tracking & Check-ins
- Quarterly achievement logging (actual vs planned) within configurable check-in windows
- Status per goal: Not Started / On Track / Completed
- Manager check-in module with structured comments and system-computed progress scores
- Configurable quarterly windows with presets (Calendar Year, Fiscal Apr-Mar, Custom)

### Reporting & Governance
- Achievement Report: exportable CSV/Excel
- Completion Dashboard: real-time check-in completion status
- Audit Trail: every post-lock change logged (who, what, when, old/new value)

## Bonus Features

### Microsoft Entra ID (Azure AD) SSO
- Single Sign-On via Microsoft accounts
- Admin assigns roles/departments/managers to SSO users

### Microsoft Teams Integration
- Adaptive card notifications via webhook for goal submissions, approvals, and returns
- Deep-link support to relevant portal pages

### Telegram Bot (@BergSpacebot)
- Account linking via portal-generated codes
- Actionable inline keyboard: managers can Approve/Return directly from Telegram
- Employees can update check-in status with one tap
- `/status` command shows current goals

### AI SMART Goal Validator
- Pre-submission AI evaluation against SMART criteria
- Suggests rewritten goals for vague submissions
- Powered by OpenAI GPT-4o-mini

### Escalation Module
- Configurable rules (N days no submission / no approval / missed check-in)
- Escalation chain: Employee → Manager → Skip-level → HR
- Intervention dashboard: bottleneck managers, department health heatmap

### Analytics Module
- QoQ achievement trends, goal distribution, department completion rates
- Manager effectiveness dashboard
- Donut charts, bar charts, line charts

### Additional
- Role-based dashboards (Employee/Manager/Admin)
- Accessibility settings (text size, reduce animations, high contrast)
- Mobile responsive (hamburger sidebar, stacking layouts)
- Email notification scaffold

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS |
| UI | shadcn/ui, Plus Jakarta Sans, Caveat, DM Mono |
| Charts | Recharts |
| Export | SheetJS (xlsx) |
| Backend | Supabase (PostgreSQL 17, Auth, Row Level Security) |
| AI | OpenAI GPT-4o-mini |
| Bot | Telegram Bot API |
| Auth | Supabase Auth + Microsoft Entra ID |
| Deploy | Vercel |

## Setup

```bash
git clone https://github.com/Arpit-oo/bergspace.git
cd bergspace
npm install
cp .env.example .env.local
# Fill in keys
npm run dev
```

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for full system architecture, directory structure, security model, and key flows.

---

Built by **Arpit Walia** | [LinkedIn](https://linkedin.com/in/arpit-walia) | [GitHub](https://github.com/Arpit-oo)

Made with love for ATOMQUEST Hackathon 1.0
