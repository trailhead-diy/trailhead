import { describe, it, expect } from 'vitest'
import {
  getSortedFeatureModules,
  getSortedModuleNames,
  sortTemplateFiles,
  composeTemplate,
  FEATURE_MODULES,
} from '../modules'
import type { ProjectConfig } from '../../config/types'

describe('module sorting utilities', () => {
  describe('getSortedFeatureModules', () => {
    it('should return modules sorted alphabetically by name', () => {
      const sorted = getSortedFeatureModules()
      const names = sorted.map((m) => m.name)

      expect(names).toEqual(['config', 'core', 'testing'])
      expect(sorted).toHaveLength(Object.keys(FEATURE_MODULES).length)
    })

    it('should maintain module integrity', () => {
      const sorted = getSortedFeatureModules()

      // Check that core module is present and correct
      const coreModule = sorted.find((m) => m.name === 'core')
      expect(coreModule).toBeDefined()
      expect(coreModule?.description).toBe('Essential CLI functionality')
      expect(coreModule?.dependencies).toEqual([])
    })
  })

  describe('getSortedModuleNames', () => {
    it('should return module names sorted alphabetically', () => {
      const names = getSortedModuleNames()

      expect(names).toEqual(['config', 'core', 'testing'])
      expect(names).toHaveLength(Object.keys(FEATURE_MODULES).length)
    })
  })

  describe('sortTemplateFiles', () => {
    const mockFiles = [
      {
        source: 'modules/config/config.json.hbs',
        destination: 'config.json',
        isTemplate: true,
        executable: false,
      },
      {
        source: 'shared/package.json.hbs',
        destination: 'package.json',
        isTemplate: true,
        executable: false,
      },
      {
        source: 'modules/core/src/index.ts.hbs',
        destination: 'src/index.ts',
        isTemplate: true,
        executable: false,
      },
      {
        source: 'shared/bin/cli.js.hbs',
        destination: 'bin/cli.js',
        isTemplate: true,
        executable: true,
      },
    ]

    it('should sort template files by destination path', () => {
      const sorted = sortTemplateFiles(mockFiles)

      expect(sorted.map((f) => f.destination)).toEqual([
        'bin/cli.js',
        'config.json',
        'package.json',
        'src/index.ts',
      ])
    })

    it('should preserve file properties', () => {
      const sorted = sortTemplateFiles(mockFiles)

      const executableFile = sorted.find((f) => f.destination === 'bin/cli.js')
      expect(executableFile?.executable).toBe(true)

      const templateFile = sorted.find((f) => f.destination === 'package.json')
      expect(templateFile?.isTemplate).toBe(true)
    })

    it('should handle empty array', () => {
      const sorted = sortTemplateFiles([])
      expect(sorted).toEqual([])
    })

    it('should handle single file', () => {
      const singleFile = [mockFiles[0]]
      const sorted = sortTemplateFiles(singleFile)
      expect(sorted).toEqual(singleFile)
    })
  })

  describe('composeTemplate with sorting', () => {
    const mockConfig: ProjectConfig = {
      projectName: 'test-cli',
      projectPath: '/test/path',
      projectType: 'standalone-cli',
      features: {
        core: true,
        config: true,
        testing: false,
      },
      nodeVersion: '18',
      typescript: true,
      packageManager: 'pnpm',
      ide: 'none',
      includeDocs: false,
      dryRun: false,
      force: false,
      verbose: false,
    }

    it('should return sorted modules, files, and dependencies', () => {
      const result = composeTemplate(mockConfig)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        const template = result.value

        // Check modules are sorted
        const moduleNames = template.modules.map((m) => m.name)
        const sortedModuleNames = [...moduleNames].sort()
        expect(moduleNames).toEqual(sortedModuleNames)

        // Check files are sorted by destination
        const destinations = template.files.map((f) => f.destination)
        const sortedDestinations = [...destinations].sort()
        expect(destinations).toEqual(sortedDestinations)

        // Check dependencies are sorted
        const deps = template.packageDependencies
        const sortedDeps = [...deps].sort()
        expect(deps).toEqual(sortedDeps)
      }
    })

    it('should include core module even if not explicitly enabled', () => {
      const configWithoutCore: ProjectConfig = {
        ...mockConfig,
        features: {
          config: true,
          testing: true,
        },
      }

      const result = composeTemplate(configWithoutCore)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        const template = result.value
        expect(template.modules.some((m) => m.name === 'core')).toBe(true)
      }
    })

    it('should handle config with all features enabled', () => {
      const fullConfig: ProjectConfig = {
        ...mockConfig,
        features: {
          core: true,
          config: true,
          testing: true,
        },
      }

      const result = composeTemplate(fullConfig)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        const template = result.value

        // Should have all three modules
        expect(template.modules).toHaveLength(3)
        expect(template.modules.map((m) => m.name)).toEqual(['config', 'core', 'testing'])

        // Files should be sorted
        expect(template.files.length).toBeGreaterThan(0)
        const destinations = template.files.map((f) => f.destination)
        const sortedDestinations = [...destinations].sort()
        expect(destinations).toEqual(sortedDestinations)
      }
    })

    it('should handle project type specific files in sorted order', () => {
      const monorepoConfig: ProjectConfig = {
        ...mockConfig,
        projectType: 'monorepo-package',
      }

      const result = composeTemplate(monorepoConfig)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        const template = result.value

        // Should include turbo.json for monorepo projects
        expect(template.files.some((f) => f.destination === 'turbo.json')).toBe(true)

        // All files should still be sorted
        const destinations = template.files.map((f) => f.destination)
        const sortedDestinations = [...destinations].sort()
        expect(destinations).toEqual(sortedDestinations)
      }
    })

    it('should compose template with all files sorted', () => {
      const result = composeTemplate(mockConfig)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        const template = result.value

        // All files should be sorted by destination path
        const destinations = template.files.map((f) => f.destination)
        const sortedDestinations = [...destinations].sort()
        expect(destinations).toEqual(sortedDestinations)

        // Should include core shared files
        expect(template.files.some((f) => f.destination === 'package.json')).toBe(true)
        expect(template.files.some((f) => f.destination === 'tsconfig.json')).toBe(true)
        expect(template.files.some((f) => f.destination === '.gitignore')).toBe(true)
      }
    })

    it('should return error for unknown features', () => {
      const invalidConfig: ProjectConfig = {
        ...mockConfig,
        features: {
          core: true,
          'unknown-feature': true,
        } as any,
      }

      const result = composeTemplate(invalidConfig)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toContain('Unknown feature: unknown-feature')
      }
    })

    it('should maintain dependency order after sorting', () => {
      const result = composeTemplate(mockConfig)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        const template = result.value

        // Dependencies should be sorted alphabetically
        const deps = template.packageDependencies
        expect(deps).toEqual(['@trailhead/fs', '@trailhead/trailhead-cli', 'zod'])

        // Should contain all expected dependencies
        expect(deps).toContain('@trailhead/trailhead-cli') // from core module
        expect(deps).toContain('@trailhead/fs') // from config module
        expect(deps).toContain('zod') // from config module
      }
    })
  })

  describe('integration with real module data', () => {
    it('should handle actual FEATURE_MODULES data correctly', () => {
      const moduleNames = Object.keys(FEATURE_MODULES)
      const sortedNames = getSortedModuleNames()

      expect(sortedNames).toHaveLength(moduleNames.length)
      expect(sortedNames).toEqual(moduleNames.sort())
    })

    it('should preserve module relationships after sorting', () => {
      const modules = getSortedFeatureModules()

      // Config module should depend on core
      const configModule = modules.find((m) => m.name === 'config')
      expect(configModule?.dependencies).toContain('core')

      // Testing module should depend on core
      const testingModule = modules.find((m) => m.name === 'testing')
      expect(testingModule?.dependencies).toContain('core')

      // Core should have no dependencies
      const coreModule = modules.find((m) => m.name === 'core')
      expect(coreModule?.dependencies).toEqual([])
    })
  })
})
