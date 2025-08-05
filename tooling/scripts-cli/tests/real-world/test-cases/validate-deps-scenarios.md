# validate-deps Test Scenarios

Test cases for comparing `scripts/validate-monorepo-deps.sh` vs `scripts-cli validate-deps`.

## Scenario 1: Valid Monorepo

**Setup**: Well-structured monorepo with correct dependencies
**Expected**: Validation passes, no issues reported

### Test Structure:

```
monorepo/
├── package.json          # Root package
├── turbo.json           # Turbo configuration
├── packages/
│   ├── utils/
│   │   ├── package.json # Depends on external libs only
│   │   └── src/index.ts
│   └── core/
│       ├── package.json # Depends on @test/utils
│       └── src/index.ts # Imports from @test/utils
└── apps/
    └── web/
        ├── package.json # Depends on both packages
        └── src/index.ts # Imports from both
```

### Expected Result:

- Exit code 0
- No warning messages
- Dependency graph is valid

## Scenario 2: Circular Dependencies

**Setup**: Packages that depend on each other
**Expected**: Detects and reports circular dependencies

### Test Setup:

```json
// packages/utils/package.json
{
  "dependencies": {
    "@test/core": "workspace:*"
  }
}

// packages/core/package.json
{
  "dependencies": {
    "@test/utils": "workspace:*"
  }
}
```

### Expected Result:

- Exit code 1
- Clear error message about circular dependency
- Lists the packages involved in the cycle

## Scenario 3: Missing Build Dependencies

**Setup**: Package imports from another package but missing build dependency
**Expected**: Reports missing dependencies

### Test Setup:

```typescript
// packages/core/src/index.ts
import { helper } from '@test/utils'; // Import exists

// packages/core/package.json - Missing @test/utils dependency
{
  "name": "@test/core",
  "dependencies": {
    // @test/utils missing here
  }
}
```

### Expected Result:

- Identifies missing dependency
- Reports which files are importing the missing package
- Suggests adding the dependency

## Scenario 4: Turbo.json Validation

**Setup**: Incorrect turbo.json configuration
**Expected**: Validates build dependency chains

### Test turbo.json Issues:

```json
{
  "pipeline": {
    "test": {
      "dependsOn": ["build"]
      // Missing @repo/vitest-config#build dependency
    }
  }
}
```

### Expected Validation:

- Checks test tasks depend on vitest-config build
- Validates pipeline dependency chains
- Reports configuration issues

## Scenario 5: --fix Flag Behavior

**Setup**: Issues that can be automatically fixed
**Expected**: Applies automatic fixes

### Auto-fixable Issues:

- Missing build scripts in package.json
- Missing turbo.json dependencies
- Correctable dependency declarations

### Expected Behavior:

- Shell script: May not have --fix functionality
- TypeScript CLI: Applies fixes and reports changes

## Scenario 6: --graph Flag Behavior

**Setup**: Valid monorepo structure  
**Expected**: Displays dependency graph

### Expected Output:

```
Dependency Graph:
├── @test/utils
├── @test/core → @test/utils
└── @test/web → @test/core, @test/utils
```

### Graph Features:

- ASCII tree visualization
- Shows workspace dependencies only
- Indicates dependency direction

## Scenario 7: Large Monorepo

**Setup**: Many packages with complex dependencies
**Expected**: Handles scale efficiently

### Test Scale:

- 10+ packages
- Multiple dependency levels
- Mixed circular and valid dependencies
- Performance comparison

## Scenario 8: Invalid Package.json

**Setup**: Malformed or missing package.json files
**Expected**: Graceful error handling

### Error Cases:

- Invalid JSON syntax
- Missing package.json in workspace
- Missing name field
- Invalid workspace references

## Files to Compare:

- Console output (validation results)
- Exit codes
- Modified files (if --fix used)
- Performance/timing
- Error message clarity
- Graph visualization format
