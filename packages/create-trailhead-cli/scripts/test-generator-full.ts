#!/usr/bin/env tsx
/**
 * Comprehensive E2E Generator Testing Script
 *
 * This script provides comprehensive end-to-end testing of the generator
 * with optional dependency installation. It tests all meaningful combinations
 * and validates that generated projects actually work.
 *
 * Usage:
 *   pnpm test:generator:full                 # Fast compilation-only testing
 *   pnpm test:generator:full --install       # Full E2E with dependency installation
 *   pnpm test:generator:full --install --ci  # CI mode with parallel execution
 *
 * Test Matrix:
 *   - 3 templates (basic, advanced, enterprise)
 *   - 2 package managers (npm, pnpm)
 *   - 2 scenarios (minimal, full-setup)
 *   - Total: 12 comprehensive tests
 */

import { join } from 'path';
import { rmSync, existsSync } from 'fs';
import { execa } from 'execa';
import chalk from 'chalk';
import ora from 'ora';
import { createTestContext } from '@esteban-url/trailhead-cli/testing';
import { generateProject } from '../src/lib/generator.js';
import type {
  ProjectConfig,
  TemplateVariant,
  PackageManager,
} from '../src/lib/types.js';

/**
 * Test scenario configuration
 */
interface TestScenario {
  name: string;
  docs: boolean;
  git: boolean;
  install: boolean;
  description: string;
}

/**
 * Test combination for comprehensive testing
 */
interface TestCombination {
  template: TemplateVariant;
  packageManager: PackageManager;
  scenario: TestScenario;
  id: string;
  description: string;
}

/**
 * Test execution options
 */
interface TestOptions {
  install: boolean;
  ci: boolean;
  verbose: boolean;
  cleanup: boolean;
  parallel: boolean;
}

/**
 * Test result tracking
 */
interface TestResult {
  combination: TestCombination;
  success: boolean;
  error?: string;
  duration: number;
  projectPath?: string;
}

// Test scenarios
const scenarios: TestScenario[] = [
  {
    name: 'minimal',
    docs: false,
    git: false,
    install: false, // Controlled by CLI flag
    description: 'Minimal setup, fastest generation',
  },
  {
    name: 'full-setup',
    docs: true,
    git: true,
    install: false, // Controlled by CLI flag
    description: 'Complete feature set',
  },
];

// Generate all test combinations (12 total)
function generateTestCombinations(): TestCombination[] {
  const combinations: TestCombination[] = [];
  const templates: TemplateVariant[] = ['basic', 'advanced', 'enterprise'];
  const packageManagers: PackageManager[] = ['npm', 'pnpm'];

  for (const template of templates) {
    for (const packageManager of packageManagers) {
      for (const scenario of scenarios) {
        const id = `${template}-${packageManager}-${scenario.name}`;
        combinations.push({
          template,
          packageManager,
          scenario,
          id,
          description: `${template} template with ${packageManager} (${scenario.name})`,
        });
      }
    }
  }

  return combinations;
}

/**
 * Parse command line arguments
 */
function parseArgs(): TestOptions {
  const args = process.argv.slice(2);

  return {
    install: args.includes('--install'),
    ci: args.includes('--ci'),
    verbose: args.includes('--verbose') || args.includes('-v'),
    cleanup: !args.includes('--no-cleanup'),
    parallel: args.includes('--parallel') || args.includes('--ci'),
  };
}

/**
 * Generate a single project and test it
 */
async function testCombination(
  combination: TestCombination,
  options: TestOptions,
  testBaseDir: string,
): Promise<TestResult> {
  const startTime = Date.now();
  const projectName = `test-${combination.id}-${Date.now()}`;
  const projectPath = join(testBaseDir, projectName);

  try {
    // Generate project
    const config: ProjectConfig = {
      projectName,
      projectPath,
      template: combination.template,
      packageManager: combination.packageManager,
      includeDocs: combination.scenario.docs,
      initGit: combination.scenario.git,
      installDependencies: options.install,
      dryRun: false,
    };

    const testContext = createTestContext({
      verbose: options.verbose,
      fs: undefined, // Use real filesystem
    });

    const result = await generateProject(config, testContext);

    if (!result.success) {
      return {
        combination,
        success: false,
        error: `Generation failed: ${result.error.message}`,
        duration: Date.now() - startTime,
      };
    }

    // Verify core files exist
    const coreFiles = ['package.json', 'tsconfig.json', 'src/index.ts'];

    for (const file of coreFiles) {
      if (!existsSync(join(projectPath, file))) {
        return {
          combination,
          success: false,
          error: `Missing core file: ${file}`,
          duration: Date.now() - startTime,
        };
      }
    }

    // Test TypeScript compilation
    try {
      await execa('npx', ['tsc', '--noEmit'], {
        cwd: projectPath,
        stdio: options.verbose ? 'inherit' : 'pipe',
      });
    } catch (error: any) {
      return {
        combination,
        success: false,
        error: `TypeScript compilation failed: ${error.message}`,
        duration: Date.now() - startTime,
      };
    }

    // Test linting (if available)
    try {
      await execa('npx', ['oxlint', 'src'], {
        cwd: projectPath,
        stdio: options.verbose ? 'inherit' : 'pipe',
      });
    } catch (error: any) {
      // Only fail for real linting errors, not missing binary
      if (
        !error.message.includes('not found') &&
        !error.message.includes('ENOENT')
      ) {
        return {
          combination,
          success: false,
          error: `Linting failed: ${error.message}`,
          duration: Date.now() - startTime,
        };
      }
    }

    // Test project functionality (if dependencies were installed)
    if (options.install) {
      try {
        // Test build
        await execa(combination.packageManager, ['run', 'build'], {
          cwd: projectPath,
          stdio: options.verbose ? 'inherit' : 'pipe',
        });

        // Test project tests (if they exist)
        try {
          await execa(combination.packageManager, ['test'], {
            cwd: projectPath,
            stdio: options.verbose ? 'inherit' : 'pipe',
          });
        } catch (error: any) {
          // Only fail if tests exist but fail, not if no tests found
          if (
            !error.message.includes('no tests found') &&
            !error.message.includes('No test files found')
          ) {
            return {
              combination,
              success: false,
              error: `Project tests failed: ${error.message}`,
              duration: Date.now() - startTime,
            };
          }
        }
      } catch (error: any) {
        return {
          combination,
          success: false,
          error: `Project functionality test failed: ${error.message}`,
          duration: Date.now() - startTime,
        };
      }
    }

    return {
      combination,
      success: true,
      duration: Date.now() - startTime,
      projectPath,
    };
  } catch (error: any) {
    return {
      combination,
      success: false,
      error: `Unexpected error: ${error.message}`,
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Run all tests in parallel or sequential mode
 */
async function runTests(
  combinations: TestCombination[],
  options: TestOptions,
  testBaseDir: string,
): Promise<TestResult[]> {
  console.log(chalk.blue('🧪 Running comprehensive generator tests...'));
  console.log(
    chalk.gray(
      `Mode: ${options.install ? 'Full E2E with installation' : 'Compilation-only'}`,
    ),
  );
  console.log(
    chalk.gray(`Execution: ${options.parallel ? 'Parallel' : 'Sequential'}`),
  );
  console.log(chalk.gray(`Combinations: ${combinations.length}`));
  console.log('');

  if (options.parallel) {
    // Run tests in parallel for faster execution
    const promises = combinations.map((combination) =>
      testCombination(combination, options, testBaseDir),
    );

    const spinner = ora('Running tests in parallel...').start();
    const results = await Promise.all(promises);
    spinner.stop();

    return results;
  } else {
    // Run tests sequentially for easier debugging
    const results: TestResult[] = [];

    for (const combination of combinations) {
      const spinner = ora(`Testing ${combination.description}`).start();
      const result = await testCombination(combination, options, testBaseDir);

      if (result.success) {
        spinner.succeed(
          chalk.green(`✓ ${combination.description} (${result.duration}ms)`),
        );
      } else {
        spinner.fail(
          chalk.red(`✗ ${combination.description}: ${result.error}`),
        );
      }

      results.push(result);
    }

    return results;
  }
}

/**
 * Print test results summary
 */
function printResults(results: TestResult[], _options: TestOptions): void {
  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  console.log('');
  console.log(chalk.bold('📊 Test Results Summary'));
  console.log(chalk.gray('═'.repeat(50)));

  console.log(
    chalk.green(`✓ Successful: ${successful.length}/${results.length}`),
  );
  console.log(chalk.red(`✗ Failed: ${failed.length}/${results.length}`));
  console.log(
    chalk.blue(`⏱️  Total Duration: ${(totalDuration / 1000).toFixed(1)}s`),
  );
  console.log(
    chalk.blue(
      `📈 Average Duration: ${(totalDuration / results.length / 1000).toFixed(1)}s`,
    ),
  );

  if (failed.length > 0) {
    console.log('');
    console.log(chalk.red.bold('❌ Failed Tests:'));
    for (const result of failed) {
      console.log(chalk.red(`  • ${result.combination.description}`));
      console.log(chalk.gray(`    ${result.error}`));
    }
  }

  if (successful.length > 0) {
    console.log('');
    console.log(chalk.green.bold('✅ Successful Tests:'));
    for (const result of successful) {
      console.log(
        chalk.green(
          `  • ${result.combination.description} (${result.duration}ms)`,
        ),
      );
    }
  }
}

/**
 * Cleanup generated test projects
 */
function cleanup(results: TestResult[], options: TestOptions): void {
  if (!options.cleanup) {
    console.log(
      chalk.yellow(
        '⚠️  Skipping cleanup - test projects remain for inspection',
      ),
    );
    return;
  }

  const spinner = ora('Cleaning up test projects...').start();
  let cleanedCount = 0;

  for (const result of results) {
    if (result.projectPath && existsSync(result.projectPath)) {
      try {
        rmSync(result.projectPath, { recursive: true, force: true });
        cleanedCount++;
      } catch (_error) {
        // Continue cleanup even if one fails
      }
    }
  }

  spinner.succeed(`Cleaned up ${cleanedCount} test projects`);
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  const options = parseArgs();
  const combinations = generateTestCombinations();
  // Use subdirectory of current working directory for security validation compliance
  const testBaseDir = join(process.cwd(), 'test-temp', `e2e-${Date.now()}`);

  // Print configuration
  console.log(chalk.bold.blue('🚀 Trailhead CLI Generator E2E Testing'));
  console.log('');

  if (options.install) {
    console.log(
      chalk.yellow(
        '⚠️  Full E2E mode enabled - this will install dependencies and may take 15-30 minutes',
      ),
    );
  } else {
    console.log(
      chalk.green('⚡ Fast mode - compilation testing only (~3-5 minutes)'),
    );
  }

  try {
    const results = await runTests(combinations, options, testBaseDir);
    printResults(results, options);
    cleanup(results, options);

    // Exit with appropriate code
    const failed = results.filter((r) => !r.success);
    if (failed.length > 0) {
      console.log('');
      console.log(chalk.red.bold('❌ Some tests failed'));
      process.exit(1);
    } else {
      console.log('');
      console.log(chalk.green.bold('🎉 All tests passed!'));
      process.exit(0);
    }
  } catch (error: any) {
    console.error(chalk.red.bold('💥 Testing failed with unexpected error:'));
    console.error(error.message);
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Show help if requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(chalk.bold('Trailhead CLI Generator E2E Testing'));
  console.log('');
  console.log('Usage:');
  console.log(
    '  pnpm test:generator:full                 Fast compilation-only testing',
  );
  console.log(
    '  pnpm test:generator:full --install       Full E2E with dependency installation',
  );
  console.log(
    '  pnpm test:generator:full --install --ci  CI mode with parallel execution',
  );
  console.log('');
  console.log('Options:');
  console.log(
    '  --install       Install dependencies and test project functionality',
  );
  console.log(
    '  --ci            CI mode with parallel execution and minimal output',
  );
  console.log('  --verbose, -v   Verbose output with detailed logging');
  console.log('  --parallel      Run tests in parallel (default in CI mode)');
  console.log(
    '  --no-cleanup    Skip cleanup - leave test projects for inspection',
  );
  console.log('  --help, -h      Show this help message');
  console.log('');
  console.log('Test Matrix:');
  console.log('  • Templates: basic, advanced, enterprise');
  console.log('  • Package Managers: npm, pnpm');
  console.log('  • Scenarios: minimal, full-setup');
  console.log('  • Total Combinations: 12');
  process.exit(0);
}

// Run the tests
main().catch((error) => {
  console.error(chalk.red.bold('💥 Script failed:'), error.message);
  process.exit(1);
});
