/**
 * Zod schemas for configuration validation.
 *
 * Provides comprehensive validation schemas for project configuration,
 * configuration files, and presets. Exports both schemas and validation
 * functions that return Result types.
 *
 * @module config/schema
 */

import { z } from 'zod'
import { ok, err, createCoreError, type Result } from '@trailhead/core'
import type { ProjectConfig } from './types.js'

// Base schemas for reuse

/**
 * Zod schema for project names.
 *
 * Validates: lowercase alphanumeric with hyphens, 1-214 chars (npm limit).
 */
export const projectNameSchema = z
  .string({
    invalid_type_error: 'Project name must be a string',
    required_error: 'Project name is required',
  })
  .min(1, { message: 'Project name is required' })
  .regex(/^[a-z0-9-]+$/, {
    message: 'Project name must be lowercase alphanumeric with hyphens only',
  })
  .max(214, { message: 'Project name must be less than 214 characters' }) // npm package name limit

/** Zod schema for package manager selection (npm or pnpm) */
export const packageManagerSchema = z.enum(['npm', 'pnpm'], {
  errorMap: () => ({ message: 'Package manager must be "npm" or "pnpm"' }),
})

/** Zod schema for project type selection */
export const projectTypeSchema = z.enum(['standalone-cli', 'library', 'monorepo-package'], {
  errorMap: () => ({
    message: 'Project type must be one of: standalone-cli, library, monorepo-package',
  }),
})

/** Zod schema for IDE configuration selection */
export const ideSchema = z.enum(['vscode', 'none'], {
  errorMap: () => ({ message: 'IDE must be "vscode" or "none"' }),
})

/**
 * Zod schema for Node.js version.
 *
 * Validates: numeric string, version 14 or higher.
 */
export const nodeVersionSchema = z
  .string({
    invalid_type_error: 'Node version must be provided as a string',
    required_error: 'Node version is required',
  })
  .regex(/^\d+$/, { message: 'Node version must be a numeric string (e.g., "18", "20")' })
  .refine((val) => parseInt(val) >= 14, {
    message: 'Node version must be 14 or higher',
  })

/** Zod schema for feature flags with core always required */
export const featuresSchema = z.object({
  core: z.literal(true, {
    errorMap: () => ({ message: 'Core feature must be enabled' }),
  }),
  config: z.boolean().optional(),
  validation: z.boolean().optional(),
  testing: z.boolean().optional(),
  cicd: z.boolean().optional(),
})

/** Complete Zod schema for project configuration with all fields */
export const modernProjectConfigSchema = z.object({
  // Basic project information
  projectName: projectNameSchema,
  projectPath: z.string().min(1, 'Project path is required'),

  // Template configuration
  projectType: projectTypeSchema,

  // Package management
  packageManager: packageManagerSchema,

  // Features and capabilities
  features: featuresSchema,

  // Technical configuration
  nodeVersion: nodeVersionSchema,
  typescript: z.boolean().default(true),
  ide: ideSchema,

  // Generation options
  dryRun: z.boolean().default(false),
  force: z.boolean().default(false),
  verbose: z.boolean().default(false),
})

/** Zod schema for configuration files saved to disk (subset of full config) */
export const configFileSchema = z.object({
  projectName: projectNameSchema,
  projectType: projectTypeSchema,
  packageManager: packageManagerSchema,
  features: featuresSchema,
  nodeVersion: nodeVersionSchema,
  typescript: z.boolean(),
  ide: ideSchema,
})

/** Zod schema for preset configurations (templates with partial overrides) */
export const presetConfigSchema = z.object({
  name: projectNameSchema,
  description: z.string().min(1, 'Preset description is required'),
  projectType: projectTypeSchema,
  features: featuresSchema.partial(),
  packageManager: packageManagerSchema.optional(),
  nodeVersion: nodeVersionSchema.optional(),
  ide: ideSchema.optional(),
})

/** TypeScript type inferred from configFileSchema */
export type ConfigFile = z.infer<typeof configFileSchema>

/** TypeScript type inferred from presetConfigSchema */
export type PresetConfig = z.infer<typeof presetConfigSchema>

/**
 * Validate a complete project configuration.
 *
 * @param config - Unknown input to validate
 * @returns Result with validated ProjectConfig or validation error
 */
export function validateProjectConfig(config: unknown): Result<ProjectConfig, any> {
  const result = modernProjectConfigSchema.safeParse(config)

  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => {
        const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : ''
        return `${path}${issue.message}`
      })
      .join(', ')

    return err(
      createCoreError('CONFIG_VALIDATION_FAILED', 'CLI_ERROR', errors, {
        component: 'create-trailhead-cli',
        operation: 'validateProjectConfig',
        details: errors,
        context: { issues: result.error.issues },
        recoverable: true,
        severity: 'high',
      })
    )
  }

  return ok(result.data as ProjectConfig)
}

/**
 * Validate a configuration file structure.
 *
 * @param config - Unknown input to validate
 * @returns Result with validated ConfigFile or validation error
 */
export function validateConfigFile(config: unknown): Result<ConfigFile, any> {
  const result = configFileSchema.safeParse(config)

  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => {
        const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : ''
        return `${path}${issue.message}`
      })
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
          context: { issues: result.error.issues },
          recoverable: true,
          severity: 'medium',
        }
      )
    )
  }

  return ok(result.data)
}

/**
 * Validate a preset configuration.
 *
 * @param preset - Unknown input to validate
 * @returns Result with validated PresetConfig or validation error
 */
export function validatePresetConfig(preset: unknown): Result<PresetConfig, any> {
  const result = presetConfigSchema.safeParse(preset)

  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => {
        const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : ''
        return `${path}${issue.message}`
      })
      .join(', ')

    return err(
      createCoreError('PRESET_VALIDATION_FAILED', 'CLI_ERROR', errors, {
        component: 'create-trailhead-cli',
        operation: 'validatePresetConfig',
        details: errors,
        context: { issues: result.error.issues },
        recoverable: true,
        severity: 'medium',
      })
    )
  }

  return ok(result.data)
}

/**
 * Extract a ConfigFile subset from a full ProjectConfig.
 *
 * Used when saving configuration to disk (excludes runtime-only fields).
 *
 * @param config - Full project configuration
 * @returns ConfigFile containing only persistable fields
 */
export function createConfigFile(config: ProjectConfig): ConfigFile {
  return {
    projectName: config.projectName,
    projectType: config.projectType,
    packageManager: config.packageManager,
    features: config.features,
    nodeVersion: config.nodeVersion,
    typescript: config.typescript,
    ide: config.ide,
  }
}

/**
 * Merge a preset with user-provided configuration.
 *
 * Preset values serve as defaults; user values override most preset values.
 * ProjectType is always taken from preset.
 *
 * @param preset - Preset configuration to use as base
 * @param userConfig - User-provided overrides
 * @returns Merged partial configuration
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
    features: {
      core: true,
      ...preset.features,
      ...userConfig.features, // User features override preset features
    },
  }
}

/**
 * Generate a JSON Schema for configuration files.
 *
 * Provides IDE support with autocomplete and validation for config files.
 *
 * @returns JSON Schema object compatible with draft-07
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
