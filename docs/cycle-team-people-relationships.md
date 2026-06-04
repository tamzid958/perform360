# Cycle · Team · People Relationships

## Overview

The system has **two user models**, a **team hierarchy** with role-based evaluation directions, and **evaluation cycles** that lock in team-template assignments at DRAFT time. Reviewers authenticate via OTP to access evaluations, not via dashboard login.

---

## 1. Two-User Model

| Model | Table | Key Field | Can log in via `/login`? | Purpose |
|-------|-------|-----------|--------------------------|---------|
| `AuthUser` | `auth_users` | `email` (`@unique`) | Yes | NextAuth identity — magic link sessions |
| `User` | `users` | `@@unique([email, companyId])` | Only ADMIN/HR | App business logic — role, company, teams |

`User.authUserId` is an optional FK to `AuthUser.id`. Only ADMIN and HR users get an `AuthUser` record. EMPLOYEE and EXTERNAL users exist **only** in the `User` table and **cannot** use the dashboard login flow.

---

## 2. Team Structure

```
Company (singleton)
  ├── User (role: ADMIN / HR / EMPLOYEE / EXTERNAL)
  ├── Team
  │     └── TeamMember (links User ↔ Team)
  │           ├── role: MANAGER | MEMBER | EXTERNAL | IMPERSONATOR
  │           └── levelId → Level (optional)
  └── Level (unique per [companyId, name])
```

### Team Member Roles (`TeamMemberRole`)

| Role | Is a subject? | Reviews | Is reviewed by |
|------|---------------|---------|----------------|
| `MANAGER` | Yes | MEMBERs (DOWNWARD) | MEMBERs (UPWARD), peers (LATERAL) |
| `MEMBER` | Yes | MANAGERs (UPWARD), peers (LATERAL), self (SELF) | MANAGERs (DOWNWARD), peers (LATERAL) |
| `EXTERNAL` | No | All MANAGERs + MEMBERs | Nobody |
| `IMPERSONATOR` | No | Takes over specific directions for another user | Nobody |

Only MANAGER and MEMBER are "subjects" — they receive evaluations. EXTERNAL and IMPERSONATOR are reviewers-only (see `src/lib/cycle-subjects.ts`).

---

## 3. Evaluation Templates

```
EvaluationTemplate
  ├── levelIds: string[]  — empty = wildcard (all levels)
  ├── sections: JSON      — array of { id, title, description?, directions[], questions[] }
  │                          empty directions = applies to all directions
  ├── weightPreset         — equal | supervisor_focus | peer_focus | custom
  ├── weightsMember        — per-direction weights for MEMBER reviewers
  ├── weightsManager       — per-direction weights for MANAGER reviewers
  ├── isGlobal             — available to all companies? (first-user onboarding templates)
  └── versions → EvaluationTemplateVersion[] (append-only history)
```

### Template Routing

When generating assignments, the system picks the **most specific template** for each subject based on their level (`src/lib/template-routing.ts`):

1. Filter templates that match the subject's level (or have empty `levelIds`)
2. Among those, prefer templates with non-empty `levelIds` (specific > wildcard)
3. Within the candidates, pick the first one that has at least one section matching the assignment's direction
4. If no template matches → skip the assignment entirely

---

## 4. Cycle Lifecycle

```
DRAFT ──────────────────→ ACTIVE ────────────→ CLOSED ──→ ARCHIVED
  │                         │                     ↑
  │   (lock assignments)    │  (auto-close:       │
  │                         │   past deadline     │
  │                         │   or 100% done)     │
  └──────────────────────────────────────────────┘ (reopen with new end date)
```

Allowed transitions (`src/app/api/cycles/[id]/route.ts:29-34`):

| From | To | Conditions |
|------|----|------------|
| `DRAFT` | `ACTIVE` | Via `POST /api/cycles/[id]/activate` — requires encryption setup, admin data key, at least one assignment |
| `ACTIVE` | `CLOSED` | Via PATCH or auto-close job |
| `CLOSED` | `ACTIVE` | Via PATCH — requires a new end date (today or future) |
| `CLOSED` | `ARCHIVED` | Via PATCH |
| `ARCHIVED` | — | No transitions allowed |

---

## 5. Cycle ↔ Team ↔ Template

When a cycle is created/edited in **DRAFT**, you assign teams and templates via:

```
EvaluationCycle
  ├── cycleTeams → CycleTeam (unique per [cycleId, teamId])
  │     └── templates → CycleTeamTemplate (unique per [cycleTeamId, templateId])
  │           └── EvaluationTemplate
  ├── assignments → EvaluationAssignment[] (generated from teams + templates)
  ├── reviewerLinks → CycleReviewerLink[] (created at activation)
  └── calibrations → CalibrationAdjustment[]
```

**Team-template assignments are locked once the cycle leaves DRAFT** (`src/app/api/cycles/[id]/route.ts:218-224`):

```ts
if (validated.teamTemplates && existing.status !== "DRAFT") {
  return errorResponse(
    "Team-template assignments can only be changed while cycle is in DRAFT",
    ...
  );
}
```

---

## 6. Assignment Generation

When a cycle is saved in DRAFT, `createAssignmentsForCycle()` in `src/lib/assignments.ts` generates `EvaluationAssignment` records:

```
EvaluationAssignment {
  cycleId,    → EvaluationCycle
  templateId, → EvaluationTemplate (routed by subject level)
  subjectId,  → User (who is being evaluated)
  reviewerId, → User (who fills the form)
  direction,  → Direction
  token,      → unique CUID (used in direct evaluation links)
  status      → PENDING | IN_PROGRESS | SUBMITTED
}
```

Each assignment is unique per `[cycleId, subjectId, reviewerId, templateId, direction]` (deduplicated across teams).

### Direction Rules

For each team with assigned templates, the system generates:

| Direction | Rule | Who reviews whom |
|-----------|------|-----------------|
| `DOWNWARD` | Each MANAGER → each MEMBER | Manager evaluates direct reports |
| `UPWARD` | Each MEMBER → each MANAGER | Member evaluates their manager |
| `LATERAL` | MEMBER ↔ MEMBER (excluding self), MANAGER ↔ MANAGER (excluding self) | Peer evaluations |
| `SELF` | Each non-EXTERNAL, non-IMPERSONATOR member evaluates themselves | Self-evaluation |
| `EXTERNAL` | Each EXTERNAL → all MANAGERs + all MEMBERs | External reviews everyone |
| `IMPERSONATOR` | Takes over specified directions on behalf of another | Substitutes for a manager/member |

### Impersonator Override

IMPERSONATOR members have `impersonatorDirections: Direction[]`. If set, the system **skips** those directions for regular members and routes them through the impersonator instead. SELF is never delegated.

---

## 7. Activation Flow (DRAFT → ACTIVE)

### Synchronous (`POST /api/cycles/[id]/activate`)

1. Validates cycle is DRAFT
2. Checks encryption is set up
3. Requires admin's decrypted data key (from passphrase entry)
4. Caches encrypted data key on the cycle (for submission encryption without passphrase)
5. Updates status to `ACTIVE`
6. Enqueues a `cycle.activate` job
7. Writes audit log

### Async Job (`handleCycleActivate` in `src/lib/jobs/cycle.ts`)

1. Fetches all assignments for the cycle
2. Groups by reviewer
3. For each reviewer, **upserts** a `CycleReviewerLink`:
   ```
   CycleReviewerLink {
     cycleId,
     reviewerId,
     token (unique CUID, auto-generated)
   }
   ```
4. If company notification setting `evaluationInvitations` is enabled:
   - Builds a summary email with all subject-direction pairs
   - Enqueues an `email.send` job per reviewer with link: `{APP_URL}/review/{linkToken}`

### CLOSED → ACTIVE (Reopening)

Reopening via PATCH **only** changes the status and updates the end date. **No job is enqueued. No emails are sent. No new `CycleReviewerLink` records are created.** Existing links from the original activation remain valid. There is currently no mechanism to re-issue or resend review links.

---

## 8. Reviewer Access (OTP-Based)

EMPLOYEE and EXTERNAL users access evaluations exclusively through `CycleReviewerLink` tokens — they never visit `/login`.

```
Reviewer clicks review link: /review/{linkToken}
            │
            ▼
  GET /api/review/{linkToken}
    → Validates token, returns cycle name + masked email
            │
            ▼
  POST /api/review/{linkToken}/otp/send
    → Creates OtpSession (linked to reviewerLink)
    → Sends 6-digit OTP via email
            │
            ▼
  POST /api/review/{linkToken}/otp/verify
    → bcrypt.compare OTP hash
    → Sets sessionToken cookie (4-hour session)
            │
            ▼
  GET /review/{linkToken}/assignments
    → Lists all assignments for this reviewer in this cycle
            │
            ▼
  Click "Start" → /evaluate/{assignmentToken}/form
    → Assignment-level OTP verification (same flow)
    → Fills and submits evaluation form
```

### OTP Configuration (`src/lib/constants.ts`)

| Setting | Value |
|---------|-------|
| OTP length | 6 digits |
| OTP expiry | 10 minutes |
| Max failed attempts | 3 |
| Cooldown after max attempts | 15 minutes |
| Rate limit per email | 5 sends / hour |
| Session duration (post-verify) | 4 hours |

---

## 9. Invitation Flows

### Flow A: Invite to Organization (`/people` → `POST /api/users/invite`)

| Role | `AuthUser` created? | Welcome email sent? | Can use `/login`? | How they access system |
|------|--------------------|--------------------|-------------------|----------------------|
| ADMIN | Yes | Yes | Yes — magic link | Dashboard at `/overview` |
| HR | Yes | Yes | Yes — magic link | Dashboard at `/overview` |
| EMPLOYEE | **No** | **No** | **No** | Only via cycle review links |
| EXTERNAL | **No** | **No** | **No** | Only via cycle review links |

### Flow B: Evaluation Invitation (Cycle Activation)

Sent **once** during DRAFT → ACTIVE via the `cycle.activate` job. Each reviewer gets a summary email with their unique `CycleReviewerLink` URL. There is **no resend mechanism** — if a reviewer loses their link, an admin must manually extract the token from the database.

### Email Templates (`src/lib/email/templates.ts`)

| Template | When sent |
|----------|-----------|
| `getUserInviteEmail` | When ADMIN/HR is invited to the org (user_invite) |
| `getSummaryInviteEmail` | When a cycle is activated (to all reviewers) |
| `getSummaryReminderEmail` | When an admin sends reminders via cycle UI |
| `getEvaluationInviteEmail` | Per-assignment invitation (generated but unused as standalone? TBD) |
| `getEvaluationReminderEmail` | Per-assignment reminder |
| `getOTPEmail` | When reviewer requests OTP for evaluation access |
| `getMagicLinkEmail` | When ADMIN/HR requests dashboard login |

---

## 10. Key Gaps & Limitations

1. **No re-invite for review links.** If a reviewer loses their `CycleReviewerLink` URL, there is no UI to resend it. Only manual DB extraction of the token works.

2. **CLOSED → ACTIVE sends nothing.** Reopening a cycle does not re-trigger any email job or create new `CycleReviewerLink` records. Existing links continue to work.

3. **No retroactive invitations.** Employees added to teams after a cycle is ACTIVE have no `EvaluationAssignment` records and no `CycleReviewerLink`. Assignments are locked at DRAFT time.

4. **EMPLOYEE/EXTERNAL users have no dashboard.** They cannot see past cycles, aggregated results, or any settings. Their entire UI is bounded by evaluation forms accessed via review links.

5. **No welcome email for EMPLOYEE/EXTERNAL invites.** An invited employee receives nothing until a cycle is activated with them as a reviewer.

---

## 11. Entity Relationship Summary

```
Company (1)
  ├── User (*)          — people in the organization
  │     └── TeamMember (*)  — links user to team with role + level
  ├── Team (*)
  │     └── TeamMember (*)
  ├── EvaluationCycle (*)
  │     ├── CycleTeam (*)       — teams selected for this cycle
  │     │     └── CycleTeamTemplate (*) — templates assigned to each team
  │     ├── EvaluationAssignment (*) — (subject, reviewer, template, direction)
  │     │     ├── EvaluationResponse (0..1) — encrypted answers
  │     │     └── OtpSession (*)
  │     ├── CycleReviewerLink (*) — per-reviewer access token (per cycle)
  │     │     └── OtpSession (*)
  │     └── CalibrationAdjustment (*)
  ├── EvaluationTemplate (*)
  │     └── EvaluationTemplateVersion (*)
  ├── Level (*)
  └── AuditLog (*)

AuthUser (1) ??── (0..1) User   — via User.authUserId FK
```

---

## 12. Key Source Files

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | All models, enums, relations, indexes |
| `src/lib/assignments.ts` | Assignment generation from teams + templates |
| `src/lib/template-routing.ts` | Template selection by subject level and direction |
| `src/lib/cycle-subjects.ts` | Subject vs reviewer-only role predicates |
| `src/lib/email/templates.ts` | All email template builders |
| `src/lib/jobs/cycle.ts` | `handleCycleActivate`, `handleCycleRemind`, `handleCycleAutoClose` |
| `src/lib/jobs/email.ts` | `handleEmailSend` |
| `src/lib/jobs/index.ts` | Job handler registry |
| `src/types/job.ts` | Job payload type definitions |
| `src/app/api/cycles/route.ts` | Cycle CRUD (list, create) |
| `src/app/api/cycles/[id]/route.ts` | Cycle CRUD (get, patch, delete) + status transitions |
| `src/app/api/cycles/[id]/activate/route.ts` | Cycle activation (DRAFT → ACTIVE) |
| `src/app/api/cycles/[id]/remind/route.ts` | Send reminders |
| `src/app/api/cycles/[id]/assignments/route.ts` | List assignments (GET only) |
| `src/app/api/users/invite/route.ts` | Invite user to organization |
| `src/app/api/review/[token]/route.ts` | Validate reviewer link |
| `src/app/api/review/[token]/otp/send/route.ts` | Send OTP for review access |
| `src/app/api/review/[token]/otp/verify/route.ts` | Verify OTP for review access |
| `src/app/api/review/[token]/assignments/route.ts` | List reviewer's assignments |
| `src/app/api/evaluate/[token]/otp/send/route.ts` | Send OTP for single evaluation |
| `src/app/api/evaluate/[token]/otp/verify/route.ts` | Verify OTP for single evaluation |
| `src/app/(dashboard)/people/page.tsx` | People page UI (invite dialog) |
| `src/app/(dashboard)/cycles/[cycleId]/page.tsx` | Cycle detail page UI |
| `src/app/(public)/review/[token]/page.tsx` | OTP entry page for review link |
| `src/app/(public)/review/[token]/assignments/page.tsx` | Reviewer's assignments list |
