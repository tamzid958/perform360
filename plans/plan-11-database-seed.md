# Plan 11 — Database Seed Data

> Comprehensive seed data for all models to enable local dev, demo UI, and test all flows.

## Problem

No `prisma/seed.ts` exists. The `db:seed` script is defined but has no target file or `prisma.seed` config. Developers cannot spin up a populated local database.

## Scope

### 1. Package Config
- [ ] Add `"prisma": { "seed": "npx tsx prisma/seed.ts" }` to `package.json`
- [ ] Add `tsx` as devDependency

### 2. Seed Script (`prisma/seed.ts`)

Idempotent script — cleans all tables, inserts fresh data, uses real encryption lib.

#### Data Inventory

**SuperAdmin** (1)
| Email | Name |
|-------|------|
| platform@perform360.com | Platform Admin |

**Companies** (2 tenants, each with encryption set up)
| Name | Slug | Passphrase |
|------|------|------------|
| Acme Corp | acme | acme-seed-passphrase-2026 |
| Globex Inc | globex | globex-seed-passphrase-2026 |

**Users** (7)
| Company | Name | Role | Email |
|---------|------|------|-------|
| Acme | Sarah Chen | ADMIN | sarah@acme.com |
| Acme | Mike Johnson | HR | mike@acme.com |
| Acme | Emily Davis | MANAGER | emily@acme.com |
| Acme | James Wilson | MEMBER | james@acme.com |
| Acme | Lisa Park | MEMBER | lisa@acme.com |
| Globex | Tom Brown | ADMIN | tom@globex.com |
| Globex | Anna White | MEMBER | anna@globex.com |

**AuthUsers** (7) — one per User for NextAuth magic link login

**Teams** (3)
| Company | Team | Members |
|---------|------|---------|
| Acme | Engineering | Emily (MANAGER), James (DIRECT_REPORT), Lisa (MEMBER) |
| Acme | Product | Sarah (MANAGER), Mike (MEMBER) |
| Globex | Operations | Tom (MANAGER), Anna (DIRECT_REPORT) |

**EvaluationTemplates** (3)
1. **360 Leadership Review** — global (`isGlobal: true`), 2 sections, 5 questions
2. **Quarterly Performance** — Acme, 2 sections, 5 questions
3. **Peer Feedback** — Globex, 1 section, 3 questions

**EvaluationCycles** (3)
| Company | Cycle | Status | Template |
|---------|-------|--------|----------|
| Acme | Q4 2025 Review | CLOSED | Acme Quarterly |
| Acme | Q1 2026 Review | ACTIVE | Global 360 Leadership |
| Globex | H1 2026 Review | DRAFT | Globex Peer Feedback |

**EvaluationAssignments** (~14)
- Acme Q4 CLOSED: 6 assignments, all SUBMITTED
- Acme Q1 ACTIVE: 6 assignments, mixed (PENDING/IN_PROGRESS/SUBMITTED)
- Globex H1 DRAFT: 2 assignments, all PENDING

**EvaluationResponses** — encrypted via `src/lib/encryption.ts`
- All SUBMITTED assignments get encrypted response JSON
- Answers match template section structure (rating scores, text feedback)

**OtpSessions** (2)
- 1 verified (active session for testing)
- 1 expired (for expiry handling)

**RecoveryCodes** (8 per company)
- Generated + hashed via `src/lib/encryption.ts` helpers
- Each stores data key re-encrypted with code-derived key

### 3. Execution Order in Seed

```
1. Clean tables (reverse dependency order)
2. SuperAdmin
3. Companies (encryption setup)
4. AuthUsers
5. Users
6. Teams + TeamMembers
7. EvaluationTemplates
8. EvaluationCycles
9. EvaluationAssignments
10. EvaluationResponses (encrypted)
11. OtpSessions
12. RecoveryCodes
13. Print summary + dev credentials
```

## Key Patterns

- Reuse `deriveKey()`, `generateDataKey()`, `encryptDataKey()`, `encrypt()` from `src/lib/encryption.ts`
- Reuse `generateRecoveryCodes()`, `hashRecoveryCode()` from same file
- Reuse `generateToken()` from `src/lib/tokens.ts`
- Template `sections` JSON matches the schema's `EvaluationTemplate.sections` structure
- `deleteMany()` in reverse FK order for idempotent re-runs

## Verification

```bash
npm install
npm run db:push
npm run db:seed    # should print summary + credentials
npm run db:studio  # verify all tables populated
npm run typecheck  # seed compiles cleanly
```

## Dependencies

- None — standalone, can run at any time
- Uses existing `src/lib/encryption.ts`, `src/lib/tokens.ts`
