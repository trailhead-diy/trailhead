---
type: explanation
title: 'Functional Architecture in Trailhead'
description: 'Understanding the functional programming principles that guide Trailhead design and architecture'
related:
  - /docs/explanation/result-types-pattern
  - /docs/how-to/apply-functional-patterns
  - /packages/cli/docs/explanation/architecture.md
  - /docs/tutorials/data-pipeline-processing
---

# Functional Architecture in Trailhead

This document explains the functional programming principles that guide Trailhead's architecture and why these patterns lead to more maintainable, testable code.

## Core Principles

### 1. Pure Functions

Functions that always return the same output for the same input and have no side effects:

```typescript
// Pure function - deterministic and no side effects
const transformDataRow = (row: DataRow): ProcessedRow => ({
  id: row.id,
  name: row.name.toUpperCase(),
  value: row.value * 1.1,
})

// Impure function - has side effects
const saveDataRow = async (row: DataRow): Promise<void> => {
  console.log('Saving row...') // Side effect
  await database.save(row) // Side effect
}
```

### 2. Immutability

Data is never modified in place:

```typescript
// Bad - mutates array
function addItem(array: string[], item: string) {
  array.push(item) // Mutates original
  return array
}

// Good - returns new array
function addItem(array: string[], item: string): string[] {
  return [...array, item] // Creates new array
}
```

### 3. Function Composition

Build complex operations from simple functions:

```typescript
import { pipe } from '@repo/core'

// Simple functions
const trim = (s: string) => s.trim()
const toLowerCase = (s: string) => s.toLowerCase()
const removeSpaces = (s: string) => s.replace(/\s+/g, '-')

// Composed function
const slugify = pipe(trim, toLowerCase, removeSpaces)

slugify('  Hello World  ') // 'hello-world'
```

### 4. Explicit Effects

Side effects are isolated and made explicit:

```typescript
// Pure core logic
const calculateTotals = (items: Item[]): Totals => {
  return items.reduce(
    (acc, item) => ({
      count: acc.count + 1,
      sum: acc.sum + item.value,
    }),
    { count: 0, sum: 0 }
  )
}

// Effects at the boundaries
async function processOrder(orderId: string): Promise<Result<Order>> {
  // Effect: Read from database
  const itemsResult = await db.getOrderItems(orderId)
  if (itemsResult.isErr()) return itemsResult

  // Pure: Calculate totals
  const totals = calculateTotals(itemsResult.value)

  // Effect: Write to database
  return db.updateOrderTotals(orderId, totals)
}
```

## Why Functional?

### Testability

Pure functions are trivial to test:

```typescript
describe('transformDataRow', () => {
  it('transforms row correctly', () => {
    const input = { id: 1, name: 'test', value: 10 }
    const output = transformDataRow(input)

    expect(output).toEqual({
      id: 1,
      name: 'TEST',
      value: 11,
    })
  })
})
```

No mocks, no setup, no cleanup - just input and output.

### Composability

Functions compose naturally:

```typescript
// Individual validators
const hasUppercase = (s: string) => /[A-Z]/.test(s)
const hasLowercase = (s: string) => /[a-z]/.test(s)
const hasNumber = (s: string) => /[0-9]/.test(s)
const minLength = (n: number) => (s: string) => s.length >= n

// Composed password validator
const isValidPassword = (password: string) =>
  minLength(8)(password) && hasUppercase(password) && hasLowercase(password) && hasNumber(password)
```

### Predictability

No hidden state or surprising mutations:

```typescript
// Functional approach - predictable
const config = { port: 3000 }
const updatedConfig = { ...config, port: 4000 }
// Original config unchanged

// Object-oriented approach - surprising
const server = new Server({ port: 3000 })
server.port = 4000 // Did this update the file? Database? Memory only?
```

### Refactoring Safety

Pure functions can be moved, extracted, and reused safely:

```typescript
// These functions can be moved to any file without breaking
export const isActive = (item: Item) => item.status === 'active'
export const calculateDiscount = (price: number, rate: number) => price * rate
export const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`

// Use them anywhere
const activeItems = items.filter(isActive)
const discounted = calculateDiscount(100, 0.1)
const display = formatCurrency(discounted)
```

## Functional Patterns in Practice

### Result Type for Error Handling

Instead of exceptions, use Result types:

```typescript
// Traditional
try {
  const data = JSON.parse(jsonString)
  const validated = validateData(data)
  await saveData(validated)
} catch (error) {
  // Which operation failed?
  console.error(error)
}

// Functional
parseJson(jsonString)
  .andThen(validateData)
  .andThen(saveData)
  .mapErr((error) => {
    // Error type tells us exactly what failed
    switch (error.type) {
      case 'ParseError': // ...
      case 'ValidationError': // ...
      case 'SaveError': // ...
    }
  })
```

### Dependency Injection

Pass dependencies explicitly:

```typescript
// Dependencies as parameters
const createFileReader = (fs: FileSystem) => {
  return (path: string) => fs.readFile(path)
}

// Easy to test with mocks
const mockFs = createMockFS()
const readFile = createFileReader(mockFs)
```

### Higher-Order Functions

Functions that create other functions:

```typescript
// Create specialized validators
const createRangeValidator = (min: number, max: number) => {
  return (value: number): Result<number> => {
    if (value < min || value > max) {
      return err(new RangeError(`Value must be between ${min} and ${max}`))
    }
    return ok(value)
  }
}

const validateAge = createRangeValidator(0, 120)
const validatePercentage = createRangeValidator(0, 100)
```

## Common Anti-Patterns to Avoid

### Shared Mutable State

```typescript
// Bad - shared mutable state
let totalProcessed = 0

function processItem(item: Item) {
  totalProcessed++ // Mutation!
  return transform(item)
}

// Good - return new state
function processItems(items: Item[]) {
  const processed = items.map(transform)
  return {
    items: processed,
    total: processed.length,
  }
}
```

### Hidden Side Effects

```typescript
// Bad - hidden side effect
function getConfig() {
  if (!configCache) {
    configCache = loadFromDisk() // Hidden I/O!
  }
  return configCache
}

// Good - explicit effect
async function getConfig(cache: Cache, fs: FileSystem) {
  const cached = cache.get('config')
  if (cached) return ok(cached)

  const result = await fs.readFile('./config.json')
  if (result.isOk()) {
    cache.set('config', result.value)
  }
  return result
}
```

### Mixing Pure and Impure

```typescript
// Bad - mixes pure logic with effects
function processAndSave(data: Data) {
  const processed = transform(data) // Pure
  database.save(processed) // Effect!
  return processed
}

// Good - separate pure from effects
const transform = (data: Data): ProcessedData => {
  /* ... */
}
const save = (data: ProcessedData) => database.save(data)

// Compose at the boundary
const processAndSave = (data: Data) => {
  const processed = transform(data)
  return save(processed).map(() => processed)
}
```

## Functional Architecture Benefits

1. **Testability** - Pure functions need no mocks
2. **Maintainability** - Clear data flow, no hidden state
3. **Composability** - Build complex from simple
4. **Refactoring** - Move functions freely
5. **Debugging** - Predictable behavior
6. **Concurrency** - No shared mutable state

## Related Resources

- [Result Types Pattern](/docs/explanation/result-types-pattern)
- [Package Ecosystem](/docs/explanation/package-ecosystem)
- [Testing Best Practices](/docs/testing-guide)
