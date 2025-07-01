/**
 * Cross-Platform Path Utilities Tests
 * 
 * Tests the cross-platform path utilities to ensure they work correctly
 * across different operating systems and handle edge cases properly.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { sep, normalize } from 'path'
import { tmpdir } from 'os'
import {
  createTestPath,
  createAbsoluteTestPath,
  createTempPath,
  normalizeMockPath,
  createPathRegex,
  toPosixPath,
  toWindowsPath,
  safeJoin,
  safeRelative,
  MockFileSystemPaths,
  pathAssertions,
  testPaths,
  createTestConfig,
  debugPaths,
  isWindows
} from './cross-platform-paths.js'

describe('Cross-Platform Path Utilities', () => {
  describe('Path Creation Functions', () => {
    it('should create normalized test paths', () => {
      const path = createTestPath('src', 'components', 'button.tsx')
      
      expect(path).toBeDefined()
      expect(path).toContain('button.tsx')
      expect(path.includes('\\') || path.includes('/')).toBe(true)
    })
    
    it('should create absolute test paths from project root', () => {
      const path = createAbsoluteTestPath('packages', 'web-ui', 'src')
      
      expect(path).toBeDefined()
      expect(path).toContain(process.cwd())
      expect(path).toContain('packages')
      expect(path).toContain('web-ui')
    })
    
    it('should create temporary paths using OS temp directory', () => {
      const tempPath = createTempPath('test-suite')
      
      expect(tempPath).toBeDefined()
      expect(tempPath).toContain('trailhead-tests')
      expect(tempPath).toContain('test-suite')
      
      // Should use OS temp directory as base
      const osTempDir = tmpdir()
      expect(tempPath.startsWith(normalize(osTempDir))).toBe(true)
    })
    
    it('should handle empty path segments gracefully', () => {
      const path1 = createTestPath('', 'components', '', 'button.tsx')
      const path2 = createTestPath('components', 'button.tsx')
      
      // Both should result in equivalent normalized paths
      expect(normalize(path1)).toBe(normalize(path2))
    })
  })
  
  describe('Path Normalization', () => {
    it('should normalize mock paths to forward slashes', () => {
      const windowsPath = 'C:\\Users\\test\\project\\src\\component.tsx'
      const unixPath = '/home/test/project/src/component.tsx'
      
      const normalizedWindows = normalizeMockPath(windowsPath)
      const normalizedUnix = normalizeMockPath(unixPath)
      
      expect(normalizedWindows).not.toContain('\\')
      expect(normalizedUnix).not.toContain('\\')
      expect(normalizedWindows).toContain('/')
      expect(normalizedUnix).toContain('/')
    })
    
    it('should handle mixed separators', () => {
      const mixedPath = 'C:/Users\\test/project\\src/component.tsx'
      const normalized = normalizeMockPath(mixedPath)
      
      expect(normalized).not.toContain('\\')
      expect(normalized).toContain('/')
    })
  })
  
  describe('Path Conversion Functions', () => {
    it('should convert paths to POSIX format', () => {
      const windowsPath = 'src\\components\\button.tsx'
      const posixPath = toPosixPath(windowsPath)
      
      expect(posixPath).toBe('src/components/button.tsx')
      expect(posixPath).not.toContain('\\')
    })
    
    it('should convert paths to Windows format', () => {
      const posixPath = 'src/components/button.tsx'
      const windowsPath = toWindowsPath(posixPath)
      
      expect(windowsPath).toBe('src\\components\\button.tsx')
      expect(windowsPath).not.toContain('/')
    })
    
    it('should handle already converted paths', () => {
      const posixPath = 'src/components/button.tsx'
      const convertedTwice = toPosixPath(toPosixPath(posixPath))
      
      expect(convertedTwice).toBe(posixPath)
    })
  })
  
  describe('Safe Path Operations', () => {
    it('should safely join mixed path segments', () => {
      const segments = ['src\\components', 'lib/catalyst', 'button.tsx']
      const joined = safeJoin(...segments)
      
      expect(joined).toBeDefined()
      expect(joined).toContain('button.tsx')
      expect(joined).toContain('components')
      expect(joined).toContain('lib')
      expect(joined).toContain('catalyst')
    })
    
    it('should handle empty segments in safe join', () => {
      const joined = safeJoin('src', '', 'components', '', 'button.tsx')
      const expected = safeJoin('src', 'components', 'button.tsx')
      
      expect(normalize(joined)).toBe(normalize(expected))
    })
    
    it('should safely calculate relative paths', () => {
      const from = createTestPath('src', 'components')
      const to = createTestPath('src', 'components', 'lib', 'button.tsx')
      
      const relative = safeRelative(from, to)
      
      expect(relative).toBeDefined()
      expect(relative).toContain('button.tsx')
    })
    
    it('should handle relative path calculation failures', () => {
      const from = '/invalid/path'
      const to = '/another/invalid/path'
      
      const relative = safeRelative(from, to)
      
      // Should return a relative path calculation (not the original 'to' path)
      expect(relative).toBeDefined()
      expect(typeof relative).toBe('string')
      // The actual result depends on the path.relative calculation
    })
  })
  
  describe('Path Regex Creation', () => {
    it('should create flexible path regex patterns', () => {
      const pattern = createPathRegex('src/components/*.tsx')
      
      // Should match both separators
      expect(pattern.test('src/components/button.tsx')).toBe(true)
      expect(pattern.test('src\\components\\button.tsx')).toBe(true)
      expect(pattern.test('src/components/nested/button.tsx')).toBe(false)
    })
    
    it('should escape special regex characters', () => {
      const pattern = createPathRegex('src/components/[test].tsx')
      
      // Should not treat [] as character class
      expect(pattern.test('src/components/[test].tsx')).toBe(true)
      expect(pattern.test('src/components/test.tsx')).toBe(false)
      expect(pattern.test('src/components/t.tsx')).toBe(false)
    })
  })
  
  describe('MockFileSystemPaths Class', () => {
    let mockPaths: MockFileSystemPaths
    
    beforeEach(() => {
      mockPaths = new MockFileSystemPaths()
    })
    
    afterEach(() => {
      mockPaths.clear()
    })
    
    it('should add and retrieve paths', () => {
      const testPath = '/src/components/button.tsx'
      const content = 'export function Button() {}'
      
      const normalizedPath = mockPaths.addPath(testPath, content)
      
      expect(mockPaths.hasPath(testPath)).toBe(true)
      expect(mockPaths.getContent(testPath)).toBe(content)
      expect(normalizedPath).toBeDefined()
    })
    
    it('should normalize paths consistently', () => {
      const windowsPath = 'C:\\src\\components\\button.tsx'
      const unixPath = '/src/components/button.tsx'
      
      mockPaths.addPath(windowsPath, 'content1')
      mockPaths.addPath(unixPath, 'content2')
      
      // Both should be accessible via normalized form
      expect(mockPaths.hasPath(windowsPath)).toBe(true)
      expect(mockPaths.hasPath(unixPath)).toBe(true)
    })
    
    it('should detect parent directories', () => {
      mockPaths.addPath('/src/components/lib/button.tsx', 'content')
      
      // Should detect that parent directories exist
      expect(mockPaths.hasPath('/src')).toBe(true)
      expect(mockPaths.hasPath('/src/components')).toBe(true)
      expect(mockPaths.hasPath('/src/components/lib')).toBe(true)
    })
    
    it('should list directory contents', () => {
      mockPaths.addPath('/src/components/button.tsx', 'content1')
      mockPaths.addPath('/src/components/alert.tsx', 'content2')
      mockPaths.addPath('/src/components/lib/index.ts', 'content3')
      
      const contents = mockPaths.listDirectory('/src/components')
      
      expect(contents).toContain('button.tsx')
      expect(contents).toContain('alert.tsx')
      expect(contents).toContain('lib')
      expect(contents).not.toContain('index.ts') // Nested file shouldn't appear
    })
    
    it('should clear all paths', () => {
      mockPaths.addPath('/src/component1.tsx', 'content1')
      mockPaths.addPath('/src/component2.tsx', 'content2')
      
      expect(mockPaths.getAllPaths()).toHaveLength(2)
      
      mockPaths.clear()
      
      expect(mockPaths.getAllPaths()).toHaveLength(0)
    })
  })
  
  describe('Path Assertions', () => {
    it('should check if path contains segment', () => {
      const fullPath = createTestPath('src', 'components', 'button.tsx')
      
      expect(pathAssertions.pathContains(fullPath, 'components')).toBe(true)
      expect(pathAssertions.pathContains(fullPath, 'button.tsx')).toBe(true)
      expect(pathAssertions.pathContains(fullPath, 'nonexistent')).toBe(false)
    })
    
    it('should check path equality across platforms', () => {
      const path1 = 'src/components/button.tsx'
      const path2 = 'src\\components\\button.tsx'
      
      expect(pathAssertions.pathsEqual(path1, path2)).toBe(true)
    })
    
    it('should check if path is absolute', () => {
      const absolutePath = createAbsoluteTestPath('src', 'components')
      const relativePath = createTestPath('src', 'components')
      
      expect(pathAssertions.isAbsolutePath(absolutePath)).toBe(true)
      expect(pathAssertions.isAbsolutePath(relativePath)).toBe(false)
    })
    
    it('should check path separator correctness', () => {
      if (isWindows) {
        expect(pathAssertions.hasCorrectSeparators('src\\components')).toBe(true)
        expect(pathAssertions.hasCorrectSeparators('src/components')).toBe(true) // Mixed is allowed
      } else {
        expect(pathAssertions.hasCorrectSeparators('src/components')).toBe(true)
        expect(pathAssertions.hasCorrectSeparators('src\\components')).toBe(false)
      }
    })
  })
  
  describe('Test Path Constants', () => {
    it('should provide valid test path constants', () => {
      expect(testPaths.temp).toBeDefined()
      expect(testPaths.fixtures).toBeDefined()
      expect(testPaths.output).toBeDefined()
      expect(testPaths.mockProject).toBeDefined()
      expect(testPaths.mockComponents).toBeDefined()
      expect(testPaths.separator).toBe(sep)
    })
    
    it('should use platform-appropriate separators in constants', () => {
      expect(testPaths.separator).toBe(sep)
      expect(testPaths.posixSeparator).toBe('/')
      expect(testPaths.windowsSeparator).toBe('\\')
    })
  })
  
  describe('Test Configuration Creation', () => {
    it('should create normalized test configuration', () => {
      const config = createTestConfig()
      
      expect(config.projectRoot).toBeDefined()
      expect(config.componentsDir).toBeDefined()
      expect(config.tempDir).toBeDefined()
      expect(config.outputDir).toBeDefined()
      
      // All paths should be normalized
      expect(config.projectRoot).toBe(normalize(config.projectRoot))
      expect(config.componentsDir).toBe(normalize(config.componentsDir))
    })
    
    it('should allow configuration overrides', () => {
      const customRoot = '/custom/project/root'
      const config = createTestConfig({ projectRoot: customRoot })
      
      expect(config.projectRoot).toBe(normalize(customRoot))
      expect(config.componentsDir).toContain('components')
    })
  })
  
  describe('Debug Utilities', () => {
    it('should provide path debugging information', () => {
      const testPath = 'src/components/button.tsx'
      const pathInfo = debugPaths.showPathInfo(testPath)
      
      expect(pathInfo.original).toBe(testPath)
      expect(pathInfo.normalized).toBeDefined()
      expect(pathInfo.posix).toBeDefined()
      expect(pathInfo.windows).toBeDefined()
      expect(typeof pathInfo.isAbsolute).toBe('boolean')
      expect(pathInfo.platform).toBeDefined()
      expect(pathInfo.separator).toBeDefined()
    })
    
    it('should provide environment debugging information', () => {
      const envInfo = debugPaths.showEnvironment()
      
      expect(envInfo.platform).toBeDefined()
      expect(typeof envInfo.isWindows).toBe('boolean')
      expect(envInfo.separator).toBeDefined()
      expect(envInfo.cwd).toBeDefined()
      expect(envInfo.tmpdir).toBeDefined()
    })
  })
  
  describe('Platform Detection', () => {
    it('should correctly identify platform', () => {
      expect(typeof isWindows).toBe('boolean')
      expect(isWindows).toBe(process.platform === 'win32')
    })
  })
  
  describe('Edge Cases and Error Handling', () => {
    it('should handle null and undefined inputs', () => {
      expect(() => createTestPath()).not.toThrow()
      expect(() => safeJoin()).not.toThrow()
      expect(() => normalizeMockPath('')).not.toThrow()
    })
    
    it('should handle very long paths', () => {
      const longSegment = 'a'.repeat(100)
      const longPath = createTestPath('src', longSegment, 'component.tsx')
      
      expect(longPath).toBeDefined()
      expect(longPath).toContain(longSegment)
    })
    
    it('should handle special characters in paths', () => {
      const specialPath = createTestPath('src', 'comp-onent$', '[test].tsx')
      
      expect(specialPath).toBeDefined()
      expect(specialPath).toContain('comp-onent$')
      expect(specialPath).toContain('[test].tsx')
    })
    
    it('should handle unicode characters in paths', () => {
      const unicodePath = createTestPath('src', '测试', 'компонент.tsx')
      
      expect(unicodePath).toBeDefined()
      expect(unicodePath).toContain('测试')
      expect(unicodePath).toContain('компонент.tsx')
    })
  })
  
  describe('Performance Considerations', () => {
    it('should handle large numbers of path operations efficiently', () => {
      const startTime = Date.now()
      
      // Perform many path operations
      for (let i = 0; i < 1000; i++) {
        createTestPath('src', 'components', `component-${i}.tsx`)
        normalizeMockPath(`/project/src/component-${i}.tsx`)
        safeJoin('src', 'components', `component-${i}.tsx`)
      }
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // Should complete within reasonable time (< 1 second)
      expect(duration).toBeLessThan(1000)
    })
    
    it('should handle large mock filesystem efficiently', () => {
      const mockPaths = new MockFileSystemPaths()
      const startTime = Date.now()
      
      // Add many paths
      for (let i = 0; i < 1000; i++) {
        mockPaths.addPath(`/src/component-${i}.tsx`, `content-${i}`)
      }
      
      // Perform lookups
      for (let i = 0; i < 100; i++) {
        mockPaths.hasPath(`/src/component-${i}.tsx`)
      }
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // Should complete within reasonable time
      expect(duration).toBeLessThan(2000)
      
      mockPaths.clear()
    })
  })
})