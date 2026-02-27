# Plan 08 — Frontend API Integration

> Replace all mock/hardcoded data in UI pages with real API calls.

## Problem

Every dashboard page renders with hardcoded mock data arrays defined inline. None of them fetch from the API.

## Scope

### 1. Dashboard Overview (`/overview`)
- [ ] Fetch stats from `GET /api/dashboard/stats`
- [ ] Render real active cycles, team counts, pending evaluations, completion rate
- [ ] Real recent activity feed
- [ ] Loading states with skeleton components
- [ ] Error states with retry

### 2. Cycles List (`/cycles`)
- [ ] Fetch from `GET /api/cycles`
- [ ] Filter tabs (All, Active, Draft, Closed, Archived) with query params
- [ ] Search functionality
- [ ] Real cycle cards with actual data
- [ ] Create cycle dialog → `POST /api/cycles`
- [ ] Delete cycle → `DELETE /api/cycles/[id]`

### 3. Cycle Detail (`/cycles/[cycleId]`)
- [ ] Fetch from `GET /api/cycles/[id]`
- [ ] Real assignments list with status indicators
- [ ] Activate button → `POST /api/cycles/[id]/activate`
- [ ] Send reminders → `POST /api/cycles/[id]/remind`
- [ ] Status change actions
- [ ] Reports tab with real data from `GET /api/reports/cycle/[id]`

### 4. Teams (`/teams`)
- [ ] Fetch from `GET /api/teams`
- [ ] Create team form → `POST /api/teams`
- [ ] Team detail page: fetch from `GET /api/teams/[id]`
- [ ] Add/remove members via API
- [ ] Role assignment UI

### 5. Templates (`/templates`)
- [ ] Fetch from `GET /api/templates`
- [ ] Create/edit template → API calls
- [ ] Template detail page with real data

### 6. People (`/people`)
- [ ] Fetch from `GET /api/users`
- [ ] Invite user dialog → `POST /api/users/invite`
- [ ] Edit role → `PATCH /api/users/[id]`
- [ ] Deactivate → `DELETE /api/users/[id]`

### 7. Settings Pages
- [ ] General settings → read/write company profile
- [ ] Roles page → display permissions matrix
- [ ] Encryption page — already partially wired (verify)

### 8. Common Patterns
- [ ] Create `useFetch` or `useSWR` pattern for data fetching
- [ ] Toast notifications on success/error for mutations
- [ ] Optimistic updates where appropriate
- [ ] Loading skeletons (not spinners) per design system

## Files to Modify

- `src/app/(dashboard)/overview/page.tsx`
- `src/app/(dashboard)/cycles/page.tsx`
- `src/app/(dashboard)/cycles/[cycleId]/page.tsx`
- `src/app/(dashboard)/cycles/[cycleId]/reports/[userId]/page.tsx`
- `src/app/(dashboard)/teams/page.tsx`
- `src/app/(dashboard)/teams/new/page.tsx`
- `src/app/(dashboard)/teams/[teamId]/page.tsx`
- `src/app/(dashboard)/templates/page.tsx`
- `src/app/(dashboard)/templates/new/page.tsx`
- `src/app/(dashboard)/templates/[templateId]/page.tsx`
- `src/app/(dashboard)/people/page.tsx`
- `src/app/(dashboard)/settings/page.tsx`

## Dependencies

- Plan 01 (all APIs must return real data first)
