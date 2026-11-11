# AGENTS.md - Tools Subsystem Guide

This file applies to `/app/tools` and related tool search wiring.

## Goal

When the user asks: "Add a tool coded `X` that does `Y`", implement it so the new tool route exists and appears automatically in the tools global search.

## Single Source of Truth

Tool search options are defined in:

- `shared/config/tools.ts`

The tools header combobox reads from this file. Do not hardcode tool lists in the header.

## Required Steps To Add A Tool

1. Create a route at `app/tools/<slug>/page.tsx`.
2. Implement the tool UI and logic on that page.
3. Add one entry to `shared/config/tools.ts`:
   - `code`: short uppercase code (unique), for example `NCK`
   - `code` must be uppercase only; do not use lowercase or mixed case
   - `title`: display name in search
   - `href`: full route path, for example `/tools/nck`
   - `description`: meta description, one or two sentences (~110–160 chars)
     saying what the tool does for the reader
   - `noindex: true` only for personal utilities that shouldn't be in search
   Then add `app/tools/<slug>/layout.tsx` exporting
   `metadata = getToolMetadata("/tools/<slug>")` (copy any sibling's). Tool
   pages are usually `"use client"`, and Next.js ignores `metadata` exported
   from client files, so it must live in the server layout.
4. Confirm the new tool is discoverable in the tools header search by:
   - code match
   - title match
   - keyboard open (`Cmd+K` / `Ctrl+K`)
5. Run `npx tsc --noEmit --pretty false` and report any unrelated pre-existing failures separately.

## Presenting Results

Every tool follows the house style in `app/tools/DATA-DISPLAY.md`. Read it
before building one. Tools that show a quantitative result and explain it
(calculators, model readouts, analyses) take the full treatment, with
`app/tools/bayesian-ab-test/` as the reference calculator and
`app/tools/bayesian-ab-testing-primer/` as the reference explainer. Form-heavy
utilities and single-value converters take the light pass described there.

## Conventions

- Keep tool codes uppercase and concise.
- Reject lowercase tool codes during review; normalize to uppercase before commit.
- Keep tool pages under `app/tools/<slug>/page.tsx`.
- Use shared UI components from `@/shared/ui/*`.
- Keep forms Enter-submittable (`<form onSubmit=...>`), not click-only.

## Existing Tools

- `NCK` -> `/tools/nck`
- `HASH` -> `/tools/hash-collisions`
- `EVP` -> `/tools/expected-value-primer`
