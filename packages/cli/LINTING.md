# Linting Guide

This package uses a dual linting approach to provide comprehensive code quality checks while leveraging the best tools for each purpose.

## Dual Linting Setup

### 1. Oxlint (Primary Linter)

- **Purpose**: Fast, comprehensive ESLint-compatible linting
- **Command**: `pnpm lint` or `pnpm lint:fix`
- **Configuration**: Uses `.oxlintrc.json` from monorepo tooling
- **Performance**: ~100x faster than ESLint for standard rules

### 2. ESLint with neverthrow Plugin (Specialized Linting)

- **Purpose**: neverthrow-specific Result type handling validation
- **Command**: `pnpm lint:neverthrow`
- **Configuration**: `eslint.config.js` with TypeScript parser
- **Rules**: Ensures `Result` types are properly handled

## Why Dual Linting?

**Oxlint Limitations**:

- Oxlint doesn't support custom ESLint plugins yet (planned for future)
- eslint-plugin-neverthrow requires TypeScript type information

**Solution**:

- Use oxlint for general code quality and standard rules
- Use ESLint specifically for neverthrow Result type validation

## Commands

```bash
# Standard linting (fast)
pnpm lint          # Check all standard rules
pnpm lint:fix      # Fix standard auto-fixable issues

# neverthrow-specific linting
pnpm lint:neverthrow  # Check Result type handling

# Complete validation (includes both)
pnpm validate      # Types + standard lint + tests
```

## neverthrow Rules

The neverthrow ESLint configuration enforces:

### `neverthrow/must-use-result` (warning)

Ensures `Result` types are explicitly handled with one of:

- `.match(onOk, onErr)` - Pattern matching both cases
- `.unwrapOr(defaultValue)` - Safe unwrapping with fallback
- `._unsafeUnwrap()` - Explicit unsafe unwrapping (tests only)

**Example Violations:**

```typescript
// ❌ Warning: Result not handled
const result = validateInput(data)

// ✅ Correct: Explicit handling
const result = validateInput(data)
if (result.isErr()) {
  return err(result.error)
}
```

### Test File Exemptions

Test files (`**/*.test.ts`, `**/*.spec.ts`) have relaxed rules:

- `neverthrow/must-use-result`: `off` (allows `._unsafeUnwrap()` for assertions)

## Integration with CI/CD

```bash
# Standard CI pipeline
pnpm types && pnpm lint && pnpm test

# With neverthrow checking (optional warning-only)
pnpm lint:neverthrow --max-warnings 50
```

## Migration Notes

This dual setup is temporary until:

1. Oxlint adds custom plugin support
2. eslint-plugin-neverthrow can be integrated directly

**Current Status**:

- ✅ Complete neverthrow migration from custom Result system
- ✅ All source files using neverthrow patterns
- ✅ ESLint rules detecting unhandled Results (41 warnings)
- ⏳ Waiting for oxlint plugin ecosystem

## Troubleshooting

### ESLint Parser Errors

If you see TypeScript project errors:

- Ensure `tsconfig.json` includes the files being linted
- Test files are excluded from project type checking by design

### Performance

- Run `pnpm lint` first (fast feedback)
- Run `pnpm lint:neverthrow` for Result-specific checks
- Use `--max-warnings` to prevent CI failures on warnings

### Rule Conflicts

If oxlint and ESLint conflict:

- Oxlint takes precedence for standard rules
- ESLint only used for neverthrow-specific validation
- Use `eslint-disable` comments sparingly for ESLint-only overrides
