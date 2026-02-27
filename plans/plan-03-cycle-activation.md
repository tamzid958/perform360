# Plan 03 — Cycle Activation & Assignment Generation

> Implement cycle lifecycle: activation, auto-assignment generation from team structure, email invitations, reminders.

## Problem

Cycle activation returns mock data. No assignments are generated from team structure. No invitation emails are sent. Reminders don't work.

## Scope

### 1. Cycle Activation (`POST /api/cycles/[id]/activate`)
- [ ] Verify cycle exists, belongs to company, status is DRAFT
- [ ] Verify cycle has a valid template assigned
- [ ] Query all teams associated with the cycle (or all company teams if cycle is company-wide)
- [ ] Generate `EvaluationAssignment` records from team structure:
  - Manager evaluates each Direct Report (relationship: "manager")
  - Each Direct Report evaluates their Manager(s) (relationship: "direct_report")
  - Peers evaluate each other (relationship: "peer")
  - Self-evaluation for each member (relationship: "self")
- [ ] Generate unique token per assignment (`cuid()`)
- [ ] Update cycle status to ACTIVE
- [ ] Send invitation emails to all reviewers with their unique evaluation link
- [ ] Return activation summary (total assignments, emails sent)

### 2. Assignment Matrix Logic
- [ ] Create helper function `generateAssignments(cycleId, teams)` in `src/lib/assignments.ts`
- [ ] Handle deduplication (same person in multiple teams)
- [ ] Handle `@@unique([cycleId, subjectId, reviewerId])` constraint
- [ ] Skip self-evaluation duplicates

### 3. Email Invitations
- [ ] Create evaluation invitation email template in `src/lib/email.ts`
- [ ] Include: reviewer name, subject name, cycle name, deadline, evaluation link
- [ ] Batch send with rate limiting (avoid SMTP throttling)

### 4. Reminder Emails (`POST /api/cycles/[id]/remind`)
- [ ] Query assignments where status is PENDING or IN_PROGRESS
- [ ] Send reminder emails to reviewers with their existing links
- [ ] Track last reminder sent date (avoid spam)

### 5. Cycle Status Transitions
- [ ] DRAFT → ACTIVE (via activate endpoint)
- [ ] ACTIVE → CLOSED (via PATCH with status change, prevent new submissions)
- [ ] CLOSED → ARCHIVED (via PATCH)
- [ ] Validate transitions (e.g., can't go from ARCHIVED back to ACTIVE)

## Files to Modify/Create

- `src/app/api/cycles/[id]/activate/route.ts` (rewrite)
- `src/app/api/cycles/[id]/remind/route.ts` (rewrite)
- `src/app/api/cycles/[id]/route.ts` (add status transition validation)
- `src/lib/assignments.ts` (new — assignment generation logic)
- `src/lib/email.ts` (add invitation + reminder templates)

## Dependencies

- Plan 01 (cycles CRUD must work first)
- `src/lib/email.ts` (exists — needs templates added)
- `src/lib/tokens.ts` (exists — verify token generation)
