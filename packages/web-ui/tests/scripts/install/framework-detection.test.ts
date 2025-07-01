/**
 * @fileoverview Framework Detection Tests for Trailhead UI Install Script
 *
 * High-ROI tests focusing on critical framework detection functionality:
 * - Accurate detection of supported frameworks
 * - Package.json dependency analysis
 * - Config file discovery and validation
 * - Edge cases and error handling
 * - Confidence scoring and prioritization
 */

import { describe, it, expect, vi } from 'vitest'
import type { FileSystem } from '../../../src/cli/core/installation/types.js'
import { Ok, Err } from '@trailhead/cli'
import { createTestPath, normalizeMockPath } from '../../utils/cross-platform-paths.js'
import {
  getFrameworkDefinitions,
  checkPackageJsonDependencies,
  calculateConfidence,
  extractFrameworkVersion,
  detectFramework,
  getFrameworkDisplayName,
  getFrameworkCapabilities,
  type FrameworkType,
  type FrameworkInfo,
} from '../../../src/cli/core/installation/framework-detection.js'

// Helper to create OS-agnostic test paths
const testPath = (...segments: string[]) => createTestPath('test', 'project', ...segments)

// Mock FileSystem for testing
const createMockFileSystem = (mockFiles: Record<string, unknown> = {}): FileSystem => ({
  exists: vi.fn().mockImplementation(async (path: string) => {
    // Normalize the path to match how we store mock files
    const normalized = normalizeMockPath(path)
    return Ok(normalized in mockFiles)
  }),
  readDir: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
  readJson: vi.fn().mockImplementation(async (path: string) => {
    // Normalize the path to match how we store mock files
    const normalized = normalizeMockPath(path)
    if (mockFiles[normalized]) {
      return Ok(mockFiles[normalized])
    }
    return Err({ type: 'FileSystemError', message: 'File not found', path })
  }),
  writeJson: vi.fn(),
  copy: vi.fn(),
  ensureDir: vi.fn(),
  stat: vi.fn(),
})

describe('Framework Detection Tests', () => {
  describe('Framework Definitions', () => {
    it('should provide all supported frameworks', () => {
      const frameworks = getFrameworkDefinitions()

      expect(frameworks).toHaveLength(4)

      const frameworkTypes = frameworks.map((f) => f.type)
      expect(frameworkTypes).toContain('redwood-sdk')
      expect(frameworkTypes).toContain('nextjs')
      expect(frameworkTypes).toContain('vite')
      expect(frameworkTypes).toContain('generic-react')
    })

    it('should have correct configuration for RedwoodSDK', () => {
      const frameworks = getFrameworkDefinitions()
      const redwood = frameworks.find((f) => f.type === 'redwood-sdk')

      expect(redwood).toBeDefined()
      expect(redwood!.name).toBe('RedwoodSDK')
      expect(redwood!.configFiles).toContain('wrangler.jsonc')
      expect(redwood!.configFiles).toContain('wrangler.json')
      expect(redwood!.packageJsonDeps).toContain('rwsdk')
      expect(redwood!.packageJsonDeps).toContain('@redwoodjs/sdk')
    })

    it('should have correct configuration for Next.js', () => {
      const frameworks = getFrameworkDefinitions()
      const nextjs = frameworks.find((f) => f.type === 'nextjs')

      expect(nextjs).toBeDefined()
      expect(nextjs!.name).toBe('Next.js')
      expect(nextjs!.configFiles).toContain('next.config.js')
      expect(nextjs!.configFiles).toContain('next.config.ts')
      expect(nextjs!.configFiles).toContain('next.config.mjs')
      expect(nextjs!.packageJsonDeps).toContain('next')
    })

    it('should have correct configuration for Vite', () => {
      const frameworks = getFrameworkDefinitions()
      const vite = frameworks.find((f) => f.type === 'vite')

      expect(vite).toBeDefined()
      expect(vite!.name).toBe('Vite')
      expect(vite!.configFiles).toContain('vite.config.js')
      expect(vite!.configFiles).toContain('vite.config.ts')
      expect(vite!.configFiles).toContain('vite.config.mjs')
      expect(vite!.packageJsonDeps).toContain('vite')
    })

    it('should have correct configuration for generic React', () => {
      const frameworks = getFrameworkDefinitions()
      const react = frameworks.find((f) => f.type === 'generic-react')

      expect(react).toBeDefined()
      expect(react!.name).toBe('React')
      expect(react!.configFiles).toEqual([])
      expect(react!.packageJsonDeps).toContain('react')
    })
  })

  describe('Package.json Dependency Analysis', () => {
    it('should detect dependencies correctly', () => {
      const packageJson = {
        dependencies: {
          react: '^18.0.0',
          next: '^13.0.0',
        },
        devDependencies: {
          vite: '^4.0.0',
        },
      }

      expect(checkPackageJsonDependencies(packageJson, ['react'])).toBe(true)
      expect(checkPackageJsonDependencies(packageJson, ['next'])).toBe(true)
      expect(checkPackageJsonDependencies(packageJson, ['vite'])).toBe(true)
      expect(checkPackageJsonDependencies(packageJson, ['svelte'])).toBe(false)
    })

    it('should handle missing dependencies section', () => {
      const packageJson = {
        name: 'test-project',
        version: '1.0.0',
      }

      expect(checkPackageJsonDependencies(packageJson, ['react'])).toBe(false)
    })

    it('should handle invalid package.json', () => {
      expect(checkPackageJsonDependencies(null, ['react'])).toBe(false)
      expect(checkPackageJsonDependencies('invalid', ['react'])).toBe(false)
      expect(checkPackageJsonDependencies(123, ['react'])).toBe(false)
    })

    it('should detect dependencies in both dependencies and devDependencies', () => {
      const packageJson = {
        dependencies: {
          react: '^18.0.0',
        },
        devDependencies: {
          next: '^13.0.0',
        },
      }

      expect(checkPackageJsonDependencies(packageJson, ['react', 'next'])).toBe(true)
      expect(checkPackageJsonDependencies(packageJson, ['react'])).toBe(true)
      expect(checkPackageJsonDependencies(packageJson, ['next'])).toBe(true)
    })
  })

  describe('Confidence Calculation', () => {
    it('should return high confidence for both config and package matches', () => {
      expect(calculateConfidence(2, true, 3)).toBe('high')
      expect(calculateConfidence(1, true, 1)).toBe('high')
    })

    it('should return medium confidence for partial matches', () => {
      expect(calculateConfidence(1, false, 3)).toBe('medium')
      expect(calculateConfidence(0, true, 2)).toBe('medium')
    })

    it('should return low confidence for no matches', () => {
      expect(calculateConfidence(0, false, 3)).toBe('low')
    })
  })

  describe('Version Extraction', () => {
    it('should extract version from dependencies', () => {
      const packageJson = {
        dependencies: {
          next: '^13.4.0',
          react: '~18.2.0',
        },
        devDependencies: {
          vite: '4.3.9',
        },
      }

      expect(extractFrameworkVersion(packageJson, 'next')).toBe('^13.4.0')
      expect(extractFrameworkVersion(packageJson, 'react')).toBe('~18.2.0')
      expect(extractFrameworkVersion(packageJson, 'vite')).toBe('4.3.9')
      expect(extractFrameworkVersion(packageJson, 'nonexistent')).toBeUndefined()
    })

    it('should prefer dependencies over devDependencies', () => {
      const packageJson = {
        dependencies: {
          vite: '^4.0.0',
        },
        devDependencies: {
          vite: '^3.0.0',
        },
      }

      expect(extractFrameworkVersion(packageJson, 'vite')).toBe('^4.0.0')
    })

    it('should handle invalid package.json for version extraction', () => {
      expect(extractFrameworkVersion(null, 'next')).toBeUndefined()
      expect(extractFrameworkVersion('invalid', 'next')).toBeUndefined()
    })
  })

  describe('Complete Framework Detection', () => {
    it('should detect Next.js project correctly', async () => {
      const projectRoot = testPath()
      const mockFs = createMockFileSystem({
        [normalizeMockPath(testPath('next.config.js'))]: true,
        [normalizeMockPath(testPath('package.json'))]: {
          dependencies: {
            next: '^13.4.0',
            react: '^18.2.0',
          },
        },
      })

      const result = await detectFramework(mockFs, projectRoot)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.value.framework.type).toBe('nextjs')
        expect(result.value.framework.version).toBe('^13.4.0')
        expect(result.value.confidence).toBe('high')
      }
    })

    it('should detect Vite project correctly', async () => {
      const projectRoot = testPath()
      const mockFs = createMockFileSystem({
        [normalizeMockPath(testPath('vite.config.ts'))]: true,
        [normalizeMockPath(testPath('package.json'))]: {
          devDependencies: {
            vite: '^4.3.0',
            react: '^18.2.0',
          },
        },
      })

      const result = await detectFramework(mockFs, projectRoot)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.value.framework.type).toBe('vite')
        expect(result.value.framework.version).toBe('^4.3.0')
        expect(result.value.confidence).toBe('high')
      }
    })

    it('should detect RedwoodSDK project correctly', async () => {
      const projectRoot = testPath()
      const mockFs = createMockFileSystem({
        [normalizeMockPath(testPath('wrangler.jsonc'))]: true,
        [normalizeMockPath(testPath('package.json'))]: {
          dependencies: {
            rwsdk: '^1.0.0',
            react: '^18.2.0',
          },
        },
      })

      const result = await detectFramework(mockFs, projectRoot)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.value.framework.type).toBe('redwood-sdk')
        expect(result.value.confidence).toBe('high')
      }
    })

    it('should fallback to generic React when only React is detected', async () => {
      const projectRoot = testPath()
      const mockFs = createMockFileSystem({
        [normalizeMockPath(testPath('package.json'))]: {
          dependencies: {
            react: '^18.2.0',
            'react-dom': '^18.2.0',
          },
        },
      })

      const result = await detectFramework(mockFs, projectRoot)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.value.framework.type).toBe('generic-react')
        expect(result.value.confidence).toBe('medium')
      }
    })

    it('should force framework when specified', async () => {
      const projectRoot = testPath()
      const mockFs = createMockFileSystem({
        [normalizeMockPath(testPath('package.json'))]: {
          dependencies: {
            react: '^18.2.0',
          },
        },
      })

      const result = await detectFramework(mockFs, projectRoot, 'nextjs')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.value.framework.type).toBe('nextjs')
        expect(result.value.confidence).toBe('low') // Low confidence because no Next.js specific indicators
      }
    })

    it('should prioritize frameworks correctly', async () => {
      // Project with both Next.js and Vite (should prefer Next.js due to higher priority)
      const projectRoot = testPath()
      const mockFs = createMockFileSystem({
        [normalizeMockPath(testPath('next.config.js'))]: true,
        [normalizeMockPath(testPath('vite.config.js'))]: true,
        [normalizeMockPath(testPath('package.json'))]: {
          dependencies: {
            next: '^13.4.0',
            react: '^18.2.0',
          },
          devDependencies: {
            vite: '^4.3.0',
          },
        },
      })

      const result = await detectFramework(mockFs, projectRoot)

      expect(result.success).toBe(true)
      if (result.success) {
        // Should detect Next.js as it has higher priority
        expect(result.value.framework.type).toBe('nextjs')
        expect(result.value.confidence).toBe('high')
      }
    })

    it('should handle missing package.json', async () => {
      const mockFs = createMockFileSystem({})
      const projectRoot = testPath()

      const result = await detectFramework(mockFs, projectRoot)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.type).toBe('FileSystemError')
        expect(result.error.message).toBe('package.json not found')
      }
    })

    it('should return error for invalid forced framework', async () => {
      const projectRoot = testPath()
      const mockFs = createMockFileSystem({
        [normalizeMockPath(testPath('package.json'))]: { dependencies: { react: '^18.2.0' } },
      })

      const result = await detectFramework(
        mockFs,
        projectRoot,
        'invalid-framework' as FrameworkType
      )

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.type).toBe('ConfigurationError')
        expect(result.error.message).toContain('Unknown framework: invalid-framework')
      }
    })
  })

  describe('Utility Functions', () => {
    it('should generate correct display names', () => {
      const framework: FrameworkInfo = {
        type: 'nextjs',
        name: 'Next.js',
        version: '^13.4.0',
        configFiles: [],
        packageJsonDeps: [],
      }

      expect(getFrameworkDisplayName(framework)).toBe('Next.js (^13.4.0)')
    })

    it('should generate display name without version', () => {
      const framework: FrameworkInfo = {
        type: 'nextjs',
        name: 'Next.js',
        configFiles: [],
        packageJsonDeps: [],
      }

      expect(getFrameworkDisplayName(framework)).toBe('Next.js')
    })

    it('should return correct capabilities for frameworks', () => {
      expect(getFrameworkCapabilities('redwood-sdk')).toEqual({
        hasSSR: true,
        hasFileBasedRouting: true,
        supportsAppDirectory: false,
        usesTailwindV4: true,
        supportsServerComponents: true,
      })

      expect(getFrameworkCapabilities('nextjs')).toEqual({
        hasSSR: true,
        hasFileBasedRouting: true,
        supportsAppDirectory: true,
        usesTailwindV4: false,
        supportsServerComponents: true,
      })

      expect(getFrameworkCapabilities('vite')).toEqual({
        hasSSR: false,
        hasFileBasedRouting: false,
        supportsAppDirectory: false,
        usesTailwindV4: false,
        supportsServerComponents: false,
      })

      expect(getFrameworkCapabilities('generic-react')).toEqual({
        hasSSR: false,
        hasFileBasedRouting: false,
        supportsAppDirectory: false,
        usesTailwindV4: false,
        supportsServerComponents: false,
      })
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle FileSystem errors gracefully', async () => {
      const mockFs: FileSystem = {
        ...createMockFileSystem(),
        exists: vi
          .fn()
          .mockImplementation(async () =>
            Err({ type: 'FileSystemError', message: 'Permission denied', path: '/test' })
          ),
        readJson: vi.fn().mockImplementation(async () =>
          Err({
            type: 'FileSystemError',
            message: 'Permission denied',
            path: '/test/package.json',
          })
        ),
      }

      const result = await detectFramework(mockFs, '/test/project')

      expect(result.success).toBe(false)
    })

    it('should handle malformed package.json', async () => {
      const mockFs = createMockFileSystem({
        'package.json': 'invalid json',
      })

      // Mock readJson to return the invalid data
      mockFs.readJson = vi
        .fn()
        .mockImplementation(async () =>
          Err({ type: 'FileSystemError', message: 'Invalid JSON', path: '/test/package.json' })
        )

      const result = await detectFramework(mockFs, '/test/project')

      expect(result.success).toBe(false)
    })
  })
})
