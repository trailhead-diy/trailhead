# ADR-002: Functional Programming Patterns

**Status**: Accepted  
**Date**: 2025-01-17  
**Deciders**: Development Team

## Context

The @esteban-url/create-cli package initially used object-oriented programming patterns with classes like `TemplateCompiler`, `ConfigManager`, and `PresetManager`. As part of the CLI framework migration, we needed to decide on the programming paradigm for the core logic.

## Decision

We will adopt functional programming patterns throughout the create-cli package, replacing OOP classes with pure functions and immutable data structures.

## Rationale

### Benefits of Functional Programming

1. **Predictability**: Pure functions with no side effects are easier to reason about
2. **Testability**: Functions are easier to test in isolation
3. **Composability**: Small functions can be composed into complex behaviors
4. **Immutability**: Immutable data prevents unexpected state changes
5. **Framework Alignment**: CLI framework uses functional patterns

### Specific Patterns Adopted

1. **Pure Functions**: All core logic implemented as pure functions
2. **Immutable Data**: Data structures don't change after creation
3. **Result Types**: Explicit error handling without exceptions
4. **Function Composition**: Building complex behavior from simple functions
5. **Higher-Order Functions**: Functions that operate on other functions

### Migration Impact

- **Removed Classes**: `TemplateCompiler`, `ConfigManager`, `PresetManager` (194+ lines)
- **Added Functions**: `compileTemplate`, `saveConfig`, `loadPreset`, etc.
- **State Management**: Explicit state threading instead of instance variables
- **Error Handling**: Result types instead of exceptions

## Implementation

### Template Compilation

**Before (OOP)**:

```typescript
class TemplateCompiler {
  private cache: Map<string, CompiledTemplate>

  constructor(options: CompilerOptions) {
    this.cache = new Map()
  }

  compile(templatePath: string, context: any): string {
    // Stateful compilation with side effects
    if (this.cache.has(templatePath)) {
      return this.cache.get(templatePath)!.render(context)
    }
    // ... compilation logic
  }
}
```

**After (Functional)**:

```typescript
export async function compileTemplate(
  templatePath: string,
  templateContext: TemplateContext,
  compilerContext: TemplateCompilerContext
): Promise<Result<string, CoreError>> {
  // Pure function with explicit state
  const cachedResult = await getCachedTemplate(templatePath, compilerContext)
  if (cachedResult.isOk() && cachedResult.value) {
    return ok(cachedResult.value(templateContext))
  }
  // ... compilation logic
}

export function createTemplateCompilerContext(
  options: TemplateCompilerOptions = {}
): TemplateCompilerContext {
  return {
    cache: { entries: new Map(), initialized: false },
    options: { ...DEFAULT_COMPILER_OPTIONS, ...options },
  }
}
```

### Configuration Management

**Before (OOP)**:

```typescript
class ConfigManager {
  private configPath: string

  constructor(configPath: string) {
    this.configPath = configPath
  }

  async save(config: Config): Promise<void> {
    // Stateful operation with side effects
    await fs.writeFile(this.configPath, JSON.stringify(config))
  }
}
```

**After (Functional)**:

```typescript
export async function saveConfig(
  config: Config,
  configPath: string
): Promise<Result<void, CoreError>> {
  // Pure function with explicit parameters
  const serialized = JSON.stringify(config, null, 2)
  return fs.writeFile(configPath, serialized)
}

export async function loadConfig(configPath: string): Promise<Result<Config, CoreError>> {
  // Pure function with explicit error handling
  const content = await fs.readFile(configPath)
  if (content.isErr()) {
    return content
  }

  try {
    const config = JSON.parse(content.value)
    return ok(config)
  } catch (error) {
    return err(createConfigError('PARSE_FAILED', 'Invalid JSON'))
  }
}
```

### Error Handling

**Before (Exceptions)**:

```typescript
class TemplateCompiler {
  compile(template: string): string {
    if (!template) {
      throw new Error('Template is required')
    }
    // ... compilation
  }
}
```

**After (Result Types)**:

```typescript
export function compileTemplate(
  templatePath: string,
  context: TemplateContext
): Result<string, CoreError> {
  if (!templatePath) {
    return err(
      createTemplateCompilerError(ERROR_CODES.TEMPLATE_PATH_REQUIRED, 'Template path is required')
    )
  }
  // ... compilation
  return ok(compiledTemplate)
}
```

## Benefits Achieved

### Code Quality

1. **Reduced Complexity**: Eliminated stateful classes and instance management
2. **Better Testing**: Pure functions are easier to test and mock
3. **Improved Readability**: Function signatures clearly show inputs and outputs
4. **Type Safety**: Result types make error handling explicit

### Maintainability

1. **Easier Debugging**: No hidden state or side effects
2. **Simpler Refactoring**: Functions can be moved and composed easily
3. **Clear Dependencies**: All dependencies are explicit parameters
4. **Predictable Behavior**: Same inputs always produce same outputs

### Performance

1. **Better Optimization**: Pure functions enable compiler optimizations
2. **Parallelization**: Functions can be safely run in parallel
3. **Memory Management**: Immutable data reduces memory pressure
4. **Caching**: Pure functions enable aggressive caching

## Consequences

### Positive

- **Reduced Code Complexity**: Eliminated stateful class management
- **Better Testability**: Functions are easier to test in isolation
- **Improved Composability**: Functions can be combined in flexible ways
- **Clearer Error Handling**: Result types make error paths explicit
- **Framework Alignment**: Consistent with CLI framework patterns

### Negative

- **Learning Curve**: Team needs to understand functional patterns
- **Verbosity**: Some operations require more explicit parameter passing
- **State Threading**: Explicit state management can be more verbose

### Neutral

- **Performance**: Comparable performance, different trade-offs
- **Memory Usage**: Immutable data structures have different memory patterns

## Functional Programming Principles Applied

### 1. Pure Functions

```typescript
// Pure function: same inputs always produce same outputs
export function sanitizeProjectName(name: string): Result<string, CoreError> {
  if (!name || typeof name !== 'string') {
    return err(createValidationError('INVALID_NAME', 'Name must be a string'))
  }

  const sanitized = name.toLowerCase().replace(/[^a-z0-9-]/g, '-')
  return ok(sanitized)
}
```

### 2. Immutable Data

```typescript
// Immutable data structures
export interface TemplateCompilerContext {
  readonly cache: TemplateCacheState
  readonly options: Required<TemplateCompilerOptions>
}

// Functions return new state instead of mutating
export function addToCache(
  context: TemplateCompilerContext,
  path: string,
  template: CompiledTemplate
): TemplateCompilerContext {
  return {
    ...context,
    cache: {
      ...context.cache,
      entries: new Map([...context.cache.entries, [path, template]]),
    },
  }
}
```

### 3. Function Composition

```typescript
// Compose simple functions into complex operations
export const processTemplate = pipe(
  validateTemplatePath,
  readTemplateFile,
  compileTemplate,
  renderWithContext
)

// Higher-order functions
export function withCache<T>(
  fn: (path: string) => Promise<Result<T, CoreError>>
): (path: string, cache: CacheContext) => Promise<Result<T, CoreError>> {
  return async (path: string, cache: CacheContext) => {
    const cached = getCached(path, cache)
    if (cached.isOk()) {
      return cached
    }
    return fn(path)
  }
}
```

### 4. Result Type Composition

```typescript
// Chain Result operations
export async function generateProjectFiles(
  config: ProjectConfig
): Promise<Result<GeneratedFiles, CoreError>> {
  return loadTemplate(config.template)
    .andThen((template) => validateTemplate(template))
    .andThen((template) => renderTemplate(template, config))
    .andThen((rendered) => writeFiles(rendered, config.outputPath))
}
```

## Testing Functional Code

### Pure Function Testing

```typescript
// Pure functions are easy to test
describe('sanitizeProjectName', () => {
  const testCases = [
    { input: 'My Project', expected: 'my-project' },
    { input: 'invalid@name', expected: 'invalid-name' },
    { input: '', expected: Error },
  ]

  testCases.forEach(({ input, expected }) => {
    it(`should handle "${input}"`, () => {
      const result = sanitizeProjectName(input)
      if (expected === Error) {
        expect(result).toBeErr()
      } else {
        expect(result).toBeOk()
        expect(result.value).toBe(expected)
      }
    })
  })
})
```

### Composition Testing

```typescript
// Test function composition
describe('processTemplate', () => {
  it('should compose all template operations', async () => {
    const mockValidate = vi.fn().mockReturnValue(ok(validPath))
    const mockRead = vi.fn().mockResolvedValue(ok(templateContent))
    const mockCompile = vi.fn().mockResolvedValue(ok(compiled))
    const mockRender = vi.fn().mockReturnValue(ok(rendered))

    const process = pipe(mockValidate, mockRead, mockCompile, mockRender)
    const result = await process(inputPath)

    expectSuccess(result)
    expect(mockValidate).toHaveBeenCalledWith(inputPath)
    expect(mockRead).toHaveBeenCalledWith(validPath)
    expect(mockCompile).toHaveBeenCalledWith(templateContent)
    expect(mockRender).toHaveBeenCalledWith(compiled)
  })
})
```

## Alternatives Considered

### 1. Keep OOP Patterns

**Pros**:

- Familiar patterns for team
- Encapsulation of state
- Clear object boundaries

**Cons**:

- Harder to test and compose
- Hidden state and side effects
- Not aligned with CLI framework

**Decision**: Rejected for functional approach

### 2. Hybrid Approach

**Pros**:

- Gradual transition
- Keep familiar patterns where beneficial
- Lower learning curve

**Cons**:

- Inconsistent codebase
- Mixing paradigms causes confusion
- Partial benefits only

**Decision**: Rejected for consistency

### 3. Full Reactive Programming

**Pros**:

- Event-driven architecture
- Powerful composition patterns
- Great for async operations

**Cons**:

- High complexity for this domain
- Steep learning curve
- Overkill for CLI generation

**Decision**: Rejected as unnecessary complexity

## References

- [Functional Programming Guide](../FUNCTIONAL_PATTERNS.md)
- [CLI Framework Patterns](../../../cli/docs/FUNCTIONAL_PATTERNS.md)
- [Result Types Documentation](../../../core/src/README.md)

## Review

This ADR should be reviewed if:

- Team feedback indicates functional patterns are hindering productivity
- Performance issues arise from immutable data structures
- New requirements favor stateful approaches
