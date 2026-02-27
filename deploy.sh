#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────
# Performs360 — One-Command Interactive Deployment Script
#
# Usage:
#   bash <(curl -fsSL https://raw.githubusercontent.com/tamzid-performs360/performs360/production/deploy.sh)
#
#   or download first:
#   curl -fsSL https://raw.githubusercontent.com/tamzid-performs360/performs360/production/deploy.sh -o deploy.sh
#   bash deploy.sh
# ─────────────────────────────────────────────────────────
set -euo pipefail

# ── Colors & helpers ─────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

info()    { echo -e "${CYAN}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

prompt_with_default() {
  local varname="$1" prompt="$2" default="$3"
  read -rp "$(echo -e "${BOLD}${prompt}${NC} [${default}]: ")" value
  eval "$varname='${value:-$default}'"
}

prompt_required() {
  local varname="$1" prompt="$2"
  local value=""
  while [[ -z "$value" ]]; do
    read -rp "$(echo -e "${BOLD}${prompt}${NC}: ")" value
    [[ -z "$value" ]] && warn "This field is required."
  done
  eval "$varname='$value'"
}

prompt_secret() {
  local varname="$1" prompt="$2"
  local value=""
  while [[ -z "$value" ]]; do
    read -srp "$(echo -e "${BOLD}${prompt}${NC}: ")" value
    echo
    [[ -z "$value" ]] && warn "This field is required."
  done
  eval "$varname='$value'"
}

prompt_secret_optional() {
  local varname="$1" prompt="$2"
  read -srp "$(echo -e "${BOLD}${prompt}${NC} (press Enter to skip): ")" value
  echo
  eval "$varname='$value'"
}

# ── Banner ───────────────────────────────────────────────
echo ""
echo -e "${BOLD}${CYAN}"
echo "  ╔═══════════════════════════════════════════════╗"
echo "  ║       Performs360 — Production Deployment     ║"
echo "  ║       Self-Hosted 360 Performance Reviews     ║"
echo "  ╚═══════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# ── Prerequisites check ─────────────────────────────────
info "Checking prerequisites..."

check_command() {
  if ! command -v "$1" &>/dev/null; then
    error "$1 is required but not installed. Please install it first.\n  $2"
  fi
  success "$1 found: $(command -v "$1")"
}

check_command "git"    "https://git-scm.com/downloads"
check_command "docker" "https://docs.docker.com/get-docker/"

# Check docker compose (plugin or standalone)
if docker compose version &>/dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
  success "docker compose (plugin) found"
elif command -v docker-compose &>/dev/null; then
  COMPOSE_CMD="docker-compose"
  success "docker-compose (standalone) found"
else
  error "docker compose is required.\n  Install: https://docs.docker.com/compose/install/"
fi

# Check Docker daemon is running
if ! docker info &>/dev/null 2>&1; then
  error "Docker daemon is not running. Please start Docker first."
fi
success "Docker daemon is running"

echo ""

# ── Repository ───────────────────────────────────────────
REPO_URL="https://github.com/tamzid-performs360/performs360.git"
INSTALL_DIR="performs360"

prompt_with_default INSTALL_DIR "Installation directory" "$INSTALL_DIR"

if [[ -d "$INSTALL_DIR" ]]; then
  warn "Directory '$INSTALL_DIR' already exists."
  read -rp "$(echo -e "${BOLD}Pull latest changes? (y/n)${NC} [y]: ")" pull_choice
  pull_choice="${pull_choice:-y}"
  if [[ "$pull_choice" =~ ^[Yy]$ ]]; then
    info "Pulling latest changes..."
    cd "$INSTALL_DIR"
    git pull origin production
    success "Repository updated"
  else
    cd "$INSTALL_DIR"
    info "Using existing directory as-is"
  fi
else
  info "Cloning repository..."
  git clone -b production "$REPO_URL" "$INSTALL_DIR"
  cd "$INSTALL_DIR"
  success "Repository cloned"
fi

echo ""

# ── Configuration ────────────────────────────────────────
info "Let's configure your deployment."
echo -e "${YELLOW}─────────────────────────────────────────${NC}"
echo ""

# App settings
echo -e "${BOLD}${CYAN}1. Application Settings${NC}"
prompt_with_default APP_URL "App URL (your domain)" "http://localhost:3000"
prompt_with_default APP_PORT "App port" "3000"

# Generate NEXTAUTH_SECRET automatically
NEXTAUTH_SECRET=$(openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64)
success "Generated NEXTAUTH_SECRET automatically"

echo ""

# Database settings (external PostgreSQL)
echo -e "${BOLD}${CYAN}2. Database Settings (external PostgreSQL)${NC}"
echo "  Provide the connection URL to your existing PostgreSQL database."
echo "  Format: postgresql://USER:PASSWORD@HOST:5432/DBNAME?schema=public"
echo ""
prompt_required DATABASE_URL "Database URL"

echo ""

# Email settings
echo -e "${BOLD}${CYAN}3. Email Settings${NC}"
echo "  Email is used for sending OTP codes and review invitations."
echo "  Providers: resend | brevo | smtp"
echo ""
prompt_with_default EMAIL_PROVIDER "Email provider" "smtp"
prompt_with_default EMAIL_FROM "From address" "Performs360 <noreply@performs360.com>"

RESEND_API_KEY=""
BREVO_API_KEY=""
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASS=""

case "$EMAIL_PROVIDER" in
  resend)
    prompt_required RESEND_API_KEY "Resend API key"
    ;;
  brevo)
    prompt_required BREVO_API_KEY "Brevo API key"
    ;;
  smtp)
    prompt_with_default SMTP_HOST "SMTP host" "smtp.gmail.com"
    prompt_with_default SMTP_PORT "SMTP port" "587"
    prompt_required SMTP_USER "SMTP username"
    prompt_secret SMTP_PASS "SMTP password"
    ;;
  *)
    error "Unknown email provider: $EMAIL_PROVIDER"
    ;;
esac

echo ""

# ── Write .env ───────────────────────────────────────────
info "Writing .env file..."

cat > .env <<ENVFILE
# ─────────────────────────────────────────────────────────
# Performs360 — Production Environment
# Generated by deploy.sh on $(date -u +"%Y-%m-%d %H:%M:%S UTC")
# ─────────────────────────────────────────────────────────

DATABASE_URL=${DATABASE_URL}

NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
NEXTAUTH_URL=${APP_URL}
NEXT_PUBLIC_APP_URL=${APP_URL}

# Email provider: resend | brevo | smtp
EMAIL_PROVIDER=${EMAIL_PROVIDER}

# Resend
RESEND_API_KEY=${RESEND_API_KEY}

# Brevo
BREVO_API_KEY=${BREVO_API_KEY}

# SMTP
SMTP_HOST=${SMTP_HOST}
SMTP_PORT=${SMTP_PORT}
SMTP_USER=${SMTP_USER}
SMTP_PASS=${SMTP_PASS}

EMAIL_FROM="${EMAIL_FROM}"
ENVFILE

success ".env file written"
echo ""

# ── Build & Deploy ───────────────────────────────────────
echo -e "${YELLOW}─────────────────────────────────────────${NC}"
echo -e "${BOLD}${CYAN}Ready to deploy!${NC}"
echo ""
echo "  App URL:        $APP_URL"
echo "  Port:           $APP_PORT"
echo "  Database:       (external PostgreSQL)"
echo "  Email provider: $EMAIL_PROVIDER"
echo ""

read -rp "$(echo -e "${BOLD}Start deployment? (y/n)${NC} [y]: ")" deploy_choice
deploy_choice="${deploy_choice:-y}"

if [[ ! "$deploy_choice" =~ ^[Yy]$ ]]; then
  info "Deployment cancelled. Your .env is saved — run '$COMPOSE_CMD up -d --build' when ready."
  exit 0
fi

echo ""
info "Building and starting containers (this may take a few minutes on first run)..."
echo ""

$COMPOSE_CMD up -d --build

echo ""

# ── Health check ─────────────────────────────────────────
info "Waiting for the app to become healthy..."
MAX_WAIT=60
WAITED=0
while [[ $WAITED -lt $MAX_WAIT ]]; do
  if curl -sf "http://localhost:${APP_PORT}" >/dev/null 2>&1; then
    break
  fi
  sleep 2
  WAITED=$((WAITED + 2))
  printf "."
done
echo ""

if [[ $WAITED -ge $MAX_WAIT ]]; then
  warn "App did not respond within ${MAX_WAIT}s — it may still be starting."
  warn "Check logs with: $COMPOSE_CMD logs -f app"
else
  success "App is responding!"
fi

echo ""

# ── Done ─────────────────────────────────────────────────
echo -e "${BOLD}${GREEN}"
echo "  ╔═══════════════════════════════════════════════╗"
echo "  ║       Deployment Complete!                    ║"
echo "  ╚═══════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""
echo -e "  ${BOLD}App:${NC}       ${APP_URL}"
echo -e "  ${BOLD}Logs:${NC}      $COMPOSE_CMD logs -f"
echo -e "  ${BOLD}Stop:${NC}      $COMPOSE_CMD down"
echo -e "  ${BOLD}Restart:${NC}   $COMPOSE_CMD restart"
echo -e "  ${BOLD}Update:${NC}    git pull && $COMPOSE_CMD up -d --build"
echo ""
echo -e "  ${YELLOW}First time? Visit ${APP_URL}/setup-encryption to initialize.${NC}"
echo ""
