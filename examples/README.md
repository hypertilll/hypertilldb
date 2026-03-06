# Examples

This directory contains small package-level reference examples for Hypertill DB.

## Included examples

- `typescript/`: type-check coverage for the public API and common subpath imports
- `book-reader/`: a runtime smoke test for a book-reader domain against the built package

## Running the examples

From the repository root:

```bash
yarn test:typescript
yarn test:book-reader
```

The interactive mobile demo now lives outside this package repo as a separate Expo app so package verification and app onboarding stay independent.
