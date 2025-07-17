# Error Handling Patterns

This document describes the standardized error handling patterns implemented in @esteban-url/create-cli and how to use them effectively.

## Overview

The create-cli package uses a standardized error handling system built on:

- **Result types** for explicit error propagation
- **Error helpers** to reduce boilerplate and ensure consistency
- **Standardized error codes** for better debugging and handling
- **Rich error context** with suggestions and recovery information

## Error Helper System

### Core Components

1. **Error Codes** (`ERROR_CODES`): Standardized constants for all error types
2. **Error Domain** (`ERROR_DOMAIN`): Consistent domain classification
3. **Component Helpers**: Specialized error creation functions
4. **Error Suggestions** (`ERROR_SUGGESTIONS`): User-friendly guidance

### Error Helpers

```typescript
// Import error helpers
import {
  createTemplateCompilerError,
  createArgsParserError,
  createGeneratorError,
  createMockScaffolderError,
  ERROR_CODES,
  ERROR_SUGGESTIONS,
} from './lib/error-helpers.js'
```

#### Template Compiler Errors

```typescript
// Template compilation failures
return err(
  createTemplateCompilerError(
    ERROR_CODES.TEMPLATE_COMPILE_FAILED,
    'Template compilation failed: syntax error on line 15',
    {
      operation: 'compileTemplate',
      context: { templatePath, lineNumber: 15 },
      cause: originalError,
      recoverable: false,
    }
  )
)
```

#### Argument Parser Errors

```typescript
// Invalid command line arguments
return err(
  createArgsParserError(
    ERROR_CODES.INVALID_TEMPLATE_VALUE,
    'Template must be "basic" or "advanced"',
    {
      suggestion: ERROR_SUGGESTIONS.TEMPLATE_OPTIONS,
      context: { providedValue: userInput },
    }
  )
)
```

#### Generator Errors

```typescript
// Project generation failures
return err(
  createGeneratorError(
    ERROR_CODES.PACKAGE_MANAGER_DETECTION_FAILED,
    'No package manager detected',
    {
      operation: 'detectPackageManager',
      recoverable: true,
      suggestion: 'Install npm or pnpm',
    }
  )
)
```

## Error Codes Reference

### Template Errors

- `TEMPLATE_NOT_FOUND`: Template file doesn't exist
- `TEMPLATE_READ_FAILED`: Cannot read template file
- `TEMPLATE_COMPILE_FAILED`: Handlebars compilation error
- `TEMPLATE_RENDER_FAILED`: Template rendering error
- `UNRESOLVED_VARIABLES`: Missing template variables
- `CONTEXT_SANITIZATION_FAILED`: Template context security issue
- `OBJECT_SANITIZATION_FAILED`: Object sanitization error
- `PRECOMPILE_FAILED`: Batch template compilation error

### Argument Parsing Errors

- `MISSING_TEMPLATE_VALUE`: --template flag without value
- `INVALID_TEMPLATE_VALUE`: Invalid template name
- `MISSING_PACKAGE_MANAGER_VALUE`: --package-manager flag without value
- `INVALID_PACKAGE_MANAGER_VALUE`: Invalid package manager
- `UNKNOWN_OPTION`: Unrecognized command line option
- `UNEXPECTED_ARGUMENT`: Unexpected positional argument
- `PROJECT_NAME_REQUIRED`: Missing required project name
- `ARGUMENT_PARSING_ERROR`: General parsing failure

### Generator Errors

- `PACKAGE_MANAGER_DETECTION_FAILED`: Cannot detect package manager
- `CONFIG_GATHER_ERROR`: Configuration collection failed
- `GENERATE_COMMAND_ERROR`: General generation failure

### Mock Scaffolder Errors (Testing)

- `INVALID_PROJECT_NAME`: Invalid project name format
- `MISSING_REQUIRED_VARIABLE`: Required template variable missing
- `INVALID_VARIABLE_TYPE`: Variable type mismatch
- `INVALID_VARIABLE_CHOICE`: Variable not in allowed choices
- `VARIABLE_VALIDATION_FAILED`: Custom validation failed

## Error Context

### Required Fields

All errors must include:

```typescript
{
  operation: string,    // Function/method name where error occurred
  recoverable?: boolean // Whether user can retry/fix
}
```

### Optional Fields

```typescript
{
  context?: Record<string, any>, // Relevant data for debugging
  cause?: Error | CoreError,     // Original error that caused this
  suggestion?: string,           // User-friendly guidance
}
```

### Context Examples

```typescript
// Good context
{
  operation: 'compileTemplate',
  context: {
    templatePath: '/path/to/template.hbs',
    variables: ['name', 'version'],
    missingVariables: ['description']
  },
  recoverable: true,
  suggestion: 'Provide values for all required template variables'
}

// Minimal context
{
  operation: 'validateProjectName',
  recoverable: true
}
```

## Error Suggestions

### Predefined Suggestions

```typescript
export const ERROR_SUGGESTIONS = {
  TEMPLATE_OPTIONS: 'Use --template basic or --template advanced',
  PACKAGE_MANAGER_OPTIONS: 'Use --package-manager npm or --package-manager pnpm',
  HELP_COMMAND: 'Run with --help to see available options',
  PROJECT_NAME_FORMAT:
    'Project names can only contain lowercase letters, numbers, hyphens, and underscores',
  PROJECT_NAME_REQUIRED: 'Provide a project name as the first argument',
  NON_INTERACTIVE_HELP: 'Provide a project name or remove --non-interactive flag',
  CLI_USAGE: 'create-trailhead-cli generate my-project-name',
} as const
```

### Custom Suggestions

```typescript
// Dynamic suggestions based on context
return err(
  createArgsParserError(ERROR_CODES.UNKNOWN_OPTION, `Unknown option: ${option}`, {
    context: { option, availableOptions: ['--template', '--package-manager'] },
    suggestion: `Did you mean: ${suggestSimilar(option, availableOptions)}?`,
  })
)
```

## Best Practices

### 1. Always Use Error Helpers

```typescript
// ✅ Good: Use error helpers
return err(
  createTemplateCompilerError(ERROR_CODES.TEMPLATE_COMPILE_FAILED, 'Handlebars syntax error', {
    operation: 'compileTemplate',
  })
)

// ❌ Avoid: Manual error construction
return err(new Error('Template failed'))
```

### 2. Provide Meaningful Context

```typescript
// ✅ Good: Rich context
{
  operation: 'generateProject',
  context: {
    projectName: 'my-cli',
    template: 'advanced',
    outputPath: '/projects/my-cli'
  },
  recoverable: true,
  suggestion: 'Ensure the output directory is writable'
}

// ❌ Avoid: No context
{
  operation: 'generateProject'
}
```

### 3. Include Recovery Information

```typescript
// ✅ Good: Clear recovery path
{
  recoverable: true,
  suggestion: 'Install pnpm with: npm install -g pnpm'
}

// ❌ Avoid: No recovery guidance
{
  recoverable: true
}
```

### 4. Chain Errors Properly

```typescript
// ✅ Good: Preserve error chain
const fileResult = await fs.readFile(path)
if (fileResult.isErr()) {
  return err(
    createTemplateCompilerError(ERROR_CODES.TEMPLATE_READ_FAILED, `Cannot read template: ${path}`, {
      operation: 'loadTemplate',
      cause: fileResult.error, // Preserve original error
      context: { templatePath: path },
    })
  )
}
```

### 5. Use Appropriate Error Codes

```typescript
// ✅ Good: Specific error code
ERROR_CODES.MISSING_TEMPLATE_VALUE

// ❌ Avoid: Generic error code
ERROR_CODES.ARGUMENT_PARSING_ERROR // Too general
```

## Testing Error Handling

### Testing Success Cases

```typescript
import { expectSuccess } from '@esteban-url/cli/testing'

const result = await someOperation()
expectSuccess(result)
expect(result).toBeOk()
```

### Testing Error Cases

```typescript
import { expectError } from '@esteban-url/cli/testing'

const result = await someOperation()
expectError(result)
expect(result).toBeErr()

// Verify specific error code
if (result.isErr()) {
  expect(result.error.code).toBe(ERROR_CODES.EXPECTED_ERROR)
}
```

### Testing Error Context

```typescript
// Verify error contains expected context
if (result.isErr()) {
  expect(result.error.context).toMatchObject({
    expectedField: 'expectedValue',
  })
  expect(result.error.suggestion).toContain('helpful text')
}
```

## Error Recovery Patterns

### Recoverable Errors

```typescript
// User can fix and retry
{
  recoverable: true,
  suggestion: 'Fix the template syntax error and try again'
}
```

### Non-Recoverable Errors

```typescript
// System or security errors
{
  recoverable: false,
  suggestion: 'Contact support if this error persists'
}
```

### Graceful Degradation

```typescript
// Attempt fallback on error
const primaryResult = await primaryOperation()
if (primaryResult.isErr() && primaryResult.error.recoverable) {
  logger.warning(`Primary operation failed: ${primaryResult.error.message}`)
  return fallbackOperation()
}
return primaryResult
```

## Migration from Legacy Patterns

### Before (Legacy)

```typescript
// Manual error construction
return err({
  domain: 'template-compiler',
  code: 'TEMPLATE_FAILED',
  message: 'Template compilation failed',
  type: 'template-compiler-error',
  recoverable: false,
  component: 'TemplateCompiler',
  operation: 'compileTemplate',
  severity: 'high',
  timestamp: new Date(),
  context: { templatePath },
  cause: error,
} as CoreError)
```

### After (Standardized)

```typescript
// Helper-based construction
return err(
  createTemplateCompilerError(ERROR_CODES.TEMPLATE_COMPILE_FAILED, 'Template compilation failed', {
    operation: 'compileTemplate',
    context: { templatePath },
    cause: error,
    recoverable: false,
  })
)
```

## Performance Considerations

### Lazy Error Context

```typescript
// For expensive context computation
return err(
  createError(code, message, {
    operation: 'heavyOperation',
    get context() {
      // Only computed if error is actually used
      return computeExpensiveContext()
    },
  })
)
```

### Error Code Constants

```typescript
// ✅ Good: Use constants (tree-shakeable)
ERROR_CODES.TEMPLATE_COMPILE_FAILED

// ❌ Avoid: String literals (harder to refactor)
;('TEMPLATE_COMPILE_FAILED')
```

## See Also

- [CLI Framework Migration Guide](./CLI_FRAMEWORK_MIGRATION.md)
- [Testing Patterns](./TESTING_PATTERNS.md)
- [Core Error Types](../../../core/src/errors/README.md)
