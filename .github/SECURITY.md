# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| latest  | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly.

**Do not open a public issue.** Instead:

1. Email the maintainers with a description of the vulnerability
2. Include steps to reproduce, if possible
3. Allow reasonable time for a fix before public disclosure

We aim to acknowledge reports within 48 hours and provide a fix or mitigation plan within 7 days for critical issues.

## Security Best Practices for Self-Hosting

- Keep your deployment up to date with the latest release
- Use strong, unique values for all secrets in your `.env` file
- Run behind a reverse proxy (nginx, Caddy) with TLS enabled
- Restrict database access to the application container only
- Regularly back up your database
- Review Docker Compose network settings to avoid exposing internal services
