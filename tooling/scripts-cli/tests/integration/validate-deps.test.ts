import { describe, it, expect, beforeEach, vi } from 'vitest'
import { validateDepsCommand } from '../../src/commands/validate-deps.js'
import { createMockContext, createMockFileSystem, createMockPackageJson, createMockTurboJson } from '../utils/mock-context.js'

describe('validate-deps integration tests', () => {
  let mockContext: any
  let files: Record<string, string>

  beforeEach(() => {
    files = {}
    mockContext = createMockContext({
      fs: createMockFileSystem(files)
    })
    vi.clearAllMocks()
  })

  it('should validate monorepo dependencies successfully', async () => {
    // Setup mock monorepo structure
    files['packages/cli/package.json'] = createMockPackageJson('@esteban-url/cli', {
      '@repo/typescript-config': 'workspace:*'
    }, { build: 'tsup' })
    
    files['packages/config/package.json'] = createMockPackageJson('@esteban-url/config', {}, { build: 'tsup' })
    
    files['tooling/typescript-config/package.json'] = createMockPackageJson('@repo/typescript-config', {}, { build: 'tsup' })
    
    files['packages/cli/src/index.ts'] = `
      import { config } from '@repo/typescript-config'
      export const cli = {}
    `
    
    files['turbo.json'] = createMockTurboJson({
      test: {
        dependsOn: ['@repo/vitest-config#build']
      }
    })

    // Mock glob results
    vi.doMock('fast-glob', () => ({
      glob: vi.fn().mockImplementation((patterns: string[]) => {
        if (patterns.some(p => p.includes('package.json'))) {
          return Promise.resolve([
            'packages/cli/package.json',
            'packages/config/package.json',
            'tooling/typescript-config/package.json'
          ])
        }
        if (patterns.some(p => p.includes('*.{ts,tsx,js,jsx}'))) {
          return Promise.resolve(['packages/cli/src/index.ts'])
        }
        if (patterns.some(p => p.includes('vitest.config.ts'))) {
          return Promise.resolve([])
        }
        return Promise.resolve([])
      })
    }))

    const result = await validateDepsCommand.action({}, mockContext)
    
    expect(result.isOk()).toBe(true)
    expect(mockContext.logger.info).toHaveBeenCalledWith(
      expect.stringContaining('All dependency checks passed!')
    )
  })

  it('should detect missing build scripts', async () => {
    files['packages/cli/package.json'] = createMockPackageJson('@esteban-url/cli', {
      '@repo/typescript-config': 'workspace:*'
    })
    
    files['tooling/typescript-config/package.json'] = createMockPackageJson('@repo/typescript-config') // No build script
    
    files['packages/cli/src/index.ts'] = `
      import { config } from '@repo/typescript-config'
    `

    vi.doMock('fast-glob', () => ({
      glob: vi.fn().mockImplementation((patterns: string[]) => {
        if (patterns.some(p => p.includes('package.json'))) {
          return Promise.resolve([
            'packages/cli/package.json',
            'tooling/typescript-config/package.json'
          ])
        }
        if (patterns.some(p => p.includes('*.{ts,tsx,js,jsx}'))) {
          return Promise.resolve(['packages/cli/src/index.ts'])
        }
        return Promise.resolve([])
      })
    }))
    
    const result = await validateDepsCommand.action({}, mockContext)
    
    expect(result.isErr()).toBe(true)
    expect(result.error.message).toContain('1 errors and 0 warnings')
  })

  it('should fix issues when --fix flag is used', async () => {
    files['packages/cli/package.json'] = createMockPackageJson('@esteban-url/cli', {
      '@repo/typescript-config': 'workspace:*'
    })
    
    files['tooling/typescript-config/package.json'] = createMockPackageJson('@repo/typescript-config') // No build script
    
    files['turbo.json'] = createMockTurboJson({
      test: {
        dependsOn: ['build'] // Missing vitest-config dependency
      }
    })

    vi.doMock('fast-glob', () => ({
      glob: vi.fn().mockImplementation((patterns: string[]) => {
        if (patterns.some(p => p.includes('package.json'))) {
          return Promise.resolve([
            'packages/cli/package.json',
            'tooling/typescript-config/package.json'
          ])
        }
        if (patterns.some(p => p.includes('vitest.config.ts'))) {
          return Promise.resolve(['packages/cli/vitest.config.ts'])
        }
        return Promise.resolve([])
      })
    }))
    
    const result = await validateDepsCommand.action({ fix: true }, mockContext)
    
    // Should still error but attempt fixes
    expect(result.isErr()).toBe(true)
    
    // Check that files were modified
    const updatedPackageJson = JSON.parse(files['tooling/typescript-config/package.json'])
    expect(updatedPackageJson.scripts.build).toBe('echo "No build required"')
    
    const updatedTurboJson = JSON.parse(files['turbo.json'])
    expect(updatedTurboJson.tasks.test.dependsOn).toContain('@repo/vitest-config#build')
  })

  it('should display dependency graph when --graph flag is used', async () => {
    files['packages/cli/package.json'] = createMockPackageJson('@esteban-url/cli', {
      '@esteban-url/config': 'workspace:*'
    }, { build: 'tsup' })
    
    files['packages/config/package.json'] = createMockPackageJson('@esteban-url/config', {
      '@esteban-url/core': 'workspace:*'
    }, { build: 'tsup' })
    
    files['packages/core/package.json'] = createMockPackageJson('@esteban-url/core', {}, { build: 'tsup' })

    vi.doMock('fast-glob', () => ({
      glob: vi.fn().mockImplementation((patterns: string[]) => {
        if (patterns.some(p => p.includes('package.json'))) {
          return Promise.resolve([
            'packages/cli/package.json',
            'packages/config/package.json',
            'packages/core/package.json'
          ])
        }
        return Promise.resolve([])
      })
    }))
    
    const result = await validateDepsCommand.action({ graph: true }, mockContext)
    
    expect(result.isOk()).toBe(true)
    expect(mockContext.logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Generating dependency graph...')
    )
    expect(mockContext.logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Package Dependency Graph:')
    )
  })

  it('should detect circular dependencies', async () => {
    files['packages/cli/package.json'] = createMockPackageJson('@esteban-url/cli', {
      '@esteban-url/config': 'workspace:*'
    }, { build: 'tsup' })
    
    files['packages/config/package.json'] = createMockPackageJson('@esteban-url/config', {
      '@esteban-url/cli': 'workspace:*' // Circular dependency
    }, { build: 'tsup' })
    
    files['packages/cli/src/index.ts'] = `
      import { config } from '@esteban-url/config'
    `
    
    files['packages/config/src/index.ts'] = `
      import { cli } from '@esteban-url/cli'
    `

    vi.doMock('fast-glob', () => ({
      glob: vi.fn().mockImplementation((patterns: string[]) => {
        if (patterns.some(p => p.includes('package.json'))) {
          return Promise.resolve([
            'packages/cli/package.json',
            'packages/config/package.json'
          ])
        }
        if (patterns.some(p => p.includes('/src/**'))) {
          const pattern = patterns[0]
          if (pattern.includes('packages/cli')) {
            return Promise.resolve(['packages/cli/src/index.ts'])
          }
          if (pattern.includes('packages/config')) {
            return Promise.resolve(['packages/config/src/index.ts'])
          }
        }
        return Promise.resolve([])
      })
    }))
    
    const result = await validateDepsCommand.action({}, mockContext)
    
    expect(result.isErr()).toBe(true)
    expect(result.error.message).toContain('errors')
  })

  it('should handle missing turbo.json gracefully', async () => {
    files['packages/cli/package.json'] = createMockPackageJson('@esteban-url/cli', {}, { build: 'tsup' })

    vi.doMock('fast-glob', () => ({
      glob: vi.fn().mockImplementation((patterns: string[]) => {
        if (patterns.some(p => p.includes('package.json'))) {
          return Promise.resolve(['packages/cli/package.json'])
        }
        return Promise.resolve([])
      })
    }))
    
    const result = await validateDepsCommand.action({}, mockContext)
    
    expect(result.isOk()).toBe(true)
    expect(mockContext.logger.info).toHaveBeenCalledWith(
      expect.stringContaining('All dependency checks passed!')
    )
  })
})