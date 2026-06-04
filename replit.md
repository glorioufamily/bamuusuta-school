# EduMaster 360

A full School Operating System — role-based ERP for Greenfield Academy covering admin, headteacher, DOS, teacher, bursar, student, and parent roles.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at /api)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — HMAC key for auth tokens

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite (port 20630, previewPath `/`)
- API: Express 5 (port 8080)
- DB: PostgreSQL + Drizzle ORM
- Auth: HMAC SHA-256 tokens (not JWT library) — key from SESSION_SECRET
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Charts: Recharts
- Animations: Framer Motion
- Routing: Wouter

## Where things live

- `lib/db/src/schema/` — all DB table definitions (users, students, teachers, classes, marks, attendance, fees, discipline, announcements, suggestions, notifications)
- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth for hooks)
- `lib/api-client-react/src/generated/` — generated Orval hooks & Zod schemas
- `lib/api-client-react/src/custom-fetch.ts` — fetch wrapper with setAuthTokenGetter support
- `artifacts/api-server/src/routes/` — all Express route handlers
- `artifacts/api-server/src/lib/auth.ts` — token creation/verification/middleware
- `artifacts/edumaster/src/` — React frontend
- `artifacts/edumaster/src/context/AuthContext.tsx` — auth state (localStorage keys: edumaster_token, edumaster_user)
- `artifacts/edumaster/src/lib/apiClient.ts` — calls setAuthTokenGetter on app init
- `artifacts/edumaster/src/pages/` — all 16 pages

## Architecture decisions

- Auth uses HMAC SHA-256 custom tokens (not jwt library) — secret from SESSION_SECRET env var. Fallback to hardcoded key only if env var missing.
- `@workspace/api-client-react` exports two subpaths: `"."` (hooks/schemas) and `"./custom-fetch"` (fetch internals + setAuthTokenGetter)
- Public endpoints (no auth): GET /api/announcements, GET /api/rankings/students, GET /api/rankings/classes
- All other API endpoints require `Authorization: Bearer <token>` header
- Seed script at `artifacts/api-server/src/seed.ts` — run with `npx tsx artifacts/api-server/src/seed.ts` to fix password hashes after truncating users table

## Demo Credentials

| Role        | Username    | Password     |
|-------------|-------------|--------------|
| Admin       | admin       | admin123     |
| Headteacher | headteacher | head123      |
| DOS         | dos         | dos123       |
| Teacher     | teacher1    | teacher123   |
| Bursar      | bursar      | bursar123    |
| Student     | student1    | student123   |
| Parent      | parent1     | parent123    |

## Product

- **Public Landing Page** — school news (announcements), top student rankings, class rankings
- **Admin/Headteacher Dashboard** — school health scores, at-risk student alerts, analytics trends, financial summary
- **Teacher Dashboard** — marks entry, attendance recording, student overview
- **Bursar Dashboard** — fees collection report, payment recording, outstanding balances
- **Student/Parent Dashboard** — personal profile, marks, fees balance, attendance history
- **All Modules**: Students, Teachers, Classes, Marks, Attendance, Fees, Discipline, Announcements, Suggestions, Analytics, Rankings

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- If you truncate the users table and re-seed, you MUST run the seed script (`npx tsx artifacts/api-server/src/seed.ts`) to re-hash passwords using the live SESSION_SECRET, not a hardcoded key
- `pnpm --filter @workspace/db run push` uses `drizzle-kit push` with `--config ./drizzle.config.ts`
- Do not use `pnpm run dev` at workspace root — start workflows individually

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
