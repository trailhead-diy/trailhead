import { z } from 'zod'
import { ok, err, createCoreError } from '@esteban-url/core'
import type { Result } from '@esteban-url/core'
import type { ProjectConfig } from './types.js'

/**
 * Comprehensive configuration schema for create-trailhead-cli
 */

// Base schemas for reuse
export const projectNameSchema = z
  .string()
  .min(1, 'Project name is required')
  .regex(/^[a-z0-9-]+$/, 'Project name must be lowercase alphanumeric with hyphens only')
  .max(214, 'Project name must be less than 214 characters') // npm package name limit

export const emailSchema = z.string().email('Invalid email format').min(1, 'Email is required')

export const packageManagerSchema = z.enum(['npm', 'pnpm'], {
  errorMap: () => ({ message: 'Package manager must be "npm" or "pnpm"' }),
})

export const projectTypeSchema = z.enum(['standalone-cli', 'library', 'monorepo-package'], {
  errorMap: () => ({
    message: 'Project type must be "standalone-cli", "library", or "monorepo-package"',
  }),
})

export const licenseSchema = z.enum(['MIT', 'Apache-2.0', 'ISC', 'custom'], {
  errorMap: () => ({ message: 'License must be "MIT", "Apache-2.0", "ISC", or "custom"' }),
})

export const ideSchema = z.enum(['vscode', 'none'], {
  errorMap: () => ({ message: 'IDE must be "vscode" or "none"' }),
})

export const nodeVersionSchema = z
  .string()
  .regex(/^\d+$/, 'Node version must be a number')
  .refine((val) => parseInt(val) >= 14, 'Node version must be 14 or higher')

// Author information schema
export const authorSchema = z.object({
  name: z.string().min(1, 'Author name is required').max(100, 'Author name too long'),
  email: emailSchema,
})

// Feature flags schema with validation
export const featuresSchema = z.object({
  core: z.literal(true, { errorMap: () => ({ message: 'Core feature is required' }) }),
  config: z.boolean().optional(),
  validation: z.boolean().optional(),
  testing: z.boolean().optional(),
  docs: z.boolean().optional(),
  cicd: z.boolean().optional(),
})

// Main project configuration schema
export const modernProjectConfigSchema = z.object({
  // Basic project information
  projectName: projectNameSchema,
  projectPath: z.string().min(1, 'Project path is required'),
  description: z.string().min(1, 'Description is required').max(500, 'Description too long'),

  // Template configuration
  projectType: projectTypeSchema,

  // Package management
  packageManager: packageManagerSchema,

  // Author and licensing
  author: authorSchema,
  license: licenseSchema,

  // Features and capabilities
  features: featuresSchema,

  // Technical configuration
  nodeVersion: nodeVersionSchema,
  typescript: z.boolean().default(true),
  ide: ideSchema,

  // Generation options
  includeDocs: z.boolean().default(false),
  installDependencies: z.boolean().default(true),
  dryRun: z.boolean().default(false),
  force: z.boolean().default(false),
  verbose: z.boolean().default(false),
})

// Configuration file schema (subset for saving to disk)
export const configFileSchema = z.object({
  projectName: projectNameSchema,
  description: z.string().min(1),
  projectType: projectTypeSchema,
  packageManager: packageManagerSchema,
  author: authorSchema,
  license: licenseSchema,
  features: featuresSchema,
  nodeVersion: nodeVersionSchema,
  typescript: z.boolean(),
  ide: ideSchema,
  includeDocs: z.boolean(),
  installDependencies: z.boolean(),
})

// Preset configuration schema for templates
export const presetConfigSchema = z.object({
  name: projectNameSchema,
  description: z.string().min(1, 'Preset description is required'),
  projectType: projectTypeSchema,
  features: featuresSchema.partial(),
  packageManager: packageManagerSchema.optional(),
  nodeVersion: nodeVersionSchema.optional(),
  ide: ideSchema.optional(),
  includeDocs: z.boolean().optional(),
  installDependencies: z.boolean().optional(),
})

// Type exports
export type ConfigFile = z.infer<typeof configFileSchema>
export type PresetConfig = z.infer<typeof presetConfigSchema>

/**
 * Validate a project configuration
 */
export function validateProjectConfig(config: unknown): Result<ProjectConfig, any> {
  try {
    const result = modernProjectConfigSchema.safeParse(config)

    if (!result.success) {
      const errors = result.error.errors
        .map((err) => `${err.path.join('.')}: ${err.message}`)
        .join(', ')

      return err(
        createCoreError('CONFIG_VALIDATION_FAILED', 'CLI_ERROR', errors, {
          component: 'create-trailhead-cli',
          operation: 'validateProjectConfig',
          details: errors,
          recoverable: true,
          severity: 'high',
        })
      )
    }

    return ok(result.data as ProjectConfig)
  } catch (error) {
    return err(
      createCoreError('CONFIG_VALIDATION_ERROR', 'CLI_ERROR', 'Configuration validation error', {
        component: 'create-trailhead-cli',
        operation: 'validateModernProjectConfig',
        cause: error,
        recoverable: false,
        severity: 'high',
      })
    )
  }
}

/**
 * Validate a configuration file
 */
export function validateConfigFile(config: unknown): Result<ConfigFile, any> {
  try {
    const result = configFileSchema.safeParse(config)

    if (!result.success) {
      const errors = result.error.errors
        .map((err) => `${err.path.join('.')}: ${err.message}`)
        .join(', ')

      return err(
        createCoreError(
          'CONFIG_FILE_VALIDATION_FAILED',
          'CLI_ERROR',
          'Configuration file validation failed',
          {
            component: 'create-trailhead-cli',
            operation: 'validateConfigFile',
            details: errors,
            recoverable: true,
            severity: 'medium',
          }
        )
      )
    }

    return ok(result.data)
  } catch (error) {
    return err(
      createCoreError(
        'CONFIG_FILE_VALIDATION_ERROR',
        'CLI_ERROR',
        'Configuration file validation error',
        {
          component: 'create-trailhead-cli',
          operation: 'validateConfigFile',
          cause: error,
          recoverable: false,
          severity: 'medium',
        }
      )
    )
  }
}

/**
 * Validate a preset configuration
 */
export function validatePresetConfig(preset: unknown): Result<PresetConfig, any> {
  try {
    const result = presetConfigSchema.safeParse(preset)

    if (!result.success) {
      const errors = result.error.errors
        .map((err) => `${err.path.join('.')}: ${err.message}`)
        .join(', ')

      return err(
        createCoreError('PRESET_VALIDATION_FAILED', 'CLI_ERROR', errors, {
          component: 'create-trailhead-cli',
          operation: 'validatePresetConfig',
          details: errors,
          recoverable: true,
          severity: 'medium',
        })
      )
    }

    return ok(result.data)
  } catch (error) {
    return err(
      createCoreError('PRESET_VALIDATION_ERROR', 'CLI_ERROR', 'Preset validation error', {
        component: 'create-trailhead-cli',
        operation: 'validatePresetConfig',
        cause: error,
        recoverable: false,
        severity: 'medium',
      })
    )
  }
}

/**
 * Create a configuration file from ProjectConfig
 */
export function createConfigFile(config: ProjectConfig): ConfigFile {
  return {
    projectName: config.projectName,
    description: config.description,
    projectType: config.projectType,
    packageManager: config.packageManager,
    author: config.author,
    license: config.license,
    features: config.features,
    nodeVersion: config.nodeVersion,
    typescript: config.typescript,
    ide: config.ide,
    includeDocs: config.includeDocs,
    installDependencies: config.installDependencies,
  }
}

/**
 * Merge preset with user configuration
 */
export function mergePresetWithConfig(
  preset: PresetConfig,
  userConfig: Partial<ProjectConfig>
): Partial<ProjectConfig> {
  return {
    ...userConfig,
    projectType: preset.projectType, // Preset always overrides user for projectType
    packageManager: userConfig.packageManager || preset.packageManager, // User overrides preset
    nodeVersion: userConfig.nodeVersion || preset.nodeVersion, // User overrides preset
    ide: userConfig.ide || preset.ide, // User overrides preset
    includeDocs: userConfig.includeDocs ?? preset.includeDocs,
    installDependencies: userConfig.installDependencies ?? preset.installDependencies,
    features: {
      core: true,
      ...preset.features,
      ...userConfig.features, // User features override preset features
    },
  }
}

/**
 * Generate JSON schema for configuration file
 */
export function generateConfigJsonSchema() {
  // This would generate a JSON Schema for IDE support
  // For now, return a basic schema structure
  return {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: 'Create Trailhead CLI Configuration',
    type: 'object',
    properties: {
      projectName: {
        type: 'string',
        pattern: '^[a-z0-9-]+$',
        minLength: 1,
        maxLength: 214,
        description: 'Project name (lowercase alphanumeric with hyphens)',
      },
      description: {
        type: 'string',
        minLength: 1,
        maxLength: 500,
        description: 'Project description',
      },
      template: {
        type: 'string',
        enum: ['basic', 'advanced'],
        description: 'Template variant',
      },
      projectType: {
        type: 'string',
        enum: ['standalone-cli', 'library', 'monorepo-package'],
        description: 'Type of project to generate',
      },
      packageManager: {
        type: 'string',
        enum: ['npm', 'pnpm'],
        description: 'Package manager to use',
      },
      author: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          email: { type: 'string', format: 'email' },
        },
        required: ['name', 'email'],
        additionalProperties: false,
      },
      license: {
        type: 'string',
        enum: ['MIT', 'Apache-2.0', 'ISC', 'custom'],
        description: 'License type',
      },
      features: {
        type: 'object',
        properties: {
          core: { type: 'boolean', const: true },
          config: { type: 'boolean' },
          validation: { type: 'boolean' },
          testing: { type: 'boolean' },
          docs: { type: 'boolean' },
          cicd: { type: 'boolean' },
        },
        required: ['core'],
        additionalProperties: false,
      },
      nodeVersion: {
        type: 'string',
        pattern: '^\\d+$',
        description: 'Target Node.js version',
      },
      typescript: {
        type: 'boolean',
        description: 'Use TypeScript',
      },
      ide: {
        type: 'string',
        enum: ['vscode', 'none'],
        description: 'IDE configuration',
      },
      includeDocs: {
        type: 'boolean',
        description: 'Include documentation',
      },
      installDependencies: {
        type: 'boolean',
        description: 'Install dependencies after generation',
      },
    },
    required: [
      'projectName',
      'description',
      'template',
      'projectType',
      'packageManager',
      'author',
      'license',
      'features',
      'nodeVersion',
      'typescript',
      'ide',
    ],
    additionalProperties: false,
  }
}
