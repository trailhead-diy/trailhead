# Scripts CLI Tests

This directory contains tests to ensure the TypeScript CLI implementation provides equivalent functionality to the shell scripts.

## Test Structure

```
tests/
├── unit/                    # Unit tests for individual functions
│   ├── test-runner.test.ts  # Test runner logic tests
│   └── validate-deps.test.ts # Dependency validation tests
├── integration/             # Integration tests for complete commands
│   ├── npm-auth.test.ts     # npm-auth command tests
│   └── validate-deps.test.ts # validate-deps command tests
├── comparison/              # Comparison tests (shell vs TypeScript)
│   └── shell-vs-ts.test.ts  # Output comparison tests
└── utils/                   # Test utilities
    └── mock-context.ts      # Mock CLI context for testing
```

## Running Tests

```bash
# Run all tests
pnpm test

# Run specific test suites
pnpm test:unit          # Unit tests only
pnpm test:integration   # Integration tests only
pnpm test:comparison    # Comparison tests only

# Verify feature parity
pnpm test:parity        # Quick verification all commands exist

# Run everything
pnpm test:all           # All tests + parity check
```

## Test Categories

### Unit Tests

Test individual functions and logic in isolation:

- Risk level detection for test-runner
- Package extraction from file paths
- Import parsing and circular dependency detection
- Progress indicator logic

### Integration Tests

Test complete command behavior end-to-end:

- npm-auth authentication setup
- validate-deps monorepo validation
- File system interactions
- Error handling scenarios

### Comparison Tests

Compare outputs between shell scripts and TypeScript commands:

- Exit code consistency
- Output format similarity
- Performance benchmarks
- Edge case handling

### Parity Verification

Quick verification that all shell scripts have TypeScript equivalents:

- Command availability check
- Help output validation
- Basic functionality smoke test

## Test Philosophy

These tests focus on **high-ROI testing**:

✅ **Test**: Command behavior, business logic, error handling, user workflows
❌ **Skip**: Low-value rendering tests, prop forwarding, framework internals

## Adding New Tests

When adding new commands or features:

1. Add unit tests for core logic
2. Add integration test for command behavior
3. Update parity verification script
4. Consider comparison test if shell equivalent exists
