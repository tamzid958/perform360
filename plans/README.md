# Perform360 — Implementation Plans

## Execution Order & Dependencies

```
plan-01 ─────────────────────┐
  (API Foundation)           │
                             ├──► plan-08 (UI Integration) ──► plan-10 (Polish)
plan-02 ────────┐            │
  (OTP/Eval)    ├──► plan-04 (Reports)
                │
plan-03 ────────┘
  (Cycle Activation)

plan-05 ──► plan-07 (Super Admin)
  (Auth/Security)

plan-06 (Encryption Recovery) — independent
plan-09 (Template Builder)    — independent (needs plan-01)
```

## Plan Files

| # | Plan | Status | Priority | Description |
|---|------|--------|----------|-------------|
| 01 | [API Foundation](plan-01-api-foundation.md) | Pending | P0 | Replace all mock APIs with real Prisma queries |
| 02 | [OTP & Evaluation Flow](plan-02-otp-evaluation-flow.md) | Pending | P0 | Complete OTP auth + encrypted submission |
| 03 | [Cycle Activation](plan-03-cycle-activation.md) | Pending | P0 | Assignment generation + email invitations |
| 04 | [Reports & Decryption](plan-04-reports-decryption.md) | Pending | P1 | Report generation with data decryption |
| 05 | [Auth & Security](plan-05-auth-security.md) | Pending | P1 | Fix auth bugs, RBAC middleware, rate limiting |
| 06 | [Encryption Recovery](plan-06-encryption-recovery.md) | Pending | P1 | Recovery codes, passphrase change, key rotation |
| 07 | [Super Admin](plan-07-super-admin.md) | Pending | P2 | SaaS owner panel with real data |
| 08 | [UI Integration](plan-08-ui-integration.md) | Pending | P1 | Wire all frontend pages to real APIs |
| 09 | [Template Builder](plan-09-template-builder.md) | Pending | P2 | Drag-and-drop form builder |
| 10 | [Email & Polish](plan-10-email-polish.md) | Pending | P3 | Branded emails, empty states, error handling |

## Key Stats

- **Critical bugs found**: 16
- **Missing features**: 12
- **Partial implementations**: 9
- **Security issues**: 4
- **Total API routes needing work**: ~30
- **Total UI pages needing work**: ~15
