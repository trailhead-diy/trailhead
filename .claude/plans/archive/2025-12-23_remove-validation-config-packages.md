# Plan: Remove Over-Engineered Packages

Remove `@trailhead/validation` and `@trailhead/config` - aspirational abstractions with minimal actual usage.

## Current State

| Package | Lines | Actual Usage |
|---------|-------|--------------|
| `@trailhead/validation` | ~2k | Re-exports `z` from Zod. 1 call to `createValidationError()` |
| `@trailhead/config` | ~10k | **Zero imports** - only template dependency metadata |

## Plan

### Phase 1: Update create-cli Templates

**Files to modify:**
- `packages/create-cli/templates/modules/config/src/lib/config-schema.ts.hbs`
  - Change: `import { z } from '@trailhead/validation'` → `import { z } from 'zod'`

- `packages/create-cli/src/lib/templates/modules.ts`
  - Remove `@trailhead/config` and `@trailhead/validation` from template dependencies
  - Add `zod` and `cosmiconfig` as direct dependencies

- `packages/create-cli/src/__tests__/integration.test.ts`
  - Update assertions to expect `zod`/`cosmiconfig` instead of @trailhead packages

### Phase 2: Add Minimal Validation Helper to Core

Add ~30 lines to `@trailhead/core` for Result-wrapped Zod validation:

**New file:** `packages/core/src/validation.ts`
```typescript
import { z } from 'zod'
import { ok, err } from './result.js'
import type { Result, CoreError } from './types.js'

export type ValidationResult<T> = Result<T, CoreError>

export const validateWithSchema = <T>(
  schema: z.ZodType<T>,
  value: unknown
): ValidationResult<T> => {
  const result = schema.safeParse(value)
  if (result.success) return ok(result.data)
  return err({
    type: 'ValidationError',
    code: 'SCHEMA_VALIDATION_FAILED',
    message: result.error.message,
    component: 'validation',
    operation: 'validateWithSchema',
    recoverable: true,
    severity: 'medium',
    timestamp: new Date(),
    context: { issues: result.error.issues }
  })
}
```

**Update:** `packages/core/src/index.ts` - Add export
**Update:** `packages/core/package.json` - Add `zod` as peer dependency

### Phase 3: Delete Packages

```bash
# Remove from workspace
rm -rf packages/validation
rm -rf packages/config

# Update root package.json if needed
# Update pnpm-workspace.yaml if packages are listed explicitly
```

### Phase 4: Update Dependencies

- `packages/create-cli/package.json` - Remove workspace deps on deleted packages
- Run `pnpm install` to update lockfile

### Phase 5: Verify & Clean

```bash
pnpm build
pnpm test
pnpm lint
```

## Files to Modify

| File | Change |
|------|--------|
| `packages/core/src/validation.ts` | **NEW** - Add validateWithSchema helper |
| `packages/core/src/index.ts` | Export validation utilities |
| `packages/core/package.json` | Add `zod` as peer dependency |
| `packages/create-cli/templates/modules/config/src/lib/config-schema.ts.hbs` | Use `zod` directly |
| `packages/create-cli/src/lib/templates/modules.ts` | Update deps list |
| `packages/create-cli/src/__tests__/integration.test.ts` | Update assertions |
| `packages/create-cli/package.json` | Remove @trailhead/validation, @trailhead/config |

## Files to Delete

- `packages/validation/` (entire directory)
- `packages/config/` (entire directory)

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Breaking generated projects | Generated projects will use standard `zod`/`cosmiconfig` - more maintainable |
| Lost functionality | Config watchers, transformers, loaders unused. Docs generation could be standalone if needed later |

## Execution Order

1. Add validation helper to `@trailhead/core` (Phase 2)
2. Update create-cli templates and deps (Phase 1)
3. Run tests to verify nothing breaks
4. Delete packages (Phase 3)
5. Final verification (Phase 5)

## Outcome

- **-12k lines** of code to maintain
- **-2 packages** in dependency graph
- Generated CLIs use standard, well-documented tools (Zod, cosmiconfig)
- Simpler onboarding for users
