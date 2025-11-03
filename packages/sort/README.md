# @trailhead/sort

Fast, type-safe sorting utilities for JavaScript/TypeScript.

## Installation

```bash
npm install @trailhead/sort
```

## Usage

```typescript
import { sortBy, orderBy, topN } from '@trailhead/sort'

// Sort by a single property
const users = [
  { name: 'John', age: 30 },
  { name: 'Jane', age: 25 },
  { name: 'Bob', age: 35 },
]

const sorted = sortBy(users, [(user) => user.age])
// [{ name: 'Jane', age: 25 }, { name: 'John', age: 30 }, { name: 'Bob', age: 35 }]

// Sort by multiple criteria
const sorted = orderBy(users, [(user) => user.age, (user) => user.name], ['asc', 'desc'])

// Get top N items efficiently
const scores = [45, 23, 89, 12, 67, 90, 34, 78, 56]
const top3 = topN(3, scores) // [90, 89, 78]
```

## API

### `sortBy(collection, criteria)`

Sort an array by one or more key functions or property names.

```typescript
sortBy(users, [(user) => user.age])
sortBy(users, ['age']) // Can use property name directly
sortBy(products, [(product) => product.category, (product) => product.price])
```

### `orderBy(collection, iteratees, orders)`

Sort an array by multiple criteria with specified order directions.

```typescript
orderBy(
  users,
  [(user) => user.role, (user) => user.age, (user) => user.name],
  ['asc', 'desc', 'asc']
)
```

### `topN(n, array, selector?)`

Efficiently get the top N items from an array. Much faster than sorting the entire array when N is small relative to the array size.

```typescript
// Get top 5 scores
topN(5, scores)

// Get top 3 users by age
topN(3, users, (user) => user.age)
```

### `bottomN(n, array, selector?)`

Efficiently get the bottom N items from an array.

```typescript
// Get lowest 5 scores
bottomN(5, scores)

// Get youngest 3 users
bottomN(3, users, (user) => user.age)
```

### `partition(predicate, array)`

Split an array into two arrays based on a predicate function.

```typescript
const [adults, minors] = partition((user) => user.age >= 18, users)
const [passed, failed] = partition((score) => score >= 60, scores)
```

## Performance

This library leverages [es-toolkit](https://github.com/es-toolkit/es-toolkit) for core sorting functionality, providing excellent performance with zero maintenance burden.

The `topN` and `bottomN` functions use an optimized partial sorting algorithm that can be significantly faster than full sorting when you only need a small subset of results:

- `topN(10, array)` is up to 13x faster than `sort(array).slice(0, 10)` for large arrays
- Best performance gains when N < array.length / 10

## TypeScript

Full TypeScript support with strict type safety.

```typescript
import type { Order, CompareFn, PropFn } from '@trailhead/sort'

// Custom comparator
const customCompare: CompareFn<User> = (a, b) => a.age - b.age

// Property selector
const getAge: PropFn<User, number> = (user) => user.age
```

## License

MIT
