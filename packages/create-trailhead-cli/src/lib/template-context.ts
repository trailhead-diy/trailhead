import { validateGitConfigValue, sanitizeText } from './security.js';
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
  try {
    const { execa } = await import('execa');
    const { stdout } = await execa('git', ['config', '--global', 'user.name'], {
      stdio: 'pipe',
      shell: false,
      timeout: 5000, // 5 second timeout
    });

    // Validate git output to prevent injection
    const validation = validateGitConfigValue(stdout.trim());
    if (!validation.success) {
      console.warn('Invalid git user.name, using default');
      return 'Your Name';
    }

    return validation.value;
  } catch (error) {
    // Don't expose error details for security
    return 'Your Name';
  }
}

/**
 * Get git user email with security validation
 */
async function getGitEmail(): Promise<string> {
  try {
    const { execa } = await import('execa');
    const { stdout } = await execa(
      'git',
      ['config', '--global', 'user.email'],
      {
        stdio: 'pipe',
        shell: false,
        timeout: 5000, // 5 second timeout
      },
    );

    // Validate git output to prevent injection
    const validation = validateGitConfigValue(stdout.trim());
    if (!validation.success) {
      console.warn('Invalid git user.email, using default');
      return 'your.email@example.com';
    }

    // Basic email validation
    const email = validation.value;
    if (!email.includes('@') || email.length > 254) {
      return 'your.email@example.com';
    }

    return email;
  } catch (error) {
    // Don't expose error details for security
    return 'your.email@example.com';
  }
}
