import { ok, err, createCoreError, type Result } from '@trailhead/core'
import { sortBy, sortStrings } from '@trailhead/sort'
import type { ProjectConfig } from '../config/types.js'
import type { TemplateFile } from './types.js'

export interface FeatureModule {
  name: string
  description: string
  dependencies: string[] // Other feature modules this depends on
  conflicts: string[] // Features that conflict with this one
  files: TemplateFile[]
  packageDependencies?: string[] // Additional npm dependencies needed
  scripts?: Record<string, string> // Additional package.json scripts
}

export interface ComposedTemplate {
  name: string
  modules: FeatureModule[]
  files: TemplateFile[]
  packageDependencies: string[]
  scripts: Record<string, string>
}

/**
 * Define all available feature modules
 */
export const FEATURE_MODULES: Record<string, FeatureModule> = {
  core: {
    name: 'core',
    description: 'Essential CLI functionality',
    dependencies: [],
    conflicts: [],
    files: [
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
    ],
    packageDependencies: ['@trailhead/trailhead-cli'],
    scripts: {
      build: 'pnpm run clean && tsc --emitDeclarationOnly && tsup',
      dev: 'tsup --watch',
      clean: 'rm -rf dist',
    },
  },

  config: {
    name: 'config',
    description: 'Configuration management system using @trailhead/config and @trailhead/fs',
    dependencies: ['core'],
    conflicts: [],
    files: [
      {
        source: 'modules/config/src/commands/hello.ts.hbs',
        destination: 'src/commands/hello.ts',
        isTemplate: true,
        executable: false,
      },
      {
        source: 'modules/config/src/commands/config.ts.hbs',
        destination: 'src/commands/config.ts',
        isTemplate: true,
        executable: false,
      },
      {
        source: 'modules/config/src/lib/config-schema.ts.hbs',
        destination: 'src/lib/config-schema.ts',
        isTemplate: true,
        executable: false,
      },
      {
        source: 'modules/config/src/lib/config.ts.hbs',
        destination: 'src/lib/config.ts',
        isTemplate: true,
        executable: false,
      },
      {
        source: 'modules/config/config.json.hbs',
        destination: 'config.json',
        isTemplate: true,
        executable: false,
      },
    ],
    packageDependencies: ['@trailhead/config', '@trailhead/fs'],
    scripts: {},
  },

  testing: {
    name: 'testing',
    description: 'Comprehensive testing setup',
    dependencies: ['core'],
    conflicts: [],
    files: [
      {
        source: 'modules/testing/src/__tests__/integration/cli.test.ts.hbs',
        destination: 'src/__tests__/integration/cli.test.ts',
        isTemplate: true,
        executable: false,
      },
      {
        source: 'modules/testing/vitest.config.ts.hbs',
        destination: 'vitest.config.ts',
        isTemplate: true,
        executable: false,
      },
    ],
    scripts: {
      test: 'vitest run',
      'test:watch': 'vitest',
      'test:coverage': 'vitest run --coverage',
    },
  },
}

/**
 * Compose template from selected features
 */
export function composeTemplate(config: ProjectConfig): Result<ComposedTemplate, any> {
  try {
    const selectedModules: FeatureModule[] = []
    const allFiles: TemplateFile[] = []
    const allDependencies = new Set<string>()
    const allScripts: Record<string, string> = {}

    // Always include core module
    const coreModule = FEATURE_MODULES.core
    selectedModules.push(coreModule)

    // Add selected features
    for (const [featureName, enabled] of Object.entries(config.features)) {
      if (enabled && featureName !== 'core') {
        const module = FEATURE_MODULES[featureName]
        if (!module) {
          return err(
            createCoreError('UNKNOWN_FEATURE', 'CLI_ERROR', `Unknown feature: ${featureName}`, {
              component: 'create-trailhead-cli',
              operation: 'composeTemplate',
            })
          )
        }
        selectedModules.push(module)
      }
    }

    // Add config module if testing is enabled but config isn't
    if (config.features.testing && !config.features.config) {
      selectedModules.push(FEATURE_MODULES.config)
    }

    // Validate dependencies
    const dependencyResult = validateDependencies(selectedModules)
    if (dependencyResult.isErr()) {
      return err(dependencyResult.error)
    }

    // Check for conflicts
    const conflictResult = checkConflicts(selectedModules)
    if (conflictResult.isErr()) {
      return err(conflictResult.error)
    }

    // Collect all files, dependencies, and scripts
    for (const module of selectedModules) {
      allFiles.push(...module.files)

      if (module.packageDependencies) {
        module.packageDependencies.forEach((dep) => allDependencies.add(dep))
      }

      if (module.scripts) {
        Object.assign(allScripts, module.scripts)
      }
    }

    // Add shared infrastructure files
    allFiles.push(
      {
        source: 'shared/package.json.hbs',
        destination: 'package.json',
        isTemplate: true,
        executable: false,
      },
      {
        source: 'shared/tsconfig.json.hbs',
        destination: 'tsconfig.json',
        isTemplate: true,
        executable: false,
      },
      {
        source: 'shared/tsup.config.ts.hbs',
        destination: 'tsup.config.ts',
        isTemplate: true,
        executable: false,
      },
      {
        source: 'shared/_gitignore',
        destination: '.gitignore',
        isTemplate: false,
        executable: false,
      }
    )

    // Add project type specific files
    if (config.projectType === 'monorepo-package') {
      allFiles.push({
        source: 'shared/turbo.json.hbs',
        destination: 'turbo.json',
        isTemplate: true,
        executable: false,
      })
    }

    // Sort modules by name and files by destination
    const sortedModules = sortBy(selectedModules, [(module) => module.name])
    const sortedFiles = sortTemplateFiles(allFiles)
    const sortedDependencies = sortStrings(Array.from(allDependencies))

    return ok({
      name: `${config.projectType}`,
      modules: sortedModules,
      files: sortedFiles,
      packageDependencies: sortedDependencies,
      scripts: allScripts,
    })
  } catch (error) {
    return err(
      createCoreError('TEMPLATE_COMPOSITION_FAILED', 'CLI_ERROR', 'Failed to compose template', {
        component: 'create-trailhead-cli',
        operation: 'composeTemplate',
        cause: error,
        recoverable: false,
      })
    )
  }
}

/**
 * Validate that all module dependencies are satisfied
 */
function validateDependencies(modules: FeatureModule[]): Result<void, any> {
  const moduleNames = new Set(modules.map((m) => m.name))

  for (const module of modules) {
    for (const dependency of module.dependencies) {
      if (!moduleNames.has(dependency)) {
        return err(
          createCoreError(
            'MISSING_DEPENDENCY',
            'CLI_ERROR',
            `Module '${module.name}' requires '${dependency}'`,
            {
              component: 'create-trailhead-cli',
              operation: 'validateDependencies',
              details: `Add the '${dependency}' feature or its dependencies`,
            }
          )
        )
      }
    }
  }

  return ok(undefined)
}

/**
 * Check for conflicting modules
 */
function checkConflicts(modules: FeatureModule[]): Result<void, any> {
  const moduleNames = new Set(modules.map((m) => m.name))

  for (const module of modules) {
    for (const conflict of module.conflicts) {
      if (moduleNames.has(conflict)) {
        return err(
          createCoreError(
            'MODULE_CONFLICT',
            'CLI_ERROR',
            `Module '${module.name}' conflicts with '${conflict}'`,
            {
              component: 'create-trailhead-cli',
              operation: 'checkConflicts',
              details: `Choose either '${module.name}' or '${conflict}', not both`,
            }
          )
        )
      }
    }
  }

  return ok(undefined)
}

/**
 * Get recommended modules for a project type
 */
export function getRecommendedModules(projectType: string): string[] {
  const base = ['core']

  switch (projectType) {
    case 'standalone-cli':
      return [...base, 'config', 'testing']

    case 'library':
      return [...base, 'config', 'testing']

    case 'monorepo-package':
      return [...base, 'testing']

    default:
      return base
  }
}

/**
 * Get all available feature modules sorted by name
 */
export function getSortedFeatureModules(): FeatureModule[] {
  const modules = Object.values(FEATURE_MODULES)
  return sortBy(modules, [(module) => module.name])
}

/**
 * Get module names sorted alphabetically
 */
export function getSortedModuleNames(): string[] {
  const names = Object.keys(FEATURE_MODULES)
  return sortStrings(names)
}

/**
 * Sort template files by destination path
 */
export function sortTemplateFiles(files: TemplateFile[]): TemplateFile[] {
  return sortBy(files, [(file) => file.destination])
}
