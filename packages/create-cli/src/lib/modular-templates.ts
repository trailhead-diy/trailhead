import { ok, err, createCoreError } from '@esteban-url/core'
import type { Result } from '@esteban-url/core'
import type { ModernProjectConfig } from './interactive-prompts.js'
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
        source: 'modules/core/src/commands/version.ts.hbs',
        destination: 'src/commands/version.ts',
        isTemplate: true,
        executable: false,
      },
      {
        source: 'modules/core/src/commands/help.ts.hbs',
        destination: 'src/commands/help.ts',
        isTemplate: true,
        executable: false,
      },
      {
        source: 'shared/bin/cli.js',
        destination: 'bin/cli.js',
        isTemplate: false,
        executable: true,
      },
    ],
    packageDependencies: ['@esteban-url/trailhead-cli'],
    scripts: {
      build: 'pnpm run clean && tsc --emitDeclarationOnly && tsup',
      dev: 'tsup --watch',
      clean: 'rm -rf dist',
    },
  },

  config: {
    name: 'config',
    description: 'Configuration management system',
    dependencies: ['core'],
    conflicts: [],
    files: [
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
        source: 'modules/config/config.example.json.hbs',
        destination: 'config.example.json',
        isTemplate: true,
        executable: false,
      },
    ],
    packageDependencies: ['zod'],
    scripts: {
      'config:validate': 'node bin/cli.js config --validate',
    },
  },

  validation: {
    name: 'validation',
    description: 'Input validation and schema checking',
    dependencies: ['core'],
    conflicts: [],
    files: [
      {
        source: 'modules/validation/src/lib/validators.ts.hbs',
        destination: 'src/lib/validators.ts',
        isTemplate: true,
        executable: false,
      },
      {
        source: 'modules/validation/src/commands/validate.ts.hbs',
        destination: 'src/commands/validate.ts',
        isTemplate: true,
        executable: false,
      },
    ],
    packageDependencies: ['zod'],
    scripts: {
      validate: 'node bin/cli.js validate',
    },
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
        source: 'modules/testing/src/__tests__/commands/version.test.ts.hbs',
        destination: 'src/__tests__/commands/version.test.ts',
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

  docs: {
    name: 'docs',
    description: 'Documentation structure and tooling',
    dependencies: ['core'],
    conflicts: [],
    files: [
      {
        source: 'modules/docs/README.md.hbs',
        destination: 'README.md',
        isTemplate: true,
        executable: false,
      },
      {
        source: 'modules/docs/docs/getting-started.md.hbs',
        destination: 'docs/getting-started.md',
        isTemplate: true,
        executable: false,
      },
      {
        source: 'modules/docs/docs/api-reference.md.hbs',
        destination: 'docs/api-reference.md',
        isTemplate: true,
        executable: false,
      },
      {
        source: 'modules/docs/docs/architecture.md.hbs',
        destination: 'docs/architecture.md',
        isTemplate: true,
        executable: false,
      },
    ],
    scripts: {
      'docs:build': 'echo "Documentation built"',
    },
  },

  cicd: {
    name: 'cicd',
    description: 'CI/CD workflows and automation',
    dependencies: ['core', 'testing'],
    conflicts: [],
    files: [
      {
        source: 'modules/cicd/.github/workflows/ci.yml.hbs',
        destination: '.github/workflows/ci.yml',
        isTemplate: true,
        executable: false,
      },
      {
        source: 'modules/cicd/.github/workflows/release.yml.hbs',
        destination: '.github/workflows/release.yml',
        isTemplate: true,
        executable: false,
      },
      {
        source: 'modules/cicd/lefthook.yml.hbs',
        destination: 'lefthook.yml',
        isTemplate: true,
        executable: false,
      },
    ],
    scripts: {
      prepare: 'lefthook install',
    },
  },

  examples: {
    name: 'examples',
    description: 'Example commands and patterns',
    dependencies: ['core'],
    conflicts: [],
    files: [
      {
        source: 'modules/examples/src/commands/build.ts.hbs',
        destination: 'src/commands/build.ts',
        isTemplate: true,
        executable: false,
      },
      {
        source: 'modules/examples/src/commands/dev.ts.hbs',
        destination: 'src/commands/dev.ts',
        isTemplate: true,
        executable: false,
      },
    ],
  },
}

/**
 * Compose template from selected features
 */
export function composeTemplate(config: ModernProjectConfig): Result<ComposedTemplate, any> {
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
            createCoreError('UNKNOWN_FEATURE', `Unknown feature: ${featureName}`, {
              component: 'create-trailhead-cli',
              operation: 'composeTemplate',
            })
          )
        }
        selectedModules.push(module)
      }
    }

    // Add template-based modules (basic vs advanced)
    if (config.template === 'advanced') {
      // Advanced template gets more example commands and features
      selectedModules.push(FEATURE_MODULES.examples)
      if (!config.features.config) {
        selectedModules.push(FEATURE_MODULES.config)
      }
      if (!config.features.validation) {
        selectedModules.push(FEATURE_MODULES.validation)
      }
    } else {
      // Basic template gets simple examples
      selectedModules.push(FEATURE_MODULES.examples)
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

    // Add IDE configuration
    if (config.ide === 'vscode') {
      allFiles.push(
        {
          source: 'modules/vscode/.vscode/settings.json.hbs',
          destination: '.vscode/settings.json',
          isTemplate: true,
          executable: false,
        },
        {
          source: 'modules/vscode/.vscode/extensions.json',
          destination: '.vscode/extensions.json',
          isTemplate: false,
          executable: false,
        }
      )
    }

    return ok({
      name: `${config.template}-${config.projectType}`,
      modules: selectedModules,
      files: allFiles,
      packageDependencies: Array.from(allDependencies),
      scripts: allScripts,
    })
  } catch (error) {
    return err(
      createCoreError('TEMPLATE_COMPOSITION_FAILED', 'Failed to compose template', {
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
export function getRecommendedModules(projectType: string, template: string): string[] {
  const base = ['core']

  switch (projectType) {
    case 'standalone-cli':
      if (template === 'advanced') {
        return [...base, 'config', 'validation', 'testing', 'docs', 'cicd', 'examples']
      }
      return [...base, 'testing', 'examples']

    case 'library':
      if (template === 'advanced') {
        return [...base, 'validation', 'testing', 'docs', 'cicd']
      }
      return [...base, 'testing', 'docs']

    case 'monorepo-package':
      return [...base, 'testing']

    default:
      return base
  }
}
