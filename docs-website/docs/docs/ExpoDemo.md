---
title: Expo Book Demo
---

# Expo Book Demo

The fastest way to understand how Hypertill DB works in a real mobile app is the TypeScript Expo example:

- [expo-hypertillDB-example](https://github.com/hypertilll/expo-hypertillDB-example)

## What the demo covers

- `Books` screen with create, edit, delete, and navigation actions
- `Chapters` screen scoped to one book
- `Notes` screen for both book notes and chapter notes
- a dedicated `src/db` folder for schema, models, and database bootstrap
- real `SQLiteAdapter` usage with `jsi: true`

## Why this repo matters

The demo is not a toy mock. It is the current reference app for the package story around `0.0.3`:

- Expo app
- TypeScript only
- Android and iOS native builds
- published package consumption

## What to read first

If you open the example repo, start with these files:

- `App.tsx` for `DatabaseProvider`
- `src/db/schema.ts` for the table layout
- `src/db/models.ts` for relations and decorators
- `src/db/database.ts` for the adapter and `Database` bootstrap
- `src/screens/*.tsx` for the current React usage pattern

## What the React style looks like today

The example reflects the same guidance as this docs site:

- reactive reads use `hooks` (auto-generated per model)
- `withObservables` is still available for complex composition
- screen actions use `useDatabase` and explicit writer functions
- the database layer is kept in its own folder instead of leaking collection logic across UI files

## Use it as a comparison target

When you integrate Hypertill DB into your own app, compare your structure against the demo:

- do you have a dedicated `db/` folder?
- are your models and schema isolated from your screens?
- is the app wrapped once with `DatabaseProvider`?
- are writes happening inside explicit `database.write()` blocks?

If the answer is yes, you are aligned with the current package direction.
