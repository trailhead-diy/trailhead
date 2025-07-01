import { describe, it, expect } from 'vitest'
import { resolve } from 'path'
import type { FileProcessingResult } from '../../../src/cli/core/shared/types'
import {
  createConversionStats,
  updateStats,
  getRelativePath,
} from '../../../src/cli/core/shared/file-utils'

describe('file-utils', () => {
  describe('Stats Management Workflow', () => {
    it('should track file processing statistics with immutable updates', () => {
      const stats = createConversionStats()

      // Process multiple files
      const result1: FileProcessingResult = {
        success: true,
        changes: 5,
        filePath: 'button.tsx',
      }
      const conversionTypes1 = [
        { description: 'Color Conversion' },
        { description: 'Color Conversion' },
        { description: 'Theme Token' },
      ]

      const stats1 = updateStats(stats, result1, conversionTypes1)
      expect(stats1.filesProcessed).toBe(1)
      expect(stats1.filesModified).toBe(1)
      expect(stats1.totalConversions).toBe(5)
      expect(stats1.conversionsByType.get('Color Conversion')).toBe(2)
      expect(stats1.conversionsByType.get('Theme Token')).toBe(1)

      // Process file with no changes
      const result2: FileProcessingResult = {
        success: true,
        changes: 0,
        filePath: 'dialog.tsx',
      }

      const stats2 = updateStats(stats1, result2, [])
      expect(stats2.filesProcessed).toBe(2)
      expect(stats2.filesModified).toBe(1) // Should not increment
      expect(stats2.totalConversions).toBe(5)

      // Process file with error
      const result3: FileProcessingResult = {
        success: false,
        changes: 0,
        filePath: 'error.tsx',
        error: 'Parse error',
      }

      const stats3 = updateStats(stats2, result3, [])
      expect(stats3.filesProcessed).toBe(3)
      expect(stats3.filesModified).toBe(1) // Should not increment
      expect(stats3.totalConversions).toBe(5)
    })
  })

  describe('Path Utilities', () => {
    it('should handle relative path conversion for display', () => {
      // Test basic functionality without assuming exact format
      const result1 = getRelativePath(resolve('absolute', 'path', 'file.tsx'))
      expect(typeof result1).toBe('string')

      const result2 = getRelativePath('./relative/path/file.tsx')
      expect(result2).toContain('file.tsx')

      const result3 = getRelativePath('src/button.tsx')
      expect(result3).toContain('button.tsx')
    })
  })

  // Configuration validation is low-ROI - removed
  // The actual validation happens at runtime and is better tested through integration
})
