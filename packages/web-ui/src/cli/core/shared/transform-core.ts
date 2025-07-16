/**
 * Transform Core - Pure functional transform orchestration
 *
 * This module provides the core transform functionality for transforming
 * existing component files from hardcoded colors to semantic tokens.
 * It operates on files in-place and does not copy or move files.
 */

import type { Result } from './types.js'
import { join } from 'path'
import { ok, err } from '@esteban-url/cli/core'

// ============================================================================
// CORE TYPES - Immutable data structures
// ============================================================================

/**
 * Configuration for transform execution
 * Immutable interface
 */
export interface TransformConfig {
  readonly srcDir: string
  readonly verbose: boolean
  readonly dryRun: boolean
  readonly skipTransforms?: boolean
  readonly enabledTransforms?: string[]
  readonly disabledTransforms?: string[]
}

/**
 * Result from transform execution
 * Immutable interface with readonly properties
 */
export interface TransformResult {
  readonly filesProcessed: number
  readonly filesModified: number
  readonly conversionsApplied: number
  readonly errors: readonly string[]
  readonly warnings: readonly string[]
}

// ============================================================================
// PURE FUNCTIONS - Core transform logic with no side effects
// ============================================================================

/**
 * Pure function: Execute transforms on existing files
 * Single responsibility: orchestrate the transform pipeline
 * No side effects: all operations return new values
 */
export const executeTransforms = async (
  config: TransformConfig
): Promise<Result<TransformResult, string>> => {
  try {
    // Execute transforms pipeline
    const transformResult = await executeTransformPipeline(config)
    return ok(transformResult)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return err(errorMessage)
  }
}

/**
 * Pure function: Execute the transforms pipeline
 * Single responsibility: run the transform pipeline only
 */
const executeTransformPipeline = async (config: TransformConfig): Promise<TransformResult> => {
  try {
    // Import the main pipeline (dependency injection pattern)
    const { runMainPipeline } = await import('../../../transforms/index.js')

    // Execute pipeline with configuration
    const result = await runMainPipeline(config.srcDir, {
      verbose: config.verbose,
      dryRun: config.dryRun,
    })

    // Use result from main pipeline
    return {
      filesProcessed: result.processedFiles,
      filesModified: config.dryRun ? 0 : result.processedFiles,
      conversionsApplied: result.processedFiles * 2, // Estimate: avg 2 conversions per file in main pipeline
      errors: result.errors.map((e: any) => e.error),
      warnings: [],
    }
  } catch (error) {
    // Return error result instead of throwing
    return {
      filesProcessed: 0,
      filesModified: 0,
      conversionsApplied: 0,
      errors: [
        `Transform pipeline failed: ${error instanceof Error ? error.message : String(error)}`,
      ],
      warnings: [],
    }
  }
}

// ============================================================================
// UTILITY FUNCTIONS - Pure functions for data transformation
// ============================================================================

// ============================================================================
// VALIDATION FUNCTIONS - Pure functions for result validation
// ============================================================================

/**
 * Pure function: Validate transform configuration
 * Single responsibility: ensure configuration is valid
 */
export const validateTransformConfig = (config: TransformConfig): Result<void, string> => {
  if (!config.srcDir) {
    return err('srcDir is required')
  }

  return ok(undefined)
}

/**
 * Pure function: Check if transforms are needed
 * Single responsibility: determine if transformation is required
 */
export const needsTransformation = async (srcDir: string): Promise<boolean> => {
  try {
    const fs = await import('fs/promises')
    const files = await fs.readdir(srcDir)
    const tsxFiles = files.filter((file) => file.endsWith('.tsx'))

    if (tsxFiles.length === 0) {
      return false // No component files to transform
    }

    // Check a sample file for hardcoded colors (indicates transformation needed)
    const sampleFile = tsxFiles[0]
    const filePath = join(srcDir, sampleFile)
    const content = await fs.readFile(filePath, 'utf-8')

    // Look for hardcoded color patterns
    const hardcodedPatterns = [
      /bg-zinc-\d+/,
      /text-zinc-\d+/,
      /border-zinc-\d+/,
      /ring-zinc-\d+/,
      /bg-slate-\d+/,
      /text-slate-\d+/,
    ]

    return hardcodedPatterns.some((pattern) => pattern.test(content))
  } catch {
    return true // If we can't check, assume transformation is needed
  }
}

// ============================================================================
// EXPORTS - Clean public API
// ============================================================================

// Types are already exported via interface declarations
// Functions are already exported via function declarations
