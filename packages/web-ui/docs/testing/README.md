# Testing Documentation

> **Note**: This documentation is part of the [Trailhead monorepo](../../../../README.md).

## Overview

The Trailhead UI testing suite provides comprehensive coverage for all scripts, utilities, and optimizations. Built with Vitest and designed around core development principles, the testing framework ensures reliability, maintainability, and high-quality code across the entire project.

## Testing Philosophy

### HIGH-ROI Testing Principles

Following core development principles, we focus on HIGH-ROI (Return on Investment) tests that provide meaningful coverage:

**Tests We Write:**

1. **User Interaction Tests**: Click handlers, form submissions, keyboard navigation
2. **Business Logic Tests**: Theme transformations, data conversions, calculations
3. **Integration Tests**: Components working together, end-to-end workflows
4. **Accessibility Tests**: Screen reader compatibility, keyboard navigation, ARIA
5. **Error Handling**: Edge cases that affect users, error boundaries
6. **Critical Path Tests**: Theme switching, semantic token resolution

**Tests We Avoid:**

1. **Basic Rendering Tests**: "renders without crashing", "should render"
2. **Props Forwarding Tests**: "passes className", "spreads props", "accepts ref"
3. **Framework Behavior Tests**: Testing React/library internals
4. **Implementation Details**: data-testid checks, internal state structure
5. **Type Checking at Runtime**: Testing TypeScript types (let the compiler do this)
6. **Style/CSS Tests**: Testing exact class names or inline styles

## Test Structure

### Directory Organization

```
tests/
├── scripts/                    # Script testing
│   ├── install/                       # CLI installation tests
│   │   ├── installation.test.ts       # Installation workflow
│   │   ├── cli.test.ts                # CLI command tests
│   │   └── integration.test.ts        # Integration tests
│   └── shared/                        # Shared script utilities
│       └── logger.test.ts             # Logger utilities
├── src/                       # Component and library testing
│   ├── components/
│   │   └── theme/                    # Theme system tests
│   │       ├── catalyst-theme.test.ts # Catalyst theme generation
│   │       ├── semantic-enhancements.test.ts # Semantic token enhancements
│   │       ├── semantic-tokens.test.ts # Token resolution and styles
│   │       ├── theme-provider.test.tsx # Theme provider component
│   │       └── theme-switcher.test.tsx # Theme switcher component
│   ├── lib/
│   │   ├── theme/                    # Theme library tests
│   │   │   ├── builder.test.ts       # Theme builder API
│   │   │   ├── registry.test.ts      # Theme registry
│   │   │   ├── presets.test.ts       # Preset themes
│   │   │   └── utils.test.tsx        # Color utilities
│   │   └── utils.test.tsx            # cn() utility function
│   ├── transforms/                   # Transform system tests
│   │   ├── critical-paths/           # Critical path tests
│   │   ├── factories/                # Transform factory tests
│   │   ├── integration/              # Transform integration tests
│   │   └── utilities/                # Transform utility tests
│   └── *.test.tsx                    # Individual component tests (27 files)
├── integration/               # Integration testing
│   ├── real-world-workflows.test.tsx  # Real-world user workflows
│   ├── form-integration.test.tsx      # Form component integration
│   ├── data-display-integration.test.tsx # Data display integration
│   ├── theme-colors.test.tsx         # Theme color switching
│   ├── interactive-patterns.test.tsx  # Interactive UI patterns
│   └── wrapper-compatibility.test.tsx # Component wrapper tests
└── vitest.setup.ts           # Test setup with PointerEvent shim
```

## Script Testing

### Script Tests

Scripts in the `/tests/scripts/` directory test various tooling and automation:

```typescript
describe('CLI Installation Tests', () => {
  it('should detect framework correctly');
  it('should install components with proper paths');
  it('should handle existing files gracefully');
  it('should transform components when needed');
});
```

### Transform System Tests

#### Transform Pipeline Tests

The transform system in `/src/transforms/` has comprehensive test coverage:

```typescript
describe('Transform System Validation', () => {
  describe('Component Transform Tests', () => {
    it('should transform component-specific color mappings');
    it('should apply semantic enhancements correctly');
    it('should handle edge cases for each component');
  });

  describe('Pipeline Integration', () => {
    it('should execute transforms in correct order');
    it('should handle AST-based transformations');
    it('should provide performance profiling');
  });

  describe('Critical Path Coverage', () => {
    it('should test className handling transforms');
    it('should test color mapping transforms');
    it('should test semantic enhancement transforms');
  });

  describe('Transform Utilities', () => {
    it('should test colors object detector');
    it('should test transform factory patterns');
    it('should test AST manipulation utilities');
  });
});
```

## Component Testing

### Individual Component Tests

Each component has HIGH-ROI tests covering:

- **User Interactions** (clicks, keyboard navigation)
- **Accessibility Features** (ARIA attributes, roles)
- **Business Logic** (state changes, conditional rendering)
- **Error States** (disabled states, validation)

Example HIGH-ROI component test:

```typescript
describe('Button Component', () => {
  // HIGH-ROI: User interaction test
  it('should handle click events', async () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)

    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledOnce()
  })

  // HIGH-ROI: Accessibility test
  it('should support keyboard activation', async () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Press me</Button>)

    const button = screen.getByRole('button')
    button.focus()
    await user.keyboard('{Enter}')

    expect(handleClick).toHaveBeenCalledOnce()
  })

  // HIGH-ROI: Error state handling
  it('should prevent clicks when disabled', async () => {
    const handleClick = vi.fn()
    render(<Button disabled onClick={handleClick}>Disabled</Button>)

    await user.click(screen.getByRole('button'))
    expect(handleClick).not.toHaveBeenCalled()
  })
})
```

### Theme System Testing

Comprehensive theme integration testing:

```typescript
describe('Theme System Integration', () => {
  it('should provide theme context', () => {
    render(
      <ThemeProvider>
        <ThemeSwitcher />
      </ThemeProvider>
    )
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('should switch themes correctly', async () => {
    render(
      <ThemeProvider>
        <ThemeSwitcher />
      </ThemeProvider>
    )

    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByText('Purple'))

    expect(document.documentElement).toHaveAttribute('data-theme', 'purple')
  })
})
```

## Integration Testing

### Core Functionality Tests

```typescript
describe('Core Functionality Integration', () => {
  it('should integrate all components with theme system', () => {
    // Test cross-component integration
  });

  it('should maintain consistent APIs across components', () => {
    // Test API consistency
  });
});
```

### End-to-End Verification

```typescript
describe('Final Verification', () => {
  it('should verify all components export correctly', () => {
    // Test exports
  });

  it('should verify theme switching works across all components', () => {
    // Test theme integration
  });
});
```

## Test Configuration

### Vitest Configuration (`vitest.config.ts`)

```typescript
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['tests/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'coverage/',
        '**/*.d.ts',
        'vitest.config.ts',
        'vitest.setup.ts',
      ],
    },
    globals: true,
    css: true,
  },
});
```

### Test Setup (`vitest.setup.ts`)

```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// PointerEvent shim for Headless UI v2 compatibility
window.PointerEvent = MouseEvent as typeof PointerEvent;

// Global test configuration
beforeAll(() => {
  // Set up global test environment
});
```

### Known Testing Challenges

**Headless UI v2 + jsdom Limitations:**

- Headless UI v2 requires PointerEvent which jsdom doesn't provide by default
- Some interactive components (Combobox, Listbox) may have limited test coverage
- We use a PointerEvent shim and document these limitations in affected tests

## Coverage Targets

### Current Coverage Metrics

| Category   | Lines  | Branches | Functions | Statements |
| ---------- | ------ | -------- | --------- | ---------- |
| Scripts    | 89.34% | 68.03%   | 85.55%    | 89.34%     |
| Components | 99.17% | 66.18%   | 95.08%    | 99.17%     |
| Utilities  | 100%   | 86%      | 100%      | 100%       |
| Overall    | 89.34% | 68.03%   | 85.55%    | 89.34%     |

### Target Coverage Goals

- **Lines**: 97%+
- **Branches**: 95%+
- **Functions**: 98%+
- **Statements**: 97%+

## Test Organization

### Test Suite Overview

The Trailhead UI test suite consists of **87 test files** organized into logical categories:

- **Component Tests**: 26 files testing individual UI components
- **Integration Tests**: 15 files testing component interactions
- **Transform Tests**: 20 files testing the transformation system
- **CLI Tests**: 10 files testing installation and commands
- **Theme Tests**: 12 files testing the theme system
- **Utility Tests**: 4 files testing shared utilities

### Test Execution Modes

#### Working Tests (Default)

```bash
# Run all working tests (excludes future/unimplemented)
pnpm test
pnpm test:working

# These are the tests that validate current functionality
```

#### Future Tests

Located in `tests/scripts/install/future/`, these tests document planned features:

```bash
# Run tests for planned features
pnpm test:future

# Example: dependency-resolution.test.ts
# Documents how advanced dependency resolution should work
```

**Purpose of Future Tests:**

- Serve as living documentation for planned features
- Define expected behavior before implementation
- Guide development of new features
- Ensure consistency when features are built

#### Changed Tests

```bash
# Run only tests affected by changes
pnpm test:changed

# Uses Vitest's dependency tracking to run relevant tests
# Ideal for pre-commit hooks and rapid development
```

## Running Tests

### Basic Test Commands

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm run test:watch

# Run tests with coverage
pnpm run test:coverage

# Generate detailed coverage report
pnpm run test:coverage -- --reporter=html

# Run specific test files
npx vitest tests/src/transforms/  # Test transform system
npx vitest tests/scripts/install/ # Test CLI installation

# Run tests for specific pattern
npx vitest tests/src/button.test.tsx
```

### Advanced Test Commands

```bash
# Run tests with specific configuration
npx vitest --config vitest.config.ts

# Run tests with custom timeout
npx vitest --testTimeout=30000

# Run tests with memory limits
npx vitest --pool=forks --isolate

# Debug tests
npx vitest --inspect-brk

# Run tests with coverage threshold
npx vitest --coverage --coverage.thresholdAutoUpdate
```

### Continuous Integration

```yaml
# GitHub Actions workflow
name: Test
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: pnpm install
      - run: pnpm run test:coverage
      - uses: codecov/codecov-action@v3
```

## Testing Best Practices

### Test Structure

1. **Arrange**: Set up test data and mocks
2. **Act**: Execute the code under test
3. **Assert**: Verify the results

```typescript
describe('Component', () => {
  it('should do something specific', () => {
    // Arrange
    const props = { value: 'test' }

    // Act
    render(<Component {...props} />)

    // Assert
    expect(screen.getByText('test')).toBeInTheDocument()
  })
})
```

### Mocking Strategies

#### File System Mocking

```typescript
import { vi } from 'vitest';

// Mock fs-extra
vi.mock('fs-extra', () => ({
  pathExists: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
  ensureDir: vi.fn(),
  copy: vi.fn(),
}));
```

#### Component Mocking

```typescript
// Mock child components
vi.mock('./ChildComponent', () => ({
  ChildComponent: ({ children }: { children: React.ReactNode }) =>
    <div data-testid="child-component">{children}</div>
}))
```

#### API Mocking

```typescript
// Mock external APIs
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: 'test' }),
  })
);
```

### Async Testing

```typescript
describe('Async Operations', () => {
  it('should handle async operations', async () => {
    const promise = asyncFunction();

    await expect(promise).resolves.toBe('expected result');
  });

  it('should handle async errors', async () => {
    const promise = failingAsyncFunction();

    await expect(promise).rejects.toThrow('Expected error');
  });
});
```

### User Interaction Testing

```typescript
import { user } from '@testing-library/user-event'

describe('User Interactions', () => {
  it('should handle click events', async () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)

    await user.click(screen.getByRole('button'))

    expect(handleClick).toHaveBeenCalledOnce()
  })

  it('should handle keyboard navigation', async () => {
    render(<Menu />)

    await user.keyboard('{Tab}')
    expect(screen.getByRole('menuitem')).toHaveFocus()

    await user.keyboard('{ArrowDown}')
    expect(screen.getAllByRole('menuitem')[1]).toHaveFocus()
  })
})
```

## Debugging Tests

### Debug Configuration

```typescript
// Enable debug logging in tests
process.env.DEBUG = 'true';

// Increase test timeout for debugging
describe('Debug Tests', () => {
  beforeEach(() => {
    vi.setTimeout(30000);
  });
});
```

### Visual Debugging

```typescript
import { screen } from '@testing-library/react'

describe('Visual Debug', () => {
  it('should debug DOM state', () => {
    render(<Component />)

    // Print current DOM state
    screen.debug()

    // Print specific element
    screen.debug(screen.getByRole('button'))
  })
})
```

### Snapshot Testing

```typescript
describe('Snapshot Tests', () => {
  it('should match component snapshot', () => {
    const { container } = render(<Component />)

    expect(container).toMatchSnapshot()
  })

  it('should match inline snapshot', () => {
    const result = pureFunction('input')

    expect(result).toMatchInlineSnapshot(`"expected output"`)
  })
})
```

## Performance Testing

### Memory Leak Detection

```typescript
describe('Memory Leaks', () => {
  it('should not create memory leaks', () => {
    const initialMemory = process.memoryUsage().heapUsed

    // Perform operations
    for (let i = 0; i < 1000; i++) {
      render(<Component />)
      cleanup()
    }

    const finalMemory = process.memoryUsage().heapUsed
    const memoryIncrease = finalMemory - initialMemory

    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024) // 10MB threshold
  })
})
```

### Performance Benchmarks

```typescript
describe('Performance Benchmarks', () => {
  it('should execute within time limits', () => {
    const startTime = performance.now();

    // Execute operation
    expensiveFunction();

    const endTime = performance.now();
    const executionTime = endTime - startTime;

    expect(executionTime).toBeLessThan(100); // 100ms threshold
  });
});
```

## Test Data Management

### Fixtures

```typescript
// tests/fixtures/demo-config.ts
export const validDemoConfig = {
  projectRoot: '/test/project',
  demoDir: '/test/project/demo',
  catalystDemoDir: '/test/project/catalyst-ui-kit/demo/typescript',
  backupDir: '/test/project/backups/demo-test',
};

export const invalidDemoConfig = {
  projectRoot: '',
  demoDir: null,
  catalystDemoDir: undefined,
};
```

### Factory Functions

```typescript
// tests/factories/component-factory.ts
export const createComponentProps = (overrides = {}) => ({
  variant: 'solid',
  size: 'medium',
  disabled: false,
  ...overrides,
});

export const createThemeProps = (theme = 'zinc') => ({
  theme,
  className: `theme-${theme}`,
  'data-theme': theme,
});
```

### Mock Data

```typescript
// tests/mocks/file-system-mock.ts
export const createFileSystemMock = () => ({
  pathExists: vi.fn().mockResolvedValue(true),
  readFile: vi.fn().mockResolvedValue('mock content'),
  writeFile: vi.fn().mockResolvedValue(undefined),
  ensureDir: vi.fn().mockResolvedValue(undefined),
  copy: vi.fn().mockResolvedValue(undefined),
});
```

## Maintenance and Updates

### Test Maintenance Schedule

1. **Weekly**: Review test coverage reports
2. **Monthly**: Update test dependencies
3. **Quarterly**: Comprehensive test review and optimization
4. **Per Release**: Full test suite execution and validation

### Adding New Tests

1. **Identify Requirement**: What needs testing?
2. **Choose Test Type**: Unit, integration, or end-to-end?
3. **Write Test**: Follow established patterns
4. **Verify Coverage**: Ensure adequate coverage
5. **Document Test**: Add to appropriate documentation

### Updating Existing Tests

1. **Identify Changes**: What functionality changed?
2. **Update Tests**: Modify tests to match new behavior
3. **Verify Compatibility**: Ensure tests still pass
4. **Update Documentation**: Reflect changes in docs

## Related Documentation

- [CLAUDE.md](../../CLAUDE.md) - Project configuration guide with testing commands
- [Vitest Documentation](https://vitest.dev/) - Official Vitest docs
- [Testing Library Documentation](https://testing-library.com/) - Testing utilities
