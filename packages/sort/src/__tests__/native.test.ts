import { describe, it, expect } from 'vitest'
import { topN, bottomN, partition } from '../native'

describe('native utilities', () => {
  describe('topN edge cases', () => {
    it('handles custom comparator', () => {
      const items = [
        { id: 1, priority: 'low' },
        { id: 2, priority: 'high' },
        { id: 3, priority: 'medium' },
        { id: 4, priority: 'high' },
      ]

      const priorityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 }
      const top2 = topN(2, items, (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

      // Both items have 'high' priority, so the order between them may vary
      const ids = top2.map((item) => item.id).sort()
      expect(ids).toEqual([2, 4])
    })

    it('handles mixed types gracefully', () => {
      const mixed = [null, undefined, 5, 'hello', 3, true, false]
      const top3 = topN(3, mixed)
      // When comparing mixed types, defaultCompare converts to strings
      // and null/undefined are treated specially (placed at end in ascending, start in descending)
      expect(top3).toHaveLength(3)
      expect(top3).toContain(undefined)
      expect(top3).toContain(null)
      expect(top3).toContain(true)
    })

    it('is efficient for large arrays', () => {
      const large = Array.from({ length: 10000 }, () => Math.random() * 1000)
      const top10 = topN(10, large)

      expect(top10).toHaveLength(10)
      expect(top10[0]).toBeGreaterThanOrEqual(top10[9])

      // Verify they are actually the top 10
      const sorted = [...large].sort((a, b) => b - a)
      expect(top10).toEqual(sorted.slice(0, 10))
    })
  })

  describe('bottomN edge cases', () => {
    it('handles dates', () => {
      const dates = [
        new Date('2023-01-01'),
        new Date('2023-06-01'),
        new Date('2023-03-01'),
        new Date('2023-12-01'),
      ]

      const earliest2 = bottomN(2, dates)
      expect(earliest2).toEqual([new Date('2023-01-01'), new Date('2023-03-01')])
    })

    it('handles NaN values', () => {
      const numbers = [1, NaN, 3, NaN, 5]
      const bottom3 = bottomN(3, numbers)
      expect(bottom3).toEqual([1, 3, 5])
    })
  })

  describe('partition performance', () => {
    it('maintains order', () => {
      const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      const [evens, odds] = partition((x: number) => x % 2 === 0, numbers)

      expect(evens).toEqual([2, 4, 6, 8, 10])
      expect(odds).toEqual([1, 3, 5, 7, 9])
    })

    it('handles complex predicates', () => {
      const words = ['apple', 'banana', 'cherry', 'date', 'elderberry']
      const [long, short] = partition((word: string) => word.length > 5, words)

      expect(long).toEqual(['banana', 'cherry', 'elderberry'])
      expect(short).toEqual(['apple', 'date'])
    })
  })
})
