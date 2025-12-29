---
'@trailhead/cli': major
'@trailhead/core': major
'@trailhead/create-cli': minor
'@trailhead/data': patch
---

## @trailhead/cli v2.0.0

### Breaking Changes

- Migrate from Chalk/Ora to Clack and picocolors for modern prompts
- New `@trailhead/cli/fs` module consolidates filesystem abstractions

### Features

- Add filesystem module with `createFileSystem`, `FileSystemOptions`, path utilities
- Comprehensive JSDoc documentation for all 156 public exports

### Migration

Replace Chalk/Ora imports with Clack equivalents. Use `@trailhead/cli/fs` for filesystem operations.

---

## @trailhead/core v2.0.0

### Breaking Changes

- Remove validation module (use Zod directly)
- Remove fp-ts dependency for simpler Result types

### Improvements

- Comprehensive JSDoc documentation for all 67 public exports

---

## @trailhead/create-cli v1.1.0

### Features

- Add tarball approach for E2E testing workflows
- Comprehensive JSDoc documentation for all 68 public exports

---

## @trailhead/data v1.0.2

### Bug Fixes

- Handle Excel binary files correctly in detection
- Wrap JSON results in ParsedData for consistent API
- Correct writeFile argument order in csv/json modules

### Improvements

- Comprehensive JSDoc documentation for all 89 public exports
