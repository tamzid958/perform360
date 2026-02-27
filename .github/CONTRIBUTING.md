# Contributing to Performs360

Thank you for your interest in contributing! This guide covers how to get involved.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Install dependencies: `npm install`
4. Copy `.env.example` to `.env` and configure
5. Run database migrations: `npm run db:migrate`
6. Start the dev server: `npm run dev`

## Development Workflow

1. Create a branch from `master` for your change
2. Make your changes with clear, focused commits
3. Follow [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`
4. Run linting and tests before submitting:
   ```bash
   npm run lint
   npm run typecheck
   npm run test
   ```
5. Open a pull request against `master`

## Pull Request Guidelines

- Keep PRs focused — one logical change per PR
- Include a clear description of what and why
- Add or update tests for any new behavior
- Ensure CI passes before requesting review

## Reporting Bugs

Open an issue with:

- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node version, Docker version)

## Requesting Features

Open an issue describing:

- The problem you're trying to solve
- Your proposed solution (if any)
- Any alternatives you've considered

## Code Style

- TypeScript strict mode enabled
- ESLint config is in `eslint.config.mjs` — follow it
- Prefer functional patterns and early returns
- Keep files under 300 lines

## License

By contributing, you agree that your contributions will be licensed under the project's [Business Source License 1.1](LICENSE).
