# Performs360

A multi-tenant 360-degree performance evaluation SaaS platform. Companies create evaluation cycles, assign peer/manager/self/external reviewers, collect encrypted feedback, calibrate scores, and export reports.

## Quick Start

```bash
git clone <repo-url> && cd Perform360
npm install
cp .env.production.example .env    # fill in values
npx prisma migrate dev             # set up database
npm run dev                        # http://localhost:3000
```

## Stack

| Layer        | Technology                                                    |
| ------------ | ------------------------------------------------------------- |
| Framework    | Next.js 16 (App Router)                                       |
| Language     | TypeScript 5                                                  |
| Database     | PostgreSQL + Prisma ORM                                       |
| Auth         | NextAuth v5 (email magic-link + OTP for external reviewers)   |
| Encryption   | AES-256-GCM (company-owned keys, scrypt derivation)           |
| UI           | Tailwind CSS, Radix UI, Lucide icons, Framer Motion           |
| Rich Text    | Tiptap editor                                                 |
| Charts       | Recharts                                                      |
| Forms        | React Hook Form + Zod validation                              |
| State        | Zustand                                                       |
| Email        | Pluggable providers (Resend / Brevo / SMTP)                   |
| Background   | Postgres-backed job queue + worker process                    |
| Exports      | PDF (PDFKit) + Excel (ExcelJS)                                |
| Analytics    | Mixpanel                                                      |
| Bot Defense  | Google reCAPTCHA v3                                           |
| Testing      | Vitest (unit/contract) + Playwright (E2E/a11y)                |
| Deploy       | Docker Compose (app + worker + migrate containers)            |

## Features

### Multi-Tenant Architecture
- Company isolation via tenant-scoped queries and middleware
- Company selector for users belonging to multiple organizations
- Super Admin panel for platform-wide management

### Evaluation Cycles
- Create cycles with start/end dates, assign teams and templates
- Lifecycle: Draft → Active → Closed → Archived
- Auto-generate reviewer assignments (manager, peer, self, direct report, external)
- Configurable relationship weights per team (e.g., 40% manager, 30% peer, 20% self, 10% external)
- Send reminder emails to pending reviewers

### Templates
- Build evaluation templates with sections and questions
- Question types with configurable options and required flags
- Global templates (managed by Super Admin) and company-specific templates
- Drag-and-drop reordering

### Review Collection
- Token-based reviewer access (no account required for external reviewers)
- OTP authentication for reviewer identity verification
- In-progress save and resume

### Encryption & Privacy
- Company-owned AES-256-GCM encryption for all review responses
- Passphrase-based key derivation (scrypt) — SaaS operator cannot access data
- Key rotation support with re-encryption
- Recovery codes for passphrase loss
- Encryption setup wizard and management UI

### Calibration
- Post-evaluation score calibration per team and per individual
- Team-level calibration offsets with justification
- Individual score adjustments with audit trail

### Reports & Exports
- Per-user evaluation reports with score breakdowns by relationship type
- Cycle-wide reports dashboard
- PDF report generation (individual)
- Excel export (cycle-wide)
- Background job processing for large exports

### People & Teams
- User management with roles (Admin, HR, Employee, External)
- Team creation with Manager/Member/External roles
- Bulk team import
- User archival (soft delete)

### Role-Based Access Control
- **Admin** — full access including settings and encryption management
- **HR** — cycles, teams, templates, reports, people management
- **Employee** — view-only dashboard
- **External** — review access only (token-based)
- **Super Admin** — platform-wide company and template management

### Security
- Rate limiting on sensitive endpoints
- OTP with attempt limits and cooldown
- Audit logging (decryption, role changes, invites, cycle activations)
- Session validation and impersonation support (Super Admin)
- reCAPTCHA v3 on public forms
- Docker `no-new-privileges` security option

### Additional
- Company logo upload and branding
- Company data export and destroy (GDPR)
- AI-powered blog generation (Ollama integration, Super Admin managed)
- SEO pages (blog, pricing, terms, privacy, security policy)
- Dark mode support
- Mixpanel analytics integration
- Responsive sidebar with collapse

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Login, register, verify
│   ├── (dashboard)/         # Main app pages
│   │   ├── overview/        # Dashboard with stats + activity
│   │   ├── cycles/          # Evaluation cycles + reports
│   │   ├── teams/           # Team management + import
│   │   ├── templates/       # Evaluation templates
│   │   ├── people/          # User management
│   │   ├── settings/        # Company settings, roles, encryption
│   │   └── profile/         # User profile
│   ├── (public)/            # Token-based review + evaluate pages
│   ├── (superadmin)/        # Super Admin panel
│   ├── (company-select)/    # Multi-company selector
│   ├── (setup)/             # Encryption setup wizard
│   └── api/                 # API routes (50+ endpoints)
├── components/
│   └── layout/              # Sidebar, nav items
├── hooks/                   # Custom React hooks
└── lib/
    ├── email/               # Pluggable email providers
    ├── jobs/                # Background job handlers
    ├── middleware/           # RBAC, company scope, super admin
    ├── pdf/                 # PDF report renderer
    ├── excel/               # Excel report renderer
    ├── encryption.ts        # AES-256-GCM encryption utilities
    ├── permissions.ts       # Role-based permission checks
    ├── queue.ts             # Postgres job queue
    └── audit.ts             # Audit logging
prisma/
├── schema.prisma            # Database schema (18 models)
└── seed.ts                  # Database seeder
```

## Development

```bash
npm run dev              # Start Next.js dev server
npm run lint             # ESLint
npm run typecheck        # TypeScript check
npm run test             # Vitest unit tests
npm run test:watch       # Vitest watch mode
npm run test:coverage    # Vitest with coverage
npm run test:e2e         # Playwright E2E tests
npm run test:e2e:ui      # Playwright UI mode
npm run test:a11y        # Accessibility tests
npm run test:contract    # Contract tests (requires .env.test)
```

### Database

```bash
npm run db:push          # Push schema to database
npm run db:migrate       # Run migrations
npm run db:seed          # Seed database
npm run db:studio        # Open Prisma Studio
npm run db:clean         # Reset database (destructive)
```

### Background Worker

```bash
npm run worker           # Start job queue worker
```

Processes: email delivery, report exports, encryption key rotation, cleanup, blog generation.

## Environment Variables

| Variable                         | Description                          | Required |
| -------------------------------- | ------------------------------------ | -------- |
| `DATABASE_URL`                   | PostgreSQL connection string         | Yes      |
| `NEXTAUTH_SECRET`                | Random secret for session signing    | Yes      |
| `NEXTAUTH_URL`                   | App base URL                         | Yes      |
| `NEXT_PUBLIC_APP_URL`            | Public-facing app URL                | Yes      |
| `EMAIL_PROVIDER`                 | `resend` / `brevo` / `smtp`         | Yes      |
| `RESEND_API_KEY`                 | Resend API key (if provider=resend)  | Cond.    |
| `BREVO_API_KEY`                  | Brevo API key (if provider=brevo)    | Cond.    |
| `SMTP_HOST` / `PORT` / `USER` / `PASS` | SMTP config (if provider=smtp) | Cond.    |
| `EMAIL_FROM`                     | Sender email address                 | Yes      |
| `SUPER_ADMIN_EMAIL`              | Platform super admin email           | Yes      |
| `SUPER_ADMIN_NAME`               | Platform super admin display name    | Yes      |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | reCAPTCHA v3 site key                | No       |
| `RECAPTCHA_SECRET_KEY`           | reCAPTCHA v3 secret key              | No       |
| `NEXT_PUBLIC_MIXPANEL_TOKEN`     | Mixpanel analytics token             | No       |

## Production Deployment

### Docker Compose (recommended)

```bash
cp .env.production.example .env.production   # configure values
docker compose up -d --build                 # start app
docker compose --profile migrate run --rm migrate  # run migrations
docker compose --profile worker up -d worker       # start worker
```

Services:
- **app** — Next.js server on port 3000
- **worker** — Background job processor
- **migrate** — One-off migration runner
- **seed** — One-off database seeder

### Health Check

```
GET http://localhost:3000/login
```

### Security Recommendations

- Keep `.env.production` out of version control
- Use a strong random `NEXTAUTH_SECRET` (32+ chars)
- Restrict database network access to trusted hosts
- Terminate TLS at a reverse proxy (Nginx / Caddy / Cloud LB)
- Review audit logs regularly

## License

Proprietary. All rights reserved.
