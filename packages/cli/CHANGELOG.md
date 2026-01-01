# @trailhead/cli

## 4.0.0 - 2025-12-31

### 🚀 Major Changes - Migration to Citty

Complete rewrite from Commander.js to [Citty](https://github.com/unjs/citty).

**Why**: Better TypeScript support, 15% smaller bundle, cleaner functional API.

### Breaking Changes

#### API

- ❌ Removed `createCLI()` → Use `defineCommand()` + `runMain()`
- ❌ Removed `createCommand()` → Use `defineCommand()`
- ❌ Removed command builders (`createFileProcessingCommand`, `defineOptions`)
- ❌ Removed complex test utilities → Test run() functions directly
- ❌ Deprecated git hooks (`createGitHooksCommand`) - will return in minor release
- ✅ Kept `CommandContext`, Result types, command patterns

#### Signatures

- `action(options, context)` → `run(args, context)`
- `options` array → `args` object
- `context.args: string[]` → `context.args: ParsedArgs`

#### Migration Example

```typescript
// Before (v3.x)
const cmd = createCommand({
  name: 'greet',
  options: [{ flags: '-n, --name <name>', required: true }],
  action: async (options, ctx) => { ... }
})

// After (v4.0)
const cmd = defineCommand({
  meta: { name: 'greet' },
  args: { name: { type: 'string', required: true } },
  run: async (args, ctx) => { ... }
})
```

### Dependencies

- Added: `citty@^0.1.6`
- Removed: `commander@^14.0.2`

### Notes

- See [README](./README.md) for complete migration guide
- @trailhead/create-cli templates will be updated separately
- Related: Closes #210

## 3.0.0

### Major Changes

- [#205](https://github.com/trailhead-diy/trailhead/pull/205) [`b02433d`](https://github.com/trailhead-diy/trailhead/commit/b02433d0079e3ff751f37a5513453cf4e56b01e0) Thanks [@esteban-url](https://github.com/esteban-url)! - ## @trailhead/cli v2.0.0

  ### Breaking Changes
  - Migrate from Chalk/Ora to Clack and picocolors for modern prompts
  - New `@trailhead/cli/fs` module consolidates filesystem abstractions

  ### Features
  - Add filesystem module with `createFileSystem`, `FileSystemOptions`, path utilities
  - Comprehensive JSDoc documentation for all 156 public exports

  ### Migration

  Replace Chalk/Ora imports with Clack equivalents. Use `@trailhead/cli/fs` for filesystem operations.

  ***

  ## @trailhead/core v2.0.0

  ### Breaking Changes
  - Remove validation module (use Zod directly)
  - Remove fp-ts dependency for simpler Result types

  ### Improvements
  - Comprehensive JSDoc documentation for all 67 public exports

  ***

  ## @trailhead/create-cli v1.1.0

  ### Features
  - Add tarball approach for E2E testing workflows
  - Comprehensive JSDoc documentation for all 68 public exports

  ***

  ## @trailhead/data v1.0.2

  ### Bug Fixes
  - Handle Excel binary files correctly in detection
  - Wrap JSON results in ParsedData for consistent API
  - Correct writeFile argument order in csv/json modules

  ### Improvements
  - Comprehensive JSDoc documentation for all 89 public exports

### Patch Changes

- Updated dependencies [[`b02433d`](https://github.com/trailhead-diy/trailhead/commit/b02433d0079e3ff751f37a5513453cf4e56b01e0)]:
  - @trailhead/core@3.0.0

## 1.0.1

### Patch Changes

- [#202](https://github.com/trailhead-diy/trailhead/pull/202) [`8d1f9d2`](https://github.com/trailhead-diy/trailhead/commit/8d1f9d2aa61ed84fbbd4e8a0283cb07a77acc1f2) Thanks [@esteban-url](https://github.com/esteban-url)! - Updated docs, deps and create-cli templates

- Updated dependencies [[`8d1f9d2`](https://github.com/trailhead-diy/trailhead/commit/8d1f9d2aa61ed84fbbd4e8a0283cb07a77acc1f2)]:
  - @trailhead/core@1.0.1
  - @trailhead/fs@1.0.1
  - @trailhead/sort@1.0.1

## 1.0.0

### Major Changes

- [#185](https://github.com/trailhead-diy/trailhead/pull/185) [`a03ca90`](https://github.com/trailhead-diy/trailhead/commit/a03ca905e11ebbe028dda3406f307e77b640cb67) Thanks [@esteban-url](https://github.com/esteban-url)! - Initial public release of Trailhead CLI framework

### Patch Changes

- [#190](https://github.com/trailhead-diy/trailhead/pull/190) [`45b2d98`](https://github.com/trailhead-diy/trailhead/commit/45b2d98aab6d1a0caa9889a5479ea02f0afb8629) Thanks [@esteban-url](https://github.com/esteban-url)! - Improve fresh start script to change and pull from main

- Updated dependencies [[`a03ca90`](https://github.com/trailhead-diy/trailhead/commit/a03ca905e11ebbe028dda3406f307e77b640cb67), [`45b2d98`](https://github.com/trailhead-diy/trailhead/commit/45b2d98aab6d1a0caa9889a5479ea02f0afb8629)]:
  - @trailhead/core@1.0.0
  - @trailhead/sort@1.0.0
  - @trailhead/fs@1.0.0
