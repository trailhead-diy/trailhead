/**
 * Simple profiling strategy (color transforms only)
 */

import { performance } from 'perf_hooks'
import { readdir, readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import type { ProfileResult, ProfileOptions } from '../types.js'
import type { ProfileProgressManager } from '../progress.js'
import { BaseProfileStrategy, createMeasurement } from './base.js'
import { setupEnvironment, measureMemory, forceGarbageCollection } from '../utils.js'
import { PROFILER_CONFIG } from '../constants.js'

// Import color transforms
import { baseMappingsTransform } from '@/transforms/components/common/colors/base-mappings.js'
import { interactiveStatesTransform } from '@/transforms/components/common/colors/interactive-states.js'
import { darkModeTransform } from '@/transforms/components/common/colors/dark-mode.js'
import { specialPatternsTransform } from '@/transforms/components/common/colors/special-patterns.js'

/**
 * Simple profiling strategy
 * Uses only core color transforms for lightweight profiling
 */
export class SimpleStrategy extends BaseProfileStrategy {
  readonly name = 'transforms_simple'
  readonly description = 'Color transforms only (faster, limited scope)'

  /**
   * Validate simple strategy
   */
  validate(options: ProfileOptions): { isValid: boolean; errors: string[] } {
    const baseValidation = this.validateCommon(options)
    const errors = [...baseValidation.errors]
    
    // Simple strategy specific validations
    if (options.mode !== 'simple') {
      errors.push('Simple strategy requires mode to be "simple"')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Get estimated duration based on historical performance
   */
  getEstimatedDuration(options: ProfileOptions): number {
    // Based on actual measurements: ~16-23ms per iteration for color transforms only
    const baseTime = 20 // milliseconds (conservative estimate)
    const setupTime = 300 // faster setup (no pipeline initialization)
    const cleanupTime = 100 // faster cleanup
    const warmupTime = options.warmupIterations ? options.warmupIterations * baseTime : 0
    
    return setupTime + warmupTime + (options.iterations * baseTime) + cleanupTime
  }

  /**
   * Get list of transforms used by simple strategy
   */
  getTransforms(): string[] {
    return [
      'base-mappings',
      'interactive-states',
      'dark-mode',
      'special-patterns'
    ]
  }

  /**
   * Apply simple transforms to a directory
   */
  private async applySimpleTransforms(srcDir: string): Promise<void> {
    const files = await readdir(srcDir)
    const tsxFiles = files.filter(f => f.endsWith('.tsx'))
    
    // Get transforms to apply
    const transforms = [
      baseMappingsTransform,
      interactiveStatesTransform,
      darkModeTransform,
      specialPatternsTransform,
    ]
    
    // Process each file
    for (const file of tsxFiles) {
      const filePath = join(srcDir, file)
      let content = await readFile(filePath, 'utf-8')
      
      // Apply each transform sequentially
      for (const transform of transforms) {
        const result = transform.execute(content)
        if (result.hasChanges) {
          content = result.content
        }
      }
      
      await writeFile(filePath, content, 'utf-8')
    }
  }

  /**
   * Execute simple profiling
   */
  async profile(
    options: ProfileOptions,
    progressManager: ProfileProgressManager
  ): Promise<ProfileResult> {
    progressManager.startProfiling(this.name, options.iterations)
    
    // Execute warmup if configured
    if (options.warmupIterations) {
      await this.executeWarmup(options, async () => {
        await setupEnvironment(PROFILER_CONFIG.transforms2Dir)
        await this.applySimpleTransforms(PROFILER_CONFIG.transforms2Dir)
      })
    }
    
    // Execute profiling iterations
    const measurements = await this.executeProfilingLoop(
      options,
      progressManager,
      async (_iteration: number) => {
        // Setup fresh environment for each iteration
        await setupEnvironment(PROFILER_CONFIG.transforms2Dir)
        
        // Force garbage collection if requested
        if (options.forceGc) {
          forceGarbageCollection()
        }
        
        const memoryBefore = measureMemory()
        const startTime = performance.now()
        
        // Apply simple transforms
        await this.applySimpleTransforms(PROFILER_CONFIG.transforms2Dir)
        
        const endTime = performance.now()
        const memoryAfter = measureMemory()
        
        return createMeasurement(startTime, endTime, memoryBefore, memoryAfter)
      }
    )
    
    // Create result from measurements
    const result = this.createResult(measurements, options)
    
    progressManager.completeProfiling(this.name, result.averageTime)
    
    return result
  }

  /**
   * Get configuration summary for simple strategy
   */
  getConfigSummary(options: ProfileOptions): Record<string, any> {
    const base = super.getConfigSummary(options)
    
    return {
      ...base,
      limitations: [
        'Color transforms only',
        'No AST transformations',
        'No semantic enhancements',
        'No component-specific optimizations'
      ],
      benefits: [
        'Faster execution',
        'Lower memory usage',
        'Good for color-only benchmarking',
        'Minimal dependencies'
      ],
      scope: [
        'zinc/gray/slate → semantic tokens',
        'hover/focus/active states',
        'dark mode patterns',
        'complex color patterns'
      ]
    }
  }
}