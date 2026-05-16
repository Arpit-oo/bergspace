# BergSpace — Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (Browser)                      │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Next.js 16 App Router (SSR)              │   │
│  │                                                       │   │
│  │  ┌─────────────┐ ┌──────────────┐ ┌──────────────┐  │   │
│  │  │  Employee    │ │   Manager    │ │    Admin     │  │   │
│  │  │  Dashboard   │ │  Dashboard   │ │  Dashboard   │  │   │
│  │  ├─────────────┤ ├──────────────┤ ├──────────────┤  │   │
│  │  │• My Goals   │ │• Team Goals  │ │• All Users   │  │   │
│  │  │• My Checkins│ │• Approvals   │ │• Goal Cycles │  │   │
│  │  │• Notifs     │ │• Check-ins   │ │• Escalations │  │   │
│  │  │             │ │• Shared Goals│ │• Reports     │  │   │
│  │  │             │ │• Reports     │ │• Analytics   │  │   │
│  │  │             │ │              │ │• Audit Log   │  │   │
│  │  │             │ │              │ │• Settings    │  │   │
│  │  └─────────────┘ └──────────────┘ └──────────────┘  │   │
│  │                                                       │   │
│  │  UI: shadcn/ui + Tailwind CSS + Recharts             │   │
│  └──────────────────────────────────────────────────────┘   │
│                              │                               │
│                     Supabase JS Client                       │
│                    (@supabase/ssr)                           │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                    Supabase Platform                          │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Auth        │  │   PostgREST  │  │  Edge Functions  │  │
│  │              │  │   (Data API)  │  │  (Email/Webhooks)│  │
│  │• Email/Pass  │  │              │  │                   │  │
│  │• Entra SSO   │  │• Auto CRUD   │  │• Notification     │  │
│  │• JWT Tokens  │  │• RLS Enforced│  │  delivery         │  │
│  └──────┬───────┘  └──────┬───────┘  └───────────────────┘  │
│         │                 │                                   │
│         ▼                 ▼                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              PostgreSQL 17 Database                    │   │
│  │                                                       │   │
│  │  Tables:                                              │   │
│  │  ┌────────────┐ ┌──────────────┐ ┌────────────────┐  │   │
│  │  │ profiles   │ │ goal_sheets  │ │ goals          │  │   │
│  │  │ departments│ │ goal_cycles  │ │ achievements   │  │   │
│  │  │ thrust_    │ │ shared_goal_ │ │ checkins       │  │   │
│  │  │   areas    │ │   templates  │ │ audit_log      │  │   │
│  │  │            │ │              │ │ escalation_    │  │   │
│  │  │            │ │              │ │   rules/log    │  │   │
│  │  │            │ │              │ │ notifications  │  │   │
│  │  └────────────┘ └──────────────┘ └────────────────┘  │   │
│  │                                                       │   │
│  │  Security: Row Level Security (40+ policies)          │   │
│  │  Triggers: Auto profile creation, shared goal sync,   │   │
│  │            updated_at timestamps                       │   │
│  │  Functions: compute_progress_score()                   │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    External Integrations                      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Microsoft    │  │ Microsoft    │  │ Vercel           │  │
│  │ Entra ID     │  │ Teams        │  │ (Hosting)        │  │
│  │ (SSO)        │  │ (Webhooks)   │  │                  │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 16 (App Router) | SSR, routing, server components |
| UI | shadcn/ui + Tailwind CSS | Component library + styling |
| Charts | Recharts | Analytics dashboards |
| Export | SheetJS (xlsx) | CSV/Excel report generation |
| Auth | Supabase Auth | Email/password + Entra SSO |
| Database | PostgreSQL 17 (Supabase) | Data storage with RLS |
| API | PostgREST (Supabase) | Auto-generated REST API |
| Hosting | Vercel | Edge deployment |
| Region | ap-south-1 (Mumbai) | Low latency for India |

## Data Flow

### Goal Lifecycle
```
Employee creates goal sheet (Draft)
    → Fills goals with weightage validation (sum=100%, min 10%, max 8)
    → Submits for approval (Submitted) → Manager notified
    → Manager reviews:
        ├─ Approves → Sheet locked, goals immutable (Approved)
        └─ Returns with reason → Employee edits (Returned → Draft)
    → Admin can unlock if needed (Audit logged)
```

### Shared Goal Flow
```
Admin/Manager creates shared goal template
    → Pushes to selected employees
    → Creates goals on their sheets (is_from_shared=true)
    → Recipients can only modify weightage
    → Primary owner's achievement syncs to all linked goals (DB trigger)
```

### Quarterly Check-in Flow
```
Admin configures quarterly windows (open/close dates)
    → Window opens → Employees log actual vs planned
    → Manager reviews planned vs actual
    → Manager adds structured check-in comment
    → System computes progress score (weighted by goal weightage)
```

## Security Model

- **Row Level Security (RLS)** on every table
- Employees see only their own data
- Managers see their direct reports' data
- Admins see all data
- Post-approval goals are immutable (locked via `is_locked` flag)
- All post-lock changes logged in `audit_log`
- Service role key never exposed to client (`SUPABASE_SERVICE_ROLE_KEY` server-only)
- JWT-based auth with automatic token refresh
