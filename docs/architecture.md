# Architecture

## Overview

Perform360 is a multi-tenant 360-degree performance evaluation SaaS platform. It uses Next.js App Router with route groups to separate concerns: `(auth)` for authentication, `(dashboard)` for the main app, `(public)` for OTP-gated evaluation forms, and `admin/` for the SaaS owner panel. Evaluation response data is encrypted at rest using envelope encryption — the SaaS owner has zero access to tenant data.

## Layer Diagram

```
                        ┌─────────────────────────────┐
                        │     Next.js App Router       │
                        │  (Route Groups + Layouts)    │
                        └──────────┬──────────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                     │
    ┌─────────▼──────┐  ┌─────────▼──────┐  ┌──────────▼─────┐
    │  Server Comps   │  │   API Routes   │  │  Client Comps  │
    │  (direct DB)    │  │  (REST + Zod)  │  │  (Zustand +    │
    │                 │  │                │  │   React Hook   │
    │                 │  │                │  │   Form)        │
    └────────┬────────┘  └───────┬────────┘  └────────────────┘
             │                   │
    ┌────────▼───────────────────▼────────┐
    │          lib/ (shared layer)        │
    │  auth · prisma · permissions ·      │
    │  encryption · otp · email · tokens  │
    └────────────────┬────────────────────┘
                     │
    ┌────────────────▼────────────────────┐
    │     Prisma ORM → PostgreSQL         │
    │  (multi-tenant, company-scoped)     │
    └─────────────────────────────────────┘
```

## Key Design Decisions

1. **Route groups for isolation** — `(auth)`, `(dashboard)`, `(public)`, `admin/` each have their own layout and auth requirements. No cross-contamination of auth logic.

2. **Dual auth model** — Dashboard users authenticate via NextAuth magic links (stored in `AuthUser` table). Evaluation reviewers authenticate via OTP-only tokens (stored in `OtpSession` table). No shared auth path.

3. **Envelope encryption** — Company admin sets a passphrase (Argon2id -> Master Key). Master Key encrypts a random AES-256 Data Key. Data Key encrypts evaluation responses. SaaS owner never holds the passphrase. Lost passphrase + lost recovery codes = permanent data loss by design.

4. **RBAC via helper functions** — `lib/permissions.ts` exports role-checking functions (`canViewReports`, `canManageCycles`, etc.). API routes use `lib/api-auth.ts` guards (`requireAuth`, `requireAdminOrHR`, `requireSuperAdmin`) that return `NextResponse` errors directly.

5. **Server Components by default** — Client components only used for interactivity (form builder, dropdowns). Dashboard layout fetches session server-side and redirects if unauthenticated.

6. **Zustand for complex client state** — Template builder uses Zustand for drag-and-drop state management. Simple forms use React Hook Form.

## Data Flow

### Dashboard Request (authenticated user)
```
Browser → Next.js route → Server Component
  → auth() session check → redirect if unauthenticated
  → prisma.query (scoped to companyId from session)
  → render RSC → stream HTML to client
```

### API Mutation (e.g., create team)
```
Client → POST /api/teams → requireAdminOrHR() guard
  → Zod schema validation
  → prisma.create (scoped to companyId)
  → return { success: true, data: team }
  → or { success: false, error: "..." }
```

### Evaluation Submission (public, OTP-gated)
```
Email link → GET /evaluate/{token} → validate token
  → OTP screen → POST /otp/send → email 6-digit code
  → POST /otp/verify → issue session cookie (2hr)
  → GET /evaluate/{token}/form → load questions
  → POST /evaluate/{token} → encrypt answers with company Data Key
  → store answersEncrypted + IV + tag → status SUBMITTED
```

## Tenant Isolation

Every query touching tenant data must include `companyId` from the authenticated session. The `companyId` is never accepted from the client — it's always derived from the session's `user.companyId` (set during NextAuth callback from the `User` table).

Super Admin routes (`/api/admin/*`) verify against the separate `SuperAdmin` table and can never access encrypted evaluation data.
