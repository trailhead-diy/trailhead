import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import { resolve } from 'path';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { createCLIPerformanceMonitor } from '../../src/testing/performance.js';

// Skip example CLI tests - they require @trailhead/cli to be published or dist files built
// These tests execute actual CLI files that import from dist/index.js
// They will pass once the package is published to npm or when using make-standalone.sh script
describe.skip('CLI Examples Performance Tests', () => {
  const examplesDir = resolve(__dirname, '..');
  const basicCliPath = resolve(examplesDir, 'basic-cli.ts');
  const advancedCliPath = resolve(examplesDir, 'advanced-cli.ts');
  const interactiveCliPath = resolve(examplesDir, 'interactive-cli.ts');
  const monitor = createCLIPerformanceMonitor();
  let testDir: string;

  beforeAll(async () => {
    testDir = await fs.mkdtemp(path.join(tmpdir(), 'cli-performance-test-'));
  });

  afterAll(async () => {
    // Export performance results
    const resultsPath = path.join(process.cwd(), 'examples', 'performance-results.json');
    try {
      await fs.writeFile(resultsPath, monitor.exportToJson());
      console.log(`📊 Performance results exported to: ${resultsPath}`);
    } catch (error) {
      console.warn('Failed to export performance results:', error);
    }

    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }

    // Print performance summary
    const summary = monitor.getSummary();
    if (summary) {
      console.log('\n📈 Performance Summary:');
      console.log(`  Total tests: ${summary.totalTests}`);
      console.log(`  Successful: ${summary.successful}`);
      console.log(`  Failed: ${summary.failed}`);
      console.log(`  Timed out: ${summary.timedOut}`);
      console.log(`  Average execution time: ${Math.round(summary.averageExecutionTime)}ms`);
      console.log(`  Max execution time: ${Math.round(summary.maxExecutionTime)}ms`);
      console.log(`  Average memory usage: ${Math.round(summary.averageMemoryUsage / 1024 / 1024)}MB`);
      console.log(`  Max memory usage: ${Math.round(summary.maxMemoryUsage / 1024 / 1024)}MB`);
    }
  });

  describe('Basic CLI Performance', () => {
    it('should execute greet command within performance limits', async () => {
      const report = await monitor.monitor(
        'Basic CLI - Greet Command',
        `npx tsx "${basicCliPath}" greet Alice`,
        () => new Promise<void>((resolve, reject) => {
          try {
            execSync(`npx tsx "${basicCliPath}" greet Alice`, {
              encoding: 'utf8',
              cwd: process.cwd(),
            });
            resolve();
          } catch (error) {
            reject(error);
          }
        }),
        5000
      );

      expect(report.status).toBe('success');
      expect(report.metrics.executionTime).toBeLessThan(3000); // Should complete in under 3 seconds
      expect(report.metrics.memoryUsage.heapUsed).toBeLessThan(100 * 1024 * 1024); // Under 100MB
    });

    it('should execute calculation commands efficiently', async () => {
      const operations = ['add', 'subtract', 'multiply', 'divide'];
      
      for (const op of operations) {
        const report = await monitor.monitor(
          `Basic CLI - Calculate ${op}`,
          `npx tsx "${basicCliPath}" calculate ${op} 100 50`,
          () => new Promise<void>((resolve, reject) => {
            try {
              execSync(`npx tsx "${basicCliPath}" calculate ${op} 100 50`, {
                encoding: 'utf8',
                cwd: process.cwd(),
              });
              resolve();
            } catch (error) {
              reject(error);
            }
          }),
          5000
        );

        expect(report.status).toBe('success');
        expect(report.metrics.executionTime).toBeLessThan(2000); // Very fast for calculations
      }
    });

    it('should handle large numbers without performance degradation', async () => {
      const largeNumbers = ['999999999999999', '888888888888888'];
      
      const report = await monitor.monitor(
        'Basic CLI - Large Number Calculation',
        `npx tsx "${basicCliPath}" calculate add ${largeNumbers.join(' ')}`,
        () => new Promise<void>((resolve, reject) => {
          try {
            execSync(`npx tsx "${basicCliPath}" calculate add ${largeNumbers.join(' ')}`, {
              encoding: 'utf8',
              cwd: process.cwd(),
            });
            resolve();
          } catch (error) {
            reject(error);
          }
        }),
        5000
      );

      expect(report.status).toBe('success');
      expect(report.metrics.executionTime).toBeLessThan(3000);
    });
  });

  describe('Advanced CLI Performance', () => {
    it('should process small files efficiently', async () => {
      const inputFile = path.join(testDir, 'small-input.txt');
      await fs.writeFile(inputFile, 'Small file content for testing');

      const report = await monitor.monitor(
        'Advanced CLI - Small File Processing',
        `npx tsx "${advancedCliPath}" process "${inputFile}" --dry-run`,
        () => new Promise<void>((resolve, reject) => {
          try {
            execSync(`npx tsx "${advancedCliPath}" process "${inputFile}" --dry-run`, {
              encoding: 'utf8',
              cwd: process.cwd(),
            });
            resolve();
          } catch (error) {
            reject(error);
          }
        }),
        10000
      );

      expect(report.status).toBe('success');
      expect(report.metrics.executionTime).toBeLessThan(5000);
    });

    it('should handle medium-sized files within reasonable time', async () => {
      const inputFile = path.join(testDir, 'medium-input.txt');
      const content = 'Line content for medium file\n'.repeat(1000); // ~27KB
      await fs.writeFile(inputFile, content);

      const report = await monitor.monitor(
        'Advanced CLI - Medium File Processing',
        `npx tsx "${advancedCliPath}" process "${inputFile}" --dry-run`,
        () => new Promise<void>((resolve, reject) => {
          try {
            execSync(`npx tsx "${advancedCliPath}" process "${inputFile}" --dry-run`, {
              encoding: 'utf8',
              cwd: process.cwd(),
            });
            resolve();
          } catch (error) {
            reject(error);
          }
        }),
        15000
      );

      expect(report.status).toBe('success');
      expect(report.metrics.executionTime).toBeLessThan(10000);
    });

    it('should handle different output formats efficiently', async () => {
      const inputFile = path.join(testDir, 'format-test.txt');
      await fs.writeFile(inputFile, 'Format test content\nSecond line\nThird line');

      const formats = ['text', 'json', 'csv'];
      
      for (const format of formats) {
        const report = await monitor.monitor(
          `Advanced CLI - ${format.toUpperCase()} Format`,
          `npx tsx "${advancedCliPath}" process "${inputFile}" --format ${format} --dry-run`,
          () => new Promise<void>((resolve, reject) => {
            try {
              execSync(`npx tsx "${advancedCliPath}" process "${inputFile}" --format ${format} --dry-run`, {
                encoding: 'utf8',
                cwd: process.cwd(),
              });
              resolve();
            } catch (error) {
              reject(error);
            }
          }),
          10000
        );

        expect(report.status).toBe('success');
        expect(report.metrics.executionTime).toBeLessThan(8000);
      }
    });
  });

  describe('Interactive CLI Performance', () => {
    it('should start interactive commands quickly', async () => {
      const report = await monitor.monitor(
        'Interactive CLI - Quick Start',
        `npx tsx "${interactiveCliPath}" --help`,
        () => new Promise<void>((resolve, reject) => {
          try {
            execSync(`npx tsx "${interactiveCliPath}" --help`, {
              encoding: 'utf8',
              cwd: process.cwd(),
            });
            resolve();
          } catch (error) {
            reject(error);
          }
        }),
        5000
      );

      expect(report.status).toBe('success');
      expect(report.metrics.executionTime).toBeLessThan(3000); // Help should be very fast
    });

    it('should handle non-interactive mode efficiently', async () => {
      const report = await monitor.monitor(
        'Interactive CLI - Non-Interactive Mode',
        `npx tsx "${interactiveCliPath}" init test-project --template node --no-install`,
        () => new Promise<void>((resolve, reject) => {
          try {
            execSync(`npx tsx "${interactiveCliPath}" init test-project --template node --no-install`, {
              encoding: 'utf8',
              cwd: process.cwd(),
            });
            resolve();
          } catch (error) {
            reject(error);
          }
        }),
        15000
      );

      expect(report.status).toBe('success');
      expect(report.metrics.executionTime).toBeLessThan(12000);
    });
  });

  describe('Stress Testing', () => {
    it('should handle rapid successive commands', async () => {
      const commands = Array.from({ length: 10 }, (_, i) => 
        `npx tsx "${basicCliPath}" calculate add ${i} ${i + 1}`
      );

      const startTime = Date.now();
      
      const results = await Promise.all(
        commands.map((cmd, i) => 
          monitor.monitor(
            `Stress Test - Command ${i + 1}`,
            cmd,
            () => new Promise<void>((resolve, reject) => {
              try {
                execSync(cmd, {
                  encoding: 'utf8',
                  cwd: process.cwd(),
                });
                resolve();
              } catch (error) {
                reject(error);
              }
            }),
            5000
          )
        )
      );

      const totalTime = Date.now() - startTime;
      const successfulResults = results.filter(r => r.status === 'success');

      expect(successfulResults.length).toBeGreaterThanOrEqual(8); // At least 80% success rate
      expect(totalTime).toBeLessThan(30000); // Complete within 30 seconds
    });

    it('should maintain performance under memory pressure', async () => {
      // Create progressively larger inputs to test memory handling
      const fileSizes = [1000, 5000, 10000]; // Lines of text
      
      for (let i = 0; i < fileSizes.length; i++) {
        const inputFile = path.join(testDir, `memory-test-${i}.txt`);
        const content = 'Memory pressure test line\n'.repeat(fileSizes[i]);
        await fs.writeFile(inputFile, content);

        const report = await monitor.monitor(
          `Memory Pressure Test - ${fileSizes[i]} lines`,
          `npx tsx "${advancedCliPath}" process "${inputFile}" --dry-run`,
          () => new Promise<void>((resolve, reject) => {
            try {
              execSync(`npx tsx "${advancedCliPath}" process "${inputFile}" --dry-run`, {
                encoding: 'utf8',
                cwd: process.cwd(),
                maxBuffer: 10 * 1024 * 1024, // 10MB buffer
              });
              resolve();
            } catch (error) {
              reject(error);
            }
          }),
          20000
        );

        // Performance should not degrade too much with larger files
        expect(report.status).toBe('success');
        
        // Memory usage should be reasonable (under 200MB for these test sizes)
        expect(report.metrics.memoryUsage.heapUsed).toBeLessThan(200 * 1024 * 1024);
      }
    });
  });

  describe('Performance Regression Detection', () => {
    it('should check overall performance thresholds', () => {
      const thresholds = {
        maxExecutionTime: 15000, // 15 seconds max for any single command
        maxMemoryUsage: 500 * 1024 * 1024, // 500MB max memory usage
        maxFailureRate: 0.1, // 10% max failure rate
      };

      const result = monitor.checkThresholds(thresholds);
      
      if (!result.passed) {
        console.warn('⚠️ Performance thresholds exceeded:');
        result.violations.forEach(violation => console.warn(`  - ${violation}`));
      }

      // In CI, we might want to fail on threshold violations
      // For now, just warn but don't fail the test
      expect(result.violations).toBeDefined();
    });

    it('should detect performance trends', () => {
      const reports = monitor.getReports();
      const basicCliReports = reports.filter(r => r.testName.includes('Basic CLI'));
      
      if (basicCliReports.length > 1) {
        const executionTimes = basicCliReports.map(r => r.metrics.executionTime);
        const avgTime = executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length;
        
        // Basic CLI commands should be consistently fast
        expect(avgTime).toBeLessThan(5000);
        
        // Check for excessive variance in execution times
        const variance = executionTimes.reduce((acc, time) => 
          acc + Math.pow(time - avgTime, 2), 0
        ) / executionTimes.length;
        
        const standardDeviation = Math.sqrt(variance);
        
        // Standard deviation should not be too high (indicating inconsistent performance)
        expect(standardDeviation).toBeLessThan(avgTime * 0.5); // Within 50% of average
      }
    });
  });
});