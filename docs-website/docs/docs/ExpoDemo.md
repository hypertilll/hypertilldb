---
title: Expo Book Demo
---

# Expo Book Demo

The fastest way to see Hypertill DB working in a real app is the TypeScript Expo example:

- [expo-hypertillDB-example](https://github.com/hypertilll/expo-hypertillDB-example)

## What the demo covers

- a `Books` screen with create, edit, delete, and navigation actions
- a `Chapters` screen scoped to one book
- a `Notes` flow for both book notes and chapter notes
- a dedicated `src/db` folder for schema, models, migrations, and database bootstrap
- `createPlatformAdapter(...)` + `Database` bootstrap
- `DatabaseProvider` at the app root
- auto-generated `hooks` for reactive reads

## Why it matters

The demo is the clearest reference for the current package story:

- Expo app
- TypeScript only
- native Android and iOS builds
- published package consumption through `@hypertill/db`

## What to read first in the demo repo

- `App.tsx` for `DatabaseProvider`
- `src/db/schema.ts` for the table layout
- `src/db/models.ts` for models and relations
- `src/db/index.ts` for `createPlatformAdapter(...)` and `Database`
- `src/screens/*.tsx` for current React usage

## What the React style looks like today

The example matches the guidance in this docs site:

- reactive reads use `hooks`
- writes use `useDatabase` or model `@writer` methods
- `withObservables` is still available for custom reactive composition
- advanced inline queries pass `inputs` so they stay reactive without hook memo boilerplate

## Use it as a comparison target

If your own app looks similar in structure, you are probably on the right path:

- do you keep database code in `src/db/`?
- do schema and models stay out of UI files?
- is the app wrapped once with `DatabaseProvider`?
- are writes happening inside `database.write(...)` or `@writer` methods?
- are advanced inline queries using `inputs`?
