/**
 * Template context creation utilities.
 *
 * @module templates/context
 */

import type { ProjectConfig } from '../config/types.js'
import type { TemplateContext } from './types.js'

/**
 * Create a complete template context for Handlebars processing.
 *
 * Transforms a ProjectConfig into the full set of variables needed by templates,
 * including computed values (e.g., packageName, currentYear) and feature flags.
 *
 * @param config - Project configuration from user input
 * @returns Complete TemplateContext with all variables for Handlebars templates
 */
export function createTemplateContext(config: ProjectConfig): TemplateContext {
  const isMonorepo = false // No monorepo templates in simplified CLI generator
  const hasTypeScript = true // All templates use TypeScript
  const _isAdvanced = config.features?.testing || config.features?.cicd

  return {
    projectName: config.projectName,
    packageName: sanitizePackageName(config.projectName),
    description: config.description || `CLI application built with @trailhead/cli`,
    author: config.author?.name || 'Your Name',
    email: config.author?.email || 'your.email@example.com',
    license: config.license || 'MIT',
    version: '0.1.0',
    packageManager: config.packageManager,
    currentYear: new Date().getFullYear(),
    features: {
      core: true,
      config: config.features?.config,
      validation: config.features?.validation,
      testing: config.features?.testing,
      examples: config.features?.testing, // Enable examples if testing is enabled
      cicd: config.features?.cicd,
    },

    // Template configuration
    CLI_VERSION: '0.1.0',
    PROJECT_NAME: config.projectName,
    IS_MONOREPO: isMonorepo,
    PACKAGE_MANAGER: config.packageManager,
    PACKAGES_DIR: 'packages',
    PACKAGES_PATTERN: '^packages/([^/]+)/',
    TEST_COMMAND: `${config.packageManager} test`,
    TIMEOUT: 120,
    FILE_PATTERNS: hasTypeScript ? 'ts,tsx,js,jsx,json,md' : 'js,jsx,json,md',

    HIGH_RISK_PATTERNS: [
      hasTypeScript ? '\\.(ts|tsx|js|jsx)$' : '\\.(js|jsx)$',
      'tsconfig',
      'package\\.json$',
      ...(isMonorepo ? ['turbo\\.json$'] : []),
      'vitest\\.config',
      'vite\\.config',
      'tsup\\.config',
      'lefthook\\.yml$',
    ],

    SKIP_PATTERNS: [
      '\\.md$',
      'README',
      'CHANGELOG',
      'LICENSE',
      '\\.github/',
      '\\.vscode/',
      '\\.gitignore$',
      '\\.prettierrc',
      '\\.prettierignore',
      'docs/',
      '\\.smart-test-config\\.json$',
    ],

    // Additional template variables
    HAS_SUBPATH_EXPORTS: false, // No subpath exports in simplified templates
    SUBPATH_EXPORTS: [], // No subpath exports needed

    PACKAGE_MAPPINGS: isMonorepo
      ? {
          cli: `@${config.projectName}/cli`,
          core: `@${config.projectName}/core`,
          utils: `@${config.projectName}/utils`,
        }
      : undefined,

    LINT_COMMAND: 'oxlint',
    TYPECHECK_COMMAND: hasTypeScript ? `${config.packageManager} types` : 'echo "No TypeScript"',
    SMART_TEST_COMMAND: './scripts/smart-test-runner.sh',

    SECRETS_PRIORITY: 5,
    FILESIZE_PRIORITY: 6,
    TESTS_PRIORITY: 7,

    CHANGESET_REMINDER: isMonorepo,
    CONVENTIONAL_COMMITS: true,
    LOCKFILE_VALIDATION: config.packageManager === 'pnpm',
  }
}

/**
 * Sanitize project name for use as package name
 */
function sanitizePackageName(projectName: string): string {
  return projectName
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-')
}
