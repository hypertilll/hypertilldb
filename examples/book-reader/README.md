# Book Reader Example

This example covers the built package only.

It exercises:

- package build output from `dist/`
- LokiJS adapter setup on Node.js
- model decorators, relations, and child queries
- writes, reads, and sorted queries
- sync push and pull flows

## Run the package smoke test

From the repository root:

```bash
yarn test:book-reader
```

The script rebuilds the package and then runs `examples/book-reader/smoke-test.cjs`.

The interactive TypeScript demo now lives in the separate Expo app workspace so package tests and app onboarding stay independent.
