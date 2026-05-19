# darceflow

Gym management for Brazilian Jiu-Jitsu academies. Multi-tenant SaaS covering
memberships, attendance, belt progression, class scheduling, technique library,
and Stripe billing.

## Stack

- **Next.js 16** (App Router, Turbopack, async `params` / `cookies` / `headers`,
  `proxy.ts` replacing `middleware.ts`)
- **React 19**
- **TypeScript 5** (strict)
- **Tailwind CSS v4** (CSS-first config, `@theme inline`, `@custom-variant dark`)
- **shadcn/ui** (base-nova preset)
- **Prisma 7** with the **Neon serverless driver adapter**
- **Auth.js v5** (next-auth beta) with Prisma adapter — wired in Phase 2
- **PostgreSQL** on [Neon](https://neon.tech)

## Prerequisites

- Node.js 22 (see `.nvmrc`)
- A free [Neon](https://neon.tech) project (Postgres host)

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy environment template and fill it in
cp .env.example .env
#    Required:
#    - DATABASE_URL  — Neon pooled connection (the URL with `-pooler`)
#    - DIRECT_URL    — Neon direct connection (for migrations)
#    - AUTH_SECRET   — generate with `openssl rand -base64 32`

# 3. Generate the Prisma client and run the initial migration
npm run db:generate
npm run db:migrate

# 4. (Optional) Seed a demo gym and admin user
npm run db:seed
#    Logs in as admin@darceflow.test / admin1234 once Phase 2 is in.

# 5. Start the dev server
npm run dev
```

App runs at <http://localhost:3000>.

## Scripts

| Command              | What it does                                          |
| -------------------- | ----------------------------------------------------- |
| `npm run dev`        | Start the Next.js dev server (Turbopack)              |
| `npm run build`      | Production build                                      |
| `npm run start`      | Run the production build                              |
| `npm run lint`       | ESLint (flat config)                                  |
| `npm run typecheck`  | `tsc --noEmit`                                        |
| `npm run db:generate`| Generate the Prisma client into `lib/generated/prisma`|
| `npm run db:migrate` | Run a `prisma migrate dev`                            |
| `npm run db:push`    | Push schema without creating a migration              |
| `npm run db:studio`  | Open Prisma Studio                                    |
| `npm run db:seed`    | Run `prisma/seed.ts`                                  |

## Architecture

```
app/
  (marketing)/   Public landing — header, footer, hero, feature grid
  (auth)/        Sign-in / sign-up (Phase 2)
  (dashboard)/   Protected app shell (Phase 2+)
components/
  ui/            shadcn primitives
  layout/        Header, footer, theme toggle, brand
  marketing/     Landing-page sections
lib/
  db.ts          Prisma client singleton (Neon adapter)
  auth.ts        Auth.js v5 wrapper (stub until Phase 2)
  db/scoped.ts   Tenant-scoped data access (stub until Phase 2)
  utils.ts       `cn()` helper
  generated/     Generated Prisma client (gitignored)
prisma/
  schema.prisma  Gym, User, Auth.js adapter tables
  seed.ts        Demo gym + admin
```

Multi-tenancy uses a **shared DB with a `gymId` column** on every tenant table.
Phase 2 introduces the scoped data-access wrapper that auto-applies `gymId`
from the session to every query.

## Roadmap

- [x] **Phase 1** — Project foundation, UI shell, dark mode, Prisma schema
- [ ] **Phase 2** — Auth.js v5, role-based protected routes (`proxy.ts`)
- [ ] **Phase 3** — Admin / coach gym dashboard
- [ ] **Phase 4** — Athlete profiles (belts, stripes, record, injuries)
- [ ] **Phase 5** — Attendance, streaks, weekly heatmaps, analytics
- [ ] **Phase 6** — Class booking, waitlists, recurring schedules
- [ ] **Phase 7** — Technique video library
- [ ] **Phase 8** — Stripe memberships, invoices, webhooks

## Conventions

- Conventional Commits (`feat:`, `fix:`, `chore:`, `feat(scope):`)
- Server Components by default; `'use client'` only where needed
- Server Actions for mutations (`'use server'`)
- `proxy.ts` (project root) replaces `middleware.ts` in Next.js 16
- `params` and `searchParams` are `Promise<T>` — always `await` them
- `cookies()` and `headers()` are async — always `await` them
