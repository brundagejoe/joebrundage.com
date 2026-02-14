# joebrundage.com

Personal website and tools app built with Next.js App Router.

This repository powers:

- A personal site (`/`, `/projects`)
- A tools suite (`/tools/*`) for probability/statistics and SEO analysis workflows
- Supabase-backed authentication (`/login`, `/signup`, `/change-password`)
- Role-gated AI-assisted scenario generation for selected tools

## What is in the app

### Core pages

- `/` personal profile and experience overview
- `/projects` selected project highlights
- `/tools` tools index

### Tools

- `NCK` - N Choose K Calculator
- `HASH` - Hash Collision Probability Calculator
- `SSC` - A/B Test Sample Size Calculator
- `BAYESP` - Bayes Primer (AI custom scenarios supported)
- `EVP` - Expected Value Primer (AI custom scenarios supported)
- `META` - Meta Analyzer (compare meta tags across sites/paths)

### Auth and protected surfaces

- Email/password auth with Supabase
- API-level AI access control with role checks for OpenAI-backed routes

## Tech stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Tailwind CSS v4
- shadcn/ui + Base UI primitives
- Supabase SSR/auth
- TanStack Query
- OpenAI Responses API

## Architecture

The codebase follows Feature-Sliced Design (FSD-style layers):

- `app/` route composition and pages
- `shared/` UI primitives, utilities, config, infrastructure
- `entities/` business entities (ready for use)
- `features/` user interactions (ready for use)
- `widgets/` higher-level UI composition (e.g., header variants)

Import aliases are configured in `tsconfig.json` (`@/shared/*`, `@/entities/*`, etc.).

## Local development

Install dependencies:

```bash
npm install
```

Run dev server:

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` - start local dev server
- `npm run build` - production build
- `npm run start` - run production server
- `npm run lint` - run ESLint

## AI integration notes

- OpenAI calls use the Responses API (`/v1/responses`)
- Custom scenario endpoints currently live under:
  - `app/api/tools/bayes-primer/custom/route.ts`
  - `app/api/tools/expected-value-primer/custom/route.ts`
- These routes enforce auth + AI role checks and validate/sanitize structured output server-side
