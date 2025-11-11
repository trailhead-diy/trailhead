# @trailhead/sort

> Fast, type-safe sorting utilities for JavaScript/TypeScript

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-blue.svg)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-20.0+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/trailhead-diy/trailhead/blob/main/LICENSE)

Fast, type-safe sorting utilities with multi-criteria sorting, partial sorting optimization, and array partitioning.

## Installation

```bash
npm install @trailhead/sort
```

## Quick Example

```typescript
import { sortBy, orderBy, topN } from '@trailhead/sort'

const users = [
  { name: 'John', age: 30 },
  { name: 'Jane', age: 25 },
  { name: 'Bob', age: 35 },
]

// Sort by a single property
const sorted = sortBy(users, [(user) => user.age])
// [{ name: 'Jane', age: 25 }, { name: 'John', age: 30 }, { name: 'Bob', age: 35 }]

// Sort by multiple criteria with order control
const ordered = orderBy(users, [(user) => user.age, (user) => user.name], ['asc', 'desc'])

// Get top N items efficiently (up to 13x faster than full sort)
const scores = [45, 23, 89, 12, 67, 90, 34, 78, 56]
const top3 = topN(3, scores) // [90, 89, 78]
```

## Key Features

- **Multi-criteria sorting** - Sort by multiple fields with independent order control
- **Partial sorting** - Optimized `topN` and `bottomN` for efficient partial results
- **Array partitioning** - Split arrays based on predicate functions
- **Type-safe** - Full TypeScript support with strict type inference
- **Performance** - Built on es-toolkit for optimal performance

## Documentation

- **[API Documentation](../../docs/@trailhead.sort.md)** - Complete API reference

## License

MIT © [Esteban URL](https://github.com/esteban-url)
