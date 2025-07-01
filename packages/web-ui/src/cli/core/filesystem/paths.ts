/**
 * Path generation utilities for installation
 */

import * as path from 'path'
import { existsSync } from 'fs'
import type { InstallConfig } from '../installation/types.js'

// ============================================================================
// SOURCE PATH GENERATION
// ============================================================================

/**
 * Pure function: Generate source paths for Trailhead UI files
 * Handles both development (src) and production (dist) environments
 */
export const generateSourcePaths = (trailheadRoot: string) => {
  // Check if we're in development (src exists) or production (only dist exists)
  const srcPath = path.join(trailheadRoot, 'src')
  const isDevEnvironment = existsSync(srcPath)

  // Use src for development, dist/src for production
  const basePath = isDevEnvironment ? 'src' : path.join('dist', 'src')
  const ext = isDevEnvironment ? '.ts' : '.js'
  const componentExt = isDevEnvironment ? '.tsx' : '.js'

  return {
    // Theme system files
    themeConfig: path.join(trailheadRoot, basePath, 'components', 'theme', `config${ext}`),
    themeBuilder: path.join(trailheadRoot, basePath, 'components', 'theme', `builder${ext}`),
    themeRegistry: path.join(trailheadRoot, basePath, 'components', 'theme', `registry${ext}`),
    themeUtils: path.join(trailheadRoot, basePath, 'components', 'theme', `utils${ext}`),
    themePresets: path.join(trailheadRoot, basePath, 'components', 'theme', `presets${ext}`),
    themeIndex: path.join(trailheadRoot, basePath, 'components', 'theme', `index${ext}`),
    themeProvider: path.join(trailheadRoot, basePath, 'components', 'theme', `theme-provider${componentExt}`),
    themeSwitcher: path.join(trailheadRoot, basePath, 'components', 'theme', `theme-switcher${componentExt}`),
    catalystTheme: path.join(trailheadRoot, basePath, 'components', 'theme', `catalyst-theme${ext}`),
    semanticTokens: path.join(trailheadRoot, basePath, 'components', 'theme', `semantic-tokens${ext}`),
    semanticEnhancements: path.join(trailheadRoot, basePath, 'components', 'theme', `semantic-enhancements${ext}`),

    // Utility files
    cnUtils: path.join(trailheadRoot, basePath, 'components', 'utils', `cn${ext}`),

    // Catalyst components directory
    catalystDir: path.join(trailheadRoot, basePath, 'components', 'lib'),

    // Component wrapper directory
    wrapperComponentsDir: path.join(trailheadRoot, basePath, 'components'),
    
    // Index files
    componentsIndex: path.join(trailheadRoot, basePath, 'components', `index${ext}`),
    libIndex: path.join(trailheadRoot, basePath, 'components', 'lib', `index${ext}`),
  }
}

// ============================================================================
// DESTINATION PATH GENERATION
// ============================================================================

/**
 * Pure function: Generate destination paths for installation
 */
export const generateDestinationPaths = (config: InstallConfig) => ({
  // Theme system destination (in destinationDir/theme/ - sibling of lib)
  themeDir: path.join(config.componentsDir, 'theme'),
  themeConfig: path.join(config.componentsDir, 'theme', 'config.ts'),
  themeBuilder: path.join(config.componentsDir, 'theme', 'builder.ts'),
  themeRegistry: path.join(config.componentsDir, 'theme', 'registry.ts'),
  themeUtils: path.join(config.componentsDir, 'theme', 'utils.ts'),
  themePresets: path.join(config.componentsDir, 'theme', 'presets.ts'),
  themeIndex: path.join(config.componentsDir, 'theme', 'index.ts'),
  catalystTheme: path.join(config.componentsDir, 'theme', 'catalyst-theme.ts'),
  semanticTokens: path.join(config.componentsDir, 'theme', 'semantic-tokens.ts'),
  semanticEnhancements: path.join(config.componentsDir, 'theme', 'semantic-enhancements.ts'),
  themeProvider: path.join(config.componentsDir, 'theme', 'theme-provider.tsx'),
  themeSwitcher: path.join(config.componentsDir, 'theme', 'theme-switcher.tsx'),

  // Utility files destination
  cnUtils: path.join(config.componentsDir, 'utils', 'cn.ts'),

  // Catalyst components destination (in destinationDir/lib/)
  catalystDir: path.join(config.componentsDir, 'lib'),

  // Component wrapper destination (in destinationDir/components/)
  wrapperComponentsDir: path.join(config.componentsDir),
  
  // Index files
  componentsIndex: path.join(config.componentsDir, 'index.ts'),
  libIndex: path.join(config.componentsDir, 'lib', 'index.ts'),
})

// ============================================================================
// PATH UTILITIES
// ============================================================================

/**
 * Get relative path from project root
 */
export const getRelativePath = (projectRoot: string, absolutePath: string): string => {
  return path.relative(projectRoot, absolutePath)
}

/**
 * Ensure path is within project bounds
 */
export const isPathWithinProject = (projectRoot: string, targetPath: string): boolean => {
  const relative = path.relative(projectRoot, targetPath)
  return !relative.startsWith('..') && !path.isAbsolute(relative)
}

/**
 * Get component name from file path
 */
export const getComponentName = (filePath: string): string => {
  return path.basename(filePath, path.extname(filePath))
}

/**
 * Create path mappings for TypeScript
 */
export const createPathMappings = (config: InstallConfig): Record<string, string[]> => {
  const componentsPath = getRelativePath(config.projectRoot, config.componentsDir)

  return {
    '@/components/*': [`./${componentsPath}/*`],
    '@/lib/*': [`./${componentsPath}/lib/*`],
    '@/theme/*': [`./${componentsPath}/theme/*`],
  }
}