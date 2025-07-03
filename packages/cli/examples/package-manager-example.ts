#!/usr/bin/env tsx
/**
 * Example demonstrating the enhanced package manager detection utility
 *
 * Features shown:
 * - Automatic detection with preference order (pnpm > npm > yarn)
 * - Version requirement checking
 * - Environment variable override (FORCE_PACKAGE_MANAGER)
 * - Caching for performance
 * - Detailed error messages with suggestions
 */

import {
  detectPackageManager,
  getRunCommand,
  getPackageManagerInfo,
  clearPackageManagerCache,
} from '@esteban-url/trailhead-cli/testing';
import { createDefaultLogger } from '@esteban-url/trailhead-cli/core';

const logger = createDefaultLogger(false);

// Example 1: Basic detection
logger.info('Example 1: Detecting package manager...');
const result = detectPackageManager();
if (result.success) {
  logger.success(`Found ${result.value.name} v${result.value.version}`);
} else {
  logger.error(result.error.message);
  if (result.error.suggestion) {
    logger.info(`Suggestion: ${result.error.suggestion}`);
  }
}

// Example 2: Get run command
logger.info('\nExample 2: Building run command...');
const runCmd = getRunCommand('test', ['--coverage', '--verbose']);
if (runCmd.success) {
  logger.info(`Command: ${runCmd.value}`);
}

// Example 3: Environment variable override
logger.info('\nExample 3: Testing environment override...');
process.env.FORCE_PACKAGE_MANAGER = 'npm';
clearPackageManagerCache(); // Clear cache to force re-detection

const forced = detectPackageManager();
if (forced.success) {
  logger.success(
    `Forced to use: ${forced.value.name} v${forced.value.version}`,
  );
}

// Clean up
delete process.env.FORCE_PACKAGE_MANAGER;
clearPackageManagerCache();

// Example 4: Get package manager info (uses cache)
logger.info('\nExample 4: Getting cached info...');
const info1 = getPackageManagerInfo();
const info2 = getPackageManagerInfo(); // This will use cache

if (info1.success && info2.success) {
  logger.info(
    'First call and second call returned same instance:',
    info1 === info2,
  );
}

// Example 5: Error handling with version requirements
logger.info('\nExample 5: Version requirement details...');
logger.info('Minimum versions required:');
logger.info('- pnpm: 6.0.0+');
logger.info('- npm: 7.0.0+');
logger.info('- yarn: 1.22.0+');

// Example 6: Performance demonstration
logger.info('\nExample 6: Performance with caching...');
clearPackageManagerCache();

const start1 = performance.now();
detectPackageManager();
const time1 = performance.now() - start1;

const start2 = performance.now();
detectPackageManager(); // Uses cache
const time2 = performance.now() - start2;

logger.info(`First detection: ${time1.toFixed(2)}ms`);
logger.info(`Cached detection: ${time2.toFixed(2)}ms`);
logger.info(`Speed improvement: ${(time1 / time2).toFixed(0)}x faster`);
