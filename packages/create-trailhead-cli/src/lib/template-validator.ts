import type { TemplateVariant, TemplateFile } from './types.js';
import { getTemplateFiles } from './template-loader.js';

/**
 * Validation result for template structure analysis
 */
export interface TemplateValidationResult {
  valid: boolean;
  variant: TemplateVariant;
  commands: CommandCoverage[];
  missing: MissingTest[];
  statistics: ValidationStatistics;
  warnings: ValidationWarning[];
}

interface CommandCoverage {
  commandFile: string;
  testFile: string | null;
  hasTest: boolean;
  testLocation: 'colocated' | 'separate' | 'missing';
}

interface MissingTest {
  commandFile: string;
  expectedTestPath: string;
  suggestion: string;
}

interface ValidationStatistics {
  totalCommands: number;
  testedCommands: number;
  coverage: number;
  colocatedTests: number;
  separateTests: number;
  integrationTests: number;
}

interface ValidationWarning {
  type: 'deprecated-pattern' | 'missing-integration' | 'orphaned-test';
  file: string;
  message: string;
  suggestion?: string;
}

/**
 * Validate that all command files have corresponding test files
 *
 * Analyzes template structure to ensure complete test coverage following
 * the colocation pattern. Identifies missing tests, deprecated patterns,
 * and provides actionable suggestions for improvement.
 *
 * @param variant - Template variant to validate
 * @returns Promise resolving to comprehensive validation results
 *
 * @example
 * ```typescript
 * const result = await validateTemplateStructure('advanced')
 *
 * if (!result.valid) {
 *   console.error(`Template validation failed for ${result.variant}`)
 *   result.missing.forEach(missing => {
 *     console.error(`Missing test: ${missing.commandFile} -> ${missing.expectedTestPath}`)
 *   })
 * }
 *
 * console.log(`Test coverage: ${result.statistics.coverage}%`)
 * console.log(`Colocated tests: ${result.statistics.colocatedTests}`)
 * ```
 */
export async function validateTemplateStructure(
  variant: TemplateVariant
): Promise<TemplateValidationResult> {
  const templateFiles = await getTemplateFiles(variant);

  // Extract command and test files
  const commandFiles = extractCommandFiles(templateFiles, variant);
  const testFiles = extractTestFiles(templateFiles);

  // Analyze command coverage
  const commands = analyzeCommandCoverage(commandFiles, testFiles);

  // Identify missing tests
  const missing = identifyMissingTests(commands);

  // Calculate statistics
  const statistics = calculateStatistics(commands, testFiles);

  // Generate warnings
  const warnings = generateWarnings(testFiles, commands);

  return {
    valid: missing.length === 0,
    variant,
    commands,
    missing,
    statistics,
    warnings,
  };
}

/**
 * Validate all template variants and generate comprehensive report
 *
 * @returns Promise resolving to validation results for all variants
 */
export async function validateAllTemplates(): Promise<TemplateValidationResult[]> {
  const variants: TemplateVariant[] = ['basic', 'advanced'];

  const results = await Promise.all(variants.map(variant => validateTemplateStructure(variant)));

  return results;
}

/**
 * Extract command files from template file list
 */
function extractCommandFiles(templateFiles: TemplateFile[], variant: TemplateVariant): string[] {
  return templateFiles
    .filter(
      file =>
        file.source.includes(`${variant}/src/commands/`) &&
        file.source.endsWith('.ts.hbs') &&
        !file.source.includes('__tests__')
    )
    .map(file => file.source);
}

/**
 * Extract test files from template file list
 */
function extractTestFiles(templateFiles: TemplateFile[]): string[] {
  return templateFiles
    .filter(
      file =>
        file.source.includes('test.ts.hbs') ||
        file.source.includes('spec.ts.hbs') ||
        file.source.includes('__tests__')
    )
    .map(file => file.source);
}

/**
 * Analyze command test coverage
 */
function analyzeCommandCoverage(commandFiles: string[], testFiles: string[]): CommandCoverage[] {
  return commandFiles.map(commandFile => {
    // Look for colocated test
    const colocatedTestPattern = commandFile.replace(
      /\/commands\/([^/]+)\.ts\.hbs$/,
      '/commands/__tests__/$1.test.ts.hbs'
    );

    // Look for separate test patterns (deprecated)
    const separateTestPatterns = [
      commandFile.replace(/\/commands\/([^/]+)\.ts\.hbs$/, '/tests/unit/$1.test.ts.hbs'),
      commandFile.replace(/\/commands\/([^/]+)\.ts\.hbs$/, '/__tests__/unit/$1.test.ts.hbs'),
    ];

    // Find matching test file
    let testFile: string | null = null;
    let testLocation: 'colocated' | 'separate' | 'missing' = 'missing';

    if (testFiles.includes(colocatedTestPattern)) {
      testFile = colocatedTestPattern;
      testLocation = 'colocated';
    } else {
      for (const pattern of separateTestPatterns) {
        if (testFiles.includes(pattern)) {
          testFile = pattern;
          testLocation = 'separate';
          break;
        }
      }
    }

    return {
      commandFile,
      testFile,
      hasTest: testFile !== null,
      testLocation,
    };
  });
}

/**
 * Identify missing tests for commands
 */
function identifyMissingTests(commands: CommandCoverage[]): MissingTest[] {
  return commands
    .filter(cmd => !cmd.hasTest)
    .map(cmd => {
      const expectedTestPath = cmd.commandFile.replace(
        /\/commands\/([^/]+)\.ts\.hbs$/,
        '/commands/__tests__/$1.test.ts.hbs'
      );

      return {
        commandFile: cmd.commandFile,
        expectedTestPath,
        suggestion: `Create test file at ${expectedTestPath} following colocation pattern`,
      };
    });
}

/**
 * Calculate validation statistics
 */
function calculateStatistics(
  commands: CommandCoverage[],
  testFiles: string[]
): ValidationStatistics {
  const totalCommands = commands.length;
  const testedCommands = commands.filter(cmd => cmd.hasTest).length;
  const colocatedTests = commands.filter(cmd => cmd.testLocation === 'colocated').length;
  const separateTests = commands.filter(cmd => cmd.testLocation === 'separate').length;

  // Count integration tests
  const integrationTests = testFiles.filter(
    file => file.includes('integration') || file.includes('e2e')
  ).length;

  return {
    totalCommands,
    testedCommands,
    coverage: totalCommands > 0 ? Math.round((testedCommands / totalCommands) * 100) : 100,
    colocatedTests,
    separateTests,
    integrationTests,
  };
}

/**
 * Generate validation warnings
 */
function generateWarnings(testFiles: string[], commands: CommandCoverage[]): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  // Warn about deprecated test patterns
  commands
    .filter(cmd => cmd.testLocation === 'separate')
    .forEach(cmd => {
      warnings.push({
        type: 'deprecated-pattern',
        file: cmd.testFile!,
        message: 'Test file uses deprecated separate directory pattern',
        suggestion: `Move to colocated pattern: ${cmd.commandFile.replace(
          /\/commands\/([^/]+)\.ts\.hbs$/,
          '/commands/__tests__/$1.test.ts.hbs'
        )}`,
      });
    });

  // Check for missing integration tests
  const hasIntegrationTests = testFiles.some(
    file => file.includes('integration') || file.includes('cli.test.ts')
  );

  if (!hasIntegrationTests) {
    warnings.push({
      type: 'missing-integration',
      file: 'N/A',
      message: 'No integration tests found',
      suggestion: 'Add CLI integration tests at src/__tests__/integration/cli.test.ts.hbs',
    });
  }

  // Find orphaned test files (tests without corresponding commands)
  const commandNames = commands.map(cmd => extractCommandName(cmd.commandFile));
  const orphanedTests = testFiles.filter(testFile => {
    const testName = extractTestName(testFile);
    return (
      testName &&
      !testName.includes('integration') &&
      !testName.includes('cli') &&
      !commandNames.includes(testName)
    );
  });

  orphanedTests.forEach(testFile => {
    warnings.push({
      type: 'orphaned-test',
      file: testFile,
      message: 'Test file has no corresponding command file',
      suggestion: 'Remove orphaned test or create corresponding command',
    });
  });

  return warnings;
}

/**
 * Extract command name from file path
 */
function extractCommandName(filePath: string): string {
  const match = filePath.match(/\/commands\/([^/]+)\.ts\.hbs$/);
  return match ? match[1] : '';
}

/**
 * Extract test name from file path
 */
function extractTestName(filePath: string): string | null {
  // Extract from colocated pattern
  let match = filePath.match(/\/commands\/__tests__\/([^/]+)\.test\.ts\.hbs$/);
  if (match) return match[1];

  // Extract from separate pattern
  match = filePath.match(/\/tests\/unit\/([^/]+)\.test\.ts\.hbs$/);
  if (match) return match[1];

  // Extract from other test patterns
  match = filePath.match(/\/__tests__\/unit\/([^/]+)\.test\.ts\.hbs$/);
  if (match) return match[1];

  return null;
}

/**
 * Generate a human-readable validation report
 *
 * @param results - Validation results to format
 * @returns Formatted report string
 */
export function formatValidationReport(results: TemplateValidationResult[]): string {
  const lines: string[] = [];

  lines.push('# Template Structure Validation Report');
  lines.push('');

  // Overall summary
  const totalValid = results.filter(r => r.valid).length;
  const overallValid = totalValid === results.length;
  lines.push(
    `**Overall Status**: ${overallValid ? '✅ VALID' : '❌ INVALID'} (${totalValid}/${results.length} variants)`
  );
  lines.push('');

  // Per-variant analysis
  results.forEach(result => {
    lines.push(`## ${result.variant.toUpperCase()} Template`);
    lines.push('');
    lines.push(`**Status**: ${result.valid ? '✅ Valid' : '❌ Invalid'}`);
    lines.push(
      `**Test Coverage**: ${result.statistics.coverage}% (${result.statistics.testedCommands}/${result.statistics.totalCommands} commands)`
    );
    lines.push(
      `**Colocation Compliance**: ${result.statistics.colocatedTests}/${result.statistics.testedCommands} tests colocated`
    );

    if (result.statistics.integrationTests > 0) {
      lines.push(`**Integration Tests**: ${result.statistics.integrationTests} found`);
    }
    lines.push('');

    // Missing tests
    if (result.missing.length > 0) {
      lines.push('**Missing Tests**:');
      result.missing.forEach(missing => {
        lines.push(`- \`${missing.commandFile}\` → Missing \`${missing.expectedTestPath}\``);
      });
      lines.push('');
    }

    // Warnings
    if (result.warnings.length > 0) {
      lines.push('**Warnings**:');
      result.warnings.forEach(warning => {
        const icon =
          warning.type === 'deprecated-pattern'
            ? '⚠️'
            : warning.type === 'missing-integration'
              ? '📋'
              : '🔍';
        lines.push(`- ${icon} ${warning.message}`);
        if (warning.suggestion) {
          lines.push(`  *Suggestion: ${warning.suggestion}*`);
        }
      });
      lines.push('');
    }
  });

  // Summary statistics
  const totalCommands = results.reduce((sum, r) => sum + r.statistics.totalCommands, 0);
  const totalTested = results.reduce((sum, r) => sum + r.statistics.testedCommands, 0);
  const totalColocated = results.reduce((sum, r) => sum + r.statistics.colocatedTests, 0);
  const overallCoverage = totalCommands > 0 ? Math.round((totalTested / totalCommands) * 100) : 100;

  lines.push('## Summary Statistics');
  lines.push('');
  lines.push(`- **Total Commands**: ${totalCommands}`);
  lines.push(`- **Total Tested**: ${totalTested} (${overallCoverage}%)`);
  lines.push(
    `- **Colocated Tests**: ${totalColocated}/${totalTested} (${totalTested > 0 ? Math.round((totalColocated / totalTested) * 100) : 0}%)`
  );
  lines.push(`- **Template Variants**: ${results.length}`);

  return lines.join('\n');
}
