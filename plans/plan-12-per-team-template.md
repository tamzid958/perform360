# Plan 12 — Per-Team Template Assignment in Cycles

> Currently a cycle has one `templateId` for the whole org. Change it so each team can have its own template, or multiple teams can share one template.

---

## Summary of Changes

**Current:** `EvaluationCycle.templateId` → one template for all teams
**New:** `CycleTeam` junction table → each team picks its own template; `EvaluationAssignment.templateId` → each assignment knows its template directly

---

## Steps

### 1. Schema — Add `CycleTeam` model, add `templateId` to `EvaluationAssignment`, remove `templateId` from `EvaluationCycle`

**File:** `prisma/schema.prisma`

```prisma
model CycleTeam {
  id         String             @id @default(cuid())
  cycleId    String
  cycle      EvaluationCycle    @relation(fields: [cycleId], references: [id], onDelete: Cascade)
  teamId     String
  team       Team               @relation(fields: [teamId], references: [id])
  templateId String
  template   EvaluationTemplate @relation(fields: [templateId], references: [id])
  createdAt  DateTime           @default(now())

  @@unique([cycleId, teamId])
}
```

Changes to existing models:
- `EvaluationCycle`: remove `templateId` field, add `cycleTeams CycleTeam[]` relation
- `EvaluationAssignment`: add `templateId String` field (denormalized from CycleTeam for direct lookup)
- `Team`: add `cycleTeams CycleTeam[]` relation
- `EvaluationTemplate`: add `cycleTeams CycleTeam[]` relation

### 2. Migration — Create migration, handle existing data

**Commands:**
```bash
npx prisma migrate dev --name per-team-template
```

Migration strategy for existing data:
- Before removing `templateId` from `EvaluationCycle`, the migration must:
  1. Create `CycleTeam` table
  2. Add `templateId` column to `EvaluationAssignment` (nullable first)
  3. Backfill: for each existing cycle, create a `CycleTeam` row for every team in the company using the cycle's `templateId`
  4. Backfill: set `EvaluationAssignment.templateId` from the cycle's `templateId`
  5. Make `EvaluationAssignment.templateId` non-nullable
  6. Drop `templateId` from `EvaluationCycle`

### 3. API — Update `POST /api/cycles` (create cycle)

**File:** `src/app/api/cycles/route.ts`

Change request schema from:
```ts
{ name, templateId, startDate, endDate }
```
To:
```ts
{ name, startDate, endDate, teamTemplates: [{ teamId, templateId }] }
```

Validation:
- `teamTemplates` must be non-empty array
- Each `teamId` must belong to the company
- Each `templateId` must belong to the company or be global
- No duplicate `teamId` entries

Create flow:
1. Create `EvaluationCycle` (no `templateId` field)
2. Bulk create `CycleTeam` rows from `teamTemplates` array

### 4. API — Update `GET /api/cycles/[id]` (cycle detail)

**File:** `src/app/api/cycles/[id]/route.ts`

- Include `cycleTeams` with team name and template name in the response
- Remove single `templateName` field, replace with `teamTemplates` array:
  ```ts
  teamTemplates: [{ teamId, teamName, templateId, templateName }]
  ```

### 5. API — Update `POST /api/cycles/[id]/activate` (activation)

**File:** `src/app/api/cycles/[id]/activate/route.ts`

Current: verifies single `cycle.templateId`, calls `createAssignmentsForCycle(cycleId, companyId)`

New:
1. Fetch all `CycleTeam` entries for the cycle (must have at least one)
2. Verify each `CycleTeam.templateId` is still accessible
3. Pass `cycleTeams` to a modified `createAssignmentsForCycle` so each assignment gets the correct `templateId`
4. Only generate assignments for teams that are in the `CycleTeam` list (not all company teams)

### 6. Lib — Update `createAssignmentsForCycle` and `generateAssignmentsFromTeams`

**File:** `src/lib/assignments.ts`

Changes:
- Accept `cycleTeams: { teamId: string; templateId: string }[]` instead of fetching all company teams
- Only fetch the teams listed in `cycleTeams`
- `GeneratedAssignment` interface: add `templateId: string`
- In `generateAssignmentsFromTeams`, each assignment inherits `templateId` from its team's mapping
- For cross-team dedup: if a user is in multiple teams with different templates, each team generates its own assignments (same reviewer+subject can appear twice if templates differ)
- Self-evaluations: pick the templateId from the user's first team encountered (or skip self if ambiguous — need to decide)

Dedup key changes from `subjectId:reviewerId` to `subjectId:reviewerId:templateId` — same pair can have multiple assignments if different templates.

### 7. API — Update `GET /api/evaluate/[token]/form` (load form)

**File:** `src/app/api/evaluate/[token]/form/route.ts`

Current: resolves template via `assignment.cycle.templateId`
New: resolves template via `assignment.templateId` directly

### 8. API — Update `POST /api/evaluate/[token]` (submit evaluation)

**File:** `src/app/api/evaluate/[token]/route.ts`

Current: validates required questions against `assignment.cycle.templateId`
New: validates against `assignment.templateId`

### 9. UI — Redesign cycle creation form

**File:** `src/app/(dashboard)/cycles/new/page.tsx`

Remove the single template dropdown. New UI:

1. Cycle name + date range (unchanged)
2. **Team-Template assignment section:**
   - Fetch teams from `/api/teams`
   - Fetch templates from `/api/templates`
   - List of rows, each row: `[Team Select] → [Template Select]`
   - "Add Team" button to add more rows
   - Remove button per row
   - Validation: at least one team-template pair, no duplicate teams
3. Submit sends `{ name, startDate, endDate, teamTemplates: [...] }`

### 10. UI — Update cycle detail page

**File:** `src/app/(dashboard)/cycles/[cycleId]/page.tsx`

- Replace single "Template: X" display with a table/list of team-template pairs
- Show which template each team uses
- On the Assignments tab, optionally show the template name per assignment

### 11. API — Add `PATCH /api/cycles/[id]` support for editing team-template pairs

**File:** `src/app/api/cycles/[id]/route.ts`

- Allow updating `teamTemplates` array while cycle is in DRAFT status
- Delete existing `CycleTeam` rows and recreate (simpler than diffing)
- Reject changes to team-template pairs after activation

### 12. Reports — Handle multi-template cycles

**Files:** `src/app/api/reports/cycle/[id]/route.ts`, `src/app/api/reports/cycle/[id]/user/[uid]/route.ts`

- When aggregating scores, group by template (questions differ per template)
- Individual reports: show which template was used for each evaluator
- Cycle-level reports: break down stats by team/template

---

## Files Affected

| # | File | Change |
|---|------|--------|
| 1 | `prisma/schema.prisma` | Add `CycleTeam` model, add `templateId` to `EvaluationAssignment`, remove `templateId` from `EvaluationCycle`, add relations to `Team` and `EvaluationTemplate` |
| 2 | `src/app/api/cycles/route.ts` | Change POST schema to accept `teamTemplates[]`, create `CycleTeam` rows |
| 3 | `src/app/api/cycles/[id]/route.ts` | GET: return `teamTemplates` instead of single template. PATCH: allow editing team-templates in DRAFT |
| 4 | `src/app/api/cycles/[id]/activate/route.ts` | Use `CycleTeam` entries instead of single `templateId`, pass to assignment generator |
| 5 | `src/lib/assignments.ts` | Accept `cycleTeams` param, add `templateId` to generated assignments, update dedup logic |
| 6 | `src/app/api/evaluate/[token]/route.ts` | Use `assignment.templateId` instead of `assignment.cycle.templateId` |
| 7 | `src/app/api/evaluate/[token]/form/route.ts` | Use `assignment.templateId` instead of `assignment.cycle.templateId` |
| 8 | `src/app/(dashboard)/cycles/new/page.tsx` | Redesign form: team-template pair selection UI |
| 9 | `src/app/(dashboard)/cycles/[cycleId]/page.tsx` | Show team-template pairs instead of single template |
| 10 | Report API routes (if they exist) | Group by template when aggregating |

---

## Key Design Decisions

1. **Denormalized `templateId` on `EvaluationAssignment`** — avoids joining through `CycleTeam` on every form load/submission. The assignment directly knows its template.

2. **Dedup key includes `templateId`** — same reviewer+subject can have multiple assignments if they're in different teams with different templates. This is correct: different templates = different evaluations.

3. **Self-evaluations** — a user in multiple teams with different templates gets one self-evaluation per template. This makes sense since the questions differ.

4. **Only selected teams participate** — no longer auto-includes all company teams. The admin explicitly picks which teams join the cycle.

5. **CycleTeam is the source of truth** — during DRAFT, admin can edit team-template pairs. On activation, assignments are generated from CycleTeam entries.
