/**
 * Shared types for profiling system
 */

export interface ProfileOptions {
  compare: boolean
  verbose: boolean
  iterations: number
  mode: 'full' | 'simple'
  outDir?: string
  interactive?: boolean
  
  // Optional advanced configuration
  keepTempFiles?: boolean
  forceGc?: boolean
  memoryProfile?: boolean
  cpuProfile?: boolean
  warmupIterations?: number
  excludeTransforms?: string[]
}

export interface ComponentProfile {
  name: string
  executionTime: number
  memoryUsed: number
  transformCount: number
}

export interface ProfileResult {
  approach: string
  totalTime: number
  averageTime: number
  medianTime: number
  minTime: number
  maxTime: number
  memoryPeak: number
  memoryAverage: number
  componentsProcessed: number
  componentsPerSecond: number
  componentProfiles: ComponentProfile[]
  iterations: number
}

export interface ComparisonResult {
  transforms2: ProfileResult
  traditional?: ProfileResult
  speedupFactor?: number
  memoryEfficiency?: number
}

export interface ProfilerConfig {
  tempBase: string
  transforms2Dir: string
  traditionalDir: string
  catalystSource: string
  reportPath: string
}

export interface ProgressIndicators {
  setup: string
  profile: string
  cleanup: string
  comparison: string
}

export interface ReportFormat {
  type: 'markdown'
  path: string
}

export interface InteractiveConfig {
  mode: 'full' | 'simple'
  compare: boolean
  iterations: number
  output?: string
}