# Plan 01 — API Foundation (Real Prisma Queries)

> Replace all mock/hardcoded API responses with real database operations.

## Problem

Almost every API route currently returns mock data or empty arrays with comments like "In production: fetch from prisma". No CRUD operations actually persist.

## Scope

### 1. Cycles API (`/api/cycles/`)
- [ ] `GET /api/cycles` — Query `EvaluationCycle` with `companyId` from session, include template + assignment counts
- [ ] `POST /api/cycles` — Create cycle in DB with Zod validation (name, templateId, startDate, endDate)
- [ ] `GET /api/cycles/[id]` — Fetch cycle by ID with assignments, template, and response stats
- [ ] `PATCH /api/cycles/[id]` — Update cycle (status, dates, name) with ownership check
- [ ] `DELETE /api/cycles/[id]` — Delete cycle (DRAFT only), cascade delete assignments

### 2. Teams API (`/api/teams/`)
- [ ] `GET /api/teams` — Query `Team` with `companyId`, include member counts by role
- [ ] `POST /api/teams` — Create team in DB with Zod validation
- [ ] `GET /api/teams/[id]` — Fetch team with all members (include User relation)
- [ ] `PATCH /api/teams/[id]` — Update team name/description
- [ ] `DELETE /api/teams/[id]` — Delete team + cascade TeamMember records
- [ ] `POST /api/teams/[id]/members` — Add member with role validation
- [ ] `DELETE /api/teams/[id]/members/[uid]` — Remove member

### 3. Templates API (`/api/templates/`)
- [ ] `GET /api/templates` — Query company templates + global templates (`isGlobal: true`)
- [ ] `POST /api/templates` — Create template with proper `sections` JSON validation (not `z.any()`)
- [ ] `GET /api/templates/[id]` — Fetch template by ID
- [ ] `PATCH /api/templates/[id]` — Update template
- [ ] `DELETE /api/templates/[id]` — Delete template (only if not used in active cycles)

### 4. Users API (`/api/users/`)
- [ ] `GET /api/users` — Query `User` with `companyId`, include team memberships
- [ ] `POST /api/users/invite` — Create user in DB + create AuthUser + send magic link email
- [ ] `PATCH /api/users/[id]` — Update user role (RBAC check: only ADMIN can change roles)
- [ ] `DELETE /api/users/[id]` — Soft-delete / deactivate user

### 5. Dashboard Stats (`/api/dashboard/stats`)
- [ ] Real counts: active cycles, total teams, pending evaluations, completion rate
- [ ] Recent activity feed from real data

## Key Patterns

```typescript
// Every route must:
// 1. Authenticate via getAuthenticatedUser()
// 2. Scope queries to user.companyId
// 3. Validate input with Zod
// 4. Return consistent ApiResponse<T> shape
// 5. Handle errors with proper status codes
```

## Files to Modify

- `src/app/api/cycles/route.ts`
- `src/app/api/cycles/[id]/route.ts`
- `src/app/api/teams/route.ts`
- `src/app/api/teams/[id]/route.ts`
- `src/app/api/teams/[id]/members/route.ts`
- `src/app/api/teams/[id]/members/[uid]/route.ts`
- `src/app/api/templates/route.ts`
- `src/app/api/templates/[id]/route.ts`
- `src/app/api/users/route.ts`
- `src/app/api/users/[id]/route.ts`
- `src/app/api/users/invite/route.ts`
- `src/app/api/dashboard/stats/route.ts`

## Dependencies

- `src/lib/prisma.ts` (exists)
- `src/lib/api-auth.ts` (exists — verify it returns companyId)
- `src/lib/permissions.ts` (exists — verify role checks)
