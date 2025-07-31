# Testing Guide

This document provides comprehensive testing guidelines for the Trailhead monorepo.

## Overview

Trailhead uses a domain-driven testing approach with specialized testing utilities for each package. All tests are powered by [Vitest](https://vitest.dev/) with shared configurations and utilities.

## Testing Philosophy

### High-ROI Testing

Focus on tests that provide the most value:

**✅ High-ROI Tests (Keep These):**

- **User Interaction Tests**: Click handlers, form submissions, keyboard navigation
- **Business Logic Tests**: Data transformations, calculations, algorithms
- **Integration Tests**: Components working together, cross-package functionality
- **Error Handling Tests**: Edge cases, error boundaries, recovery scenarios
- **Critical Path Tests**: Core functionality, authentication, data persistence

**❌ Low-ROI Tests (Avoid These):**

- **Basic Rendering Tests**: "renders without crashing", "should render"
- **Props Forwarding Tests**: "passes className", "spreads props"
- **Framework Behavior Tests**: Testing React/library internals
- **Implementation Details**: Testing internal state structure
- **Snapshot Tests**: Brittle tests that break with any UI changes

### Result-Based Testing

All packages use Result types for explicit error handling. Use the Result matchers from `@esteban-url/core/testing`:

```typescript
import { setupResultMatchers } from '@esteban-url/core/testing'

// Setup in test files
setupResultMatchers()

// Use in tests
expect(result).toBeOk()
expect(result).toHaveValue(expectedValue)
expect(errorResult).toBeErr()
expect(errorResult).toHaveErrorCode('VALIDATION_ERROR')
```

## Shared Testing Infrastructure

### Vitest Configuration

The monorepo uses shared Vitest configuration from `@repo/vitest-config`:

```typescript
import { testingProfiles } from '@repo/vitest-config'

// Standard Node.js package
export default testingProfiles.node()

// React/Web UI package
export default testingProfiles.web()

// CLI package with extended timeout
export default testingProfiles.cli()

// Performance testing
export default testingProfiles.performance()

// Integration testing
export default testingProfiles.integration()
```

### Test Patterns

Use consistent test patterns from the shared configuration:

```typescript
import { testPatterns } from '@repo/vitest-config'

// Consistent test descriptions
describe(testPatterns.group('cli', 'command parsing'), () => {
  test(testPatterns.descriptions.unit('should parse basic commands'), () => {
    // Test implementation
  })
})

// Timeouts and retries
test('async operation', testPatterns.timeout(5000), async () => {
  // Test with custom timeout
})
```

## Package-Specific Testing

### Core Package (`@esteban-url/core/testing`)

Foundation testing utilities for Result types and error handling:

```typescript
import {
  setupResultMatchers,
  resultMatchers,
  createMockError,
  createMockResult,
} from '@esteban-url/core/testing'

// Setup Result matchers
setupResultMatchers()

// Test Result types
const result = someOperation()
expect(result).toBeOk()
expect(result).toHaveValue(expectedValue)

// Test error handling
const errorResult = failingOperation()
expect(errorResult).toBeErr()
expect(errorResult).toHaveErrorCode('VALIDATION_ERROR')
```

### CLI Package (`@esteban-url/cli/testing`)

CLI-specific testing utilities for commands and interactions:

```typescript
import {
  runCommand,
  createCLITestRunner,
  createInteractiveTest,
  expectCommandSuccess,
  expectCommandFailure,
  createTestContext,
} from '@esteban-url/cli/testing'

// Test CLI commands
const result = await runCommand(myCommand, ['--verbose'])
expectCommandSuccess(result)

// Test interactive prompts
const interactive = createInteractiveTest(myInteractiveCommand)
await interactive.sendInput('yes')
await interactive.sendInput('save')
```

### Web UI Package (`@esteban-url/web-ui/testing`)

React component testing utilities:

```typescript
import {
  renderComponent,
  simulateUserInteraction,
  themeFixtures,
  assertComponentRenders,
  assertThemeApplied
} from '@esteban-url/web-ui/testing'

// Render component with theme
const { container, user } = renderComponent(
  <Button>Click me</Button>,
  { theme: themeFixtures.dark }
)

// Test user interactions
await simulateUserInteraction(user, 'click', container.querySelector('button'))
assertComponentRenders(container, 'button')
```

### Data Package (`@esteban-url/data/testing`)

Data processing and format testing utilities:

```typescript
import {
  createMockDataProcessor,
  createMockFormatDetector,
  dataFixtures,
  testFormatConversion,
  assertDataParsing,
} from '@esteban-url/data/testing'

// Test data processing
const processor = createMockDataProcessor()
const result = processor.parseData(dataFixtures.csv.usersList, 'csv')
assertDataParsing(result, 'csv', 3)

// Test format conversion
const conversionResult = await testFormatConversion(dataFixtures.json.usersList, 'json', 'csv')
expect(conversionResult).toBeOk()
```

### File System Package (`@esteban-url/fs/testing`)

File system testing utilities:

```typescript
import { createTestTempDir, createTestFile, cleanup, normalizePath } from '@esteban-url/fs/testing'

// Create temporary directory
const tempDir = await createTestTempDir()

// Create test files
await createTestFile(tempDir, 'test.txt', 'content')

// Cleanup after tests
afterEach(() => cleanup(tempDir))
```

## Test Organization

### Directory Structure

```
packages/
├── package-name/
│   ├── src/
│   │   ├── __tests__/           # Unit tests
│   │   ├── testing/             # Testing utilities
│   │   │   ├── index.ts         # Main testing exports
│   │   │   ├── fixtures.ts      # Test fixtures
│   │   │   ├── mocks.ts         # Mock implementations
│   │   │   └── assertions.ts    # Custom assertions
│   │   └── ...
│   ├── vitest.config.ts         # Test configuration
│   └── ...
```

### Test File Naming

- Unit tests: `*.test.ts`
- Integration tests: `*.integration.test.ts`
- End-to-end tests: `*.e2e.test.ts`
- Performance tests: `*.perf.test.ts`

## Running Tests

### Monorepo Commands

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm test --filter=@esteban-url/cli

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode
pnpm test:watch
```

### Package-Specific Commands

```bash
# From package directory
pnpm test                    # Run all tests
pnpm test:watch             # Watch mode
pnpm test:coverage          # Generate coverage
pnpm test:ui                # Vitest UI (if available)
```

### Test Filtering

```bash
# Run specific test file
pnpm test command.test.ts

# Run tests matching pattern
pnpm test --reporter=verbose --run command

# Run tests with timeout
pnpm test --timeout=30000
```

## Coverage Requirements

### Thresholds

- **Standard packages**: 80% coverage minimum
- **Web UI packages**: 85% coverage minimum
- **CLI packages**: 80% coverage minimum
- **Core packages**: 90% coverage minimum

### Coverage Exclusions

The following are excluded from coverage:

- `node_modules/`
- `dist/`
- `coverage/`
- `**/*.config.ts`
- `**/*.config.js`
- `**/testing/**`
- `**/*.test.ts`
- `**/*.spec.ts`
- `**/mocks/**`
- `**/fixtures/**`

## Testing Best Practices

### 1. Test Structure

Use the AAA pattern (Arrange, Act, Assert):

```typescript
test('should parse command arguments', () => {
  // Arrange
  const args = ['--verbose', '--output', 'file.txt']

  // Act
  const result = parseArguments(args)

  // Assert
  expect(result).toBeOk()
  expect(result.value.verbose).toBe(true)
  expect(result.value.output).toBe('file.txt')
})
```

### 2. Test Isolation

Each test should be independent and not rely on other tests:

```typescript
describe('User management', () => {
  let testUser: User

  beforeEach(() => {
    testUser = createTestUser()
  })

  afterEach(() => {
    cleanupTestUser(testUser)
  })

  test('should create user', () => {
    // Test implementation
  })
})
```

### 3. Mock External Dependencies

Mock external services and dependencies:

```typescript
import { vi } from 'vitest'

// Mock external module
vi.mock('@external/service', () => ({
  apiCall: vi.fn(() => Promise.resolve({ data: 'mock data' })),
}))
```

### 4. Test Error Conditions

Always test both success and failure scenarios:

```typescript
test('should handle validation errors', async () => {
  const invalidInput = { email: 'invalid-email' }

  const result = await validateUser(invalidInput)

  expect(result).toBeErr()
  expect(result).toHaveErrorCode('VALIDATION_ERROR')
})
```

### 5. Use Descriptive Test Names

Test names should clearly describe what is being tested:

```typescript
// ✅ Good
test('should return error when email is invalid')

// ❌ Bad
test('email validation')
```

## Performance Testing

### Using Performance Utilities

```typescript
import { measureCLIPerformance, createCLIPerformanceMonitor } from '@esteban-url/cli/testing'

test('command performance', async () => {
  const monitor = createCLIPerformanceMonitor()

  const result = await measureCLIPerformance(() => runCommand(['build']), {
    maxExecutionTime: 5000,
  })

  expect(result.executionTime).toBeLessThan(5000)
})
```

### Performance Benchmarks

Create performance benchmarks for critical operations:

```typescript
import { bench } from 'vitest'

bench('data parsing performance', async () => {
  await parseData(largeDataSet)
})
```

## Debugging Tests

### Debug Mode

Run tests in debug mode:

```bash
pnpm test --reporter=verbose --run --no-coverage
```

### Test UI

Use Vitest UI for interactive debugging:

```bash
pnpm test:ui
```

### Debug Specific Tests

```bash
# Debug specific test file
pnpm test --reporter=verbose command.test.ts

# Debug with increased timeout
pnpm test --timeout=60000 command.test.ts
```

## Continuous Integration

### Pre-commit Hooks

Tests are run automatically before commits:

```bash
# Install pre-commit hooks
pnpm prepare

# Run tests manually
pnpm test
```

### CI Pipeline

Tests run in CI with:

- Coverage reporting
- Performance benchmarks
- Cross-platform testing
- Dependency vulnerability scanning

## Troubleshooting

### Common Issues

1. **Tests timing out**: Increase timeout or optimize test setup
2. **Mock not working**: Check mock setup and module resolution
3. **Coverage too low**: Add tests for uncovered code paths
4. **Flaky tests**: Use proper async handling and cleanup

### Getting Help

- Check package-specific testing documentation
- Review test examples in existing packages
- Consult shared testing utilities documentation
- Ask in team discussions for complex testing scenarios

## Contributing to Testing Infrastructure

### Adding New Testing Utilities

1. Create utilities in appropriate `src/testing/` directory
2. Export from package's main testing index
3. Add documentation and examples
4. Write tests for the testing utilities
5. Document the new testing patterns with examples and migration guides

### Improving Shared Infrastructure

1. Enhance shared Vitest configuration
2. Add new testing profiles for different scenarios
3. Create cross-package testing utilities
4. Improve test reporting and coverage analysis

---

This testing guide should be kept up-to-date as the testing infrastructure evolves. For package-specific testing details, refer to the individual package documentation.
