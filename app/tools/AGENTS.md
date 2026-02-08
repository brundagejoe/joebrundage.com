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
   - `title`: display name in search
   - `href`: full route path, for example `/tools/nck`
4. Confirm the new tool is discoverable in the tools header search by:
   - code match
   - title match
   - keyboard open (`Cmd+K` / `Ctrl+K`)
5. Run `npx tsc --noEmit --pretty false` and report any unrelated pre-existing failures separately.

## Conventions

- Keep tool codes uppercase and concise.
- Keep tool pages under `app/tools/<slug>/page.tsx`.
- Use shared UI components from `@/shared/ui/*`.
- Keep forms Enter-submittable (`<form onSubmit=...>`), not click-only.

## Existing Tools

- `NCK` -> `/tools/nck`
- `HASH` -> `/tools/hash-collisions`
