# Plan 04 — Reports & Decryption

> Implement report generation with encrypted data decryption, aggregation, and PDF export.

## Problem

Report APIs return mock data. No decryption logic exists for reading evaluation responses. No aggregation, no charts data, no PDF export.

## Scope

### 1. Individual Report (`GET /api/reports/cycle/[id]/user/[uid]`)
- [ ] RBAC check: only ADMIN/HR can access
- [ ] Query all `EvaluationResponse` records for the subject in this cycle
- [ ] Decrypt each response using company's Data Key:
  - Get company's `encryptionKeyEncrypted` from session/DB
  - Admin provides passphrase (cached in session) → derive Master Key → decrypt Data Key
  - Use Data Key + `answersIv` + `answersTag` to decrypt `answersEncrypted`
- [ ] Aggregate scores by relationship type (manager avg, peer avg, direct_report avg, self)
- [ ] Aggregate scores by question/section for radar chart data
- [ ] Group open-text feedback by relationship type (anonymized)
- [ ] Return structured report data

### 2. Cycle Aggregate Report (`GET /api/reports/cycle/[id]`)
- [ ] RBAC check: only ADMIN/HR
- [ ] Completion rates per team
- [ ] Score distributions across all subjects
- [ ] Top strengths / areas for improvement (aggregated)
- [ ] Participation analytics (submitted vs pending vs total)

### 3. PDF Export (`GET /api/reports/cycle/[id]/export`)
- [ ] Generate PDF from report data
- [ ] Include radar charts, score breakdowns, anonymized comments
- [ ] Return as downloadable PDF blob
- [ ] Consider using `@react-pdf/renderer` or server-side HTML-to-PDF

### 4. Encryption Session Management
- [ ] Create mechanism for Admin/HR to provide encryption passphrase
- [ ] Cache derived Data Key in server-side session (encrypted in memory)
- [ ] Auto-expire passphrase cache after session timeout
- [ ] Audit log each decryption event (who, when, which records)

### 5. Report UI Pages
- [ ] `cycles/[cycleId]/page.tsx` — Reports tab: wire up real cycle report data
- [ ] `cycles/[cycleId]/reports/[userId]/page.tsx` — Wire up individual report with real data
- [ ] Radar chart component with real data
- [ ] Score breakdown component with real data

## Files to Modify/Create

- `src/app/api/reports/cycle/[id]/route.ts` (rewrite)
- `src/app/api/reports/cycle/[id]/user/[uid]/route.ts` (rewrite)
- `src/app/api/reports/cycle/[id]/export/route.ts` (rewrite)
- `src/lib/reports.ts` (new — aggregation helpers)
- `src/lib/encryption.ts` (verify decrypt functions work end-to-end)
- Report UI pages (wire up)

## Dependencies

- Plan 01 (cycles API must work)
- Plan 02 (encrypted submissions must exist in DB to decrypt)
- Plan 06 (encryption setup must be complete)
