# Plan 02 — OTP & Evaluation Submission Flow

> Implement the complete public evaluation flow: token validation, OTP auth, form loading, encrypted submission.

## Problem

The entire evaluation submission pipeline is non-functional. OTP send returns mock data, OTP verify accepts any 6-digit code, token validation doesn't check the database, and submissions aren't encrypted or persisted.

## Scope

### 1. Token Validation (`GET /api/evaluate/[token]`)
- [ ] Query `EvaluationAssignment` by token
- [ ] Verify assignment exists, cycle is ACTIVE, status is not SUBMITTED
- [ ] Return assignment metadata (subject name, cycle name, relationship type)
- [ ] Return error for invalid/expired/completed tokens

### 2. OTP Send (`POST /api/evaluate/[token]/otp/send`)
- [ ] Validate token exists and assignment is ACTIVE
- [ ] Look up reviewer email from assignment → reviewerId → User
- [ ] Rate limit: max 5 sends per email per hour (query OtpSession count)
- [ ] Generate cryptographically random 6-digit OTP (`crypto.randomInt`)
- [ ] Hash OTP with bcrypt (cost factor 10)
- [ ] Create `OtpSession` record (hash, expiry = now + 10min, email)
- [ ] Send OTP email via Nodemailer (use `src/lib/email.ts`)
- [ ] Return `{ success: true, expiresIn: 600 }`

### 3. OTP Verify (`POST /api/evaluate/[token]/otp/verify`)
- [ ] Find latest `OtpSession` for this assignment
- [ ] Check cooldown (`cooldownUntil > now` → reject)
- [ ] Check expiry (`expiresAt < now` → reject)
- [ ] Compare submitted OTP against bcrypt hash
- [ ] If wrong: increment `attempts`, set cooldown at 3 attempts (15 min)
- [ ] If correct: set `verifiedAt`, generate `sessionToken` (cuid), set `sessionExpiry` (now + 2h)
- [ ] Set sessionToken as httpOnly cookie (`evaluation_session`)
- [ ] Return `{ success: true, sessionToken }`

### 4. Form Loading (`GET /api/evaluate/[token]/form`)
- [ ] Validate OTP session from cookie
- [ ] Query `OtpSession` by sessionToken, verify expiry
- [ ] Load template sections/questions from cycle's template
- [ ] Return form structure + subject info

### 5. Evaluation Submission (`POST /api/evaluate/[token]`)
- [ ] Validate OTP session from cookie
- [ ] Validate answers against template schema (all required questions answered)
- [ ] Retrieve company's `encryptionKeyEncrypted` + decrypt Data Key
- [ ] Encrypt answers JSON with AES-256-GCM → `answersEncrypted`, `answersIv`, `answersTag`
- [ ] Create `EvaluationResponse` record
- [ ] Update `EvaluationAssignment.status` to SUBMITTED
- [ ] Return success confirmation

### 6. Frontend Pages
- [ ] `(public)/evaluate/[token]/page.tsx` — Wire up real OTP send/verify API calls
- [ ] `(public)/evaluate/[token]/form/page.tsx` — Wire up real form load + submission

## Security Requirements

- OTP stored as bcrypt hash (never plain text)
- 6-digit numeric OTP, 10-minute expiry
- Max 3 attempts before 15-minute cooldown
- Session valid for 2 hours after verification
- httpOnly, SameSite=Strict cookie for session token
- Rate limit: 5 OTP sends per email per hour
- Answers encrypted before DB write (AES-256-GCM)

## Files to Modify/Create

- `src/app/api/evaluate/[token]/route.ts` (rewrite)
- `src/app/api/evaluate/[token]/otp/send/route.ts` (rewrite)
- `src/app/api/evaluate/[token]/otp/verify/route.ts` (rewrite)
- `src/app/api/evaluate/[token]/form/route.ts` (may need to create)
- `src/app/(public)/evaluate/[token]/page.tsx` (wire up)
- `src/app/(public)/evaluate/[token]/form/page.tsx` (wire up)

## Dependencies

- `src/lib/otp.ts` (exists — verify functions)
- `src/lib/encryption.ts` (exists — verify AES-256-GCM functions)
- `src/lib/email.ts` (exists — verify OTP email template)
- `src/lib/prisma.ts` (exists)
