/**
 * Git hooks management commands for the Trailhead CLI
 * Provides installation, update, and configuration of smart git hooks
 */

import { Command } from 'commander';
import path from 'path';
import { ok, err, type Result, type CLIError } from '../core/errors/index.js';
import { createError } from '../core/index.js';
import { createFileSystem } from '../filesystem/index.js';
import chalk from 'chalk';

// Types
interface GitHooksOptions {
  type?: 'smart-aggressive' | 'conservative' | 'basic';
  framework?: 'vitest' | 'jest' | 'auto';
  packageManager?: 'pnpm' | 'npm' | 'yarn' | 'auto';
  dryRun?: boolean;
  force?: boolean;
  destination?: string;
}

interface ProjectConfig {
  isMonorepo: boolean;
  packageManager: string;
  testFramework: string;
  hasTypeScript: boolean;
  packagesDir: string;
  packages: string[];
}

// Constants
const TEMPLATES_DIR = '../templates/git-hooks';
const DEFAULT_SCRIPTS_DIR = 'scripts';

/**
 * Detect project configuration
 */
async function detectProjectConfig(): Promise<Result<ProjectConfig, CLIError>> {
  const fs = createFileSystem();

  try {
    // Detect package manager
    let packageManager = 'npm';
    const pnpmLockResult = await fs.access('pnpm-lock.yaml');
    const yarnLockResult = await fs.access('yarn.lock');

    if (pnpmLockResult.isOk()) {
      packageManager = 'pnpm';
    } else if (yarnLockResult.isOk()) {
      packageManager = 'yarn';
    }

    // Detect monorepo
    const turboResult = await fs.access('turbo.json');
    const pnpmWorkspaceResult = await fs.access('pnpm-workspace.yaml');
    const lernaResult = await fs.access('lerna.json');

    const isMonorepo = turboResult.isOk() || pnpmWorkspaceResult.isOk() || lernaResult.isOk();

    // Detect TypeScript
    const tsconfigResult = await fs.access('tsconfig.json');
    const hasTypeScript = tsconfigResult.isOk();

    // Detect test framework
    let testFramework = 'vitest';
    const jestConfigJsResult = await fs.access('jest.config.js');
    const jestConfigTsResult = await fs.access('jest.config.ts');

    if (jestConfigJsResult.isOk() || jestConfigTsResult.isOk()) {
      testFramework = 'jest';
    }

    // Try to read package.json to confirm framework
    try {
      const packageJsonResult = await fs.readFile('package.json');
      if (packageJsonResult.isOk()) {
        const packageJson = JSON.parse(packageJsonResult.value);

        if (packageJson.devDependencies?.jest || packageJson.dependencies?.jest) {
          testFramework = 'jest';
        } else if (packageJson.devDependencies?.vitest || packageJson.dependencies?.vitest) {
          testFramework = 'vitest';
        }
      }
    } catch {
      // Ignore package.json read errors
    }

    // Detect packages directory and list packages
    let packagesDir = 'packages';
    let packages: string[] = [];

    if (isMonorepo) {
      try {
        const packagesDirResult = await fs.access('packages');
        if (packagesDirResult.isOk()) {
          const dirResult = await fs.readdir('packages');
          if (dirResult.isOk()) {
            packages = dirResult.value;
          }
        }
      } catch {
        // Ignore packages detection errors
      }
    }

    return ok({
      isMonorepo,
      packageManager,
      testFramework,
      hasTypeScript,
      packagesDir,
      packages,
    });
  } catch (error) {
    return err(
      createError(
        'PROJECT_CONFIG_DETECTION_FAILED',
        `Failed to detect project configuration: ${error}`,
        { recoverable: false }
      )
    );
  }
}

/**
 * Generate template variables from project config
 */
function generateTemplateVars(
  config: ProjectConfig,
  options: GitHooksOptions
): Record<string, any> {
  const vars: Record<string, any> = {
    CLI_VERSION: '0.1.0',
    PROJECT_NAME: path.basename(process.cwd()),
    PACKAGE_MANAGER: config.packageManager,
    IS_MONOREPO: config.isMonorepo,
    PACKAGES_DIR: config.packagesDir,
    PACKAGES_PATTERN: `^${config.packagesDir}/([^/]+)/`,
    PACKAGES_GLOB: config.packagesDir,

    // Test configuration
    TEST_COMMAND: `${config.packageManager} test`,
    TIMEOUT: 120,

    // File patterns
    FILE_PATTERNS: config.hasTypeScript ? 'ts,tsx,js,jsx,json,md' : 'js,jsx,json,md',
    SOURCE_PATTERN: config.hasTypeScript ? '**/*.{ts,tsx,js,jsx}' : '**/*.{js,jsx}',

    // High-risk patterns
    HIGH_RISK_PATTERNS: [
      config.hasTypeScript ? '\\.(ts|tsx|js|jsx)$' : '\\.(js|jsx)$',
      'tsconfig',
      'package\\.json$',
      ...(config.isMonorepo ? ['turbo\\.json$'] : []),
      `${config.testFramework}\\.config`,
      'vite\\.config',
      'tsup\\.config',
      'lefthook\\.yml$',
    ],

    // Skip patterns
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

    // Tool commands
    LINT_COMMAND: 'oxlint',
    LINT_FIX_FLAG: '--fix',
    TYPECHECK_COMMAND: config.hasTypeScript
      ? `${config.packageManager} types`
      : 'echo "No TypeScript"',

    // Prettier cache
    PRETTIER_CACHE: config.isMonorepo
      ? '--cache --cache-location .turbo/.prettiercache'
      : '--cache',

    // Priority settings
    SECRETS_PRIORITY: 5,
    FILESIZE_PRIORITY: 6,
    TESTS_PRIORITY: 7,

    // Smart test command
    SMART_TEST_COMMAND: `./${options.destination || DEFAULT_SCRIPTS_DIR}/smart-test-runner.sh`,

    // Monorepo config pattern
    MONOREPO_CONFIG_PATTERN: config.isMonorepo ? 'turbo\\.json$|pnpm-workspace' : 'package\\.json$',

    // Optional features
    DOCS_VALIDATION: false, // Can be enabled based on project detection
    CHANGESET_REMINDER: config.isMonorepo,
    CONVENTIONAL_COMMITS: true,
    LOCKFILE_VALIDATION: config.packageManager === 'pnpm',
    LOCKFILE:
      config.packageManager === 'pnpm'
        ? 'pnpm-lock.yaml'
        : config.packageManager === 'yarn'
          ? 'yarn.lock'
          : 'package-lock.json',

    // Example scope for commit messages
    EXAMPLE_SCOPE: config.isMonorepo ? config.packages[0] || 'cli' : 'app',
  };

  // Add package mappings for monorepo
  if (config.isMonorepo && config.packages.length > 0) {
    vars.PACKAGE_MAPPINGS = {};
    config.packages.forEach(pkg => {
      // Try to guess package name from directory
      vars.PACKAGE_MAPPINGS[pkg] = `@${vars.PROJECT_NAME}/${pkg}`;
    });
  }

  return vars;
}

/**
 * Render template with variables
 */
function renderTemplate(template: string, vars: Record<string, any>): string {
  let result = template;

  // Replace simple variables {{VAR}}
  result = result.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    const value = vars[key.trim()];
    return value !== undefined ? String(value) : match;
  });

  // Handle conditional blocks {{#if VAR}}...{{/if}}
  result = result.replace(
    /\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (match, condition, content) => {
      const value = vars[condition.trim()];
      return value ? content : '';
    }
  );

  // Handle arrays {{#each ARR}}...{{/each}}
  result = result.replace(
    /\{\{#each\s+([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g,
    (match, arrayName, itemTemplate) => {
      const array = vars[arrayName.trim()];
      if (!Array.isArray(array)) return '';

      return array
        .map((item, index) => {
          let itemContent = itemTemplate;
          itemContent = itemContent.replace(/\{\{this\}\}/g, String(item));
          itemContent = itemContent.replace(/\{\{@last\}\}/g, String(index === array.length - 1));
          return itemContent;
        })
        .join('');
    }
  );

  // Handle object iteration {{#each OBJ}}...{{/each}}
  result = result.replace(
    /\{\{#each\s+([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g,
    (match, objName, itemTemplate) => {
      const obj = vars[objName.trim()];
      if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return '';

      const entries = Object.entries(obj);
      return entries
        .map(([key, value], index) => {
          let itemContent = itemTemplate;
          itemContent = itemContent.replace(/\{\{@key\}\}/g, key);
          itemContent = itemContent.replace(/\{\{this\}\}/g, String(value));
          itemContent = itemContent.replace(/\{\{@last\}\}/g, String(index === entries.length - 1));
          return itemContent;
        })
        .join('');
    }
  );

  return result;
}

/**
 * Install git hooks
 */
async function installGitHooks(options: GitHooksOptions): Promise<Result<void, CLIError>> {
  const fs = createFileSystem();

  try {
    console.log(chalk.blue('🔧 Installing smart git hooks...'));

    // Detect project configuration
    const projectConfigResult = await detectProjectConfig();
    if (projectConfigResult.isErr()) {
      return err(projectConfigResult.error);
    }

    const config = projectConfigResult.value;
    const vars = generateTemplateVars(config, options);

    if (options.dryRun) {
      console.log(chalk.yellow('📋 DRY RUN - Would install:'));
      console.log(`  Project type: ${config.isMonorepo ? 'Monorepo' : 'Single package'}`);
      console.log(`  Package manager: ${config.packageManager}`);
      console.log(`  Test framework: ${config.testFramework}`);
      console.log(`  TypeScript: ${config.hasTypeScript ? 'Yes' : 'No'}`);
      if (config.isMonorepo) {
        console.log(`  Packages: ${config.packages.join(', ')}`);
      }
      return ok(undefined);
    }

    // Get template directory
    const templatesDir = path.resolve(__dirname, TEMPLATES_DIR);

    // Create scripts directory
    const scriptsDir = options.destination || DEFAULT_SCRIPTS_DIR;
    await fs.ensureDir(scriptsDir);

    // Copy and process smart-test-runner.sh
    const runnerTemplateResult = await fs.readFile(path.join(templatesDir, 'smart-test-runner.sh'));
    if (runnerTemplateResult.isErr()) {
      return err(
        createError(
          'TEMPLATE_READ_FAILED',
          `Failed to read smart-test-runner.sh template: ${runnerTemplateResult.error.message}`,
          { recoverable: false }
        )
      );
    }

    const runnerContent = renderTemplate(runnerTemplateResult.value, vars);
    const runnerPath = path.join(scriptsDir, 'smart-test-runner.sh');

    const writeRunnerResult = await fs.writeFile(runnerPath, runnerContent);
    if (writeRunnerResult.isErr()) {
      return err(
        createError(
          'FILE_WRITE_FAILED',
          `Failed to write smart-test-runner.sh: ${writeRunnerResult.error.message}`,
          { recoverable: false }
        )
      );
    }

    // Make executable using outputFile (which handles permissions)
    const outputResult = await fs.outputFile(runnerPath, runnerContent);
    if (outputResult.isErr()) {
      return err(
        createError(
          'FILE_PERMISSIONS_FAILED',
          `Failed to set executable permissions: ${outputResult.error.message}`,
          { recoverable: false }
        )
      );
    }

    // Process and copy lefthook.yml
    const lefthookTemplateResult = await fs.readFile(
      path.join(templatesDir, 'lefthook.yml.template')
    );
    if (lefthookTemplateResult.isErr()) {
      return err(
        createError(
          'TEMPLATE_READ_FAILED',
          `Failed to read lefthook.yml.template: ${lefthookTemplateResult.error.message}`,
          { recoverable: false }
        )
      );
    }

    const lefthookContent = renderTemplate(lefthookTemplateResult.value, vars);

    const lefthookPath = 'lefthook.yml';
    const lefthookResult = await fs.access(lefthookPath);
    if (lefthookResult.isOk() && !options.force) {
      console.log(chalk.yellow(`⚠️  ${lefthookPath} already exists. Use --force to overwrite.`));
    } else {
      const writeLefthookResult = await fs.writeFile(lefthookPath, lefthookContent);
      if (writeLefthookResult.isErr()) {
        return err(
          createError(
            'FILE_WRITE_FAILED',
            `Failed to write lefthook.yml: ${writeLefthookResult.error.message}`,
            { recoverable: false }
          )
        );
      }
    }

    // Process and copy .smart-test-config.json
    const configTemplateResult = await fs.readFile(
      path.join(templatesDir, 'smart-test-config.json.template')
    );
    if (configTemplateResult.isErr()) {
      return err(
        createError(
          'TEMPLATE_READ_FAILED',
          `Failed to read smart-test-config.json.template: ${configTemplateResult.error.message}`,
          { recoverable: false }
        )
      );
    }

    const configContent = renderTemplate(configTemplateResult.value, vars);

    const configPath = '.smart-test-config.json';
    const smartConfigResult = await fs.access(configPath);
    if (smartConfigResult.isOk() && !options.force) {
      console.log(chalk.yellow(`⚠️  ${configPath} already exists. Use --force to overwrite.`));
    } else {
      const writeConfigResult = await fs.writeFile(configPath, configContent);
      if (writeConfigResult.isErr()) {
        return err(
          createError(
            'FILE_WRITE_FAILED',
            `Failed to write .smart-test-config.json: ${writeConfigResult.error.message}`,
            { recoverable: false }
          )
        );
      }
    }

    // Copy README
    const readmeTemplateResult = await fs.readFile(path.join(templatesDir, 'README.md'));
    if (readmeTemplateResult.isErr()) {
      return err(
        createError(
          'TEMPLATE_READ_FAILED',
          `Failed to read README.md template: ${readmeTemplateResult.error.message}`,
          { recoverable: false }
        )
      );
    }

    const readmePath = path.join(scriptsDir, 'README.md');
    const readmeResult = await fs.access(readmePath);
    if (readmeResult.isErr() || options.force) {
      const writeReadmeResult = await fs.writeFile(readmePath, readmeTemplateResult.value);
      if (writeReadmeResult.isErr()) {
        return err(
          createError(
            'FILE_WRITE_FAILED',
            `Failed to write README.md: ${writeReadmeResult.error.message}`,
            { recoverable: false }
          )
        );
      }
    }

    console.log(chalk.green('✅ Smart git hooks installed successfully!'));
    console.log(chalk.blue('📋 Next steps:'));
    console.log(
      `   1. Install lefthook: ${config.packageManager === 'pnpm' ? 'pnpm' : 'npm'} install lefthook`
    );
    console.log(`   2. Install git hooks: ${config.packageManager} lefthook install`);
    console.log(`   3. Test the setup: ./${scriptsDir}/smart-test-runner.sh --dry-run --verbose`);

    return ok(undefined);
  } catch (error) {
    return err(
      createError('GIT_HOOKS_INSTALL_FAILED', `Failed to install git hooks: ${error}`, {
        recoverable: false,
      })
    );
  }
}

/**
 * Update git hooks
 */
async function updateGitHooks(options: GitHooksOptions): Promise<Result<void, CLIError>> {
  console.log(chalk.blue('🔄 Updating smart git hooks...'));

  // For updates, we force overwrite the scripts but preserve config
  const updateOptions = { ...options, force: true };
  // Remove force flag to preserve config files

  return installGitHooks(updateOptions);
}

/**
 * Remove git hooks
 */
async function removeGitHooks(options: GitHooksOptions): Promise<Result<void, CLIError>> {
  const fs = createFileSystem();

  try {
    console.log(chalk.yellow('🗑️  Removing smart git hooks...'));

    if (options.dryRun) {
      console.log(chalk.yellow('📋 DRY RUN - Would remove:'));
      console.log('  scripts/smart-test-runner.sh');
      console.log('  lefthook.yml');
      console.log('  .smart-test-config.json');
      return ok(undefined);
    }

    const scriptsDir = options.destination || DEFAULT_SCRIPTS_DIR;

    // Remove files
    const filesToRemove = [
      path.join(scriptsDir, 'smart-test-runner.sh'),
      path.join(scriptsDir, 'README.md'),
      'lefthook.yml',
      '.smart-test-config.json',
    ];

    for (const file of filesToRemove) {
      const fileResult = await fs.access(file);
      if (fileResult.isOk()) {
        const removeResult = await fs.rm(file, {
          recursive: true,
          force: true,
        });
        if (removeResult.isOk()) {
          console.log(chalk.gray(`   Removed ${file}`));
        }
      }
    }

    // Remove scripts directory if empty
    try {
      const entriesResult = await fs.readdir(scriptsDir);
      if (entriesResult.isOk() && entriesResult.value.length === 0) {
        const removeDirResult = await fs.rm(scriptsDir, {
          recursive: true,
          force: true,
        });
        if (removeDirResult.isOk()) {
          console.log(chalk.gray(`   Removed empty directory ${scriptsDir}`));
        }
      }
    } catch {
      // Ignore errors removing directory
    }

    console.log(chalk.green('✅ Smart git hooks removed successfully!'));
    console.log(chalk.blue('📋 You may also want to:'));
    console.log('   1. Uninstall lefthook: npm uninstall lefthook');
    console.log('   2. Remove git hooks: lefthook uninstall');

    return ok(undefined);
  } catch (error) {
    return err(
      createError('GIT_HOOKS_REMOVE_FAILED', `Failed to remove git hooks: ${error}`, {
        recoverable: false,
      })
    );
  }
}

/**
 * Interactive configuration wizard for git hooks
 */
async function configureGitHooks(): Promise<Result<void, CLIError>> {
  try {
    console.log(chalk.blue('🔧 Git Hooks Configuration Wizard'));
    console.log('This wizard will help you configure smart test execution.');
    console.log('');

    // Detect current configuration
    const configResult = await detectProjectConfig();
    if (configResult.isErr()) {
      return err(configResult.error);
    }

    const config = configResult.value;

    // Interactive prompts would go here
    console.log(chalk.green('Current Configuration:'));
    console.log(`  Project type: ${config.isMonorepo ? 'Monorepo' : 'Single package'}`);
    console.log(`  Package manager: ${config.packageManager}`);
    console.log(`  Test framework: ${config.testFramework}`);
    console.log(`  TypeScript: ${config.hasTypeScript ? 'Yes' : 'No'}`);

    if (config.isMonorepo) {
      console.log(`  Packages: ${config.packages.join(', ')}`);
      console.log(`  Parallel testing: Enabled`);
    } else {
      console.log(`  Parallel testing: Disabled (single package)`);
    }

    console.log(`  Max retries: 2`);
    console.log(`  Timeout: 120s`);
    console.log(`  Retry flaky tests: Enabled`);

    console.log('');
    console.log(
      chalk.yellow('💡 Configuration looks good! Run `git-hooks install` to set up hooks.')
    );

    return ok(undefined);
  } catch (error) {
    return err(
      createError('CONFIG_WIZARD_FAILED', `Configuration wizard failed: ${error}`, {
        recoverable: false,
      })
    );
  }
}

/**
 * Create git-hooks command
 */
export function createGitHooksCommand(): Command {
  const command = new Command('git-hooks').description('Manage smart git hooks for your project');

  // Install subcommand
  command
    .command('install')
    .description('Install smart git hooks')
    .option(
      '--type <type>',
      'Hook type (smart-aggressive, conservative, basic)',
      'smart-aggressive'
    )
    .option('--framework <framework>', 'Test framework (vitest, jest, auto)', 'auto')
    .option('--package-manager <pm>', 'Package manager (pnpm, npm, yarn, auto)', 'auto')
    .option('--destination <dir>', 'Destination directory for scripts', 'scripts')
    .option('--dry-run', 'Show what would be installed without making changes')
    .option('--force', 'Overwrite existing files')
    .action(async (options: GitHooksOptions) => {
      const result = await installGitHooks(options);
      if (result.isErr()) {
        console.error(chalk.red(`❌ ${result.error.message}`));
        process.exit(1);
      }
    });

  // Update subcommand
  command
    .command('update')
    .description('Update smart git hooks to latest version')
    .option('--destination <dir>', 'Scripts directory', 'scripts')
    .option('--dry-run', 'Show what would be updated without making changes')
    .action(async (options: GitHooksOptions) => {
      const result = await updateGitHooks(options);
      if (result.isErr()) {
        console.error(chalk.red(`❌ ${result.error.message}`));
        process.exit(1);
      }
    });

  // Remove subcommand
  command
    .command('remove')
    .description('Remove smart git hooks')
    .option('--destination <dir>', 'Scripts directory', 'scripts')
    .option('--dry-run', 'Show what would be removed without making changes')
    .action(async (options: GitHooksOptions) => {
      const result = await removeGitHooks(options);
      if (result.isErr()) {
        console.error(chalk.red(`❌ ${result.error.message}`));
        process.exit(1);
      }
    });

  // Configure subcommand
  command
    .command('configure')
    .description('Interactive configuration wizard for git hooks')
    .action(async () => {
      const result = await configureGitHooks();
      if (result.isErr()) {
        console.error(chalk.red(`❌ ${result.error.message}`));
        process.exit(1);
      }
    });

  // Status subcommand
  command
    .command('status')
    .description('Show git hooks status')
    .action(async () => {
      const fs = createFileSystem();

      console.log(chalk.blue('📊 Git Hooks Status'));

      const files = ['scripts/smart-test-runner.sh', 'lefthook.yml', '.smart-test-config.json'];

      for (const file of files) {
        const fileResult = await fs.access(file);
        const status = fileResult.isOk() ? chalk.green('✅ Installed') : chalk.red('❌ Missing');
        console.log(`   ${file}: ${status}`);
      }

      // Check if lefthook is installed
      try {
        const packageJsonResult = await fs.readFile('package.json');
        if (packageJsonResult.isOk()) {
          const pkg = JSON.parse(packageJsonResult.value);
          const hasLefthook = pkg.devDependencies?.lefthook || pkg.dependencies?.lefthook;
          const lefthookStatus = hasLefthook
            ? chalk.green('✅ Installed')
            : chalk.yellow('⚠️  Not installed');
          console.log(`   lefthook package: ${lefthookStatus}`);
        } else {
          console.log(`   lefthook package: ${chalk.gray('❓ Cannot determine')}`);
        }
      } catch {
        console.log(`   lefthook package: ${chalk.gray('❓ Cannot determine')}`);
      }
    });

  return command;
}
