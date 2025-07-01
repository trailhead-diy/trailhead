# Windows Test Fix Implementation Checklist

## Summary
Total files requiring fixes: **12 high-priority files** with hardcoded paths

## ✅ Already Fixed
1. **packages/cli/tests/test-utils/cross-platform-paths.ts** - Created utility file
2. **packages/cli/tests/src/core/command/base.test.ts** - Updated to use testPaths

## 🔧 High Priority Files (Hardcoded Paths)

### Web-UI Package - Integration Tests
These files have the most hardcoded paths and need immediate attention:

1. **packages/web-ui/tests/scripts/install/integration.test.ts** ⚠️
   - 67+ hardcoded `/project/` paths
   - 20+ hardcoded `/trailhead/` paths
   - Needs: Complete refactor using projectPath() and trailheadPath()

2. **packages/web-ui/tests/scripts/install/installation-workflow.test.ts**
   - Multiple `/project/` paths in mock data
   - Needs: Update mock filesystem setup

3. **packages/web-ui/tests/scripts/install/framework-detection.test.ts**
   - Path comparisons with hardcoded values
   - Already uses some cross-platform utilities
   - Needs: Update remaining hardcoded paths

### Web-UI Package - CLI Tests
4. **packages/web-ui/tests/src/cli/integration/install-workflow.test.ts**
   - Mock filesystem with hardcoded paths
   - Needs: Update all path references

5. **packages/web-ui/tests/src/cli/core/installation/component-installer.test.ts**
   - File path operations with hardcoded separators
   - Needs: Use safeJoin for all path operations

6. **packages/web-ui/tests/src/cli/commands/install.test.ts**
   - Project root and path configurations
   - Needs: Update to use testPaths constants

## 📋 Medium Priority Files (Path Operations)

7. **packages/web-ui/tests/scripts/shared/file-utils.test.ts**
   - File system operations that may fail on Windows
   - Needs: Review and update path operations

8. **packages/web-ui/tests/src/cli/core/installation/step-factory.test.ts**
   - Path construction in test scenarios
   - Needs: Use createTestPath for all paths

9. **packages/web-ui/tests/src/cli/core/installation/component-transformer.test.ts**
   - Transform operations with path assumptions
   - Needs: Ensure path normalization

## 🔍 Low Priority Files (Already Using Utils)

10. **packages/web-ui/tests/scripts/install/package-manager-registry.test.ts**
11. **packages/web-ui/tests/scripts/install/dependency-strategies.test.ts**
12. **packages/web-ui/tests/scripts/install/dependencies.test.ts**

These files already import cross-platform utilities but may need minor updates.

## Implementation Steps

### Step 1: Run Automated Fix Script (Optional)
```bash
# Create and run the fix script
pnpm tsx scripts/fix-windows-paths.ts
```

### Step 2: Manual Review and Fixes

For each file:
1. Add import for cross-platform utilities
2. Replace hardcoded paths with utility functions
3. Update path comparisons to use pathAssertions
4. Test locally to ensure no regressions

### Step 3: Systematic Testing
```bash
# Run tests for each package after fixes
pnpm test --filter=@trailhead/cli
pnpm test --filter=@trailhead/web-ui
```

### Step 4: Cross-Platform Validation
- Test on Windows machine or VM
- Add Windows CI job to validate

## Quick Reference

### Import Statement
```typescript
import { createTestPath, safeJoin, testPaths, isWindows, projectPath, trailheadPath } from '../../utils/cross-platform-paths.js'
```

### Common Replacements
```typescript
// Before → After
'/test/project' → testPaths.mockProject
'/project/src' → projectPath('src')
'/trailhead/components' → trailheadPath('components')
path.join('src', 'file.ts') → safeJoin('src', 'file.ts')
path === '/project/file' → pathAssertions.pathsEqual(path, projectPath('file'))
```

## Verification Checklist
- [ ] All test files import cross-platform utilities
- [ ] No hardcoded Unix paths remain (`/test/`, `/project/`, etc.)
- [ ] Path comparisons use pathAssertions utilities
- [ ] Mock filesystems use normalized paths
- [ ] Tests pass on both Unix and Windows
- [ ] CI includes Windows test matrix

## Notes
- The web-ui package already has comprehensive cross-platform utilities
- Focus on integration.test.ts first as it has the most issues
- Consider adding ESLint rule to prevent future hardcoded paths
- Update contributing guidelines with cross-platform testing requirements