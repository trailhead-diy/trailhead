---
type: reference
sidebar: true
example: 0
---

[**Trailhead API Documentation v1.0.0**](README.md)

***

[Trailhead API Documentation](README.md) / @esteban-url/sort

# @esteban-url/sort

Fast, type-safe sorting utilities for JavaScript/TypeScript.

## Interfaces

### SortOptions\<T\>

Common sorting options interface for consistent API across packages

#### Type Parameters

##### T

`T` = `any`

#### Properties

##### by?

> `optional` **by**: `string` \| `string`[] \| [`PropFn`](#propfn)\<`T`, `any`\> \| [`PropFn`](#propfn)\<`T`, `any`\>[]

Field(s) to sort by - can be a single field or array of fields

##### caseInsensitive?

> `optional` **caseInsensitive**: `boolean`

Whether to perform case-insensitive string comparison

##### compareFn?

> `optional` **compareFn**: [`CompareFn`](#comparefn-1)\<`T`\>

Optional custom comparison function

##### limit?

> `optional` **limit**: `number`

Maximum number of items to return (for topN/bottomN operations)

##### order?

> `optional` **order**: [`SortDirection`](#sortdirection) \| [`SortDirection`](#sortdirection)[]

Sort order(s) - can be a single order or array matching the fields

## Type Aliases

### CompareFn()\<T\>

> **CompareFn**\<`T`\> = (`a`, `b`) => `number`

A comparison function that determines the relative order of two values.

#### Type Parameters

##### T

`T`

The type of values being compared

#### Parameters

##### a

`T`

The first value to compare

##### b

`T`

The second value to compare

#### Returns

`number`

A number indicating the relative order:
         - Negative number if `a` should come before `b`
         - Zero if `a` and `b` are considered equal
         - Positive number if `a` should come after `b`

#### Examples

```ts
// Simple number comparison
const compareNumbers: CompareFn<number> = (a, b) => a - b
```

```ts
// Case-insensitive string comparison
const compareStrings: CompareFn<string> = (a, b) =>
  a.toLowerCase().localeCompare(b.toLowerCase())
```

```ts
// Custom object comparison
const compareUsers: CompareFn<User> = (a, b) =>
  a.age - b.age || a.name.localeCompare(b.name)
```

***

### Order

> **Order** = `"asc"` \| `"desc"`

Represents the sort order direction.
- 'asc' for ascending order (smallest to largest)
- 'desc' for descending order (largest to smallest)

***

### PropFn()\<T, K\>

> **PropFn**\<`T`, `K`\> = (`item`) => `K`

A function that extracts a comparable value from an object.

This is commonly used with sorting functions to specify which property
or computed value should be used for comparison.

#### Type Parameters

##### T

`T`

The type of the input object

##### K

`K`

The type of the extracted value

#### Parameters

##### item

`T`

The object to extract a value from

#### Returns

`K`

The extracted value to use for comparison

#### Examples

```ts
// Extract a property
const getAge: PropFn<User, number> = user => user.age
```

```ts
// Compute a value
const getFullName: PropFn<User, string> = user =>
  `${user.firstName} ${user.lastName}`
```

```ts
// Complex calculation
const getTotalScore: PropFn<Player, number> = player =>
  player.scores.reduce((sum, score) => sum + score, 0)
```

***

### SortDirection

> **SortDirection** = `"asc"` \| `"desc"`

Represents sorting direction

## Functions

### bottomN()

> **bottomN**\<`T`\>(`n`, `array`, `compareFnOrSelector?`): `T`[]

Get the bottom N elements from an array in ascending order.

This function uses an optimized partial sorting algorithm that is significantly
faster than sorting the entire array when N is small relative to the array size.

#### Type Parameters

##### T

`T`

#### Parameters

##### n

`number`

The number of bottom elements to return

##### array

readonly `T`[]

The input array to select from

##### compareFnOrSelector?

Optional comparison function or property selector.
                             If a function with 2 parameters, it's used as a comparator.
                             If a function with 1 parameter, it's used as a property selector.
                             If omitted, elements are compared using default comparison.

[`CompareFn`](#comparefn-1)\<`T`\> | [`PropFn`](#propfn)\<`T`, `any`\>

#### Returns

`T`[]

An array containing the bottom N elements in ascending order

#### Examples

```ts
// Get bottom 3 numbers
bottomN(3, [9, 3, 1, 7, 2, 8, 4, 6, 5])
// => [1, 2, 3]
```

```ts
// Get bottom 3 users by score (lowest scores)
const users = [
  { name: 'Alice', score: 95 },
  { name: 'Bob', score: 87 },
  { name: 'Charlie', score: 91 },
  { name: 'David', score: 82 }
]
bottomN(2, users, u => u.score)
// => [{ name: 'David', score: 82 }, { name: 'Bob', score: 87 }]
```

```ts
// Get earliest dates
const dates = [
  new Date('2024-03-15'),
  new Date('2024-01-10'),
  new Date('2024-02-20')
]
bottomN(2, dates)
// => [Date('2024-01-10'), Date('2024-02-20')]
```

***

### orderStrings()

> **orderStrings**(`strings`, `compareFn`, `order`): `string`[]

Sort an array of strings with custom comparator

#### Parameters

##### strings

`string`[]

Array of strings to sort

##### compareFn

(`a`, `b`) => `number`

Custom comparison function

##### order

[`SortDirection`](#sortdirection) = `'asc'`

Sort order ('asc' or 'desc')

#### Returns

`string`[]

New sorted array

#### Example

```typescript
// Sort by length
orderStrings(['a', 'abc', 'ab'], (a, b) => a.length - b.length)
// ['a', 'ab', 'abc']
```

***

### partition()

> **partition**\<`T`\>(`predicate`, `array`): \[`T`[], `T`[]\]

Partition an array into two arrays based on a predicate function.

This function splits an array into two arrays: the first contains all elements
that satisfy the predicate, and the second contains all elements that don't.
The original order of elements is preserved in both arrays.

#### Type Parameters

##### T

`T`

#### Parameters

##### predicate

(`value`) => `boolean`

A function that returns true for elements that should go in the first array

##### array

readonly `T`[]

The input array to partition

#### Returns

\[`T`[], `T`[]\]

A tuple of two arrays: [passing elements, failing elements]

#### Examples

```ts
// Partition numbers by threshold
const [high, low] = partition(x => x > 5, [1, 6, 3, 8, 2, 9])
// => [[6, 8, 9], [1, 3, 2]]
```

```ts
// Separate adults from minors
const users = [
  { name: 'Alice', age: 25 },
  { name: 'Bob', age: 17 },
  { name: 'Charlie', age: 30 },
  { name: 'David', age: 16 }
]
const [adults, minors] = partition(user => user.age >= 18, users)
// => [
//   [{ name: 'Alice', age: 25 }, { name: 'Charlie', age: 30 }],
//   [{ name: 'Bob', age: 17 }, { name: 'David', age: 16 }]
// ]
```

```ts
// Filter valid vs invalid data
const data = [
  { id: 1, value: 10 },
  { id: 2, value: null },
  { id: 3, value: 20 },
  { id: 4, value: undefined }
]
const [valid, invalid] = partition(item => item.value != null, data)
// => [
//   [{ id: 1, value: 10 }, { id: 3, value: 20 }],
//   [{ id: 2, value: null }, { id: 4, value: undefined }]
// ]
```

***

### sortArray()

> **sortArray**\<`T`\>(`array`, `order`): `T`[]

Sort an array of primitives (strings, numbers, booleans)

#### Type Parameters

##### T

`T` *extends* `string` \| `number` \| `boolean`

#### Parameters

##### array

`T`[]

Array of primitives to sort

##### order

[`SortDirection`](#sortdirection) = `'asc'`

Sort order ('asc' or 'desc')

#### Returns

`T`[]

New sorted array

#### Example

```typescript
sortArray([3, 1, 2]) // [1, 2, 3]
sortArray(['c', 'a', 'b']) // ['a', 'b', 'c']
sortArray([3, 1, 2], 'desc') // [3, 2, 1]
```

***

### sortMultiple()

> **sortMultiple**\<`T`\>(`array`, `criteria`): `T`[]

Sort an array with multiple sort criteria (for objects)
Useful when es-toolkit's orderBy doesn't handle the specific case

#### Type Parameters

##### T

`T`

#### Parameters

##### array

`T`[]

Array to sort

##### criteria

`object`[]

Array of accessor functions and their sort orders

#### Returns

`T`[]

New sorted array

#### Example

```typescript
const data = [
  { name: 'John', age: 30 },
  { name: 'Jane', age: 25 },
  { name: 'Bob', age: 30 }
]

sortMultiple(data, [
  { accessor: (item) => item.age, order: 'asc' },
  { accessor: (item) => item.name, order: 'desc' }
])
```

***

### sortStrings()

> **sortStrings**(`strings`, `order`): `string`[]

Sort an array of strings

#### Parameters

##### strings

`string`[]

Array of strings to sort

##### order

[`SortDirection`](#sortdirection) = `'asc'`

Sort order ('asc' or 'desc')

#### Returns

`string`[]

New sorted array

#### Example

```typescript
sortStrings(['zebra', 'apple', 'banana']) // ['apple', 'banana', 'zebra']
sortStrings(['zebra', 'apple', 'banana'], 'desc') // ['zebra', 'banana', 'apple']
```

***

### topN()

> **topN**\<`T`\>(`n`, `array`, `compareFnOrSelector?`): `T`[]

Get the top N elements from an array in descending order.

This function uses an optimized partial sorting algorithm that is significantly
faster than sorting the entire array when N is small relative to the array size.

#### Type Parameters

##### T

`T`

#### Parameters

##### n

`number`

The number of top elements to return

##### array

readonly `T`[]

The input array to select from

##### compareFnOrSelector?

Optional comparison function or property selector.
                             If a function with 2 parameters, it's used as a comparator.
                             If a function with 1 parameter, it's used as a property selector.
                             If omitted, elements are compared using default comparison.

[`CompareFn`](#comparefn-1)\<`T`\> | [`PropFn`](#propfn)\<`T`, `any`\>

#### Returns

`T`[]

An array containing the top N elements in descending order

#### Examples

```ts
// Get top 3 numbers
topN(3, [9, 3, 1, 7, 2, 8, 4, 6, 5])
// => [9, 8, 7]
```

```ts
// Get top 3 users by score
const users = [
  { name: 'Alice', score: 95 },
  { name: 'Bob', score: 87 },
  { name: 'Charlie', score: 91 }
]
topN(2, users, u => u.score)
// => [{ name: 'Alice', score: 95 }, { name: 'Charlie', score: 91 }]
```

```ts
// Using custom comparator
topN(2, users, (a, b) => a.score - b.score)
// => [{ name: 'Alice', score: 95 }, { name: 'Charlie', score: 91 }]
```
