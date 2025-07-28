import type { ProjectConfig } from '../config/types.js'
import type { TemplateContext } from './types.js'

/**
 * Create template context for Handlebars processing
 */
export async function createTemplateContext(config: ProjectConfig): Promise<TemplateContext> {
  const isMonorepo = false // No monorepo templates in simplified CLI generator
  const hasTypeScript = true // All templates use TypeScript
  const _isAdvanced = config.features?.testing || config.features?.docs || config.features?.cicd

  return {
    projectName: config.projectName,
    packageName: sanitizePackageName(config.projectName),
    description: `CLI application built with @esteban-url/* domain packages`,
    author: await getGitUser(),
    email: await getGitEmail(),
    license: 'MIT',
    version: '0.1.0',
    packageManager: config.packageManager,
    currentYear: new Date().getFullYear(),
    hasDocs: config.includeDocs,

    // Template configuration
    CLI_VERSION: '0.1.0',
    PROJECT_NAME: config.projectName,
    IS_MONOREPO: isMonorepo,
    PACKAGE_MANAGER: config.packageManager,
    PACKAGE_MANAGER_VERSION: '10.13.1',
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

    DOCS_VALIDATION: config.includeDocs,
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

/**
 * Get default user name
 */
async function getGitUser(): Promise<string> {
  return 'Your Name'
}

/**
 * Get default user email
 */
async function getGitEmail(): Promise<string> {
  return 'your.email@example.com'
}
