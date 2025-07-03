/**
 * CLI context utilities
 */

import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync, existsSync } from 'fs'
import type { CLIContext } from './types.js'

// Import local config for sync loading (until @esteban-url/trailhead-cli supports sync)
import { loadConfigSync } from '../core/config/index.js'

/**
 * Pure function: Get package version from package.json
 */
export const getPackageVersion = (baseDir: string): string => {
  try {
    const packagePath = join(baseDir, '..', '..', 'package.json')
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'))
    return packageJson.version || '1.0.0'
  } catch {
    return '1.0.0'
  }
}

/**
 * Pure function: Check if current directory is a Trailhead UI project
 */
export const isTrailheadProject = (projectRoot: string): boolean => {
  try {
    const packageJsonPath = join(projectRoot, 'package.json')
    if (!existsSync(packageJsonPath)) return false

    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
    return !!(
      packageJson.dependencies?.['trailhead-ui'] || packageJson.devDependencies?.['trailhead-ui']
    )
  } catch {
    return false
  }
}

/**
 * Pure function: Create CLI context
 */
export const createCLIContext = (baseDir: string): CLIContext => {
  const projectRoot = process.cwd()

  // Load configuration
  const configResult = loadConfigSync(projectRoot)

  // Build context with optional config
  if (configResult.success) {
    return {
      version: getPackageVersion(baseDir),
      projectRoot,
      isTrailheadProject: isTrailheadProject(projectRoot),
      config: {
        loaded: true,
        filepath: configResult.value.filepath,
        data: configResult.value.config,
      },
    }
  }

  return {
    version: getPackageVersion(baseDir),
    projectRoot,
    isTrailheadProject: isTrailheadProject(projectRoot),
  }
}

/**
 * Pure function: Get script directory
 */
export const getScriptDir = (): string => {
  const __filename = fileURLToPath(import.meta.url)
  return dirname(__filename)
}

/**
 * Pure function: Get Trailhead UI package root
 * Resolves to the installed package location
 */
export const getTrailheadPackageRoot = (): string => {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)

  // Check if we're running from source or dist
  if (__dirname.includes('/dist/')) {
    // From dist/src/cli/utils/context.js, go up to package root
    return join(__dirname, '..', '..', '..', '..')
  } else {
    // From src/cli/utils/context.ts, go up to package root
    return join(__dirname, '..', '..', '..')
  }
}
