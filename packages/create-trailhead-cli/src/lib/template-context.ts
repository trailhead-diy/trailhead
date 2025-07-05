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
 * Get git user name
 */
async function getGitUser(): Promise<string> {
  try {
    const { execa } = await import('execa');
    const { stdout } = await execa('git', ['config', '--global', 'user.name']);
    return stdout.trim();
  } catch {
    return 'Your Name';
  }
}

/**
 * Get git user email
 */
async function getGitEmail(): Promise<string> {
  try {
    const { execa } = await import('execa');
    const { stdout } = await execa('git', ['config', '--global', 'user.email']);
    return stdout.trim();
  } catch {
    return 'your.email@example.com';
  }
}
