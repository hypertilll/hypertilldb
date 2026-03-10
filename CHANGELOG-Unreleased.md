### Highlights

### BREAKING CHANGES

### Deprecations

### New features

- Auto-generated React hooks (`hooks.use<Model>`, `hooks.use<Models>`, `hooks.use<Models>Advanced`)
- Automatic metadata columns (`deleted_at`, `created_tz`, `updated_tz`, `deleted_tz`) via platform adapters
- Database defaults for record IDs (UUIDv4) and timestamps (epoch + timezone)

### Fixes

- [LokiJS] Multitab sync issue fix
- [Android] Added linker flag for building with 16kB page alignment
- [TS] make catchError visible to typescript

### Performance

### Changes

- Updated better-sqlite3 to 11.9.1

### Internal

- Updated internal dependencies
- Updated documentation scripts
