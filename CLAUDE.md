# CLAUDE.md — Perform360

> 360° Performance Evaluation SaaS Platform

---

## Product Overview

**Perform360** is a modern 360° performance evaluation SaaS platform built with Next.js. It enables organizations to run structured evaluation cycles where employees receive feedback from managers, direct reports, and peers. The platform supports multi-tenant architecture with company-level isolation, role-based access control, and a premium Apple-inspired design language.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS 4 |
| UI Components | Radix UI primitives + custom components |
| Database | PostgreSQL (via Supabase or Neon) |
| ORM | Prisma |
| Authentication | NextAuth.js v5 (Auth.js) — Magic Link (passwordless email) |
| State Management | Zustand (client), React Server Components (server) |
| Forms | React Hook Form + Zod validation |
| Email | Nodemailer (SMTP) |
| Deployment | Vercel |

---

## Architecture

### Multi-Tenant Model

```
Super Admin (SaaS Owner — Perform360 platform operator)
└── Company (Tenant — customer organization)
    ├── Admin / HR (company-level administrators)
    ├── Evaluation Cycles
    ├── Teams
    │   ├── Managers (multiple per team)
    │   ├── Direct Reports (multiple per team)
    │   └── Members
    ├── Evaluation Templates (company-level + global)
    └── Reports & Analytics
```

### Database Schema (Core Models)

```prisma
// ─── GLOBAL (SaaS Owner) ───
model SuperAdmin {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  createdAt DateTime @default(now())
  // SaaS owner accounts — NOT company admins.
  // These are Perform360 platform operators who manage
  // all tenants, global templates, and platform settings.
}

model EvaluationTemplate {
  id          String   @id @default(cuid())
  name        String
  description String?
  sections    Json     // Array of { title, questions: [{ text, type, options?, required }] }
  isGlobal    Boolean  @default(false) // SaaS owner global templates (available to all companies)
  companyId   String?  // null = global template
  company     Company? @relation(fields: [companyId], references: [id])
  createdBy   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// ─── COMPANY / TENANT ───
model Company {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique // subdomain or URL slug
  logo        String?
  settings    Json?    // company-level config
  
  // ─── ENCRYPTION (company-owned, SaaS owner cannot access) ───
  encryptionKeyEncrypted  String   // AES-256 data key, encrypted with company's master key
  keyVersion              Int      @default(1) // For key rotation
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  users       User[]
  teams       Team[]
  cycles      EvaluationCycle[]
  templates   EvaluationTemplate[]
}

model User {
  id          String   @id @default(cuid())
  email       String
  name        String
  avatar      String?
  role        UserRole @default(MEMBER) // ADMIN | HR | MANAGER | MEMBER
  companyId   String
  company     Company  @relation(fields: [companyId], references: [id])
  createdAt   DateTime @default(now())

  // Relations
  teamMemberships  TeamMember[]
  submittedReviews EvaluationResponse[]
  receivedReviews  EvaluationResponse[] @relation("ReviewSubject")

  @@unique([email, companyId])
}

enum UserRole {
  ADMIN
  HR
  MANAGER
  MEMBER
}

// ─── TEAMS ───
model Team {
  id          String   @id @default(cuid())
  name        String
  description String?
  companyId   String
  company     Company  @relation(fields: [companyId], references: [id])
  createdAt   DateTime @default(now())

  members     TeamMember[]
}

model TeamMember {
  id        String         @id @default(cuid())
  userId    String
  teamId    String
  role      TeamMemberRole // MANAGER | MEMBER
  user      User           @relation(fields: [userId], references: [id])
  team      Team           @relation(fields: [teamId], references: [id])

  @@unique([userId, teamId])
}

enum TeamMemberRole {
  MANAGER // Multiple managers per team allowed
  MEMBER  // Multiple members per team allowed
}

// ─── EVALUATION CYCLES ───
model EvaluationCycle {
  id          String      @id @default(cuid())
  name        String      // e.g., "Q1 2025 Review"
  companyId   String
  company     Company     @relation(fields: [companyId], references: [id])
  templateId  String
  status      CycleStatus @default(DRAFT) // DRAFT | ACTIVE | CLOSED | ARCHIVED
  startDate   DateTime
  endDate     DateTime
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  assignments EvaluationAssignment[]
}

enum CycleStatus {
  DRAFT
  ACTIVE
  CLOSED
  ARCHIVED
}

model EvaluationAssignment {
  id          String          @id @default(cuid())
  cycleId     String
  cycle       EvaluationCycle @relation(fields: [cycleId], references: [id])
  subjectId   String          // Person being evaluated
  reviewerId  String          // Person giving feedback
  relationship String         // "manager" | "direct_report" | "peer" | "self"
  status      AssignmentStatus @default(PENDING)
  token       String          @unique @default(cuid()) // Unique submission link token
  createdAt   DateTime        @default(now())

  responses   EvaluationResponse[]
  otpSessions OtpSession[]

  @@unique([cycleId, subjectId, reviewerId])
}

// ─── OTP AUTHENTICATION ───
model OtpSession {
  id            String               @id @default(cuid())
  assignmentId  String
  assignment    EvaluationAssignment @relation(fields: [assignmentId], references: [id])
  email         String
  otpHash       String               // bcrypt hash of 6-digit OTP (never store plain)
  attempts      Int                  @default(0) // Max 3 before cooldown
  expiresAt     DateTime             // OTP valid for 10 minutes
  cooldownUntil DateTime?            // 15-min lockout after 3 failed attempts
  verifiedAt    DateTime?            // null = not yet verified
  sessionToken  String?              @unique // Issued after successful OTP verification
  sessionExpiry DateTime?            // Session valid for 2 hours after verification
  createdAt     DateTime             @default(now())
}

enum AssignmentStatus {
  PENDING
  IN_PROGRESS
  SUBMITTED
}

model EvaluationResponse {
  id            String               @id @default(cuid())
  assignmentId  String
  assignment    EvaluationAssignment @relation(fields: [assignmentId], references: [id])
  reviewerId    String
  reviewer      User                 @relation(fields: [reviewerId], references: [id])
  subjectId     String
  subject       User                 @relation("ReviewSubject", fields: [subjectId], references: [id])
  
  // ─── ENCRYPTED DATA ───
  answersEncrypted  String           // AES-256-GCM encrypted JSON blob of answers
  answersIv         String           // Initialization vector for decryption
  answersTag        String           // GCM auth tag for integrity verification
  keyVersion        Int              // Which company key version was used to encrypt
  
  submittedAt   DateTime?
  createdAt     DateTime             @default(now())
  updatedAt     DateTime             @updatedAt
}
```

---

## Role-Based Access Control (RBAC)

### Roles & Permissions Matrix

| Action | Super Admin (SaaS Owner) | Admin | HR | Manager | Member |
|---|:---:|:---:|:---:|:---:|:---:|
| Manage global templates | ✅ | ❌ | ❌ | ❌ | ❌ |
| View/manage all companies | ✅ | ❌ | ❌ | ❌ | ❌ |
| Platform analytics (aggregate only) | ✅ | ❌ | ❌ | ❌ | ❌ |
| **View evaluation responses/reports** | **❌ (encrypted)** | ✅ | ✅ | ❌ | ❌ |
| Create/manage cycles | ❌ | ✅ | ✅ | ❌ | ❌ |
| Create/manage teams | ❌ | ✅ | ✅ | ❌ | ❌ |
| View individual reports | ❌ | ✅ | ✅ | ❌ | ❌ |
| Submit evaluations (via OTP link) | ❌ | ✅ | ✅ | ✅ | ✅ |
| View own report | ❌ | ❌ | ❌ | ❌ | ❌ |
| Admin settings | ❌ | ✅ | ❌ | ❌ | ❌ |
| Manage encryption passphrase & keys | ❌ | ✅ | ❌ | ❌ | ❌ |

> **Key restrictions**:
> - Super Admin (SaaS owner) has **zero access** to encrypted evaluation data — enforced cryptographically, not just by permissions.
> - Managers and members **cannot** view any reports, including their own. Only Admin/HR can view and share reports.
> - If the encryption passphrase and recovery codes are both lost, data is **permanently unrecoverable** — no backdoor exists.

### Link-Based Submission with OTP Verification

Evaluation participants receive a **unique tokenized link** via email:

```
https://app.perform360.com/evaluate/{token}
```

**OTP Authentication Flow:**

```
1. Reviewer receives email with evaluation link
2. Opens link → lands on OTP verification screen
3. System auto-sends 6-digit OTP to the reviewer's registered email
4. Reviewer enters OTP → verified → evaluation form loads
5. OTP expires after 10 minutes, max 3 attempts before cooldown (15 min)
6. Session persists for 2 hours (allows saving drafts and returning)
```

- Token maps to a specific `EvaluationAssignment`
- **No password/account needed** — OTP-only authentication per evaluation
- Link is single-use per assignment (can be re-opened if status is not SUBMITTED)
- **Only company Admin/HR roles can view aggregated results and individual reports**
- **SaaS owner / Super Admin CANNOT view evaluation data** (see Encryption below)
- Reviewers see ONLY their own submission form — no access to others' responses or reports

---

## Project Structure

```
perform360/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx          # Magic link request (enter email)
│   │   │   ├── verify/page.tsx         # Magic link verification / check email prompt
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx              # Sidebar + top nav
│   │   │   ├── page.tsx                # Dashboard home
│   │   │   ├── cycles/
│   │   │   │   ├── page.tsx            # List cycles
│   │   │   │   ├── new/page.tsx        # Create cycle
│   │   │   │   └── [cycleId]/
│   │   │   │       ├── page.tsx        # Cycle detail
│   │   │   │       └── reports/
│   │   │   │           ├── page.tsx    # All reports for cycle
│   │   │   │           └── [userId]/page.tsx  # Individual report
│   │   │   ├── teams/
│   │   │   │   ├── page.tsx            # List teams
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [teamId]/page.tsx   # Team detail
│   │   │   ├── templates/
│   │   │   │   ├── page.tsx            # List templates
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [templateId]/page.tsx
│   │   │   ├── people/page.tsx         # User management
│   │   │   └── settings/
│   │   │       ├── page.tsx            # General settings
│   │   │       ├── roles/page.tsx
│   │   │       └── encryption/page.tsx # Encryption passphrase, key rotation, recovery codes
│   │   ├── (public)/
│   │   │   └── evaluate/
│   │   │       └── [token]/
│   │   │           ├── page.tsx        # OTP verification screen
│   │   │           └── form/page.tsx   # Evaluation form (after OTP verified)
│   │   ├── (superadmin)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx                # Super admin dashboard
│   │   │   ├── companies/page.tsx
│   │   │   └── templates/
│   │   │       ├── page.tsx            # Global templates
│   │   │       └── [templateId]/page.tsx
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── cycles/route.ts
│   │   │   ├── teams/route.ts
│   │   │   ├── templates/route.ts
│   │   │   ├── evaluate/[token]/route.ts
│   │   │   └── reports/route.ts
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                         # Base UI primitives (Apple-inspired)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── tabs.tsx
│   │   │   └── tooltip.tsx
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   ├── top-nav.tsx
│   │   │   ├── mobile-nav.tsx
│   │   │   └── page-header.tsx
│   │   ├── dashboard/
│   │   │   ├── stats-cards.tsx
│   │   │   ├── cycle-overview.tsx
│   │   │   ├── completion-chart.tsx
│   │   │   └── recent-activity.tsx
│   │   ├── cycles/
│   │   │   ├── cycle-card.tsx
│   │   │   ├── cycle-form.tsx
│   │   │   ├── assignment-matrix.tsx
│   │   │   └── cycle-status-badge.tsx
│   │   ├── teams/
│   │   │   ├── team-card.tsx
│   │   │   ├── team-form.tsx
│   │   │   ├── member-list.tsx
│   │   │   └── role-badge.tsx
│   │   ├── templates/
│   │   │   ├── template-builder.tsx    # Drag-and-drop form builder
│   │   │   ├── question-editor.tsx
│   │   │   ├── section-editor.tsx
│   │   │   └── template-preview.tsx
│   │   ├── evaluate/
│   │   │   ├── evaluation-form.tsx     # Public-facing form
│   │   │   ├── rating-scale.tsx
│   │   │   ├── text-response.tsx
│   │   │   └── submission-success.tsx
│   │   └── reports/
│   │       ├── individual-report.tsx
│   │       ├── radar-chart.tsx
│   │       ├── score-breakdown.tsx
│   │       ├── comment-summary.tsx
│   │       └── export-button.tsx
│   ├── lib/
│   │   ├── prisma.ts                   # Prisma client singleton
│   │   ├── auth.ts                     # NextAuth config
│   │   ├── permissions.ts              # RBAC helper functions
│   │   ├── tokens.ts                   # Token generation & validation
│   │   ├── email.ts                    # Email sending (Nodemailer SMTP)
│   │   ├── encryption.ts              # AES-256-GCM encrypt/decrypt, key derivation
│   │   ├── otp.ts                     # OTP generation, hashing, verification
│   │   ├── utils.ts                    # General utilities
│   │   └── constants.ts
│   ├── hooks/
│   │   ├── use-current-user.ts
│   │   ├── use-company.ts
│   │   └── use-permissions.ts
│   ├── store/
│   │   └── template-builder.ts         # Zustand store for form builder
│   └── types/
│       ├── evaluation.ts
│       ├── team.ts
│       └── report.ts
├── public/
│   ├── logo.svg
│   └── og-image.png
├── .env.local
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Design System — Apple-Inspired

### Design Principles

1. **Clarity** — Clean typography, generous whitespace, purposeful hierarchy
2. **Deference** — Content-first, UI fades into background
3. **Depth** — Subtle shadows, layered surfaces, smooth transitions
4. **Precision** — Pixel-perfect alignment, consistent spacing scale

### Color Palette

```css
/* globals.css */
:root {
  /* Neutrals — warm gray tones */
  --gray-50: #fafafa;
  --gray-100: #f5f5f7;
  --gray-200: #e8e8ed;
  --gray-300: #d2d2d7;
  --gray-400: #a1a1a6;
  --gray-500: #86868b;
  --gray-600: #6e6e73;
  --gray-700: #48484a;
  --gray-800: #2c2c2e;
  --gray-900: #1d1d1f;
  --gray-950: #0a0a0a;

  /* Brand — refined blue */
  --brand-50: #eff6ff;
  --brand-100: #dbeafe;
  --brand-500: #0071e3;
  --brand-600: #0058b9;
  --brand-700: #004493;

  /* Semantic */
  --success: #34c759;
  --warning: #ff9f0a;
  --error: #ff3b30;
  --info: #5ac8fa;

  /* Surfaces */
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f7;
  --bg-tertiary: #fafafa;
  --bg-elevated: #ffffff;
  --bg-sidebar: #f5f5f7;

  /* Borders */
  --border-default: #e8e8ed;
  --border-subtle: #f0f0f2;

  /* Shadows */
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 12px 40px rgba(0, 0, 0, 0.12);
  --shadow-card: 0 0 0 1px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.06);

  /* Border radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-full: 9999px;

  /* Typography */
  --font-sans: 'SF Pro Display', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Inter', system-ui, sans-serif;
  --font-mono: 'SF Mono', 'JetBrains Mono', 'Fira Code', monospace;
}

/* Dark mode */
[data-theme="dark"] {
  --bg-primary: #000000;
  --bg-secondary: #1c1c1e;
  --bg-tertiary: #2c2c2e;
  --bg-elevated: #1c1c1e;
  --bg-sidebar: #0a0a0a;
  --border-default: #38383a;
  --border-subtle: #2c2c2e;
  --gray-50: #1d1d1f;
  --gray-900: #f5f5f7;
}
```

### Typography Scale

```css
/* Apple-style type scale */
.text-title-large   { font-size: 34px; font-weight: 700; letter-spacing: -0.01em; line-height: 1.1; }
.text-title          { font-size: 28px; font-weight: 700; letter-spacing: -0.01em; line-height: 1.15; }
.text-title-small    { font-size: 22px; font-weight: 600; letter-spacing: -0.005em; line-height: 1.2; }
.text-headline       { font-size: 17px; font-weight: 600; line-height: 1.3; }
.text-body           { font-size: 15px; font-weight: 400; line-height: 1.5; }
.text-body-emphasis  { font-size: 15px; font-weight: 600; line-height: 1.5; }
.text-callout        { font-size: 14px; font-weight: 400; line-height: 1.45; }
.text-caption        { font-size: 12px; font-weight: 400; line-height: 1.35; color: var(--gray-500); }
```

### Component Patterns

**Cards** — No hard borders, subtle shadow + 1px border:
```tsx
<div className="bg-white rounded-2xl shadow-[var(--shadow-card)] border border-gray-100/50 p-6">
```

**Buttons** — Pill-shaped primary, rounded secondary:
```tsx
// Primary
<button className="bg-[#0071e3] hover:bg-[#0058b9] text-white rounded-full px-6 py-2.5 text-[15px] font-medium transition-all duration-200">

// Secondary
<button className="bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-full px-6 py-2.5 text-[15px] font-medium transition-all duration-200">

// Ghost
<button className="hover:bg-gray-100 text-gray-600 rounded-xl px-4 py-2 text-[15px] transition-all duration-200">
```

**Inputs** — Minimal, focus ring on brand color:
```tsx
<input className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white text-[15px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 focus:border-[#0071e3] transition-all duration-200" />
```

**Sidebar** — Translucent with backdrop blur:
```tsx
<aside className="w-[260px] h-screen bg-[#f5f5f7]/80 backdrop-blur-xl border-r border-gray-200/50 p-4">
```

**Animations** — Smooth, spring-like transitions:
```css
.transition-apple {
  transition: all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
}
```

### Iconography

Use **Lucide React** icons with:
- `strokeWidth={1.5}` (thinner, Apple-like feel)
- `size={20}` for UI elements, `size={16}` for inline

---

## Key Feature Specifications

### 1. Dashboard (Company-level)

The dashboard is the landing page after login for Admin/HR users:

- **Stats row**: Active cycles, Total teams, Pending evaluations, Completion rate
- **Active cycle card**: Progress bar, deadline, quick actions
- **Recent activity feed**: Submissions, new assignments, cycle status changes
- **Completion heatmap**: Per-team completion rates

### 2. Evaluation Cycles

Lifecycle: `DRAFT → ACTIVE → CLOSED → ARCHIVED`

- **Create cycle**: Select template, set date range, assign teams/individuals
- **Assignment matrix**: Visual grid of who evaluates whom (auto-generated from team structure)
- **Bulk actions**: Send reminders, extend deadlines, close early
- **When ACTIVE**: Generates unique tokenized links per assignment, sends email invitations

### 3. Teams

- Each team has a name, description, and members
- Members have one of two roles: **Manager** or **Member**
- **Multiple managers per team** are supported (co-leads, matrix reporting)
- **Multiple members per team** are supported
- Team structure drives automatic assignment generation in cycles:
  - **Downward**: Manager evaluates each Member
  - **Upward**: Each Member evaluates their Manager(s)
  - **Lateral**: Members evaluate each other as peers
- Team cards and detail pages show evaluation direction badges with counts

### 4. Evaluation Templates (Form Builder)

**Super Admin (SaaS Owner)** can create global templates available to all companies.
**Company Admins** can create company-specific templates.

Template structure:
```typescript
interface EvaluationTemplate {
  sections: {
    title: string;
    description?: string;
    questions: {
      id: string;
      text: string;
      type: "rating_scale" | "text" | "multiple_choice" | "yes_no" | "competency_matrix";
      required: boolean;
      options?: string[];          // For multiple_choice
      scaleMin?: number;           // For rating_scale (default 1)
      scaleMax?: number;           // For rating_scale (default 5)
      scaleLabels?: string[];      // e.g., ["Needs Improvement", ..., "Exceptional"]
      conditionalOn?: string;      // Show only if another question has specific answer
    }[];
  }[];
}
```

Form builder UI: drag-and-drop sections & questions, live preview panel, template duplication.

### 5. Link-Based Submission

```
Flow:
1. Admin creates cycle → Assignments auto-generated from team structure
2. System generates unique token per assignment
3. Email sent with link: https://app.perform360.com/evaluate/{token}
4. Reviewer opens link → OTP verification screen shown
5. System sends 6-digit OTP to reviewer's email
6. Reviewer enters OTP → form loads (session valid for 2 hours)
7. Reviewer fills form → in-memory auto-save only (no server drafts)
8. Reviewer MUST complete and submit within the session — closing the browser loses progress
9. Reviewer submits → data encrypted with company key → status SUBMITTED
10. Only company Admin/HR can decrypt and view results in Reports section
11. SaaS owner / Super Admin has NO access to evaluation data
```

- Token validated on page load — expired/invalid tokens show error
- Auto-save draft functionality (encrypted, in-memory only — lost if session expires or browser closes)
- **No cross-session draft persistence** — reviewer must complete the form within the 2-hour OTP session
- Progress indicator showing completion percentage
- Mobile-responsive form layout

### 6. Reports

**Individual Report** (per person, per cycle):
- Overall score with radar chart across competency areas
- Score breakdown by evaluator relationship (manager avg, peer avg, direct report avg, self)
- Per-question detail with distribution visualization
- Anonymized open-text feedback (grouped by relationship type)
- Trend comparison (if previous cycles exist)
- PDF export

**Cycle Report** (aggregate):
- Completion rates per team
- Score distributions across company
- Top strengths/areas for improvement (aggregated)
- Participation analytics

### 7. Admin Settings

- Company profile (name, logo, slug)
- User management (invite, deactivate, change roles)
- Default evaluation settings
- Email notification preferences
- Encryption settings (passphrase, key rotation, recovery codes)

### 8. Super Admin Panel (SaaS Owner)

Accessible only to Perform360 platform operators (SaaS owners). This is completely separate from any company's admin dashboard.

- View/manage all registered companies (tenants)
- Global template management (CRUD) — templates available to all companies
- Platform-wide analytics (total companies, active cycles, total users, MRR)
- Feature flag management
- Company management and onboarding oversight
- Platform configuration (default settings for new companies)
- Ability to impersonate company admins for support/debugging

---

## API Routes

```
POST   /api/auth/[...nextauth]     # Authentication
GET    /api/dashboard/stats         # Dashboard statistics

# Cycles
GET    /api/cycles                  # List cycles (company-scoped)
POST   /api/cycles                  # Create cycle
GET    /api/cycles/[id]             # Get cycle detail
PATCH  /api/cycles/[id]             # Update cycle (status, dates)
DELETE /api/cycles/[id]             # Delete cycle (DRAFT only)
POST   /api/cycles/[id]/activate    # Activate and send invitations
POST   /api/cycles/[id]/remind      # Send reminder emails

# Teams
GET    /api/teams                   # List teams
POST   /api/teams                   # Create team
GET    /api/teams/[id]              # Get team with members
PATCH  /api/teams/[id]              # Update team
DELETE /api/teams/[id]              # Delete team
POST   /api/teams/[id]/members      # Add member
DELETE /api/teams/[id]/members/[uid] # Remove member

# Templates
GET    /api/templates               # List templates (company + global)
POST   /api/templates               # Create template
GET    /api/templates/[id]          # Get template
PATCH  /api/templates/[id]          # Update template
DELETE /api/templates/[id]          # Delete template

# Public evaluation (OTP-protected)
GET    /api/evaluate/[token]        # Validate token, show OTP screen
POST   /api/evaluate/[token]/otp/send    # Send OTP to reviewer's email
POST   /api/evaluate/[token]/otp/verify  # Verify OTP, issue session cookie
GET    /api/evaluate/[token]/form   # Get form (requires valid OTP session)
POST   /api/evaluate/[token]        # Submit evaluation (encrypted)

# Reports (Admin/HR only)
GET    /api/reports/cycle/[id]              # Cycle aggregate report
GET    /api/reports/cycle/[id]/user/[uid]   # Individual report
GET    /api/reports/cycle/[id]/export       # PDF export

# Users
GET    /api/users                   # List company users
POST   /api/users/invite            # Invite user
PATCH  /api/users/[id]              # Update user role
DELETE /api/users/[id]              # Deactivate user

# Super Admin (SaaS Owner only)
GET    /api/admin/companies         # List all tenant companies
POST   /api/admin/companies         # Create company manually
PATCH  /api/admin/companies/[id]    # Update company (status, settings)
GET    /api/admin/templates         # Global templates
POST   /api/admin/templates         # Create global template
PATCH  /api/admin/templates/[id]    # Update global template
DELETE /api/admin/templates/[id]    # Delete global template
GET    /api/admin/stats             # Platform-wide stats (MRR, usage)
POST   /api/admin/impersonate/[id]  # Impersonate company admin (support)
```

---

## Security Requirements

### End-to-End Encryption (E2EE for Evaluation Data)

**Core principle**: Evaluation response data is encrypted at the company level. The SaaS platform owner / Super Admin **cannot** read any evaluation responses. Only authenticated company Admin/HR users can decrypt and view data.

**Encryption Architecture — Envelope Encryption with Company-Owned Keys:**

```
┌─────────────────────────────────────────────────────────┐
│  KEY HIERARCHY                                          │
│                                                         │
│  Company Master Key (derived from company admin's       │
│  passphrase via Argon2id)                               │
│       │                                                 │
│       ├── Encrypts → Company Data Key (AES-256)         │
│       │                  │                              │
│       │                  ├── Encrypts → Response Data   │
│       │                  └── Encrypts → Report Cache    │
│       │                                                 │
│       └── Stored as: encryptionKeyEncrypted in DB       │
│           (platform CANNOT decrypt without passphrase)  │
└─────────────────────────────────────────────────────────┘
```

**How it works:**

```
COMPANY ONBOARDING:
1. Company admin sets an "Encryption Passphrase" during setup
2. Passphrase → Argon2id → Master Key (never stored anywhere)
3. System generates random AES-256 Data Key
4. Data Key encrypted with Master Key → stored as encryptionKeyEncrypted
5. Admin must remember passphrase (recovery via pre-generated recovery codes)

ENCRYPTING (on submission):
1. Reviewer submits evaluation form
2. Server retrieves company's encryptionKeyEncrypted
3. Company admin's session holds decrypted Data Key in memory (from login)
4. Data Key + AES-256-GCM → encrypt answers JSON
5. Store: answersEncrypted + answersIv + answersTag + keyVersion
6. Plain text answers NEVER written to database

DECRYPTING (admin viewing reports):
1. Admin/HR user logs in → enters encryption passphrase (cached in session)
2. Passphrase → Argon2id → Master Key → decrypts Data Key
3. Data Key + IV + Tag → decrypt answersEncrypted → plain JSON
4. Reports rendered server-side, decrypted data never sent to client unprotected

KEY ROTATION:
1. Admin can rotate Data Key from settings
2. New Data Key generated, encrypted with same Master Key
3. keyVersion incremented
4. Background job re-encrypts existing responses with new key
5. Old key kept until migration complete
```

**What the SaaS owner / Super Admin CAN see:**
- Company names, user counts, usage metrics
- Template structures (questions, not answers)
- Cycle metadata (dates, status, completion counts)
- Assignment metadata (who is assigned to evaluate whom)

**What the SaaS owner / Super Admin CANNOT see:**
- Evaluation responses/answers (encrypted at rest)
- Report content (decrypted only in company admin session)
- Open-text feedback (encrypted within answer blobs)

> **⚠️ Strict E2EE Policy**: If the company admin loses both their encryption passphrase AND all recovery codes, evaluation data is **permanently unrecoverable**. There is no backdoor, no escrow, and no SaaS-level recovery mechanism. This is by design — it is the cryptographic guarantee that the SaaS owner cannot access tenant data.

### OTP Security

```typescript
// OTP Configuration
const OTP_CONFIG = {
  length: 6,                    // 6-digit numeric OTP
  expiryMinutes: 10,            // OTP expires after 10 minutes
  maxAttempts: 3,               // Max wrong attempts before cooldown
  cooldownMinutes: 15,          // Cooldown after max attempts
  sessionDurationHours: 2,      // Verified session duration
  hashAlgorithm: 'bcrypt',      // OTP stored as bcrypt hash
  rateLimitPerEmail: 5,         // Max OTP sends per email per hour
};
```

**OTP Implementation Details:**

```
SEND OTP:
1. Validate token exists and assignment is ACTIVE
2. Check rate limit (5 sends/email/hour)
3. Generate cryptographically random 6-digit OTP
4. Hash OTP with bcrypt (cost factor 10)
5. Store hash + expiry + email in OtpSession
6. Send OTP via Nodemailer SMTP (branded HTML template)
7. Return { success: true, expiresIn: 600 }

VERIFY OTP:
1. Find latest OtpSession for assignment
2. Check cooldown (reject if cooldownUntil > now)
3. Check expiry (reject if expiresAt < now)
4. Compare submitted OTP against bcrypt hash
5. If wrong: increment attempts, set cooldown at 3
6. If correct: set verifiedAt, generate sessionToken (cuid)
7. Set sessionExpiry to now + 2 hours
8. Return sessionToken as httpOnly cookie

VALIDATE SESSION:
1. Read sessionToken from httpOnly cookie
2. Find OtpSession with matching token
3. Verify sessionExpiry > now
4. Verify assignmentId matches route param
5. Allow form access
```

### General Security

- **All API routes** must verify authentication via NextAuth session (dashboard) or OTP session (evaluation forms)
- **Super Admin isolation**: `/api/admin/*` routes verify the user is a Perform360 SaaS owner — completely separate from company-level Admin role. Super Admins are stored in the `SuperAdmin` table, not the `User` table. Super Admins have **NO** access to encrypted evaluation data.
- **Company isolation**: Every tenant query scoped to `companyId` from session — never trust client-provided company IDs
- **RBAC middleware**: Check `user.role` before returning sensitive data (reports, admin features)
- **Token validation**: Evaluation tokens must be validated for existence, expiry, and assignment status
- **Public routes** (`/evaluate/[token]`): OTP-gated, no password/account needed
- **Rate limiting**: OTP sends (5/email/hour), OTP verifies (3 attempts/session), API calls (100/min/IP)
- **Input sanitization**: Zod validation on all API inputs
- **CSRF protection**: Built-in via NextAuth + SameSite cookies
- **No data leaks**: Evaluation responses encrypted at rest, Super Admin excluded from decryption chain
- **Encryption at rest**: AES-256-GCM for all evaluation response data
- **Encryption in transit**: TLS 1.3 enforced
- **Passphrase recovery**: Pre-generated recovery codes (stored hashed), displayed once during company setup. **No escrow, no backdoor** — lost passphrase + lost codes = permanent data loss by design.
- **Audit log**: All decryption events logged (who, when, which records) — visible to company Admin only
- **Impersonation audit trail**: All super admin sessions logged with timestamp, target company, and actions taken

---

## Coding Conventions

### General

- Use TypeScript strict mode everywhere — no `any` types
- Use Server Components by default, `"use client"` only when needed (interactivity, hooks)
- Colocate related files (component + types + tests in same directory)
- Use `@/` path alias for imports from `src/`
- Error boundaries on every page layout
- Loading skeletons (not spinners) for async content

### Naming

- **Files**: `kebab-case.tsx` for components, `camelCase.ts` for utilities
- **Components**: `PascalCase`
- **Functions/variables**: `camelCase`
- **Constants**: `SCREAMING_SNAKE_CASE`
- **Database columns**: `camelCase` (Prisma convention)
- **API routes**: RESTful, kebab-case URLs

### Data Fetching

- Use Server Components with direct Prisma calls for read operations
- Use Server Actions for mutations
- Use `unstable_cache` or `revalidatePath` for cache management
- API routes only for webhook handlers and public endpoints (evaluation form)

### Error Handling

```typescript
// Consistent API response shape
type ApiResponse<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
  code?: string;
};
```

### Commit Messages

```
feat: add evaluation template builder
fix: resolve team member role assignment bug
refactor: extract RBAC middleware
docs: update API documentation
style: align dashboard card spacing
```

---

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."

# Auth
NEXTAUTH_URL="https://app.perform360.com"
NEXTAUTH_SECRET="..."

# Email (SMTP)
SMTP_HOST="..."
SMTP_PORT="587"
SMTP_USER="..."
SMTP_PASSWORD="..."
SMTP_FROM="noreply@perform360.com"

# App
NEXT_PUBLIC_APP_URL="https://app.perform360.com"
```

---

## Development Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint
npm run typecheck    # TypeScript check
npm run db:push      # Push schema to database
npm run db:migrate   # Run migrations
npm run db:seed      # Seed database
npm run db:studio    # Open Prisma Studio
```
