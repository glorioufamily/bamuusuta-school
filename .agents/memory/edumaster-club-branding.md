---
name: EduMaster Club & Branding Extension
description: Architecture decisions for the club accounts, school branding, and communication system added to EduMaster 360.
---

## Club Accounts
- Clubs are stored in `clubsTable` (lib/db/src/schema/clubs.ts)
- Each club gets a user in `usersTable` with `role="club"` and `linkedId` pointing to the club row
- Club announcements are identified by `authorId` matching the club's userId; `clubId` on the announcement is set from `user.linkedId`
- The `enrichAnnouncement` function in announcements.ts detects role="club" and looks up club name + logoUrl via linkedId

## School Branding
- Single-row table `schoolBrandingTable`; GET always returns (fallback defaults if empty)
- PATCH does upsert: updates existing row or inserts new one
- Frontend: `BrandingContext` wraps the whole app (inside AuthProvider) and provides `useBranding()` hook

## App.tsx Layout Pattern
- Added `ProtectedLayout` wrapper component that combines `<ProtectedRoute>` + `<AppLayout>`
- ALL protected routes use `<ProtectedLayout>` — this was missing before and caused no sidebar
- Public routes (/, /login) do NOT use ProtectedLayout

**Why:** Previously the App.tsx had no AppLayout wrapping at all. Adding ProtectedLayout ensures all logged-in views have the sidebar with branding.

## New Role: "club"
- Added "club" to User.role enum in openapi.yaml
- Club login redirects to /club-dashboard (handled in AppLayout nav items)
- Clubs can only: create/edit/delete their own announcements; cannot see students, staff, finance

## Key files
- DB schemas: lib/db/src/schema/branding.ts, clubs.ts (extended announcements.ts with 5 new fields)
- API routes: artifacts/api-server/src/routes/branding.ts, clubs.ts
- Frontend: BrandingContext.tsx, SchoolBrandingPage.tsx, ClubsManagementPage.tsx, ClubDashboardPage.tsx
- After any schema change: run `pnpm --filter @workspace/db run push-force` then `pnpm --filter @workspace/api-spec run codegen`
