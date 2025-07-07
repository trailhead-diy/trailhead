import { Ok as CliOk, Err as CliErr, type Result } from '@esteban-url/trailhead-cli';
import { createCommand, type CommandContext } from '@esteban-url/trailhead-cli/command';
import {
  createValidationPipeline,
  createRule,
  ValidationOk,
  ValidationErr,
  type ValidationResult,
} from '@esteban-url/trailhead-cli/core';
import { createNodeFileSystem } from '@esteban-url/trailhead-cli/filesystem';
import { runInstallationPrompts } from '../prompts/installation.js';
import { loadConfigSync, logConfigDiscovery } from '../config.js';
import {
  performInstallation,
  performDryRunInstallation,
  type InstallOptions as CoreInstallOptions,
} from '../core/installation/index.js';
import { resolveConfiguration } from '../core/installation/config.js';
import { detectFramework } from '../core/installation/framework-detection.js';
import { getTrailheadPackageRoot } from '../utils/context.js';
import { createError } from '@esteban-url/trailhead-cli/core';
import {
  type StrictInstallOptions,
  isValidFramework,
  isValidDependencyStrategy,
} from '../core/types/command-options.js';

// Use strict typing for better type safety
type InstallOptions = StrictInstallOptions;

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Create validation pipeline for install options using framework validation
 */
const createInstallValidation = () => {
  return createValidationPipeline<InstallOptions>()
    .add(
      createRule<InstallOptions>(
        'framework',
        'Framework must be valid if specified',
        (value: unknown) => {
          const options = value as InstallOptions;

          // Only validate if framework is explicitly provided
          if (options.framework) {
            if (!isValidFramework(options.framework)) {
              return ValidationErr(
                `Invalid framework. Must be one of: nextjs, vite, redwood-sdk, generic-react`,
                'framework'
              );
            }
          }

          // Validate dependency strategy if provided
          if (options.dependencyStrategy) {
            if (!isValidDependencyStrategy(options.dependencyStrategy)) {
              return ValidationErr(
                `Invalid dependency strategy. Must be one of: auto, smart, selective, manual, skip, force`,
                'dependencyStrategy'
              );
            }
          }

          return ValidationOk(options);
        },
        false // Not required, but validated when provided
      )
    )
    .add(
      createRule<InstallOptions>(
        'dest',
        'Destination directory must be valid',
        (value: unknown) => {
          const options = value as InstallOptions;
          if (!options.dest) return ValidationOk(options);

          if (typeof options.dest !== 'string' || options.dest.trim().length === 0) {
            return ValidationErr('Destination directory must be a non-empty string', 'dest');
          }

          return ValidationOk(options);
        },
        false
      )
    )
    .add(
      createRule<InstallOptions>(
        'catalystDir',
        'Catalyst directory must be valid',
        (value: unknown) => {
          const options = value as InstallOptions;
          if (!options.catalystDir) return ValidationOk(options);

          if (typeof options.catalystDir !== 'string' || options.catalystDir.trim().length === 0) {
            return ValidationErr('Catalyst directory must be a non-empty string', 'catalystDir');
          }

          return ValidationOk(options);
        },
        false
      )
    )
    .add(
      createRule<InstallOptions>(
        'dependencyStrategy',
        'Dependency strategy must be valid',
        (value: unknown) => {
          const options = value as InstallOptions;
          if (!options.dependencyStrategy) return ValidationOk(options);

          const validStrategies = ['auto', 'smart', 'selective', 'manual', 'skip', 'force'];
          if (!validStrategies.includes(options.dependencyStrategy)) {
            return ValidationErr(
              `Invalid dependency strategy. Must be one of: ${validStrategies.join(', ')}`,
              'dependencyStrategy'
            );
          }

          return ValidationOk(options);
        },
        false
      )
    );
};

// ============================================================================
// INSTALLATION WORKFLOW
// ============================================================================

/**
 * Execute installation workflow using core modules
 */
async function executeInstallation(
  options: InstallOptions,
  context: CommandContext,
  finalOptions?: InstallOptions
): Promise<Result<void>> {
  // Create dependencies
  const nodeFS = createNodeFileSystem();
  const fs = nodeFS; // Use CLI package filesystem directly
  const logger = context.logger;

  try {
    // Load simplified config system
    const configResult = loadConfigSync(context.projectRoot);
    const loadedConfig = configResult.config;
    const configPath = configResult.filepath;

    // Always show when config is found
    if (configPath) {
      logger.info(`Configuration loaded from: ${configPath}`);
    }

    // Log detailed config in verbose mode (check both CLI option and config setting)
    if (options.verbose || loadedConfig.verbose) {
      logConfigDiscovery(configPath, loadedConfig, true, configResult.source);
    }

    // Step 1: Resolve configuration
    logger.step('Resolving configuration...');

    // Merge configuration: CLI options > config file > defaults
    const installConfig = loadedConfig?.install;
    const destinationDir = options.dest || installConfig?.destDir;

    const resolveResult = await resolveConfiguration(
      fs,
      logger,
      {
        catalystDir: options.catalystDir,
        destinationDir: destinationDir,
        verbose: options.verbose,
      },
      context.projectRoot
    );

    if (!resolveResult.success) {
      return resolveResult;
    }

    const config = resolveResult.value;

    // Step 2: Detect framework
    logger.step('Detecting framework...');
    const frameworkResult = await detectFramework(
      fs,
      config.projectRoot,
      options.framework as any // Cast since we've validated it
    );

    if (!frameworkResult.success) {
      return frameworkResult;
    }

    const framework = frameworkResult.value;
    logger.success(`Detected ${framework.framework.name}`);

    // Step 3: Perform installation or dry run
    if (options.dryRun) {
      const dryRunResult = await performDryRunInstallation(
        fs,
        logger,
        config,
        getTrailheadPackageRoot(),
        framework.framework.type,
        options.wrappers ?? true
      );

      if (!dryRunResult.success) {
        return dryRunResult;
      }

      logger.info('\nDry run complete. No files were installed.');
      return CliOk(undefined);
    }

    // Build installation options
    const effectiveOptions = finalOptions || options;
    const coreOptions: CoreInstallOptions = {
      interactive: effectiveOptions.interactive,
      skipDependencyPrompts: false,
      dependencyStrategy: effectiveOptions.dependencyStrategy as any,
    };

    const installResult = await performInstallation(
      fs,
      logger,
      config,
      getTrailheadPackageRoot(),
      options.force ?? false,
      framework.framework.type,
      options.wrappers ?? true,
      coreOptions
    );

    if (!installResult.success) {
      return installResult;
    }

    const summary = installResult.value;

    // Step 4: Display summary
    displayInstallationSummary(logger, {
      framework: framework.framework.name,
      filesInstalled: summary.filesInstalled.length,
      themes: ['red', 'rose', 'orange', 'yellow', 'green', 'blue', 'violet', 'catalyst'],
    });

    return CliOk(undefined);
  } catch (error) {
    return CliErr({
      code: 'INSTALL_ERROR',
      message: error instanceof Error ? error.message : 'Installation failed',
      recoverable: false,
      cause: error,
    });
  }
}

// ============================================================================
// DISPLAY FUNCTIONS
// ============================================================================

/**
 * Display installation summary
 */
function displayInstallationSummary(
  logger: import('@esteban-url/trailhead-cli/core').Logger,
  summary: {
    framework: string;
    filesInstalled: number;
    themes: string[];
  }
): void {
  logger.info('');
  logger.success('✅ Trailhead UI installed successfully!');
  logger.info('');

  logger.info('📦 Installed:');
  logger.info(`   • ${summary.filesInstalled} files`);
  logger.info(`   • ${summary.themes.length} themes available`);
  logger.info('');

  logger.info('🚀 Next Steps:');
  const steps = getFrameworkSteps(summary.framework);
  steps.forEach((step, index) => {
    logger.info(`   ${index + 1}. ${step}`);
  });
  logger.info('');

  logger.info('📚 Docs: https://github.com/esteban-url/trailhead-ui#readme');
}

/**
 * Get framework-specific next steps
 */
function getFrameworkSteps(framework: string): string[] {
  switch (framework) {
    case 'RedwoodJS':
      return [
        'Add ThemeProvider to web/src/App.tsx',
        "Import components: import { Button } from '@/components/th/button'",
        'Run: yarn rw dev',
      ];
    case 'Next.js':
      return [
        'Add ThemeProvider to app/layout.tsx or pages/_app.tsx',
        "Import components: import { Button } from '@/components/th/button'",
        'Run: npm run dev',
      ];
    case 'Vite':
      return [
        'Add ThemeProvider to src/main.tsx',
        "Import components: import { Button } from '@/components/th/button'",
        'Run: npm run dev',
      ];
    default:
      return [
        'Wrap your app with ThemeProvider',
        "Import components: import { Button } from '@/components/th/button'",
        'Start your development server',
      ];
  }
}

// ============================================================================
// COMMAND HANDLER
// ============================================================================

/**
 * Handle install command execution
 */
async function handleInstall(
  options: InstallOptions,
  context: CommandContext
): Promise<Result<void>> {
  // Validate options
  const validation = createInstallValidation();
  const validationResult = validation.validateSync(options);

  if (validationResult.overall === 'fail') {
    context.logger.error('❌ Invalid options:');
    // Simple error display until formatValidationSummary is available
    validationResult.failed.forEach((result: ValidationResult) => {
      context.logger.error(`  • ${result.message}`);
    });
    return CliErr(createError('VALIDATION_ERROR', 'Invalid installation options'));
  }

  // Show warnings if any
  if (validationResult.overall === 'warning') {
    validationResult.warnings.forEach((result: ValidationResult) => {
      context.logger.info(`⚠ ${result.message}`);
    });
  }

  // Run interactive prompts if needed
  let finalOptions = options;
  if (options.interactive || (!options.framework && !options.dryRun)) {
    context.logger.info('🚀 Interactive Installation Mode\n');
    const promptResults = await runInstallationPrompts();

    // Merge with CLI options (only override if explicitly provided)
    finalOptions = {
      ...promptResults,
      // Only include CLI options that were explicitly set
      ...(options.dest ? { dest: options.dest } : {}),
      ...(options.framework ? { framework: options.framework } : {}),
      ...(options.catalystDir ? { catalystDir: options.catalystDir } : {}),
      ...(options.force !== undefined ? { force: options.force } : {}),
      ...(options.dryRun !== undefined ? { dryRun: options.dryRun } : {}),
      ...(options.noConfig !== undefined ? { noConfig: options.noConfig } : {}),
      ...(options.overwrite !== undefined ? { overwrite: options.overwrite } : {}),
      ...(options.interactive !== undefined ? { interactive: options.interactive } : {}),
      ...(options.verbose !== undefined ? { verbose: options.verbose } : {}),
      ...(options.wrappers !== undefined ? { wrappers: options.wrappers } : {}),
    };
  }

  // Execute installation
  const result = await executeInstallation(finalOptions, context, finalOptions);

  if (!result.success) {
    context.logger.error('❌ Installation failed:');
    context.logger.error(result.error.message);
    if (options.verbose && result.error.details) {
      context.logger.error('Details:' + result.error.details);
    }
    return result;
  }

  return CliOk(undefined);
}

// ============================================================================
// COMMAND CREATION
// ============================================================================

/**
 * Create refactored install command
 */
export const createInstallCommand = () => {
  return createCommand<InstallOptions>({
    name: 'install',
    description: 'Install and configure Trailhead UI components with enhanced theming',

    options: [
      {
        flags: '--catalyst-dir <path>',
        description: 'path to catalyst-ui-kit directory',
      },
      {
        flags: '-d, --dest <path>',
        description: 'destination directory for installation',
      },
      {
        flags: '-f, --framework <type>',
        description: 'framework type (redwood-sdk, nextjs, vite, generic-react)',
      },
      {
        flags: '--force',
        description: 'overwrite existing component files',
        default: false,
      },
      {
        flags: '--no-config',
        description: 'skip generating configuration files',
        default: false,
      },
      {
        flags: '--overwrite',
        description: 'always overwrite config files without prompting',
        default: false,
      },
      {
        flags: '-i, --interactive',
        description: 'run in interactive mode',
        default: false,
      },
      {
        flags: '--no-wrappers',
        description: 'install components without wrapper files',
        default: false,
      },
      {
        flags: '--dependency-strategy <strategy>',
        description:
          'dependency installation strategy (auto, smart, selective, manual, skip, force)',
      },
      {
        flags: '--dry-run',
        description: 'preview changes without making any modifications',
        default: false,
      },
      {
        flags: '-v, --verbose',
        description: 'verbose output with detailed logging',
        default: false,
      },
    ],

    examples: [
      '$ trailhead-ui install',
      '$ trailhead-ui install --framework nextjs',
      '$ trailhead-ui install --dest src/ui',
      '$ trailhead-ui install --dry-run',
      '$ trailhead-ui install --interactive',
    ],

    action: async (options: InstallOptions, cmdContext: CommandContext) => {
      return await handleInstall(options, cmdContext);
    },
  });
};
