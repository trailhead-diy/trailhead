/**
 * Interactive mode using inquirer prompts
 */

import { input, select, confirm, number } from '@inquirer/prompts';
import chalk from 'chalk';
import type { ProfileOptions, InteractiveConfig } from './types.js';
import { DEFAULT_OPTIONS } from './constants.js';
/**
 * Pure function to get mode description
 */
function getModeDescription(mode: string): string {
  switch (mode) {
    case 'full':
      return 'Complete transforms pipeline with all optimizations';
    case 'simple':
      return 'Color transforms only (faster, limited scope)';
    default:
      return '';
  }
}

/**
 * Main interactive configuration prompt
 */
export async function promptInteractiveConfig(): Promise<InteractiveConfig> {
  console.log(chalk.green('🔬 Interactive Transform Profiler Configuration\n'));
  console.log(chalk.gray('Configure your profiling session with guided prompts.\n'));

  // Profile mode selection
  const mode = await select({
    message: 'Select profiling mode:',
    choices: [
      {
        name: 'Full Pipeline',
        value: 'full',
        description: getModeDescription('full'),
      },
      {
        name: 'Simple (Color transforms only)',
        value: 'simple',
        description: getModeDescription('simple'),
      },
    ],
    default: DEFAULT_OPTIONS.mode,
  });

  // Comparison option
  const compare = await confirm({
    message: 'Compare with traditional approach?',
    default: true,
  });

  // Iterations
  const iterations = await number({
    message: 'Number of iterations for statistical accuracy:',
    default: DEFAULT_OPTIONS.iterations,
    min: 1,
    max: 10,
  });

  // Output options
  const needsOutput = await confirm({
    message: 'Save detailed reports?',
    default: true,
  });

  let outputPath: string | undefined;
  if (needsOutput) {
    outputPath = await input({
      message: 'Output directory (leave empty for default):',
      default: './docs',
    });
  }

  return {
    mode: mode as 'full' | 'simple',
    compare,
    iterations: iterations || DEFAULT_OPTIONS.iterations,
    output: outputPath,
  };
}

/**
 * Prompt for advanced configuration options
 */
export async function promptAdvancedConfig(): Promise<Partial<ProfileOptions>> {
  console.log(chalk.blue('\n🔧 Advanced Configuration (Optional)\n'));

  const wantsAdvanced = await confirm({
    message: 'Configure advanced options?',
    default: false,
  });

  if (!wantsAdvanced) {
    return {};
  }

  const advancedOptions: Partial<ProfileOptions> = {};

  // Reports are always generated in markdown format

  // Memory profiling
  const memoryProfiling = await confirm({
    message: 'Enable detailed memory profiling?',
    default: false,
  });

  if (memoryProfiling) {
    advancedOptions.memoryProfile = true;
  }

  // Garbage collection
  const forceGc = await confirm({
    message: 'Force garbage collection between iterations?',
    default: false,
  });

  if (forceGc) {
    advancedOptions.forceGc = true;
  }

  // Warmup iterations
  const needsWarmup = await confirm({
    message: 'Add warmup iterations for more stable results?',
    default: false,
  });

  if (needsWarmup) {
    const warmupIterations = await number({
      message: 'Number of warmup iterations:',
      default: 1,
      min: 0,
      max: 5,
    });

    advancedOptions.warmupIterations = warmupIterations || 1;
  }

  // Keep temp files
  const keepFiles = await confirm({
    message: 'Keep temporary files for inspection?',
    default: false,
  });

  if (keepFiles) {
    advancedOptions.keepTempFiles = true;
  }

  return advancedOptions;
}

/**
 * Convert interactive config to full ProfileOptions
 */
export function configToOptions(
  config: InteractiveConfig,
  advanced: Partial<ProfileOptions> = {}
): ProfileOptions {
  return {
    mode: config.mode,
    compare: config.compare,
    iterations: config.iterations,
    verbose: true, // Interactive mode defaults to verbose
    interactive: true,
    outDir: config.output,
    ...advanced,
  };
}

/**
 * Show configuration summary before execution
 */
export async function confirmConfiguration(options: ProfileOptions): Promise<boolean> {
  console.log(chalk.blue('\n📋 Configuration Summary\n'));
  console.log(chalk.white(`Mode: ${chalk.green(options.mode)}`));
  console.log(chalk.white(`Iterations: ${chalk.green(options.iterations)}`));
  console.log(
    chalk.white(
      `Compare with traditional: ${options.compare ? chalk.green('Yes') : chalk.red('No')}`
    )
  );

  if (options.outDir) {
    console.log(chalk.white(`Output directory: ${chalk.green(options.outDir)}`));
  }

  if (options.memoryProfile) {
    console.log(chalk.white(`Memory profiling: ${chalk.green('Enabled')}`));
  }

  if (options.forceGc) {
    console.log(chalk.white(`Garbage collection: ${chalk.green('Forced')}`));
  }

  if (options.warmupIterations) {
    console.log(chalk.white(`Warmup iterations: ${chalk.green(options.warmupIterations)}`));
  }

  console.log();

  return await confirm({
    message: 'Start profiling with this configuration?',
    default: true,
  });
}

/**
 * Full interactive flow
 */
export async function runInteractiveMode(): Promise<ProfileOptions | null> {
  try {
    const config = await promptInteractiveConfig();
    const advanced = await promptAdvancedConfig();
    const options = configToOptions(config, advanced);

    const confirmed = await confirmConfiguration(options);

    if (!confirmed) {
      console.log(chalk.yellow('\n❌ Profiling cancelled.'));
      return null;
    }

    return options;
  } catch (error) {
    if (error === '' || (error as any).name === 'ExitPromptError') {
      console.log(chalk.yellow('\n❌ Interactive mode cancelled.'));
      return null;
    }
    throw error;
  }
}
