# AGENTS.md - Repository Guide for AI Agents

This document explains the architecture, conventions, and patterns used in this codebase to help AI agents work effectively with the repository.

## Architecture Overview

This repository uses **Feature Sliced Design (FSD) v2** architecture combined with **Next.js 16 App Router**. The codebase is organized into layers that enforce clear boundaries and dependencies.

### Key Principles

1. **Layered Architecture**: Code is organized into layers (shared, entities, features, widgets) with strict import rules
2. **Next.js App Router**: The `app/` directory handles routing and page composition
3. **TypeScript**: Full type safety throughout the codebase
4. **Component Library**: Uses shadcn/ui components built on Base UI primitives

## Directory Structure

```
/
├── app/                    # Next.js App Router (routing & pages)
│   ├── layout.tsx          # Root layout with fonts & metadata
│   ├── page.tsx            # Home page
│   └── globals.css         # Global styles
│
├── shared/                 # Reusable infrastructure code
│   ├── ui/                # UI component library (shadcn/ui)
│   ├── lib/               # Utility functions
│   └── config/            # App configuration
│
├── entities/               # Business entities (empty - ready for use)
├── features/              # User interactions (empty - ready for use)
├── widgets/               # Composite UI blocks (empty - ready for use)
│
├── public/                # Static assets
├── components.json        # shadcn/ui configuration
└── tsconfig.json          # TypeScript configuration
```

## Layer Descriptions

### `app/` - Next.js App Router

- **Purpose**: Routing, page composition, and Next.js-specific configuration
- **Contains**: Route handlers, layouts, page components
- **Rules**:
  - Can import from all FSD layers (`shared`, `entities`, `features`, `widgets`)
  - Should not contain business logic (delegate to features/widgets)
  - Keep minimal - use for routing structure only

### `shared/` - Infrastructure Layer

- **Purpose**: Reusable code that has no business logic
- **Contains**:
  - `ui/`: UI component library (buttons, inputs, dialogs, etc.)
  - `lib/`: Utility functions (e.g., `cn()` for className merging)
  - `config/`: App-wide configuration
- **Rules**:
  - Cannot import from `entities`, `features`, or `widgets`
  - Should be framework-agnostic where possible
  - No business domain knowledge

### `entities/` - Business Entities

- **Purpose**: Business domain models and data structures
- **Contains**: (Currently empty, ready for use)
  - Type definitions for domain objects
  - Entity-specific hooks and utilities
  - Data transformation logic
- **Rules**:
  - Can only import from `shared/`
  - Represents core business concepts (User, Post, Product, etc.)

### `features/` - User Interactions

- **Purpose**: User-facing functionality and interactions
- **Contains**: (Currently empty, ready for use)
  - Feature-specific components
  - User actions (create, edit, delete, etc.)
  - Feature-specific hooks and state management
- **Rules**:
  - Can import from `shared/` and `entities/`
  - Cannot import from `widgets/`
  - Represents user actions (e.g., `create-post`, `edit-profile`)

### `widgets/` - Composite UI Blocks

- **Purpose**: Complex UI compositions that combine features
- **Contains**: (Currently empty, ready for use)
  - Page sections and layouts
  - Composite components that use multiple features
- **Rules**:
  - Can import from `shared/`, `entities/`, and `features/`
  - Highest level of composition before pages

## Import Conventions

### Path Aliases

The repository uses TypeScript path aliases configured in `tsconfig.json`:

```typescript
"@/*"           → "./*"              // Root (use sparingly)
"@/shared/*"    → "./shared/*"       // Shared layer
"@/entities/*"  → "./entities/*"     // Entities layer
"@/features/*"  → "./features/*"     // Features layer
"@/widgets/*"   → "./widgets/*"     // Widgets layer
```

### Import Examples

```typescript
// ✅ Correct - Importing from shared layer
import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/lib/utils"

// ✅ Correct - Importing from entities
import { User } from "@/entities/user"

// ✅ Correct - Importing from features
import { CreatePostForm } from "@/features/create-post"

// ✅ Correct - Importing from widgets
import { PostList } from "@/widgets/post-list"

// ❌ Wrong - Violating layer rules
import { Button } from "@/components/ui/button" // Old path, doesn't exist
import { User } from "@/shared/user" // Business logic in shared
```

## Component Library

This repository uses **shadcn/ui** as its component library. All UI components are built using shadcn/ui components, which are themselves built on **Base UI** primitives.

### UI Components (`shared/ui/`)

All shadcn/ui components are located in `shared/ui/`:

- `button.tsx` - Button component with variants
- `input.tsx` - Input field
- `card.tsx` - Card container
- `alert-dialog.tsx` - Modal dialogs
- `select.tsx` - Dropdown select
- `combobox.tsx` - Autocomplete/combobox
- `dropdown-menu.tsx` - Context menus
- `field.tsx` - Form field wrapper
- `label.tsx` - Form labels
- `textarea.tsx` - Text area
- `switch.tsx` - Toggle switch
- `separator.tsx` - Visual separator
- `badge.tsx` - Badge component
- `input-group.tsx` - Input with addons

### Using Components

```typescript
import { Button } from "@/shared/ui/button"
import { Card, CardHeader, CardTitle } from "@/shared/ui/card"

export function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hello</CardTitle>
      </CardHeader>
      <Button variant="default">Click me</Button>
    </Card>
  )
}
```

### Utility Functions

The `cn()` utility (from `@/shared/lib/utils`) merges Tailwind classes:

```typescript
import { cn } from "@/shared/lib/utils"

// Merges and deduplicates className strings
;<div className={cn("base-class", condition && "conditional-class")} />
```

## Tech Stack

- **Framework**: Next.js 16.0.10 (App Router)
- **React**: 19.2.1
- **TypeScript**: 5.x
- **Styling**: Tailwind CSS 4.x
- **UI Library**: shadcn/ui (Base UI primitives)
- **Icons**: Lucide React
- **Fonts**: Geist Sans, Geist Mono, Inter

## Working with the Codebase

### Adding a New UI Component

1. Use shadcn CLI (if available) or manually create in `shared/ui/`
2. Follow existing component patterns
3. Use `cn()` utility for className merging
4. Import from `@/shared/lib/utils` for utilities

### Adding a Feature

1. Create directory in `features/` (e.g., `features/create-post/`)
2. Can import from `shared/` and `entities/`
3. Export feature components/hooks from index file
4. Use in `widgets/` or `app/` pages

### Adding an Entity

1. Create directory in `entities/` (e.g., `entities/user/`)
2. Define types, hooks, and utilities
3. Can only import from `shared/`
4. Keep business logic isolated

### Adding a Widget

1. Create directory in `widgets/` (e.g., `widgets/post-list/`)
2. Compose features and entities
3. Can import from all lower layers
4. Use in `app/` pages

### File Naming Conventions

- Components: `kebab-case.tsx` (e.g., `alert-dialog.tsx`)
- Directories: `kebab-case` (e.g., `create-post/`)
- Exports: PascalCase for components, camelCase for utilities

## Configuration Files

### `components.json`

- shadcn/ui configuration
- Defines component paths and aliases
- Points to `@/shared/ui` for components

### `tsconfig.json`

- TypeScript configuration
- Path aliases for FSD layers
- Strict mode enabled

### `next.config.ts`

- Next.js configuration
- Currently minimal, ready for customization

## Common Patterns

### Component Structure

```typescript
import { cn } from "@/shared/lib/utils"
import { SomePrimitive } from "@base-ui/react/..."

export function Component({ className, ...props }: ComponentProps) {
  return <SomePrimitive className={cn("base-styles", className)} {...props} />
}
```

### Client Components

Components using hooks or browser APIs need `"use client"`:

```typescript
"use client"

import { useState } from "react"
// ...
```

### Server Components

By default, components in `app/` are Server Components. No `"use client"` needed unless using client-side features.

## AI Features and Access Control

This repo now supports both AI-protected routes and AI-protected features within otherwise public pages.

### Source of Truth for AI Access

- `shared/lib/auth/ai-access.ts` is the single source of truth.
- Use:
  - `requireAiAccess()` for API route protection (returns 401/403 JSON responses).
  - `canAccessAi(user)` for UI-level gating in Server Components.
- Role allowlist is configured by `AI_ALLOWED_ROLES` (comma-separated) and parsed in `shared/config/ai.ts`.
- Role resolution order:
  1. `user.app_metadata.role`
  2. `user.user_metadata.role`

### Protecting AI API Routes

For any route under `app/api/**` that calls OpenAI:

1. Gate with `requireAiAccess()` at the top of the handler.
2. Return consistent JSON error shapes for:
   - missing env vars
   - provider errors
   - invalid request payloads
3. Prefer `cache: "no-store"` for OpenAI fetches.
4. Validate and sanitize model output server-side before returning it to clients.

### Gating AI UI Features (Without Blocking Entire Page)

When a page should stay usable without AI, but one feature should be AI-only:

1. Use a Server Component page wrapper (`app/.../page.tsx`) to read the signed-in user via `createSupabaseServerClient()`.
2. Compute a boolean gate with `canAccessAi(user)`.
3. Pass that boolean into a Client Component that renders the interactive UI.
4. Conditionally render AI-only controls (buttons/forms) from that boolean.
5. Keep non-AI functionality available when user is logged out or unauthorized.

Example: Bayes Primer custom generation
- `app/tools/bayes-primer/page.tsx`
- `app/tools/bayes-primer/bayes-primer-client.tsx`
- `app/api/tools/bayes-primer/custom/route.ts`

### OpenAI Responses API Conventions

- Use the Responses API endpoint: `https://api.openai.com/v1/responses`.
- Default model for new lightweight generation paths: `gpt-5.6-luna` (unless a task says otherwise).
- The 5.6 family rejects `reasoning.effort: "minimal"`; use `"none"` for these generation paths. Valid values are `none`, `low`, `medium`, `high`, `xhigh`, `max`.
- Prefer structured output with JSON schema:
  - Provide `text.format.type = "json_schema"` and a strict schema.
  - Parse structured fields first; only use text parsing as fallback.
- For reliability:
  - keep prompts explicit about output keys/types
  - clamp numeric ranges and apply safe fallbacks
  - handle incomplete responses (e.g. token exhaustion) with clear retryable errors

### Debugging AI Integration

- Add temporary server-side logs in API routes when diagnosing model output shape issues.
- Log:
  - provider HTTP status
  - raw response payload (or safely truncated payload)
  - parsed payload result
- Remove or reduce noisy logs once stable.

## Best Practices

1. **Respect Layer Boundaries**: Don't import from higher layers into lower layers
2. **Keep Shared Clean**: No business logic in `shared/`
3. **Type Everything**: Use TypeScript types for all props and data
4. **Use Path Aliases**: Always use `@/` aliases, never relative imports across layers
5. **Component Composition**: Build complex UIs by composing simpler components
6. **Follow FSD Principles**: Each layer has a clear purpose and responsibility
7. **Validate Changes**: After code changes, run `npm run check` (lint + typecheck) before finishing

## Quick Reference

| Layer       | Can Import From            | Purpose           |
| ----------- | -------------------------- | ----------------- |
| `app/`      | All layers                 | Routing & pages   |
| `widgets/`  | shared, entities, features | Composite UI      |
| `features/` | shared, entities           | User interactions |
| `entities/` | shared                     | Business models   |
| `shared/`   | None (external libs only)  | Infrastructure    |

## Getting Started

1. **Development**: `npm run dev`
2. **Build**: `npm run build`
3. **Lint**: `npm run lint`
4. **Validation (Lint + Typecheck)**: `npm run check`

The codebase is ready for development. Start by:

- Adding entities in `entities/`
- Creating features in `features/`
- Composing widgets in `widgets/`
- Building pages in `app/`

## Cursor Cloud specific instructions

### Services

This is a single Next.js application (no separate backend). Run with `npm run dev` on port 3000.

### External dependencies

- **Supabase** (auth + Postgres): Required for login/signup and Book Club features. Env vars `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` must be set. Without them, auth-gated pages return errors but the rest of the site (homepage, static tools) works fine.
- **OpenAI API**: Optional. Powers AI-generated scenarios in Bayes Primer and Expected Value Primer tools. Requires `OPENAI_API_KEY`. The app gracefully degrades without it.

### Gotchas

- There are no automated tests in this repo — `npm run check` (lint + typecheck) is the primary validation command.
- The dev server uses Turbopack. Hot reload is fast; no need to restart for most code changes.
- No `.env` files are committed. All secrets come from environment variables.
- `npm run build` generates some `baseline-browser-mapping` warnings — these are cosmetic and safe to ignore.
