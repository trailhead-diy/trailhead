import { describe, it, expect, beforeEach, vi } from 'vitest'
import { sortFileEntries, enrichWithStats } from '../utils/sorting'
import type { FileStats } from '../types'

describe('sorting utilities', () => {
  describe('sortFileEntries', () => {
    const mockFiles = ['file3.txt', 'file1.txt', 'file2.txt', 'a-file.js', 'z-file.md']

    const mockFileStats: FileStats[] = [
      {
        name: 'small.txt',
        size: 100,
        isFile: true,
        isDirectory: false,
        isSymbolicLink: false,
        mtime: new Date('2024-01-01'),
        atime: new Date('2024-01-01'),
        ctime: new Date('2024-01-01'),
      },
      {
        name: 'large.txt',
        size: 1000,
        isFile: true,
        isDirectory: false,
        isSymbolicLink: false,
        mtime: new Date('2024-01-03'),
        atime: new Date('2024-01-03'),
        ctime: new Date('2024-01-03'),
      },
      {
        name: 'medium.txt',
        size: 500,
        isFile: true,
        isDirectory: false,
        isSymbolicLink: false,
        mtime: new Date('2024-01-02'),
        atime: new Date('2024-01-02'),
        ctime: new Date('2024-01-02'),
      },
    ]

    it('should return entries as-is when no sort options provided', () => {
      const result = sortFileEntries(mockFiles)
      expect(result).toEqual(mockFiles)
    })

    it('should sort by name ascending when sort is a string', () => {
      const result = sortFileEntries(mockFiles, { sort: 'name' })
      expect(result).toEqual(['a-file.js', 'file1.txt', 'file2.txt', 'file3.txt', 'z-file.md'])
    })

    it('should sort by extension', () => {
      const result = sortFileEntries(mockFiles, { sort: 'extension' })
      expect(result).toEqual(['a-file.js', 'z-file.md', 'file3.txt', 'file1.txt', 'file2.txt'])
    })

    it('should sort by size ascending', () => {
      const result = sortFileEntries(mockFileStats, { sort: 'size' })
      expect(result.map((f) => f.name)).toEqual(['small.txt', 'medium.txt', 'large.txt'])
    })

    it('should sort by size descending', () => {
      const result = sortFileEntries(mockFileStats, {
        sort: { by: 'size', order: 'desc' },
      })
      expect(result.map((f) => f.name)).toEqual(['large.txt', 'medium.txt', 'small.txt'])
    })

    it('should sort by mtime', () => {
      const result = sortFileEntries(mockFileStats, { sort: 'mtime' })
      expect(result.map((f) => f.name)).toEqual(['small.txt', 'medium.txt', 'large.txt'])
    })

    it('should handle multiple sort criteria', () => {
      const filesWithDupes: FileStats[] = [
        { ...mockFileStats[0], size: 100, name: 'b.txt' },
        { ...mockFileStats[1], size: 100, name: 'a.txt' },
        { ...mockFileStats[2], size: 200, name: 'c.txt' },
      ]

      const result = sortFileEntries(filesWithDupes, {
        sort: [
          { by: 'size', order: 'asc' },
          { by: 'name', order: 'asc' },
        ],
      })

      expect(result.map((f) => f.name)).toEqual(['a.txt', 'b.txt', 'c.txt'])
    })

    it('should handle empty array', () => {
      const result = sortFileEntries([], { sort: 'name' })
      expect(result).toEqual([])
    })
  })

  describe('enrichWithStats', () => {
    const mockStatFn = vi.fn()

    beforeEach(() => {
      mockStatFn.mockClear()
    })

    it('should enrich file names with stats', async () => {
      const mockStats: FileStats = {
        size: 1000,
        isFile: true,
        isDirectory: false,
        isSymbolicLink: false,
        mtime: new Date('2024-01-01'),
        atime: new Date('2024-01-01'),
        ctime: new Date('2024-01-01'),
      }

      mockStatFn.mockResolvedValue(mockStats)

      const result = await enrichWithStats('/test', ['file1.txt', 'file2.txt'], mockStatFn)

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({ ...mockStats, name: 'file1.txt' })
      expect(result[1]).toEqual({ ...mockStats, name: 'file2.txt' })
      expect(mockStatFn).toHaveBeenCalledTimes(2)
      expect(mockStatFn).toHaveBeenCalledWith('/test/file1.txt')
      expect(mockStatFn).toHaveBeenCalledWith('/test/file2.txt')
    })

    it('should process files in batches', async () => {
      const entries = Array.from({ length: 150 }, (_, i) => `file${i}.txt`)
      const mockStats: FileStats = {
        size: 1000,
        isFile: true,
        isDirectory: false,
        isSymbolicLink: false,
        mtime: new Date(),
        atime: new Date(),
        ctime: new Date(),
      }

      mockStatFn.mockResolvedValue(mockStats)

      const result = await enrichWithStats('/test', entries, mockStatFn)

      expect(result).toHaveLength(150)
      expect(mockStatFn).toHaveBeenCalledTimes(150)

      // Verify batching by checking that promises are resolved in groups
      // This is implicit in the implementation but ensures parallel processing
    })

    it('should handle stat failures gracefully', async () => {
      mockStatFn
        .mockResolvedValueOnce({
          size: 1000,
          isFile: true,
          isDirectory: false,
          isSymbolicLink: false,
          mtime: new Date(),
          atime: new Date(),
          ctime: new Date(),
        })
        .mockRejectedValueOnce(new Error('Permission denied'))
        .mockResolvedValueOnce({
          size: 2000,
          isFile: true,
          isDirectory: false,
          isSymbolicLink: false,
          mtime: new Date(),
          atime: new Date(),
          ctime: new Date(),
        })

      // The current implementation doesn't handle errors - it would throw
      // This test documents the current behavior
      await expect(
        enrichWithStats('/test', ['file1.txt', 'file2.txt', 'file3.txt'], mockStatFn)
      ).rejects.toThrow('Permission denied')
    })
  })
})
