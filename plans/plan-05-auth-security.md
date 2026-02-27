# Plan 05 — Auth, RBAC & Security Hardening

> Fix authentication bugs, add company isolation middleware, enforce RBAC, add rate limiting.

## Problem

- Session callback queries User by email alone (not unique — `@@unique([email, companyId])`)
- No company isolation middleware — routes don't verify resource ownership
- RBAC checks are manual and inconsistent across routes
- No rate limiting on any endpoint
- No audit logging

## Scope

### 1. Fix NextAuth Session Bug
- [ ] `src/lib/auth.ts` — Session callback: when querying User by email, also filter by the Account's linked company or use AuthUser → User mapping
- [ ] Ensure session object includes `companyId`, `role`, and `userId` (company-scoped)
- [ ] Handle edge case: same email in multiple companies

### 2. Company Isolation Middleware
- [ ] Create `src/lib/middleware/company-scope.ts`
- [ ] Every dashboard API route must verify requested resource belongs to `session.user.companyId`
- [ ] Pattern: wrap route handlers with `withCompanyScope(handler)`
- [ ] Reject cross-company access with 403

### 3. RBAC Middleware
- [ ] Create `src/lib/middleware/rbac.ts`
- [ ] Define route-level permission requirements
- [ ] Pattern: `withRBAC(handler, { requiredRoles: ['ADMIN', 'HR'] })`
- [ ] Apply to all routes per the permissions matrix in CLAUDE.md:
  - Reports: ADMIN, HR only
  - Cycle management: ADMIN, HR only
  - Team management: ADMIN, HR only
  - User management: ADMIN only
  - Encryption settings: ADMIN only

### 4. Rate Limiting
- [ ] Create `src/lib/rate-limit.ts` with in-memory store (or Redis if available)
- [ ] OTP sends: 5 per email per hour
- [ ] OTP verifies: 3 attempts per session
- [ ] API calls: 100 per minute per IP
- [ ] Return 429 Too Many Requests with `Retry-After` header

### 5. Input Validation Hardening
- [ ] Replace all `z.any()` usages with proper schemas
- [ ] Add Zod schemas for template `sections` JSON structure
- [ ] Validate all URL params (cycleId, teamId, etc.) are valid cuid format

### 6. Audit Logging
- [ ] Create `AuditLog` Prisma model (or use JSON append to company settings)
- [ ] Log: decryption events, role changes, user invitations, cycle activations
- [ ] `GET /api/audit-log` — ADMIN only

## Files to Modify/Create

- `src/lib/auth.ts` (fix session callback)
- `src/lib/middleware/company-scope.ts` (new)
- `src/lib/middleware/rbac.ts` (new)
- `src/lib/rate-limit.ts` (new)
- All API route files (apply middleware)
- `prisma/schema.prisma` (add AuditLog model if needed)

## Dependencies

- None — can be done in parallel with other plans
