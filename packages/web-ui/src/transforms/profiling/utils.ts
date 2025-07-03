/**
 * Shared utility functions for profiling system
 */

import { mkdir, rm, copyFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import type { ProfileResult, ProfileOptions } from './types.js';
import { CATALYST_COMPONENTS, PROFILER_CONFIG } from './constants.js';

/**
 * Pure function to measure memory usage
 */
export function measureMemory(): number {
  const usage = process.memoryUsage();
  return Math.round(usage.heapUsed / 1024 / 1024); // MB
}

/**
 * Pure function to calculate statistics from timing array
 */
export function calculateStatistics(times: number[]): {
  total: number;
  average: number;
  median: number;
  min: number;
  max: number;
} {
  const sorted = [...times].sort((a, b) => a - b);
  const total = sorted.reduce((sum, t) => sum + t, 0);

  return {
    total,
    average: total / sorted.length,
    median: sorted[Math.floor(sorted.length / 2)],
    min: sorted[0],
    max: sorted[sorted.length - 1],
  };
}

/**
 * Pure function to calculate memory statistics
 */
export function calculateMemoryStats(memories: number[]): {
  peak: number;
  average: number;
} {
  return {
    peak: Math.max(...memories),
    average: memories.reduce((sum, m) => sum + m, 0) / memories.length,
  };
}

/**
 * Pure function to create ProfileResult from measurements
 */
export function createProfileResult(
  approach: string,
  times: number[],
  memories: number[],
  iterations: number,
  componentProfiles: any[] = []
): ProfileResult {
  const timeStats = calculateStatistics(times);
  const memoryStats = calculateMemoryStats(memories);

  return {
    approach,
    totalTime: timeStats.total,
    averageTime: timeStats.average,
    medianTime: timeStats.median,
    minTime: timeStats.min,
    maxTime: timeStats.max,
    memoryPeak: memoryStats.peak,
    memoryAverage: memoryStats.average,
    componentsProcessed: CATALYST_COMPONENTS.length,
    componentsPerSecond: (CATALYST_COMPONENTS.length * 1000) / timeStats.average,
    componentProfiles,
    iterations,
  };
}

/**
 * Pure function to calculate comparison metrics
 */
export function calculateComparison(
  transforms2: ProfileResult,
  traditional: ProfileResult
): { speedupFactor: number; memoryEfficiency: number } {
  return {
    speedupFactor: traditional.averageTime / transforms2.averageTime,
    memoryEfficiency:
      ((traditional.memoryAverage - transforms2.memoryAverage) / traditional.memoryAverage) * 100,
  };
}

/**
 * Pure function to parse command line arguments
 */
export function parseOptions(args: string[]): ProfileOptions {
  // This will be enhanced when we implement commander
  const hasCompare = args.includes('--compare') || args.includes('-c');
  const hasVerbose = args.includes('--verbose') || args.includes('-v');
  const iterationsIndex = args.findIndex(arg => arg === '--iterations' || arg === '-i');
  const iterations =
    iterationsIndex >= 0 && args[iterationsIndex + 1]
      ? parseInt(args[iterationsIndex + 1], 10) || 3
      : 3;

  return {
    compare: hasCompare,
    verbose: hasVerbose,
    iterations,
    mode: 'full',
  };
}

/**
 * Setup test environment with fresh components
 * Side effect: creates directories and copies files
 */
export async function setupEnvironment(targetDir: string): Promise<void> {
  if (existsSync(targetDir)) {
    await rm(targetDir, { recursive: true });
  }
  await mkdir(targetDir, { recursive: true });

  // Copy all Catalyst components
  for (const component of CATALYST_COMPONENTS) {
    const source = join(PROFILER_CONFIG.catalystSource, component);
    const dest = join(targetDir, component);
    if (existsSync(source)) {
      await copyFile(source, dest);
    }
  }
}

/**
 * Cleanup environment
 * Side effect: removes directories
 */
export async function cleanupEnvironment(): Promise<void> {
  if (existsSync(PROFILER_CONFIG.tempBase)) {
    await rm(PROFILER_CONFIG.tempBase, { recursive: true });
  }
}

/**
 * Force garbage collection if available
 * Side effect: triggers GC
 */
export function forceGarbageCollection(): void {
  if (global.gc) {
    global.gc();
  }
}

/**
 * Pure function to validate file exists
 */
export function validateFile(path: string): boolean {
  return existsSync(path);
}

/**
 * Pure function to generate timestamp
 */
export function generateTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Pure function to format duration
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }
  return `${(ms / 1000).toFixed(1)}s`;
}

/**
 * Pure function to format memory
 */
export function formatMemory(mb: number): string {
  if (mb < 1) {
    return `${(mb * 1024).toFixed(0)}KB`;
  }
  return `${mb.toFixed(1)}MB`;
}

/**
 * Pure function to create progress bar visualization
 */
export function createProgressBar(current: number, total: number, width: number = 20): string {
  const progress = Math.round((current / total) * width);
  const bar = '█'.repeat(progress) + '░'.repeat(width - progress);
  const percentage = Math.round((current / total) * 100);
  return `${bar} ${percentage}%`;
}

/**
 * Pure function to validate options
 */
export function validateOptions(options: ProfileOptions): string[] {
  const errors: string[] = [];

  if (options.iterations < 1 || options.iterations > 10) {
    errors.push('Iterations must be between 1 and 10');
  }

  if (!['full', 'simple', 'custom'].includes(options.mode)) {
    errors.push('Mode must be full, simple, or custom');
  }

  return errors;
}

/**
 * Pure function to ensure directory exists
 */
export async function ensureDirectory(path: string): Promise<void> {
  if (!existsSync(path)) {
    await mkdir(path, { recursive: true });
  }
}
