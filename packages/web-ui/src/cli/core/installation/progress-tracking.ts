/**
 * Progress tracking module with immutable state
 */

import { updateArray } from './functional-utils.js'
import {
  parseProgress as parseProgressFromRegistry,
  type PackageManagerName,
} from './package-manager-registry.js'

// ============================================================================
// TYPES
// ============================================================================

export interface InstallStep {
  readonly name: string
  readonly weight: number
  readonly completed: boolean
}

export interface ProgressState {
  readonly steps: readonly InstallStep[]
  readonly currentStep: number
  readonly completed: number
  readonly startTime: number
  readonly lastUpdate: number
}

export interface ProgressUpdate {
  readonly type: 'step-complete' | 'step-start' | 'progress' | 'log'
  readonly stepName?: string
  readonly message?: string
  readonly percent?: number
}

export type ProgressRenderer = (state: ProgressState) => string

// ============================================================================
// PROGRESS STATE CREATION
// ============================================================================

/**
 * Create initial progress state for dependency installation
 */
export const createProgressState = (dependencies: readonly string[]): ProgressState => {
  const now = Date.now()

  return {
    steps: [
      { name: 'Preparing installation', weight: 0.5, completed: false },
      { name: 'Resolving dependencies', weight: 1, completed: false },
      { name: 'Fetching packages', weight: dependencies.length, completed: false },
      { name: 'Linking dependencies', weight: 1, completed: false },
      { name: 'Building native modules', weight: 0.5, completed: false },
      { name: 'Running postinstall scripts', weight: 0.5, completed: false },
      { name: 'Finalizing installation', weight: 0.5, completed: false },
    ],
    currentStep: -1,
    completed: 0,
    startTime: now,
    lastUpdate: now,
  }
}

/**
 * Create progress state for custom steps
 */
export const createCustomProgressState = (
  steps: ReadonlyArray<{ name: string; weight?: number }>
): ProgressState => {
  const now = Date.now()

  return {
    steps: steps.map((step) => ({
      name: step.name,
      weight: step.weight ?? 1,
      completed: false,
    })),
    currentStep: -1,
    completed: 0,
    startTime: now,
    lastUpdate: now,
  }
}

// ============================================================================
// STATE UPDATES
// ============================================================================

/**
 * Update progress state based on output
 */
export const updateProgress = (state: ProgressState, output: string): ProgressState => {
  const stepName = detectStepFromOutput(output)
  if (!stepName) return state

  const stepIndex = state.steps.findIndex((s) => s.name === stepName)
  if (stepIndex === -1) return state

  // If step is already completed, no update needed
  if (state.steps[stepIndex].completed) return state

  // Mark step as completed
  const updatedSteps = updateArray(state.steps, stepIndex, (step) => ({ ...step, completed: true }))

  const completed = calculateProgress(updatedSteps)

  return {
    ...state,
    steps: updatedSteps,
    currentStep: stepIndex,
    completed,
    lastUpdate: Date.now(),
  }
}

/**
 * Update progress by step name
 */
export const updateProgressByStep = (
  state: ProgressState,
  stepName: string,
  completed: boolean
): ProgressState => {
  const stepIndex = state.steps.findIndex((s) => s.name === stepName)
  if (stepIndex === -1) return state

  const updatedSteps = updateArray(state.steps, stepIndex, (step) => ({ ...step, completed }))

  const progress = calculateProgress(updatedSteps)

  return {
    ...state,
    steps: updatedSteps,
    currentStep: completed ? stepIndex : state.currentStep,
    completed: progress,
    lastUpdate: Date.now(),
  }
}

/**
 * Process a progress update
 */
export const processProgressUpdate = (
  state: ProgressState,
  update: ProgressUpdate
): ProgressState => {
  switch (update.type) {
    case 'step-complete':
      return update.stepName ? updateProgressByStep(state, update.stepName, true) : state

    case 'step-start':
      if (!update.stepName) return state
      const stepIndex = state.steps.findIndex((s) => s.name === update.stepName)
      return stepIndex !== -1 ? { ...state, currentStep: stepIndex, lastUpdate: Date.now() } : state

    case 'progress':
      return update.percent !== undefined
        ? { ...state, completed: update.percent, lastUpdate: Date.now() }
        : state

    case 'log':
      return update.message ? updateProgress(state, update.message) : state

    default:
      return state
  }
}

// ============================================================================
// PROGRESS CALCULATION
// ============================================================================

/**
 * Calculate overall progress percentage
 */
const calculateProgress = (steps: readonly InstallStep[]): number => {
  const totalWeight = steps.reduce((sum, step) => sum + step.weight, 0)
  if (totalWeight === 0) return 100

  const completedWeight = steps
    .filter((step) => step.completed)
    .reduce((sum, step) => sum + step.weight, 0)

  return Math.round((completedWeight / totalWeight) * 100)
}

/**
 * Get elapsed time in seconds
 */
export const getElapsedTime = (state: ProgressState): number => {
  return Math.floor((Date.now() - state.startTime) / 1000)
}

/**
 * Estimate remaining time based on progress
 */
export const estimateRemainingTime = (state: ProgressState): number | null => {
  if (state.completed === 0 || state.completed === 100) return null

  const elapsed = getElapsedTime(state)
  const estimatedTotal = (elapsed / state.completed) * 100
  const remaining = estimatedTotal - elapsed

  return Math.max(0, Math.round(remaining))
}

// ============================================================================
// OUTPUT PARSING
// ============================================================================

/**
 * Detect installation step from package manager output
 */
const detectStepFromOutput = (output: string): string | null => {
  const patterns: Array<{ pattern: RegExp; step: string }> = [
    { pattern: /preparing|initializing/i, step: 'Preparing installation' },
    { pattern: /resolv(?:ing|ed)|resolution/i, step: 'Resolving dependencies' },
    { pattern: /fetch(?:ing|ed)|download(?:ing|ed)/i, step: 'Fetching packages' },
    { pattern: /link(?:ing|ed)|symlink/i, step: 'Linking dependencies' },
    { pattern: /build(?:ing)?|compil(?:ing|e)|native/i, step: 'Building native modules' },
    { pattern: /postinstall|post-install|script/i, step: 'Running postinstall scripts' },
    { pattern: /finaliz(?:ing|e)|complet(?:ing|e)|done/i, step: 'Finalizing installation' },
  ]

  const match = patterns.find(({ pattern }) => pattern.test(output))
  return match?.step || null
}

/**
 * Parse package manager specific progress indicators
 */
export const parsePackageManagerProgress = (
  output: string,
  packageManager: string
): ProgressUpdate | null => {
  const pmName = packageManager as PackageManagerName
  const parsed = parseProgressFromRegistry(output, pmName)

  // Convert registry format to our format
  if (parsed.packages) {
    return { type: 'step-complete', stepName: 'Fetching packages' }
  }

  if (parsed.current && parsed.total) {
    const percent = Math.round((parsed.current / parsed.total) * 100)
    return { type: 'progress', percent }
  }

  // Check for step detection
  const step = detectStepFromOutput(output)
  if (step && parsed.phase) {
    return { type: 'step-start', stepName: step }
  }

  return { type: 'log', message: output }
}

// ============================================================================
// PROGRESS RENDERING
// ============================================================================

/**
 * Default progress renderer
 */
export const defaultProgressRenderer: ProgressRenderer = (state) => {
  const elapsed = getElapsedTime(state)
  const remaining = estimateRemainingTime(state)

  const parts = [`${state.completed}%`]

  if (state.currentStep >= 0 && state.currentStep < state.steps.length) {
    parts.push(state.steps[state.currentStep].name)
  }

  parts.push(`${elapsed}s`)

  if (remaining !== null && remaining > 0) {
    parts.push(`~${remaining}s remaining`)
  }

  return parts.join(' • ')
}

/**
 * Simple progress bar renderer
 */
export const progressBarRenderer: ProgressRenderer = (state) => {
  const width = 30
  const filled = Math.round((state.completed / 100) * width)
  const empty = width - filled

  const bar = '█'.repeat(filled) + '░'.repeat(empty)

  return `[${bar}] ${state.completed}%`
}

/**
 * Detailed progress renderer
 */
export const detailedProgressRenderer: ProgressRenderer = (state) => {
  const lines: string[] = []

  state.steps.forEach((step, index) => {
    const icon = step.completed ? '✓' : index === state.currentStep ? '→' : ' '
    const status = step.completed ? 'done' : index === state.currentStep ? 'in progress' : 'pending'
    lines.push(`${icon} ${step.name} (${status})`)
  })

  lines.push('')
  lines.push(`Progress: ${state.completed}%`)
  lines.push(`Time: ${getElapsedTime(state)}s`)

  const remaining = estimateRemainingTime(state)
  if (remaining !== null) {
    lines.push(`Remaining: ~${remaining}s`)
  }

  return lines.join('\n')
}
