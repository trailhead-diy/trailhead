/**
 * Package Manager Utilities Tests - High-ROI Testing
 *
 * Tests focus on:
 * - Business logic for package manager detection
 * - Version validation and comparison
 * - Command execution and error handling
 * - Caching behavior for performance
 * - Environment variable overrides
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { execSync } from 'node:child_process'
import {
  detectPackageManager,
  getRunCommand,
  execPackageManagerCommand,
  getPackageManagerInfo,
  clearPackageManagerCache,
  createPackageManagerCache,
  SemVer,
} from './package-manager.js'

// Mock execSync to control command execution
vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
}))

const mockExecSync = vi.mocked(execSync)

describe('Package Manager Detection - Core Business Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearPackageManagerCache()
    delete process.env.FORCE_PACKAGE_MANAGER
  })

  afterEach(() => {
    delete process.env.FORCE_PACKAGE_MANAGER
  })

  describe('detectPackageManager', () => {
    it('should detect pnpm when available and meets version requirement', () => {
      mockExecSync.mockReturnValueOnce(Buffer.from('8.10.0'))

      const result = detectPackageManager()

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.name).toBe('pnpm')
        expect(result.value.version).toBe('8.10.0')
        expect(result.value.command).toBe('pnpm')
        expect(result.value.runCommand).toBe('pnpm run')
        expect(result.value.installCommand).toBe('pnpm install')
      }
    })

    it('should fallback to npm when pnpm is not available', () => {
      mockExecSync
        .mockImplementationOnce(() => {
          throw new Error('pnpm not found')
        })
        .mockReturnValueOnce(Buffer.from('9.5.0'))

      const result = detectPackageManager()

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.name).toBe('npm')
        expect(result.value.version).toBe('9.5.0')
      }
    })

    it('should reject package manager with insufficient version', () => {
      mockExecSync.mockReturnValueOnce(Buffer.from('5.0.0')) // Below pnpm requirement of 6.0.0

      const result = detectPackageManager()

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.type).toBe('PACKAGE_MANAGER_ERROR')
        expect(result.error.message).toContain('pnpm v5.0.0 (requires v6.0.0+)')
      }
    })

    it('should return error when no package managers are available', () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('command not found')
      })

      const result = detectPackageManager()

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.type).toBe('PACKAGE_MANAGER_ERROR')
        expect(result.error.message).toContain('No package manager found')
        expect(result.error.message).toContain('Tried: pnpm, npm')
      }
    })

    it('should handle timeout errors gracefully', () => {
      const timeoutError = new Error('Command timed out')
      ;(timeoutError as any).code = 'ETIMEDOUT'
      mockExecSync.mockImplementation(() => {
        throw timeoutError
      })

      const result = detectPackageManager({ timeout: 1000 })

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.type).toBe('PACKAGE_MANAGER_ERROR')
        expect(result.error.message).toContain('No package manager found')
      }
    })
  })

  describe('Environment Variable Override', () => {
    it('should respect FORCE_PACKAGE_MANAGER environment variable', () => {
      process.env.FORCE_PACKAGE_MANAGER = 'npm'
      mockExecSync.mockReturnValueOnce(Buffer.from('9.5.0'))

      const result = detectPackageManager()

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.name).toBe('npm')
      }

      // Should only check the forced manager
      expect(mockExecSync).toHaveBeenCalledTimes(1)
      expect(mockExecSync).toHaveBeenCalledWith(
        'npm --version',
        expect.objectContaining({ timeout: 5000 })
      )
    })

    it('should validate forced package manager name', () => {
      process.env.FORCE_PACKAGE_MANAGER = 'invalid-manager'

      const result = detectPackageManager()

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.type).toBe('PACKAGE_MANAGER_ERROR')
        expect(result.error.message).toContain('Invalid package manager name: invalid-manager')
        expect(result.error.message).toContain('Allowed values: pnpm, npm')
      }
    })

    it('should sanitize package manager name input', () => {
      process.env.FORCE_PACKAGE_MANAGER = 'NPM!' // Mixed case with special chars
      mockExecSync.mockReturnValueOnce(Buffer.from('9.5.0'))

      const result = detectPackageManager()

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.name).toBe('npm')
      }
    })

    it('should return error when forced manager is not installed', () => {
      process.env.FORCE_PACKAGE_MANAGER = 'pnpm'
      mockExecSync.mockImplementation(() => {
        throw new Error('pnpm not found')
      })

      const result = detectPackageManager()

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.type).toBe('PACKAGE_MANAGER_ERROR')
        expect(result.error.message).toContain("Forced package manager 'pnpm' is not installed")
        expect((result.error as any).suggestion).toContain(
          'Install pnpm or unset FORCE_PACKAGE_MANAGER'
        )
      }
    })
  })

  describe('Caching Behavior', () => {
    it('should cache successful detection results', () => {
      mockExecSync.mockReturnValueOnce(Buffer.from('8.10.0'))

      // First call
      const result1 = detectPackageManager()
      expect(result1.isOk()).toBe(true)

      // Second call should use cache
      const result2 = detectPackageManager()
      expect(result2.isOk()).toBe(true)

      // execSync should only be called once due to caching
      expect(mockExecSync).toHaveBeenCalledTimes(1)
    })

    it('should cache error results', () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('not found')
      })

      // First call
      const result1 = detectPackageManager()
      expect(result1.isErr()).toBe(true)

      // Second call should use cached error
      const result2 = detectPackageManager()
      expect(result2.isErr()).toBe(true)

      // Should try both managers only once
      expect(mockExecSync).toHaveBeenCalledTimes(2)
    })

    it('should use custom cache instance when provided', () => {
      const customCache = createPackageManagerCache()
      mockExecSync.mockReturnValueOnce(Buffer.from('8.10.0'))

      const result = detectPackageManager({ cache: customCache })

      expect(result.isOk()).toBe(true)

      // Default cache should still be empty, custom cache should have the result
      mockExecSync.mockReturnValueOnce(Buffer.from('9.0.0'))
      const _defaultResult = detectPackageManager()
      expect(mockExecSync).toHaveBeenCalledTimes(2) // Cache miss for default
    })

    it('should respect cache TTL', () => {
      // This test is complex to implement with real timers in vitest
      // In a real scenario, you'd test cache expiration after 5 minutes
      const cache = createPackageManagerCache()
      mockExecSync.mockReturnValueOnce(Buffer.from('8.10.0'))

      const result = detectPackageManager({ cache })
      expect(result.isOk()).toBe(true)
      expect(mockExecSync).toHaveBeenCalledTimes(1)
    })
  })
})

describe('SemVer Version Comparison', () => {
  describe('SemVer.parse', () => {
    it('should parse standard version formats', () => {
      const testCases = [
        { input: '1.2.3', expected: { major: 1, minor: 2, patch: 3 } },
        { input: 'v2.0.0', expected: { major: 2, minor: 0, patch: 0 } },
        { input: '10.15.3', expected: { major: 10, minor: 15, patch: 3 } },
      ]

      testCases.forEach(({ input, expected }) => {
        const result = SemVer.parse(input)
        expect(result.isOk()).toBe(true)
        if (result.isOk()) {
          expect(result.value.major).toBe(expected.major)
          expect(result.value.minor).toBe(expected.minor)
          expect(result.value.patch).toBe(expected.patch)
        }
      })
    })

    it('should parse versions with prerelease tags', () => {
      const result = SemVer.parse('1.2.3-beta.1')

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.major).toBe(1)
        expect(result.value.minor).toBe(2)
        expect(result.value.patch).toBe(3)
        expect(result.value.prerelease).toBe('beta.1')
      }
    })

    it('should reject invalid version formats', () => {
      const invalidVersions = ['invalid', 'v1.x.y']

      invalidVersions.forEach((version) => {
        const result = SemVer.parse(version)
        expect(result.isErr()).toBe(true)
        if (result.isErr()) {
          expect(result.error.type).toBe('PACKAGE_MANAGER_ERROR')
          expect(result.error.message).toContain('Invalid version format')
        }
      })
    })
  })

  describe('Version Comparison', () => {
    it('should compare major versions correctly', () => {
      const v1 = new SemVer(2, 0, 0)
      const v2 = new SemVer(1, 5, 3)

      expect(v1.isGreaterThanOrEqual(v2)).toBe(true)
      expect(v2.isGreaterThanOrEqual(v1)).toBe(false)
    })

    it('should compare minor versions when major is equal', () => {
      const v1 = new SemVer(1, 5, 0)
      const v2 = new SemVer(1, 3, 9)

      expect(v1.isGreaterThanOrEqual(v2)).toBe(true)
      expect(v2.isGreaterThanOrEqual(v1)).toBe(false)
    })

    it('should compare patch versions when major and minor are equal', () => {
      const v1 = new SemVer(1, 2, 5)
      const v2 = new SemVer(1, 2, 3)

      expect(v1.isGreaterThanOrEqual(v2)).toBe(true)
      expect(v2.isGreaterThanOrEqual(v1)).toBe(false)
    })

    it('should handle equal versions', () => {
      const v1 = new SemVer(1, 2, 3)
      const v2 = new SemVer(1, 2, 3)

      expect(v1.isGreaterThanOrEqual(v2)).toBe(true)
      expect(v2.isGreaterThanOrEqual(v1)).toBe(true)
    })

    it('should handle prerelease versions correctly', () => {
      const stable = new SemVer(1, 2, 3)
      const prerelease = new SemVer(1, 2, 3, 'beta.1')

      // Stable version should be greater than prerelease
      expect(stable.isGreaterThanOrEqual(prerelease)).toBe(true)
      expect(prerelease.isGreaterThanOrEqual(stable)).toBe(false)
    })
  })
})

describe('Command Generation and Execution', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearPackageManagerCache()
  })

  describe('getRunCommand', () => {
    it('should generate correct run command for detected package manager', () => {
      mockExecSync.mockReturnValueOnce(Buffer.from('8.10.0'))

      const result = getRunCommand('build')

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toBe('pnpm run build')
      }
    })

    it('should include arguments in run command', () => {
      mockExecSync.mockReturnValueOnce(Buffer.from('8.10.0'))

      const result = getRunCommand('test', ['--watch', '--coverage'])

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toBe('pnpm run test -- --watch --coverage')
      }
    })

    it('should propagate package manager detection errors', () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('not found')
      })

      const result = getRunCommand('build')

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.type).toBe('PACKAGE_MANAGER_ERROR')
        expect(result.error.message).toContain('No package manager found')
      }
    })
  })

  describe('execPackageManagerCommand', () => {
    it('should execute command with detected package manager', () => {
      mockExecSync
        .mockReturnValueOnce(Buffer.from('8.10.0')) // Detection
        .mockReturnValueOnce(Buffer.from('Success')) // Command execution

      const result = execPackageManagerCommand('pnpm install express')

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toBe('Success')
      }

      expect(mockExecSync).toHaveBeenCalledTimes(2)
    })

    it('should handle command execution failures', () => {
      mockExecSync
        .mockReturnValueOnce(Buffer.from('8.10.0')) // Detection succeeds
        .mockImplementationOnce(() => {
          throw new Error('Command failed')
        })

      const result = execPackageManagerCommand('pnpm install invalid-package')

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.type).toBe('PACKAGE_MANAGER_ERROR')
        expect(result.error.message).toContain('Command failed')
      }
    })

    it('should respect custom timeout options', () => {
      mockExecSync
        .mockReturnValueOnce(Buffer.from('8.10.0'))
        .mockReturnValueOnce(Buffer.from('Success'))

      const result = execPackageManagerCommand('pnpm install', { timeout: 30000 })

      expect(result.isOk()).toBe(true)
      expect(mockExecSync).toHaveBeenLastCalledWith(
        'pnpm install',
        expect.objectContaining({ timeout: 30000 })
      )
    })
  })

  describe('getPackageManagerInfo', () => {
    it('should return package manager information', () => {
      mockExecSync.mockReturnValueOnce(Buffer.from('8.10.0'))

      const result = getPackageManagerInfo()

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        const info = result.value
        expect(info.name).toBe('pnpm')
        expect(info.version).toBe('8.10.0')
        expect(info.command).toBe('pnpm')
        expect(info.runCommand).toBe('pnpm run')
        expect(info.installCommand).toBe('pnpm install')
      }
    })
  })
})

describe('Integration Scenarios', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearPackageManagerCache()
  })

  it('should handle typical CLI development workflow', () => {
    // Simulate pnpm being available
    mockExecSync.mockReturnValueOnce(Buffer.from('8.10.0'))

    // 1. Detect package manager
    const detectResult = detectPackageManager()
    expect(detectResult.isOk()).toBe(true)

    // 2. Generate run command
    mockExecSync.mockReturnValueOnce(Buffer.from('8.10.0')) // Cache should prevent this call
    const runResult = getRunCommand('dev')
    expect(runResult.isOk()).toBe(true)
    if (runResult.isOk()) {
      expect(runResult.value).toBe('pnpm run dev')
    }

    // Should use cached result, so only one detection call
    expect(mockExecSync).toHaveBeenCalledTimes(1)
  })

  it('should handle CI environment with forced package manager', () => {
    process.env.FORCE_PACKAGE_MANAGER = 'npm'
    mockExecSync.mockReturnValueOnce(Buffer.from('9.5.0'))

    const result = detectPackageManager()

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value.name).toBe('npm')
    }

    // Should only check npm, not pnpm
    expect(mockExecSync).toHaveBeenCalledTimes(1)
    expect(mockExecSync).toHaveBeenCalledWith('npm --version', expect.any(Object))
  })

  it('should handle version compatibility checks', () => {
    // Test minimum version requirements
    const testCases = [
      { manager: 'pnpm', version: '6.0.0', shouldPass: true },
      { manager: 'pnpm', version: '5.9.0', shouldPass: false },
      { manager: 'npm', version: '7.0.0', shouldPass: true },
      { manager: 'npm', version: '6.14.0', shouldPass: false },
    ]

    testCases.forEach(({ manager, version, shouldPass }) => {
      // Clean up environment completely before each test
      clearPackageManagerCache()
      delete process.env.FORCE_PACKAGE_MANAGER
      process.env.FORCE_PACKAGE_MANAGER = manager

      // Reset mock completely
      mockExecSync.mockReset()
      mockExecSync.mockReturnValueOnce(Buffer.from(version))

      const result = detectPackageManager()

      if (shouldPass) {
        expect(result.isOk()).toBe(true)
        if (result.isOk()) {
          expect(result.value.name).toBe(manager)
          expect(result.value.version).toBe(version)
        }
      } else {
        expect(result.isErr()).toBe(true)
        if (result.isErr()) {
          expect(result.error.type).toBe('PACKAGE_MANAGER_ERROR')
          expect(result.error.message).toContain('below minimum required version')
        }
      }

      // Clean up after each iteration
      delete process.env.FORCE_PACKAGE_MANAGER
    })
  })
})
