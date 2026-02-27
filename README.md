# Performs360

[![License: BSL 1.1](https://img.shields.io/badge/License-BSL%201.1-blue.svg)](LICENSE)

Self-hosted 360-degree performance review platform. Run reviews, collect multi-source feedback, and generate calibrated reports — all on your own infrastructure.

## Quick Deploy

**One command — installs everything:**

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/tamzid-performs360/performs360/production/deploy.sh)
```

Or download first:

```bash
curl -fsSL https://raw.githubusercontent.com/tamzid-performs360/performs360/production/deploy.sh -o deploy.sh
bash deploy.sh
```

The interactive script will:

1. Check prerequisites (git, docker, docker compose)
2. Clone the repository
3. Walk you through configuration (app URL, database, email)
4. Build and start all containers
5. Run database migrations automatically

### Prerequisites

- **Docker** with Docker Compose (plugin or standalone)
- **Git**
- **PostgreSQL** database (external — bring your own)

## Manual Setup

If you prefer to set things up manually:

```bash
git clone -b production https://github.com/tamzid-performs360/performs360.git
cd performs360
cp .env.production.example .env
# Edit .env with your values
docker compose up -d --build
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Yes | Random secret for session encryption (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Yes | Your app's public URL |
| `NEXT_PUBLIC_APP_URL` | Yes | Same as `NEXTAUTH_URL` |
| `EMAIL_PROVIDER` | Yes | `resend`, `brevo`, or `smtp` |
| `EMAIL_FROM` | Yes | Sender address for emails |
| `RESEND_API_KEY` | If resend | Resend API key |
| `BREVO_API_KEY` | If brevo | Brevo API key |
| `SMTP_HOST` | If smtp | SMTP server host |
| `SMTP_PORT` | If smtp | SMTP server port |
| `SMTP_USER` | If smtp | SMTP username |
| `SMTP_PASS` | If smtp | SMTP password |

## Architecture

```
┌─────────────────────────────────────────────┐
│                 Docker Host                 │
│                                             │
│  ┌─────────────┐      ┌─────────────────┐  │
│  │   App        │      │   Worker         │  │
│  │  (Next.js)   │      │  (Background     │  │
│  │  Port 3000   │      │   job processor) │  │
│  └──────┬───────┘      └────────┬─────────┘  │
│         │                       │            │
│         └───────────┬───────────┘            │
│                     │                        │
└─────────────────────┼────────────────────────┘
                      │
              ┌───────┴────────┐
              │  PostgreSQL    │
              │  (external)    │
              └────────────────┘
```

**Services:**

- **App** — Next.js standalone server (port 3000)
- **Worker** — Background job processor (cycle auto-close, OTP cleanup)
- **Migrate** — Runs Prisma migrations on startup, then exits

## Management

```bash
# View logs
docker compose logs -f

# View app logs only
docker compose logs -f app

# Stop all services
docker compose down

# Restart
docker compose restart

# Update to latest version
git pull origin production
docker compose up -d --build
```

## Post-Install

After deployment, visit `/setup-encryption` to initialize the encryption keys.

## Tech Stack

- **Framework:** Next.js 16 (App Router, standalone output)
- **Database:** PostgreSQL 16 + Prisma ORM
- **Auth:** NextAuth.js v5
- **UI:** Tailwind CSS, Radix UI, Recharts
- **Email:** Resend / Brevo / SMTP (Nodemailer)
- **Language:** TypeScript (strict mode)

## Contributing

See [CONTRIBUTING.md](.github/CONTRIBUTING.md) for development setup and guidelines.

Please note that this project follows a [Code of Conduct](.github/CODE_OF_CONDUCT.md).

## Security

To report a vulnerability, see [SECURITY.md](.github/SECURITY.md).

## License

Licensed under the [Business Source License 1.1](LICENSE). After the change date (2030-03-28), the code converts to Apache License 2.0.
