import { z } from 'zod'
export const transformConfigSchema = z.object({
  enabled: z.boolean().default(true),
  srcDir: z.string().optional(),
  excludePatterns: z.array(z.string()).default([]),
  enabledTransforms: z.array(z.string()).optional(),
  disabledTransforms: z.array(z.string()).default([]),
})

export const installConfigSchema = z.object({
  destDir: z.string().optional(),
  wrappers: z.boolean().default(true),
})

export const devRefreshConfigSchema = z.object({
  srcDir: z.string().optional(),
  destDir: z.string().optional(),
  prefix: z.string().default('catalyst-'),
})

/**
 * Main configuration schema
 */
export const trailheadConfigSchema = z.object({
  $schema: z.string().optional(),
  install: installConfigSchema.optional(),
  transforms: transformConfigSchema.optional(),
  devRefresh: devRefreshConfigSchema.optional(),
  verbose: z.boolean().default(false),
  dryRun: z.boolean().default(false),
})

/**
 * Inferred types from schemas
 */
export type TransformConfig = z.infer<typeof transformConfigSchema>
export type InstallationConfig = z.infer<typeof installConfigSchema>
export type DevRefreshConfig = z.infer<typeof devRefreshConfigSchema>
export type TrailheadConfig = z.infer<typeof trailheadConfigSchema>

/**
 * Default configuration values
 */
export const defaultConfig: TrailheadConfig = {
  install: {
    wrappers: true,
  },
  transforms: {
    enabled: true,
    excludePatterns: [],
    disabledTransforms: [],
  },
  devRefresh: {
    prefix: 'catalyst-',
  },
  verbose: false,
  dryRun: false,
}
