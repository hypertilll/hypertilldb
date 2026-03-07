# Hypertill DB

Hypertill DB is the published HelaPoint-maintained fork of WatermelonDB. It keeps the same local-first database architecture, but the package identity, docs, and mobile example app now ship under the Hypertill name.

## What 0.0.1 already gives you

- The npm package: [`@hypertill/db`](https://www.npmjs.com/package/@hypertill/db)
- Expo SDK 54+ support through the built-in package plugin
- React helpers: `DatabaseProvider`, `useDatabase`, and `withObservables`
- SQLite adapters for iOS, Android, and Node.js
- LokiJS support for browser-based usage
- A TypeScript Expo reference app for books, chapters, book notes, and chapter notes

## Start here

1. Read the docs site: [Hypertill DB documentation](https://db.hypertill.com/docs)
2. Install the package: [Installation guide](https://db.hypertill.com/docs/Installation)
3. Set up schema and models: [Setup guide](https://db.hypertill.com/docs/Setup)
4. Connect React screens: [Connecting Components](https://db.hypertill.com/docs/Components)
5. Review the working mobile reference: [expo-hypertillDB-example](https://github.com/hypertilll/expo-hypertillDB-example)

## Current React guidance in 0.0.1

- Put `DatabaseProvider` at the app root once.
- Use `withObservables` for reactive records, relations, lists, and counts.
- Use `useDatabase` for writes, screen actions, and imperative lookups.
- First-party query hooks are not part of `0.0.1`, so the package still favors observable composition for live reads.

## Core package surface

The current package exports the following primitives:

- `Database`
- `Collection`
- `Model`
- `Query`
- `Relation`
- schema helpers such as `appSchema()` and `tableSchema()`

## What Hypertill DB is good at

- Offline-first mobile apps with real local data models
- Large local datasets that should stay in SQLite until queried
- Apps that need explicit write boundaries and predictable sync handoff
- Teams that want a published Expo-compatible package instead of a private patch

## Practical reference app

The external Expo example repo is here:

- [expo-hypertillDB-example](https://github.com/hypertilll/expo-hypertillDB-example)

It uses TypeScript, separate screens for books, chapters, and notes, and the published `@hypertill/db` package.

## Contributing

Contributions to the fork should preserve API quality, platform compatibility, and clear docs. See [CONTRIBUTING](./CONTRIBUTING.md) for setup, testing, and release workflow details.

## Upstream lineage

The upstream project was originally created by Nozbe and led by [Radek Pietruszewski](https://github.com/radex).

The Hypertill DB fork is maintained by [HelaPoint](https://github.com/hypertilll).

[See all contributors](https://github.com/hypertilll/hypertillDB/graphs/contributors).

Hypertill DB is available under the MIT license. See the [LICENSE file](https://github.com/hypertilll/hypertillDB/LICENSE) for more info.
