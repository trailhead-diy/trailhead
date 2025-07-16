/**
 * Path generation utilities for installation
 */

import * as path from 'node:path'
// Types removed with installation system

// ============================================================================
// SOURCE PATH GENERATION
// ============================================================================

/**
 * Pure function: Generate source paths for Trailhead UI files
 * Handles both development (src) and production (dist) environments
 */
export const generateSourcePaths = (trailheadRoot: string) => {
  // For path generation, assume development environment by default
  // The actual existence check happens during installation
  const isDevEnvironment = true

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
    themeProvider: path.join(
      trailheadRoot,
      basePath,
      'components',
      'theme',
      `theme-provider${componentExt}`
    ),
    themeSwitcher: path.join(
      trailheadRoot,
      basePath,
      'components',
      'theme',
      `theme-switcher${componentExt}`
    ),
    catalystTheme: path.join(
      trailheadRoot,
      basePath,
      'components',
      'theme',
      `catalyst-theme${ext}`
    ),
    semanticTokens: path.join(
      trailheadRoot,
      basePath,
      'components',
      'theme',
      `semantic-tokens${ext}`
    ),
    semanticEnhancements: path.join(
      trailheadRoot,
      basePath,
      'components',
      'theme',
      `semantic-enhancements${ext}`
    ),

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
// PATH UTILITIES
// ============================================================================

// Installation-related path functions removed with installation system
