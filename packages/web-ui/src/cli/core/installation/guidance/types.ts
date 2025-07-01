/**
 * Common types for framework guidance
 */

import type { FrameworkInfo } from '../framework-detection.js'

// ============================================================================
// TYPES
// ============================================================================

export interface IntegrationStep {
  readonly title: string
  readonly description: string
  readonly code?: string
  readonly filename?: string
  readonly language?: 'css' | 'tsx' | 'ts' | 'json' | 'bash'
  readonly optional?: boolean
}

export interface FrameworkGuidance {
  readonly framework: FrameworkInfo
  readonly steps: readonly IntegrationStep[]
  readonly notes?: readonly string[]
  readonly troubleshooting?: readonly string[]
}

export interface ConfigTemplate {
  readonly filename: string
  readonly content: string
  readonly description: string
}
