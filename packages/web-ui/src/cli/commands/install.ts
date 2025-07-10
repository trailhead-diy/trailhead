import { ok as CliOk, err as CliErr } from '@esteban-url/trailhead-cli';
import {
  createCommand,
  executeWithPhases,
  displaySummary,
  type CommandPhase,
  type CommandContext,
} from '@esteban-url/trailhead-cli/command';
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
// TYPES
// ============================================================================

interface InstallConfig {
  options: InstallOptions;
  projectRoot: string;
  loadedConfig?: any;
  configPath?: string | null;
  resolvedConfig?: any;
  framework?: any;
  finalOptions?: InstallOptions;
  installResult?: any;
}

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
// INSTALLATION PHASES
// ============================================================================

/**
 * Create installation phases for structured execution
 */
const createInstallPhases = (cmdContext: CommandContext): CommandPhase<InstallConfig>[] => [
  {
    name: 'Loading configuration',
    execute: async (config: InstallConfig) => {
      const configResult = loadConfigSync(config.projectRoot);
      const loadedConfig = configResult.config;
      const configPath = configResult.filepath;

      // Always show when config is found
      if (configPath) {
        cmdContext.logger.info(`Configuration loaded from: ${configPath}`);
      }

      // Log detailed config in verbose mode
      if (config.options.verbose || loadedConfig.verbose) {
        logConfigDiscovery(configPath, loadedConfig, true, configResult.source);
      }

      return CliOk({
        ...config,
        loadedConfig,
        configPath,
      });
    },
  },
  {
    name: 'Resolving configuration',
    execute: async (config: InstallConfig) => {
      const nodeFS = createNodeFileSystem();

      // Merge configuration: CLI options > config file > defaults
      const installConfig = config.loadedConfig?.install;
      const destinationDir = config.options.dest || installConfig?.destDir;

      const resolveResult = await resolveConfiguration(
        nodeFS,
        cmdContext.logger,
        {
          catalystDir: config.options.catalystDir,
          destinationDir: destinationDir,
          verbose: config.options.verbose,
        },
        config.projectRoot
      );

      if (resolveResult.isErr()) {
        return CliErr(resolveResult.error);
      }

      return CliOk({
        ...config,
        resolvedConfig: resolveResult.value,
      });
    },
  },
  {
    name: 'Detecting framework',
    execute: async (config: InstallConfig) => {
      const nodeFS = createNodeFileSystem();

      const frameworkResult = await detectFramework(
        nodeFS,
        config.resolvedConfig.projectRoot,
        config.options.framework && isValidFramework(config.options.framework)
          ? config.options.framework
          : undefined
      );

      if (frameworkResult.isErr()) {
        return CliErr(frameworkResult.error);
      }

      const framework = frameworkResult.value;
      cmdContext.logger.success(`Detected ${framework.framework.name}`);

      return CliOk({
        ...config,
        framework,
      });
    },
  },
  {
    name: 'Executing installation',
    execute: async (config: InstallConfig) => {
      const nodeFS = createNodeFileSystem();
      const effectiveOptions = config.finalOptions || config.options;

      // Handle dry run
      if (config.options.dryRun) {
        const dryRunResult = await performDryRunInstallation(
          nodeFS,
          cmdContext.logger,
          config.resolvedConfig,
          getTrailheadPackageRoot(),
          config.framework.framework.type,
          config.options.wrappers ?? true
        );

        if (dryRunResult.isErr()) {
          return CliErr(dryRunResult.error);
        }

        cmdContext.logger.info('\nDry run complete. No files were installed.');
        return CliOk(config);
      }

      // Build installation options
      const coreOptions: CoreInstallOptions = {
        interactive: effectiveOptions.interactive,
        skipDependencyPrompts: false,
        dependencyStrategy:
          effectiveOptions.dependencyStrategy &&
          isValidDependencyStrategy(effectiveOptions.dependencyStrategy)
            ? effectiveOptions.dependencyStrategy
            : 'auto',
      };

      const installResult = await performInstallation(
        nodeFS,
        cmdContext.logger,
        config.resolvedConfig,
        getTrailheadPackageRoot(),
        config.options.force ?? false,
        config.framework.framework.type,
        config.options.wrappers ?? true,
        coreOptions
      );

      if (installResult.isErr()) {
        return CliErr(installResult.error);
      }

      return CliOk({
        ...config,
        installResult: installResult.value,
      });
    },
  },
  {
    name: 'Displaying summary',
    execute: async (config: InstallConfig) => {
      // Skip summary for dry runs
      if (config.options.dryRun || !config.installResult) {
        return CliOk(config);
      }

      displayInstallationSummary(cmdContext.logger, {
        framework: config.framework.framework.name,
        filesInstalled: config.installResult.filesInstalled.length,
        themes: ['red', 'rose', 'orange', 'yellow', 'green', 'blue', 'violet', 'catalyst'],
      });

      return CliOk(config);
    },
  },
];

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
// COMMAND PHASES - INTERACTIVE & VALIDATION
// ============================================================================

/**
 * Create pre-installation phases for validation and interactive prompts
 */
const createPreInstallPhases = (cmdContext: CommandContext): CommandPhase<InstallConfig>[] => [
  {
    name: 'Validating options',
    execute: async (config: InstallConfig) => {
      const validation = createInstallValidation();
      const validationResult = validation.validateSync(config.options);

      if (validationResult.overall === 'fail') {
        cmdContext.logger.error('❌ Invalid options:');
        validationResult.failed.forEach((result: ValidationResult) => {
          cmdContext.logger.error(`  • ${result.message}`);
        });
        return CliErr(createError('VALIDATION_ERROR', 'Invalid installation options'));
      }

      // Show warnings if any
      if (validationResult.overall === 'warning') {
        validationResult.warnings.forEach((result: ValidationResult) => {
          cmdContext.logger.info(`⚠ ${result.message}`);
        });
      }

      return CliOk(config);
    },
  },
  {
    name: 'Running interactive prompts',
    execute: async (config: InstallConfig) => {
      let finalOptions = config.options;

      // Run interactive prompts if needed
      if (config.options.interactive || (!config.options.framework && !config.options.dryRun)) {
        cmdContext.logger.info('🚀 Interactive Installation Mode\n');
        const promptResults = await runInstallationPrompts();

        // Merge with CLI options (only override if explicitly provided)
        finalOptions = {
          ...promptResults,
          // Only include CLI options that were explicitly set
          ...(config.options.dest ? { dest: config.options.dest } : {}),
          ...(config.options.framework ? { framework: config.options.framework } : {}),
          ...(config.options.catalystDir ? { catalystDir: config.options.catalystDir } : {}),
          ...(config.options.force !== undefined ? { force: config.options.force } : {}),
          ...(config.options.dryRun !== undefined ? { dryRun: config.options.dryRun } : {}),
          ...(config.options.noConfig !== undefined ? { noConfig: config.options.noConfig } : {}),
          ...(config.options.overwrite !== undefined
            ? { overwrite: config.options.overwrite }
            : {}),
          ...(config.options.interactive !== undefined
            ? { interactive: config.options.interactive }
            : {}),
          ...(config.options.verbose !== undefined ? { verbose: config.options.verbose } : {}),
          ...(config.options.wrappers !== undefined ? { wrappers: config.options.wrappers } : {}),
        };
      }

      return CliOk({
        ...config,
        finalOptions,
      });
    },
  },
];

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
      // Initialize config
      const config: InstallConfig = {
        options,
        projectRoot: cmdContext.projectRoot,
      };

      // Execute pre-installation phases (validation & interactive prompts)
      const prePhases = createPreInstallPhases(cmdContext);
      const preResult = await executeWithPhases(prePhases, config, cmdContext);

      if (preResult.isErr()) {
        return CliErr(preResult.error);
      }

      // Execute main installation phases
      const mainPhases = createInstallPhases(cmdContext);
      const mainResult = await executeWithPhases(mainPhases, preResult.value, cmdContext);

      if (mainResult.isErr()) {
        cmdContext.logger.error('❌ Installation failed:');
        cmdContext.logger.error(mainResult.error.message);
        if (options.verbose && mainResult.error.details) {
          cmdContext.logger.error('Details:' + mainResult.error.details);
        }
        return CliErr(mainResult.error);
      }

      // Display final summary
      displaySummary(
        'Installation Complete',
        [
          { label: 'Framework', value: mainResult.value.framework?.framework.name || 'Unknown' },
          {
            label: 'Files Installed',
            value: mainResult.value.installResult?.filesInstalled.length?.toString() || '0',
          },
          { label: 'Mode', value: options.dryRun ? 'Dry Run' : 'Live Installation' },
          ...(mainResult.value.configPath
            ? [{ label: 'Config', value: mainResult.value.configPath }]
            : []),
        ],
        cmdContext
      );

      return CliOk(undefined);
    },
  });
};
