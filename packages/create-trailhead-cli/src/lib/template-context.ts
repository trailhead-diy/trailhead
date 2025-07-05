import { sanitizeText } from './security.js';
import { executeGitCommandSimple } from '@esteban-url/trailhead-cli/git';
import type { ProjectConfig, TemplateContext } from './types.js';

/**
 * Create template context for Handlebars processing
 */
export async function createTemplateContext(
  config: ProjectConfig,
): Promise<TemplateContext> {
  return {
    projectName: config.projectName,
    packageName: sanitizePackageName(config.projectName),
    description: `CLI application built with @esteban-url/trailhead-cli`,
    author: await getGitUser(),
    email: await getGitEmail(),
    license: 'MIT',
    version: '0.1.0',
    packageManager: config.packageManager,
    currentYear: new Date().getFullYear(),
    hasGit: config.initGit,
    hasDocs: config.includeDocs,
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
  const nameResult = await executeGitCommandSimple(
    ['config', '--global', 'user.name'],
    { timeout: 5000 },
  );

  if (!nameResult.success) {
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
  const emailResult = await executeGitCommandSimple(
    ['config', '--global', 'user.email'],
    { timeout: 5000 },
  );

  if (!emailResult.success) {
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
  if (
    email.includes('\n') ||
    email.includes('\0') ||
    email.includes(';') ||
    email.includes('|')
  ) {
    console.warn('Invalid git user.email, using default');
    return 'your.email@example.com';
  }

  return email;
}
