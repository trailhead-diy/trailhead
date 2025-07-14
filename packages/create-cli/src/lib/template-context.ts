// import { executeGitCommandSimple } from '@esteban-url/trailhead-cli/git';
import type { ProjectConfig, TemplateContext } from './types.js';

/**
 * Create template context for Handlebars processing
 */
export async function createTemplateContext(config: ProjectConfig): Promise<TemplateContext> {
  const isMonorepo = false; // No monorepo templates in simplified CLI generator
  const hasTypeScript = true; // All templates use TypeScript
  const isAdvanced = config.template === 'advanced';

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
    hasGit: config.initGit,
    hasDocs: config.includeDocs,
    isAdvanced,

    // Git hooks configuration
    CLI_VERSION: '0.1.0',
    PROJECT_NAME: config.projectName,
    IS_MONOREPO: isMonorepo,
    PACKAGE_MANAGER: config.packageManager,
    PACKAGE_MANAGER_VERSION: '10.12.4',
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
  };
}

/**
 * Sanitize project name for use as package name
 */
function sanitizePackageName(projectName: string): string {
  return projectName
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

/**
 * Get git user name with security validation
 */
async function getGitUser(): Promise<string> {
  const nameResult = { isOk: () => false, value: 'Your Name' }; // TODO: Implement git config

  if (!nameResult.isOk()) {
    return 'Your Name';
  }

  const name = nameResult.value.trim();
  if (!name) {
    return 'Your Name';
  }

  // Basic validation to ensure it's not empty or suspicious
  if (name.length > 100 || name.includes('\n') || name.includes('\0')) {
    console.warn('Invalid git user.name, using default');
    return 'Your Name';
  }

  return name;
}

/**
 * Get git user email with security validation
 */
async function getGitEmail(): Promise<string> {
  const emailResult = { isOk: () => false, value: 'your.email@example.com' }; // TODO: Implement git config

  if (!emailResult.isOk()) {
    return 'your.email@example.com';
  }

  const email = emailResult.value.trim();
  if (!email) {
    return 'your.email@example.com';
  }

  // Basic email validation
  if (!email.includes('@') || email.length > 254 || email.length < 3) {
    return 'your.email@example.com';
  }

  // Security validation to prevent dangerous characters
  if (email.includes('\n') || email.includes('\0') || email.includes(';') || email.includes('|')) {
    console.warn('Invalid git user.email, using default');
    return 'your.email@example.com';
  }

  return email;
}
