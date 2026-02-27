# Plan 10 — Email Templates & Polish

> Build branded email templates, finalize evaluation form UX, and misc polish items.

## Problem

Email utility exists but has no branded templates. Evaluation form lacks polish. Various small items remain.

## Scope

### 1. Email Templates (`src/lib/email.ts`)
- [ ] Magic link login email (branded HTML)
- [ ] Evaluation invitation email (reviewer name, subject name, cycle name, deadline, link)
- [ ] OTP verification email (6-digit code, expiry notice)
- [ ] Evaluation reminder email (days remaining, link)
- [ ] User invitation email (welcome, login link)
- [ ] All emails: responsive HTML, Apple-inspired minimal design, plain text fallback

### 2. Evaluation Form Polish
- [ ] Progress indicator showing completion percentage
- [ ] Mobile-responsive form layout
- [ ] In-memory auto-save (warn on page leave if unsaved)
- [ ] Submission success screen with animation
- [ ] Error handling for expired sessions

### 3. Landing Page
- [ ] Verify all sections render correctly
- [ ] CTA buttons link to `/login` and `/register`
- [ ] Mobile responsive

### 4. Empty States
- [ ] Cycles page: empty state when no cycles exist
- [ ] Teams page: empty state
- [ ] Templates page: empty state
- [ ] People page: empty state
- [ ] All should have clear CTA to create first item

### 5. Error Boundaries
- [ ] Add error boundaries to all page layouts
- [ ] Custom 404 page
- [ ] Custom 500 page
- [ ] Toast notifications for API errors

### 6. Loading States
- [ ] Verify all pages have skeleton loading states
- [ ] Verify loading.tsx files exist for each route group

## Files to Modify/Create

- `src/lib/email.ts` (add all templates)
- `src/components/evaluate/submission-success.tsx` (create)
- `src/app/not-found.tsx` (create if missing)
- `src/app/error.tsx` (create if missing)
- Various page files (add empty states)

## Dependencies

- Plan 08 (UI integration should be done first)
