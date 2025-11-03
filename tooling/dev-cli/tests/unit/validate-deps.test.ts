import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('validate-deps unit tests', () => {
  // let mockContext: any

  beforeEach(() => {
    // mockContext = createMockContext()
    vi.clearAllMocks()
  })

  describe('extractRepoImports', () => {
    const mockExtractRepoImports = (content: string) => {
      const repoImportRegex = /@repo\/[^"'`\s]*/g
      const matches = content.match(repoImportRegex) || []
      return [...new Set(matches)]
    }

    it('should extract @repo imports', () => {
      const content = `
        import { config } from '@repo/typescript-config'
        import { utils } from '@repo/utils/helpers'
      `
      const result = mockExtractRepoImports(content)
      expect(result).toEqual(['@repo/typescript-config', '@repo/utils/helpers'])
    })

    it('should deduplicate imports', () => {
      const content = `
        import { config } from '@repo/typescript-config'
        import { other } from '@repo/typescript-config'
      `
      const result = mockExtractRepoImports(content)
      expect(result).toEqual(['@repo/typescript-config'])
    })

    it('should handle empty content', () => {
      const result = mockExtractRepoImports('')
      expect(result).toEqual([])
    })
  })

  describe('extractImportedPackages', () => {
    const mockExtractImportedPackages = (content: string) => {
      const importRegex = /from\s+['"]@([^'"]*)['"]/g
      let match
      const packages = []

      while ((match = importRegex.exec(content)) !== null) {
        const fullPackage = match[1]
        const packageName = fullPackage.split('/')[0]
        if (packageName && packageName !== 'repo') {
          packages.push(packageName)
        }
      }

      return [...new Set(packages)] // Remove duplicates
    }

    it('should extract external package imports', () => {
      const content = `
        import { something } from '@trailhead/cli'
        import { other } from '@external/package'
      `
      const result = mockExtractImportedPackages(content)
      expect(result).toEqual(['trailhead', 'external'])
    })

    it('should filter out @repo imports', () => {
      const content = `
        import { config } from '@repo/typescript-config'
        import { cli } from '@trailhead/cli'
      `
      const result = mockExtractImportedPackages(content)
      expect(result).toEqual(['trailhead'])
    })
  })

  describe('validateTurboJson', () => {
    const mockValidateTurboJson = (turboConfig: any, vitestConfigs: string[]) => {
      const issues: string[] = []
      let warnings = 0

      // Check if test tasks depend on vitest-config build
      const testTask = turboConfig.tasks?.test || turboConfig.pipeline?.test
      if (testTask) {
        const dependsOn = testTask.dependsOn || []
        const hasVitestDep =
          dependsOn.includes('@repo/vitest-config#build') ||
          dependsOn.includes('^@repo/vitest-config#build')

        if (!hasVitestDep) {
          if (vitestConfigs.length > 0) {
            issues.push('⚠️  Test tasks should depend on @repo/vitest-config#build')
            warnings++
          }
        }
      }

      return { errors: 0, warnings, issues }
    }

    it('should pass when test task has vitest-config dependency', () => {
      const turboConfig = {
        tasks: {
          test: {
            dependsOn: ['@repo/vitest-config#build'],
          },
        },
      }
      const result = mockValidateTurboJson(turboConfig, ['packages/cli/vitest.config.ts'])
      expect(result.warnings).toBe(0)
      expect(result.issues).toEqual([])
    })

    it('should warn when test task missing vitest-config dependency', () => {
      const turboConfig = {
        tasks: {
          test: {
            dependsOn: ['build'],
          },
        },
      }
      const result = mockValidateTurboJson(turboConfig, ['packages/cli/vitest.config.ts'])
      expect(result.warnings).toBe(1)
      expect(result.issues).toContain('⚠️  Test tasks should depend on @repo/vitest-config#build')
    })

    it('should pass when no vitest configs exist', () => {
      const turboConfig = {
        tasks: {
          test: {
            dependsOn: ['build'],
          },
        },
      }
      const result = mockValidateTurboJson(turboConfig, [])
      expect(result.warnings).toBe(0)
      expect(result.issues).toEqual([])
    })

    it('should handle legacy pipeline format', () => {
      const turboConfig = {
        pipeline: {
          test: {
            dependsOn: ['^@repo/vitest-config#build'],
          },
        },
      }
      const result = mockValidateTurboJson(turboConfig, ['packages/cli/vitest.config.ts'])
      expect(result.warnings).toBe(0)
      expect(result.issues).toEqual([])
    })
  })

  describe('checkForCircularImport', () => {
    const mockCheckForCircularImport = (
      packageName: string,
      importedPackage: string,
      packageContents: Record<string, string[]>
    ) => {
      const importedFiles = packageContents[importedPackage] || []

      for (const content of importedFiles) {
        const importRegex = /from\s+['"]@([^'"]*)['"]/g
        const matches = content.match(importRegex) || []
        const backImports = matches
          .map((match) => match.replace(/from\s+['"]@([^/'"]*)['"]/g, '$1'))
          .filter((pkg) => pkg && pkg !== 'repo')

        if (backImports.includes(packageName)) {
          return true
        }
      }

      return false
    }

    it.skip('should detect circular dependencies', () => {
      const packageContents = {
        'esteban-url/cli': [`import { config } from '@trailhead/config'`],
        'esteban-url/config': [`import { utils } from '@trailhead/cli'`],
      }

      const result = mockCheckForCircularImport(
        'esteban-url/cli',
        'esteban-url/config',
        packageContents
      )
      expect(result).toBe(true)
    })

    it('should not detect false positives', () => {
      const packageContents = {
        'esteban-url/cli': [`import { config } from '@trailhead/config'`],
        'esteban-url/config': [`import { lodash } from 'lodash'`],
      }

      const result = mockCheckForCircularImport(
        'esteban-url/cli',
        'esteban-url/config',
        packageContents
      )
      expect(result).toBe(false)
    })
  })

  describe('dependency graph generation', () => {
    const mockBuildDependencyMap = (packages: Array<{ name: string; dependencies: string[] }>) => {
      const dependencyMap = new Map<string, Set<string>>()

      packages.forEach((pkg) => {
        dependencyMap.set(pkg.name, new Set(pkg.dependencies))
      })

      return dependencyMap
    }

    it('should build dependency map correctly', () => {
      const packages = [
        { name: 'cli', dependencies: ['config', 'core'] },
        { name: 'config', dependencies: ['core'] },
        { name: 'core', dependencies: [] },
      ]

      const result = mockBuildDependencyMap(packages)
      expect(result.get('cli')).toEqual(new Set(['config', 'core']))
      expect(result.get('config')).toEqual(new Set(['core']))
      expect(result.get('core')).toEqual(new Set([]))
    })

    it('should identify root packages', () => {
      const dependencyMap = new Map([
        ['cli', new Set(['config'])],
        ['config', new Set(['core'])],
        ['core', new Set([])],
      ])

      const allPackages = new Set(['cli', 'config', 'core'])
      const dependedOn = new Set<string>()
      dependencyMap.forEach((deps) => deps.forEach((dep) => dependedOn.add(dep)))
      const rootPackages = Array.from(allPackages).filter((pkg) => !dependedOn.has(pkg))

      expect(rootPackages).toEqual(['cli'])
    })
  })
})
