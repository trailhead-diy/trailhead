/**
 * CLI interface using commander.js
 */

import { Command } from 'commander';
import type { ProfileOptions } from './types.js';
import { CLI_CONFIG, DEFAULT_OPTIONS } from './constants.js';
import { validateOptions } from './utils.js';

/**
 * Pure function to create CLI program
 */
export function createCLI(): Command {
  const program = new Command()
    .name(CLI_CONFIG.name)
    .description(CLI_CONFIG.description)
    .version(CLI_CONFIG.version);

  // Main command options
  program
    .option('-c, --compare', 'Compare with traditional approach', DEFAULT_OPTIONS.compare)
    .option('-v, --verbose', 'Show detailed output', DEFAULT_OPTIONS.verbose)
    .option(
      '-i, --iterations <number>',
      'Number of iterations (1-10)',
      DEFAULT_OPTIONS.iterations.toString()
    )
    .option('-m, --mode <type>', 'Profile mode: full|simple', DEFAULT_OPTIONS.mode)
    .option('-o, --output <path>', 'Output directory for markdown reports')
    .option('--interactive', 'Interactive mode with prompts', DEFAULT_OPTIONS.interactive)
    .option('--no-cleanup', 'Keep temporary files for inspection')
    .option('--gc', 'Run with garbage collection between iterations');

  // Transform filtering
  program.option('--exclude <list>', 'Comma-separated list of transforms to exclude');

  // Performance options
  program
    .option('--memory-profile', 'Enable detailed memory profiling')
    .option('--cpu-profile', 'Enable CPU profiling')
    .option('--warmup <number>', 'Number of warmup iterations', '1');

  return program;
}

/**
 * Pure function to parse CLI arguments into ProfileOptions
 */
export function parseCliOptions(program: Command): ProfileOptions {
  const options = program.opts();

  // Parse iterations with validation
  const iterations = parseInt(
    options.iterations?.toString() || DEFAULT_OPTIONS.iterations.toString(),
    10
  );

  // Parse exclude list
  const excludeList = options.exclude
    ? options.exclude.split(',').map((t: string) => t.trim())
    : undefined;

  const profileOptions: ProfileOptions = {
    compare: options.compare || DEFAULT_OPTIONS.compare,
    verbose: options.verbose || DEFAULT_OPTIONS.verbose,
    iterations: isNaN(iterations) ? DEFAULT_OPTIONS.iterations : iterations,
    mode: options.mode || DEFAULT_OPTIONS.mode,
    interactive: options.interactive || DEFAULT_OPTIONS.interactive,
    outDir: options.output,
    // Additional options can be added here
    ...(excludeList && { excludeTransforms: excludeList }),
    ...(options.cleanup === false && { keepTempFiles: true }),
    ...(options.gc && { forceGc: true }),
    ...(options.memoryProfile && { memoryProfile: true }),
    ...(options.cpuProfile && { cpuProfile: true }),
    ...(options.warmup && { warmupIterations: parseInt(options.warmup, 10) }),
  };

  return profileOptions;
}

/**
 * Pure function to validate CLI options
 */
export function validateCliOptions(options: ProfileOptions): {
  isValid: boolean;
  errors: string[];
} {
  const errors = validateOptions(options);

  // Additional CLI-specific validations

  if (options.warmupIterations && (options.warmupIterations < 0 || options.warmupIterations > 5)) {
    errors.push('Warmup iterations must be between 0 and 5');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
/**
 * Setup CLI with all commands and help
 */
export function setupCLI(): Command {
  const program = createCLI();

  // Add help for transforms
  program.addHelpText(
    'after',
    `
Examples:
  $ profile-transforms                          # Basic profiling
  $ profile-transforms --compare --verbose      # Compare with traditional approach
  $ profile-transforms --interactive           # Interactive mode
  $ profile-transforms --mode simple               # Simple color-only mode
  $ profile-transforms --iterations 5 --output ./reports

Performance Tips:
  - Use --gc for more accurate memory measurements
  - Use --warmup for more stable timing results
  - Use --verbose to see detailed component breakdown
  - Use --no-cleanup to inspect transformed files
`
  );

  return program;
}

/**
 * Parse and validate command line arguments
 */
export function parseAndValidate(argv: string[]): { options: ProfileOptions; errors: string[] } {
  const program = setupCLI();
  program.parse(argv);

  const options = parseCliOptions(program);
  const validation = validateCliOptions(options);

  return {
    options,
    errors: validation.errors,
  };
}
