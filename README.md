# Perform360

Perform360 is a 360-degree performance evaluation platform built with Next.js, Prisma, and PostgreSQL.

## Production Deployment (Docker Compose + External Postgres)

This repository is configured to run production with:
- `app` service (Next.js server)
- `worker` service (background jobs, optional profile)
- `migrate` service (Prisma migrations, one-off profile)
- external PostgreSQL (not inside Docker)

## Prerequisites

- Docker + Docker Compose installed
- A reachable PostgreSQL instance
- SMTP credentials for email login/invites
- A public domain (recommended for production)

## 1) Configure Environment

Create production env file:

```bash
cp .env.production.example .env.production
```

Edit `.env.production` with real values:

```env
DATABASE_URL=postgresql://USER:PASSWORD@DB_HOST:5432/perform360?schema=public

NEXTAUTH_SECRET=replace-with-a-strong-random-secret
NEXTAUTH_URL=https://app.example.com
NEXT_PUBLIC_APP_URL=https://app.example.com

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=smtp-user
SMTP_PASSWORD=smtp-password
SMTP_FROM=noreply@example.com

SUPER_ADMIN_EMAIL=admin@perform360.com
SUPER_ADMIN_NAME=Perform360 Admin
```

Notes:
- `NEXTAUTH_SECRET` must be strong and random.
- `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` should be your production URL.
- `DATABASE_URL` must point to your external PostgreSQL.

## 2) Build and Start App

```bash
docker compose up -d --build
```

This starts the `app` service on port `3000`.

## 3) Run Database Migrations

```bash
docker compose --profile migrate run --rm migrate
```

Run this after first deploy and on schema changes.

## 4) Start Worker (Recommended)

```bash
docker compose --profile worker up -d worker
```

The worker processes async jobs (reminders, cleanup, key rotation jobs, etc.).

## 5) Verify

Check containers:

```bash
docker compose ps
```

Check logs:

```bash
docker compose logs -f app
docker compose logs -f worker
```

App health endpoint check (current healthcheck target):
- `http://YOUR_HOST:3000/login`

## Common Operations

Redeploy after code changes:

```bash
docker compose up -d --build
docker compose --profile migrate run --rm migrate
```

Restart services:

```bash
docker compose restart app
docker compose --profile worker restart worker
```

Stop everything:

```bash
docker compose down
```

## Security Recommendations

- Keep `.env.production` out of git.
- Use a long random `NEXTAUTH_SECRET`.
- Restrict database network access to trusted hosts.
- Terminate TLS at a reverse proxy (Nginx/Caddy/Cloud LB) in front of port `3000`.

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.
