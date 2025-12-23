import { spinner } from '@clack/prompts'
import type { ProgressTracker, ProgressState } from './types.js'

/**
 * Enhanced progress step configuration
 * @deprecated Enhanced progress tracker is deprecated. Use createProgressTracker instead.
 */
export interface EnhancedProgressStep {
  /** Step name for display */
  name: string
  /** Step weight for progress calculation */
  weight: number
  /** Estimated duration in milliseconds */
  estimatedDuration?: number
}

/**
 * Enhanced progress tracking state
 * @deprecated Enhanced progress tracker is deprecated. Use createProgressTracker instead.
 */
export interface EnhancedProgressState extends ProgressState {
  /** Current step being executed */
  currentStepIndex: number
  /** Steps configuration */
  steps: EnhancedProgressStep[]
  /** Step-specific progress (0-100) */
  stepProgress: number
  /** Estimated time remaining in milliseconds */
  estimatedTimeRemaining?: number
  /** Time elapsed in milliseconds */
  timeElapsed: number
  /** Average time per step */
  averageStepTime?: number
  /** Step start time */
  stepStartTime?: number
  /** Step completion times */
  stepCompletionTimes: number[]
}

/**
 * Enhanced progress options
 * @deprecated Enhanced progress tracker is deprecated. Use createProgressTracker instead.
 */
export interface EnhancedProgressOptions {
  /** Progress steps configuration */
  steps: EnhancedProgressStep[]
  /** Whether to show time estimates */
  showTimeEstimates?: boolean
  /** Whether to show step names */
  showStepNames?: boolean
}

/**
 * Enhanced progress tracker with multi-step progress and time estimates
 * @deprecated Enhanced progress tracker is deprecated. Use createProgressTracker instead.
 */
export interface EnhancedProgressTracker extends ProgressTracker {
  /** Get enhanced progress state */
  getEnhancedState: () => EnhancedProgressState
  /** Update progress within current step */
  updateStepProgress: (progress: number) => EnhancedProgressState
  /** Start next step with automatic time tracking */
  startNextStep: (stepName?: string) => EnhancedProgressState
  /** Complete current step and move to next */
  completeStep: (stepName?: string) => EnhancedProgressState
  /** Get time estimate for remaining steps */
  getTimeEstimate: () => {
    remaining: number
    total: number
    elapsed: number
  }
}

/**
 * Default enhanced progress options
 */
const DEFAULT_ENHANCED_OPTIONS: Partial<EnhancedProgressOptions> = {
  showTimeEstimates: true,
  showStepNames: true,
}

/**
 * Create an enhanced progress tracker with multi-step progress and time estimates
 *
 * @deprecated This function is deprecated and will be removed in v3.0.0.
 * Use createProgressTracker instead for simpler progress tracking.
 *
 * Provides advanced progress tracking with weighted steps, time estimates,
 * and per-step progress updates. Uses Clack's spinner for display.
 *
 * @param options - Enhanced progress configuration
 * @returns Enhanced progress tracker with time estimation capabilities
 */
export function createEnhancedProgressTracker(
  options: EnhancedProgressOptions
): EnhancedProgressTracker {
  const config = { ...DEFAULT_ENHANCED_OPTIONS, ...options }

  let state: EnhancedProgressState = createInitialEnhancedState(config)
  const s = spinner()

  // Start the spinner
  s.start(formatEnhancedMessage(state, config))

  return {
    nextStep: (stepName: string, metadata: Record<string, unknown> = {}) => {
      const nextIndex = Math.min(state.currentStepIndex + 1, state.steps.length - 1)
      const nextStep = state.steps[nextIndex]

      state = updateEnhancedProgress(state, {
        currentStepIndex: nextIndex,
        stepName: stepName || nextStep?.name || 'Unknown',
        stepProgress: 0,
        stepStartTime: Date.now(),
        metadata,
      })

      s.message(formatEnhancedMessage(state, config))
      return state
    },

    setStep: (step: number, stepName: string, metadata: Record<string, unknown> = {}) => {
      const stepIndex = Math.max(0, Math.min(step - 1, state.steps.length - 1))
      const stepConfig = state.steps[stepIndex]

      state = updateEnhancedProgress(state, {
        currentStepIndex: stepIndex,
        stepName: stepName || stepConfig?.name || 'Unknown',
        stepProgress: 0,
        stepStartTime: Date.now(),
        metadata,
      })

      s.message(formatEnhancedMessage(state, config))
      return state
    },

    complete: () => {
      state = updateEnhancedProgress(state, {
        currentStepIndex: state.steps.length - 1,
        stepName: 'Complete',
        stepProgress: 100,
        percentage: 100,
        completed: true,
      })

      s.stop('Complete')
      return state
    },

    getState: () => ({ ...state }),

    reset: (totalSteps: number) => {
      s.stop()
      const newSteps = Array.from({ length: totalSteps }, (_, i) => ({
        name: `Step ${i + 1}`,
        weight: 1,
      }))

      state = createInitialEnhancedState({ ...config, steps: newSteps })
      s.start(formatEnhancedMessage(state, config))
      return state
    },

    stop: () => {
      s.stop()
    },

    // Enhanced methods
    getEnhancedState: () => ({ ...state }),

    updateStepProgress: (progress: number) => {
      const clampedProgress = Math.max(0, Math.min(100, progress))
      state = updateEnhancedProgress(state, {
        stepProgress: clampedProgress,
      })

      s.message(formatEnhancedMessage(state, config))
      return state
    },

    startNextStep: (stepName?: string) => {
      const nextIndex = Math.min(state.currentStepIndex + 1, state.steps.length - 1)
      const nextStep = state.steps[nextIndex]

      const completionTime = state.stepStartTime ? Date.now() - state.stepStartTime : 0
      const newCompletionTimes = [...state.stepCompletionTimes, completionTime]

      state = updateEnhancedProgress(state, {
        currentStepIndex: nextIndex,
        stepName: stepName || nextStep?.name || 'Unknown',
        stepProgress: 0,
        stepStartTime: Date.now(),
        stepCompletionTimes: newCompletionTimes,
      })

      s.message(formatEnhancedMessage(state, config))
      return state
    },

    completeStep: (stepName?: string) => {
      const completionTime = state.stepStartTime ? Date.now() - state.stepStartTime : 0
      const newCompletionTimes = [...state.stepCompletionTimes, completionTime]

      state = updateEnhancedProgress(state, {
        stepProgress: 100,
        stepName: stepName || state.stepName,
        stepCompletionTimes: newCompletionTimes,
      })

      s.message(formatEnhancedMessage(state, config))
      return state
    },

    getTimeEstimate: () => {
      const elapsed = state.timeElapsed
      const remaining = state.estimatedTimeRemaining || 0
      const total = elapsed + remaining

      return { remaining, total, elapsed }
    },
  }
}

/**
 * Format enhanced progress message for spinner display
 */
function formatEnhancedMessage(
  state: EnhancedProgressState,
  config: EnhancedProgressOptions
): string {
  const parts: string[] = []

  parts.push(`[${state.currentStep}/${state.totalSteps}]`)

  if (config.showStepNames && state.stepName) {
    parts.push(state.stepName)
  }

  if (state.stepProgress > 0 && state.stepProgress < 100) {
    parts.push(`(${state.stepProgress}%)`)
  }

  if (config.showTimeEstimates && state.estimatedTimeRemaining) {
    parts.push(`ETA: ${formatTimeEstimate(state.estimatedTimeRemaining)}`)
  }

  return parts.join(' ')
}

/**
 * Create initial enhanced progress state
 */
function createInitialEnhancedState(options: EnhancedProgressOptions): EnhancedProgressState {
  const startTime = Date.now()
  const firstStep = options.steps[0]

  return {
    currentStep: 0,
    totalSteps: options.steps.length,
    stepName: firstStep?.name || 'Starting...',
    percentage: 0,
    startTime,
    completed: false,
    metadata: {},
    currentStepIndex: 0,
    steps: options.steps,
    stepProgress: 0,
    timeElapsed: 0,
    stepStartTime: startTime,
    stepCompletionTimes: [],
    estimatedTimeRemaining: undefined,
    averageStepTime: undefined,
  }
}

/**
 * Update enhanced progress state immutably
 */
function updateEnhancedProgress(
  currentState: EnhancedProgressState,
  updates: Partial<EnhancedProgressState>
): EnhancedProgressState {
  const now = Date.now()
  const timeElapsed = now - currentState.startTime

  const currentStepIndex = updates.currentStepIndex ?? currentState.currentStepIndex
  const stepProgress = updates.stepProgress ?? currentState.stepProgress
  const steps = updates.steps ?? currentState.steps

  const totalWeight = steps.reduce((sum, step) => sum + step.weight, 0)
  const completedWeight = steps
    .slice(0, currentStepIndex)
    .reduce((sum, step) => sum + step.weight, 0)
  const currentStepWeight = steps[currentStepIndex]?.weight || 0
  const currentStepWeightedProgress = (currentStepWeight * stepProgress) / 100

  const overallProgress =
    totalWeight > 0 ? ((completedWeight + currentStepWeightedProgress) / totalWeight) * 100 : 0

  const completionTimes = updates.stepCompletionTimes ?? currentState.stepCompletionTimes
  const averageStepTime =
    completionTimes.length > 0
      ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length
      : undefined

  const remainingSteps = steps.length - currentStepIndex - stepProgress / 100
  const estimatedTimeRemaining =
    averageStepTime && remainingSteps > 0 ? averageStepTime * remainingSteps : undefined

  return {
    ...currentState,
    ...updates,
    percentage: Math.round(overallProgress),
    timeElapsed,
    averageStepTime,
    estimatedTimeRemaining,
    currentStep: currentStepIndex + 1,
    completed: updates.completed ?? overallProgress >= 100,
  }
}

/**
 * Format time estimate for display
 */
function formatTimeEstimate(ms?: number): string {
  if (!ms || ms < 0) return 'calculating...'

  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  } else {
    return `${seconds}s`
  }
}
