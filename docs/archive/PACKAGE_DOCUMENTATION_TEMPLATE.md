# Package Documentation Template

This template provides a standardized structure for package documentation across the Trailhead monorepo.

## Structure

Every package should include the following documentation files:

### 1. README.md (Required)

````markdown
# @esteban-url/package-name

Brief description of the package's purpose and key features.

## Features

- 🎯 **Feature 1** - Brief description
- 🔧 **Feature 2** - Brief description
- 📦 **Feature 3** - Brief description

## Installation

```bash
pnpm add @esteban-url/package-name
```
````

## Quick Start

```typescript
import { mainFunction } from '@esteban-url/package-name'

// Basic usage example
const result = mainFunction()
```

## API Reference

### Main Functions

#### `mainFunction(options)`

Description of the main function.

**Parameters:**

- `options` (SomeType): Description of parameters

**Returns:** `Result<ReturnType, ErrorType>`

**Example:**

```typescript
const result = mainFunction({ option: 'value' })
if (result.isOk()) {
  console.log(result.value)
}
```

### Types

#### `SomeType`

```typescript
interface SomeType {
  property: string
  optional?: number
}
```

## Testing

```typescript
import { packageTesting } from '@esteban-url/package-name/testing'

// Example test usage
const result = packageTesting.createMockSomething()
```

## Error Handling

This package uses Result types for explicit error handling:

```typescript
import { ok, err } from '@esteban-url/core'

const result = someOperation()
if (result.isErr()) {
  console.error(result.error.message)
}
```

## Examples

### Basic Example

```typescript
// Simple usage example
```

### Advanced Example

```typescript
// Complex usage example
```

## Architecture

Brief description of the package architecture and design decisions.

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for contribution guidelines.

## License

See [LICENSE](../../LICENSE) for license information.

````

### 2. CHANGELOG.md (Required for public packages)

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- New features

### Changed
- Changes in existing functionality

### Deprecated
- Soon-to-be removed features

### Removed
- Now removed features

### Fixed
- Bug fixes

### Security
- Vulnerability fixes

## [1.0.0] - 2024-01-01

### Added
- Initial release
````

### 3. src/testing/README.md (Required for packages with testing utilities)

````markdown
# Testing Utilities

This package provides testing utilities for [package purpose].

## Overview

Brief description of the testing utilities provided.

## Quick Start

```typescript
import { createMockSomething } from '@esteban-url/package-name/testing'

const mock = createMockSomething()
// Usage example
```
````

## Testing Utilities

### Mock Creators

#### `createMockSomething()`

Description of the mock creator.

**Returns:** `MockSomething`

**Example:**

```typescript
const mock = createMockSomething()
mock.mockMethod('value')
```

### Fixtures

#### `packageFixtures`

Description of available test fixtures.

**Available fixtures:**

- `basic` - Basic test data
- `complex` - Complex test scenarios
- `edge` - Edge case data

### Assertions

#### `assertSomething(result, expected)`

Description of assertion function.

**Parameters:**

- `result` - The result to test
- `expected` - Expected value

**Example:**

```typescript
const result = someOperation()
assertSomething(result, expectedValue)
```

## Testing Patterns

### Unit Testing

```typescript
import { createMockSomething } from './testing'

test('should handle basic operation', () => {
  const mock = createMockSomething()
  // Test implementation
})
```

### Integration Testing

```typescript
// Integration test example
```

## Best Practices

1. Use Result type assertions from `@esteban-url/core/testing`
2. Follow the AAA pattern (Arrange, Act, Assert)
3. Test both success and failure scenarios
4. Use descriptive test names
5. Keep tests focused and isolated

## Migration Guide

If updating from previous versions, see migration notes here.

```

## Documentation Standards

### 1. Consistent Formatting

- Use consistent heading levels (H1 for title, H2 for main sections, H3 for subsections)
- Include emoji icons for features (🎯, 🔧, 📦, etc.)
- Use consistent code block formatting with language specifiers
- Include consistent sections in the same order

### 2. Code Examples

- All code examples should be complete and runnable
- Include imports and necessary setup
- Show both success and error handling scenarios
- Use TypeScript for all examples
- Include Result type handling where applicable

### 3. API Documentation

- Document all public functions, classes, and types
- Include parameter descriptions and types
- Show return types, especially Result types
- Provide practical examples for each API item
- Document error conditions and error types

### 4. Testing Documentation

- Every package with testing utilities should have testing documentation
- Include quick start examples
- Document all testing utilities, fixtures, and assertions
- Show integration with shared testing infrastructure
- Include best practices and patterns

### 5. Architecture Documentation

- Explain key architectural decisions
- Document functional programming patterns used
- Explain Result type usage and error handling approach
- Include information about monorepo integration

## Writing Guidelines

### 1. Tone and Style

- Use clear, concise language
- Write for developers familiar with TypeScript
- Be direct and avoid unnecessary pleasantries
- Focus on practical usage and examples

### 2. Structure

- Start with a clear overview and features
- Progress from simple to complex examples
- Group related functionality together
- End with contributing and license information

### 3. Examples

- Every major feature should have a code example
- Examples should be self-contained and runnable
- Show real-world usage scenarios
- Include error handling examples

### 4. Maintenance

- Keep documentation up-to-date with code changes
- Update examples when APIs change
- Maintain consistency across all packages
- Review documentation during code reviews

## Implementation Checklist

For each package, ensure:

- [ ] README.md follows the template structure
- [ ] All public APIs are documented with examples
- [ ] Testing utilities are documented if they exist
- [ ] Error handling is explained and demonstrated
- [ ] Code examples are complete and runnable
- [ ] Architecture decisions are explained
- [ ] Contributing guidelines are referenced
- [ ] License information is included
- [ ] Changelog is maintained for public packages
- [ ] Documentation is consistent with other packages

## Tools and Automation

### Documentation Generation

Consider using tools for automatic documentation generation:

- **TypeDoc** for API documentation from TypeScript comments
- **JSDoc** for inline documentation
- **Doctoc** for automatic table of contents generation

### Validation

Use linting tools to ensure documentation quality:

- **Markdownlint** for consistent markdown formatting
- **Alex** for inclusive language
- **Textlint** for writing style consistency

### Integration

Integrate documentation into the development workflow:

- Include documentation updates in PR reviews
- Use pre-commit hooks for documentation validation
- Generate documentation as part of the CI/CD pipeline
- Keep documentation in sync with code changes

## Examples

See existing packages for examples of this template in action:

- `@esteban-url/cli` - Comprehensive CLI package documentation
- `@esteban-url/core` - Core utilities documentation
- `@esteban-url/web-ui` - React component documentation
- `@esteban-url/data` - Data processing documentation

Each package demonstrates different aspects of the documentation template and provides real-world examples of how to structure and write effective package documentation.
```
