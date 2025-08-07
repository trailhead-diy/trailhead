import { describe, it, expect, beforeEach } from 'vitest'
import {
  createStats,
  updateStats,
  getElapsedTime,
  formatStats,
  getTopOperations,
  getBottomOperations,
  getOperationsSortedByType,
  formatStatsSorted,
  type StatsTracker,
} from '../stats'

describe('stats utilities', () => {
  let stats: StatsTracker

  beforeEach(() => {
    stats = createStats()
  })

  describe('createStats', () => {
    it('should create initial stats with zero values', () => {
      expect(stats.filesProcessed).toBe(0)
      expect(stats.filesModified).toBe(0)
      expect(stats.totalOperations).toBe(0)
      expect(stats.operationsByType.size).toBe(0)
      expect(stats.startTime).toBeGreaterThan(0)
    })

    it('should create stats with custom data', () => {
      const customStats = createStats({ errors: [], warnings: 5 })
      expect(customStats.custom?.errors).toEqual([])
      expect(customStats.custom?.warnings).toBe(5)
    })
  })

  describe('updateStats', () => {
    it('should update file counts', () => {
      const updated = updateStats(stats, {
        filesProcessed: 5,
        filesModified: 2,
        operations: 10,
      })

      expect(updated.filesProcessed).toBe(5)
      expect(updated.filesModified).toBe(2)
      expect(updated.totalOperations).toBe(10)
    })

    it('should accumulate operation types', () => {
      let updated = updateStats(stats, {
        operationTypes: [
          { type: 'read', count: 3 },
          { type: 'write', count: 2 },
        ],
      })

      expect(updated.operationsByType.get('read')).toBe(3)
      expect(updated.operationsByType.get('write')).toBe(2)

      // Add more operations
      updated = updateStats(updated, {
        operationTypes: [
          { type: 'read', count: 2 },
          { type: 'delete', count: 1 },
        ],
      })

      expect(updated.operationsByType.get('read')).toBe(5)
      expect(updated.operationsByType.get('write')).toBe(2)
      expect(updated.operationsByType.get('delete')).toBe(1)
    })

    it('should update custom data', () => {
      const customStats = createStats({ errors: [], warnings: 0 })
      const updated = updateStats(customStats, {
        custom: { warnings: 3 },
      })

      expect(updated.custom?.errors).toEqual([])
      expect(updated.custom?.warnings).toBe(3)
    })
  })

  describe('getElapsedTime', () => {
    it('should calculate elapsed time', () => {
      const pastStats = { ...stats, startTime: Date.now() - 1000 }
      const elapsed = getElapsedTime(pastStats)
      expect(elapsed).toBeGreaterThan(900)
      expect(elapsed).toBeLessThan(1100)
    })
  })

  describe('formatStats', () => {
    it('should format basic stats', () => {
      const testStats = updateStats(stats, {
        filesProcessed: 10,
        filesModified: 3,
        operations: 25,
      })

      const formatted = formatStats(testStats)
      expect(formatted).toContain('Files processed: 10')
      expect(formatted).toContain('Files modified: 3')
      expect(formatted).toContain('Total operations: 25')
      expect(formatted).toContain('Time elapsed:')
    })

    it('should include operation breakdown', () => {
      const testStats = updateStats(stats, {
        operationTypes: [
          { type: 'read', count: 10 },
          { type: 'write', count: 5 },
        ],
      })

      const formatted = formatStats(testStats)
      expect(formatted).toContain('Operations by type:')
      expect(formatted).toContain('read: 10')
      expect(formatted).toContain('write: 5')
    })
  })

  describe('sorting operations', () => {
    let statsWithOps: StatsTracker

    beforeEach(() => {
      statsWithOps = updateStats(stats, {
        operationTypes: [
          { type: 'read', count: 10 },
          { type: 'write', count: 5 },
          { type: 'delete', count: 2 },
          { type: 'copy', count: 8 },
        ],
      })
    })

    describe('getTopOperations', () => {
      it('should return top N operations by count descending', () => {
        const top2 = getTopOperations(statsWithOps, 2)
        expect(top2).toHaveLength(2)
        expect(top2[0]).toEqual({ type: 'read', count: 10 })
        expect(top2[1]).toEqual({ type: 'copy', count: 8 })
      })

      it('should handle requesting more operations than exist', () => {
        const topAll = getTopOperations(statsWithOps, 10)
        expect(topAll).toHaveLength(4)
      })

      it('should handle empty stats', () => {
        const emptyTop = getTopOperations(stats, 5)
        expect(emptyTop).toEqual([])
      })
    })

    describe('getBottomOperations', () => {
      it('should return bottom N operations by count ascending', () => {
        const bottom2 = getBottomOperations(statsWithOps, 2)
        expect(bottom2).toHaveLength(2)
        expect(bottom2[0]).toEqual({ type: 'delete', count: 2 })
        expect(bottom2[1]).toEqual({ type: 'write', count: 5 })
      })

      it('should handle requesting more operations than exist', () => {
        const bottomAll = getBottomOperations(statsWithOps, 10)
        expect(bottomAll).toHaveLength(4)
      })
    })

    describe('getOperationsSortedByType', () => {
      it('should return operations sorted alphabetically by type', () => {
        const sorted = getOperationsSortedByType(statsWithOps)
        expect(sorted).toHaveLength(4)
        expect(sorted.map((op) => op.type)).toEqual(['copy', 'delete', 'read', 'write'])
        expect(sorted.map((op) => op.count)).toEqual([8, 2, 10, 5])
      })
    })

    describe('formatStatsSorted', () => {
      it('should format stats with sorted operations by count', () => {
        const formatted = formatStatsSorted(statsWithOps, {
          sortBy: 'count',
          order: 'desc',
        })

        expect(formatted).toContain('read: 10')
        expect(formatted).toContain('copy: 8')
        expect(formatted).toContain('write: 5')
        expect(formatted).toContain('delete: 2')

        // Check order
        const readIndex = formatted.indexOf('read: 10')
        const copyIndex = formatted.indexOf('copy: 8')
        expect(readIndex).toBeLessThan(copyIndex)
      })

      it('should format stats with sorted operations by type', () => {
        const formatted = formatStatsSorted(statsWithOps, {
          sortBy: 'type',
          order: 'asc',
        })

        expect(formatted).toContain('copy: 8')
        expect(formatted).toContain('delete: 2')

        // Check alphabetical order
        const copyIndex = formatted.indexOf('copy: 8')
        const deleteIndex = formatted.indexOf('delete: 2')
        expect(copyIndex).toBeLessThan(deleteIndex)
      })

      it('should limit operations when specified', () => {
        const formatted = formatStatsSorted(statsWithOps, {
          sortBy: 'count',
          order: 'desc',
          limit: 2,
        })

        expect(formatted).toContain('read: 10')
        expect(formatted).toContain('copy: 8')
        expect(formatted).not.toContain('write: 5')
        expect(formatted).not.toContain('delete: 2')
      })

      it('should handle default sorting (no options)', () => {
        const formatted = formatStatsSorted(statsWithOps)
        expect(formatted).toContain('Operations by type:')
        expect(formatted).toContain('read: 10')
        expect(formatted).toContain('write: 5')
      })
    })
  })

  describe('edge cases', () => {
    it('should handle stats with no operations', () => {
      const top = getTopOperations(stats, 5)
      const bottom = getBottomOperations(stats, 5)
      const sorted = getOperationsSortedByType(stats)

      expect(top).toEqual([])
      expect(bottom).toEqual([])
      expect(sorted).toEqual([])
    })

    it('should handle zero counts in operation types', () => {
      const zeroStats = updateStats(stats, {
        operationTypes: [{ type: 'zero', count: 0 }],
      })

      expect(zeroStats.operationsByType.get('zero')).toBe(0)

      const top = getTopOperations(zeroStats, 1)
      expect(top).toEqual([{ type: 'zero', count: 0 }])
    })

    it('should preserve immutability', () => {
      const original = createStats()
      const updated = updateStats(original, { filesProcessed: 5 })

      expect(original.filesProcessed).toBe(0)
      expect(updated.filesProcessed).toBe(5)
      expect(original).not.toBe(updated)
    })
  })
})
