import { describe, it, expect } from 'vitest'
import { sortBy, orderBy, topN, bottomN, partition } from '../index'

describe('@esteban-url/sort', () => {
  describe('sortBy', () => {
    it('sorts by property selector', () => {
      const users = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
        { name: 'Bob', age: 35 },
      ]

      const sorted = sortBy(users, [(user: (typeof users)[0]) => user.age])

      expect(sorted).toEqual([
        { name: 'Jane', age: 25 },
        { name: 'John', age: 30 },
        { name: 'Bob', age: 35 },
      ])
    })

    it('sorts numbers', () => {
      const items = [{ value: 3 }, { value: 1 }, { value: 4 }, { value: 1 }, { value: 5 }]
      const sorted = sortBy(items, ['value'])
      expect(sorted.map((item) => item.value)).toEqual([1, 1, 3, 4, 5])
    })
  })

  describe('orderBy', () => {
    it('sorts by multiple criteria', () => {
      const users = [
        { name: 'John', age: 30, score: 85 },
        { name: 'Jane', age: 25, score: 90 },
        { name: 'Bob', age: 30, score: 75 },
        { name: 'Alice', age: 25, score: 95 },
      ]

      const sorted = orderBy(
        users,
        [(user: (typeof users)[0]) => user.age, (user: (typeof users)[0]) => user.score],
        ['asc', 'desc']
      )

      expect(sorted).toEqual([
        { name: 'Alice', age: 25, score: 95 },
        { name: 'Jane', age: 25, score: 90 },
        { name: 'John', age: 30, score: 85 },
        { name: 'Bob', age: 30, score: 75 },
      ])
    })
  })

  describe('topN', () => {
    it('gets top N numbers', () => {
      const numbers = [45, 23, 89, 12, 67, 90, 34, 78, 56]
      const top3 = topN(3, numbers)
      expect(top3).toEqual([90, 89, 78])
    })

    it('gets top N objects by property', () => {
      const users = [
        { name: 'John', score: 85 },
        { name: 'Jane', score: 90 },
        { name: 'Bob', score: 75 },
        { name: 'Alice', score: 95 },
      ]

      const top2 = topN(2, users, (user: (typeof users)[0]) => user.score)
      expect(top2).toEqual([
        { name: 'Alice', score: 95 },
        { name: 'Jane', score: 90 },
      ])
    })

    it('returns empty array for n <= 0', () => {
      expect(topN(0, [1, 2, 3])).toEqual([])
      expect(topN(-1, [1, 2, 3])).toEqual([])
    })

    it('returns all items sorted when n >= array length', () => {
      const numbers = [3, 1, 4, 1, 5]
      expect(topN(10, numbers)).toEqual([5, 4, 3, 1, 1])
    })
  })

  describe('bottomN', () => {
    it('gets bottom N numbers', () => {
      const numbers = [45, 23, 89, 12, 67, 90, 34, 78, 56]
      const bottom3 = bottomN(3, numbers)
      expect(bottom3).toEqual([12, 23, 34])
    })

    it('gets bottom N objects by property', () => {
      const users = [
        { name: 'John', score: 85 },
        { name: 'Jane', score: 90 },
        { name: 'Bob', score: 75 },
        { name: 'Alice', score: 95 },
      ]

      const bottom2 = bottomN(2, users, (user: (typeof users)[0]) => user.score)
      expect(bottom2).toEqual([
        { name: 'Bob', score: 75 },
        { name: 'John', score: 85 },
      ])
    })
  })

  describe('partition', () => {
    it('partitions array by predicate', () => {
      const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9]
      const [evens, odds] = partition((x: number) => x % 2 === 0, numbers)

      expect(evens).toEqual([2, 4, 6, 8])
      expect(odds).toEqual([1, 3, 5, 7, 9])
    })

    it('partitions objects by property', () => {
      const users = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 17 },
        { name: 'Bob', age: 25 },
        { name: 'Alice', age: 16 },
      ]

      const [adults, minors] = partition((user: (typeof users)[0]) => user.age >= 18, users)

      expect(adults).toEqual([
        { name: 'John', age: 30 },
        { name: 'Bob', age: 25 },
      ])
      expect(minors).toEqual([
        { name: 'Jane', age: 17 },
        { name: 'Alice', age: 16 },
      ])
    })

    it('handles empty arrays', () => {
      const [pass, fail] = partition((x: number) => x > 5, [] as number[])
      expect(pass).toEqual([])
      expect(fail).toEqual([])
    })
  })
})
