# Plan 07 — Super Admin Panel

> Complete the SaaS owner admin panel: companies CRUD, global templates, platform stats, impersonation.

## Problem

Super admin routes exist but return mock data. Admin UI pages exist but aren't wired to real APIs.

## Scope

### 1. Super Admin Auth
- [ ] Verify super admin authentication — must check `SuperAdmin` table, NOT `User` table
- [ ] Super admin sessions should be completely separate from company user sessions
- [ ] Middleware: `withSuperAdmin(handler)` that verifies the session user is in `SuperAdmin` table

### 2. Companies Management (`/api/admin/companies/`)
- [ ] `GET /api/admin/companies` — List all companies with user counts, active cycle counts, creation date
- [ ] `POST /api/admin/companies` — Create company manually (for enterprise onboarding)
- [ ] `PATCH /api/admin/companies/[id]` — Update company settings, status
- [ ] `DELETE /api/admin/companies/[id]` — Deactivate company (soft delete)

### 3. Global Templates (`/api/admin/templates/`)
- [ ] `GET /api/admin/templates` — List global templates (`isGlobal: true, companyId: null`)
- [ ] `POST /api/admin/templates` — Create global template
- [ ] `PATCH /api/admin/templates/[id]` — Update global template
- [ ] `DELETE /api/admin/templates/[id]` — Delete global template (only if not in use)

### 4. Platform Stats (`/api/admin/stats`)
- [ ] Total companies, total users, total active cycles
- [ ] MRR tracking (if billing data exists)
- [ ] Usage metrics: evaluations submitted this month, active users

### 5. Impersonation (`/api/admin/impersonate/[id]`)
- [ ] Create impersonation session for company admin
- [ ] Audit trail: log who impersonated, when, target company
- [ ] Time-limited impersonation sessions
- [ ] Clear visual indicator in UI when impersonating
- [ ] **Cannot access encrypted data** even when impersonating

### 6. Admin UI Pages
- [ ] `admin/page.tsx` — Dashboard with real platform stats
- [ ] `admin/companies/page.tsx` — Companies list with real data
- [ ] `admin/templates/page.tsx` — Global templates with real data

## Files to Modify/Create

- `src/app/api/admin/companies/route.ts` (rewrite)
- `src/app/api/admin/companies/[id]/route.ts` (rewrite)
- `src/app/api/admin/templates/route.ts` (rewrite)
- `src/app/api/admin/templates/[id]/route.ts` (rewrite)
- `src/app/api/admin/stats/route.ts` (rewrite)
- `src/app/api/admin/impersonate/[id]/route.ts` (rewrite)
- `src/lib/middleware/super-admin.ts` (new)
- Admin UI pages (wire up)

## Dependencies

- Plan 05 (auth system must be solid)
