# Generator Testing Scripts

This directory contains comprehensive testing utilities for the Trailhead CLI generator.

## 🧪 Test Scripts

### `test-generator-full.ts`

Comprehensive end-to-end testing script that validates all generator combinations.

**Features:**

- Tests all 12 meaningful combinations (3 templates × 2 package managers × 2 scenarios)
- Optional dependency installation and project functionality testing
- Parallel or sequential execution modes
- Real file generation with TypeScript compilation validation
- Comprehensive reporting and cleanup

**Usage:**

```bash
# Fast compilation-only testing (3-5 minutes)
pnpm test:generator:full

# Full E2E with dependency installation (15-30 minutes)
pnpm test:generator:full --install

# CI mode with parallel execution
pnpm test:generator:full --install --ci

# Development mode with verbose output
pnpm test:generator:full --verbose --no-cleanup
```

**Test Matrix:**

- **Templates**: basic, advanced, enterprise
- **Package Managers**: npm, pnpm
- **Scenarios**: minimal (no flags), full-setup (--docs --git)
- **Total**: 12 comprehensive test combinations

## 🎯 Testing Strategy

### Integration Tests (CI - Fast)

- **File**: `src/__tests__/integration-matrix.test.ts`
- **Runtime**: ~3 minutes
- **Coverage**: All 12 combinations with real file generation
- **Validation**: Template compilation, TypeScript compilation, linting
- **Trigger**: Every PR/push

### E2E Tests (Manual/Pre-release - Comprehensive)

- **File**: `scripts/test-generator-full.ts`
- **Runtime**: 3-5 minutes (compilation) / 15-30 minutes (with --install)
- **Coverage**: Same 12 combinations + optional dependency installation
- **Validation**: Full project functionality, build, test execution
- **Trigger**: Manual, pre-release CI

## 🚀 Test Execution Modes

### Development Testing

```bash
# Quick verification during development
pnpm test:integration

# Deep testing with installation for major changes
pnpm test:generator:full --install --verbose
```

### CI Testing

```bash
# Regular CI: Fast integration tests only
pnpm test:integration

# Pre-release CI: Full E2E validation
pnpm test:generator:full --install --ci
```

### Manual Debugging

```bash
# Detailed output with project preservation
pnpm test:generator:full --verbose --no-cleanup

# Test specific combinations
pnpm test:integration --grep "enterprise.*pnpm"
```

## 📊 Quality Gates

### Fast Integration Tests ✓

- Template compilation succeeds
- File generation creates expected structure
- TypeScript compilation passes
- Generated code passes linting
- Template variables resolve correctly

### Comprehensive E2E Tests ✓

- All integration test validations
- Dependency installation succeeds
- Generated project builds successfully
- Generated tests pass (when they exist)
- Package manager commands execute correctly

## 🔧 Configuration

### Package Manager Support

- ✅ **npm**: Universal compatibility, industry standard
- ✅ **pnpm**: Modern, efficient, monorepo-ready, recommended
- ❌ **yarn**: Removed for simplicity and focus
- ❌ **bun**: Removed for stability and maturity concerns

### Template Coverage

- **basic**: Minimal CLI with essential features
- **advanced**: Full-featured CLI with examples and comprehensive testing
- **enterprise**: Production-ready CLI with monorepo, monitoring, and security

### Testing Scenarios

- **minimal**: Fastest generation, core functionality only
- **full-setup**: Complete feature set with docs and git integration

## 🛠️ Maintenance

### Adding New Tests

1. Update test combinations in `integration-matrix.test.ts`
2. Add corresponding scenarios to `test-generator-full.ts`
3. Update this documentation

### Debugging Test Failures

1. Run with `--verbose` flag for detailed output
2. Use `--no-cleanup` to inspect generated projects
3. Test individual combinations with vitest grep patterns
4. Check TypeScript compilation errors in generated projects

### Performance Optimization

- Integration tests use parallel vitest execution
- E2E script supports `--parallel` mode for CI
- Template compilation is cached across test runs
- Cleanup runs in background for faster completion

## 📈 Metrics

**Current Test Coverage:**

- 12 core combinations (100% matrix coverage)
- 3 sample compilation validations
- 2 package manager compatibility tests
- 1 template variable resolution test
- 1 special character handling test

**Performance Targets:**

- Integration tests: < 5 minutes
- E2E compilation-only: < 5 minutes
- E2E with installation: < 30 minutes
- Individual test: < 3 seconds (compilation) / < 2 minutes (with install)
