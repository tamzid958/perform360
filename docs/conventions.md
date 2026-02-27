# Code Conventions

## Naming

- **Files:** `kebab-case.tsx` for components, `camelCase.ts` for utilities (e.g., `button.tsx`, `apiAuth.ts`)
- **Variables/functions:** `camelCase`
- **Components:** `PascalCase` (e.g., `Button`, `TopNav`, `HeroSection`)
- **Types/interfaces:** `PascalCase` (e.g., `AuthResult`, `TemplateQuestion`)
- **Enums (Prisma):** `SCREAMING_SNAKE_CASE` values (e.g., `UserRole.ADMIN`, `CycleStatus.DRAFT`)
- **Constants:** `SCREAMING_SNAKE_CASE` (e.g., `OTP_CONFIG`, `ALGORITHM`)
- **Database columns:** `camelCase` (Prisma convention)
- **Routes:** RESTful kebab-case URLs

## File Structure

Typical component file:
```tsx
"use client"; // only if needed

import { /* externals */ } from "...";
import { /* internals */ } from "@/...";

interface ComponentProps { ... }

function Component({ ... }: ComponentProps) { ... }

export { Component };
export type { ComponentProps };
```

Typical API route file:
```tsx
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, isAuthError } from "@/lib/api-auth";

const schema = z.object({ ... });

export async function GET() { ... }
export async function POST(request: NextRequest) { ... }
```

## Imports

- Use `@/` path alias for all imports from `src/`
- External imports first, then internal
- Prisma client imported from `@/lib/prisma`
- Auth imported from `@/lib/auth`

## Components

- Server Components by default — add `"use client"` only when needed (hooks, event handlers, browser APIs)
- UI primitives in `src/components/ui/` built on Radix UI + `forwardRef`
- Class merging via `cn()` from `@/lib/utils` (clsx + tailwind-merge)
- Apple-inspired design: pill buttons, rounded-2xl cards, subtle shadows, backdrop-blur sidebars
- Icons: Lucide React with `strokeWidth={1.5}`, `size={20}`

## Error Handling

API routes use a consistent envelope:
```typescript
// Success
{ success: true, data: T }

// Error
{ success: false, error: string }
```

Auth guards (`requireAuth`, `requireAdminOrHR`, `requireSuperAdmin`) return `NextResponse` directly on failure. Use `isAuthError()` type guard to check.

Zod validation errors return 400. Unhandled errors return 500.

## Testing

No test framework is set up yet. When added:
- Co-locate tests with source files
- Name: `*.test.ts` / `*.test.tsx`
- Test API routes with mock Prisma client

## State Management

- **Server:** React Server Components with direct Prisma calls
- **Client (complex):** Zustand stores in `src/store/`
- **Client (forms):** React Hook Form + Zod resolvers
- **Mutations:** Server Actions preferred; API routes for public/webhook endpoints

## Commit Messages

```
feat: add evaluation template builder
fix: resolve team member role assignment bug
refactor: extract RBAC middleware
docs: update API documentation
style: align dashboard card spacing
```
