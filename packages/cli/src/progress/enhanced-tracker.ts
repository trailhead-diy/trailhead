import { SingleBar, Presets } from 'cli-progress'
import type { ProgressTracker, ProgressState, ProgressOptions } from './types.js'

/**
 * Enhanced progress step configuration
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
 */
export interface EnhancedProgressOptions extends ProgressOptions {
  /** Progress steps configuration */
  steps: EnhancedProgressStep[]
  /** Whether to show time estimates */
  showTimeEstimates?: boolean
  /** Custom format template */
  enhancedFormat?: string
}

/**
 * Enhanced progress tracker with multi-step progress and time estimates
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
  enhancedFormat: 'Progress [{bar}] {percentage}% | {step}/{total} | {stepName} | ETA: {eta}',
  showStepNames: true,
}

/**
 * Create an enhanced progress tracker with multi-step progress and time estimates
 *
 * Provides advanced progress tracking with weighted steps, time estimates,
 * and per-step progress updates. Ideal for complex operations with
 * varying step durations.
 *
 * @param options - Enhanced progress configuration
 * @param options.steps - Array of step configurations with names and weights
 * @param options.showTimeEstimates - Whether to display ETA (default: true)
 * @param options.enhancedFormat - Custom format with {eta} support
 * @returns Enhanced progress tracker with time estimation capabilities
 *
 * @example
 * ```typescript
 * const tracker = createEnhancedProgressTracker({
 *   steps: [
 *     { name: 'Download files', weight: 3 },
 *     { name: 'Process data', weight: 5 },
 *     { name: 'Upload results', weight: 2 }
 *   ],
 *   showTimeEstimates: true
 * });
 *
 * tracker.startNextStep();
 * tracker.updateStepProgress(50); // 50% through download
 * tracker.completeStep();
 *
 * const { remaining, elapsed } = tracker.getTimeEstimate();
 * ```
 */
export function createEnhancedProgressTracker(
  options: EnhancedProgressOptions
): EnhancedProgressTracker {
  const config = { ...DEFAULT_ENHANCED_OPTIONS, ...options }

  let state: EnhancedProgressState = createInitialEnhancedState(config)

  // Initialize cli-progress bar
  const progressBar = new SingleBar({
    ...Presets.shades_classic,
    format: config.enhancedFormat || config.format,
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true,
    ...config.barOptions,
  })

  // Start the progress bar
  progressBar.start(100, 0, {
    step: 1,
    total: config.steps.length,
    stepName: config.steps[0]?.name || 'Starting...',
    eta: 'calculating...',
  })

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

      updateEnhancedProgressBar(progressBar, state, config)
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

      updateEnhancedProgressBar(progressBar, state, config)
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

      progressBar.update(100, {
        step: state.steps.length,
        total: state.steps.length,
        stepName: 'Complete',
        eta: '0s',
      })

      progressBar.stop()
      return state
    },

    getState: () => ({ ...state }),

    reset: (totalSteps: number) => {
      progressBar.stop()
      // Create new steps with equal weights if not provided
      const newSteps = Array.from({ length: totalSteps }, (_, i) => ({
        name: `Step ${i + 1}`,
        weight: 1,
      }))

      state = createInitialEnhancedState({ ...config, steps: newSteps })

      progressBar.start(100, 0, {
        step: 1,
        total: totalSteps,
        stepName: 'Starting...',
        eta: 'calculating...',
      })

      return state
    },

    stop: () => {
      progressBar.stop()
    },

    // Enhanced methods
    getEnhancedState: () => ({ ...state }),

    updateStepProgress: (progress: number) => {
      const clampedProgress = Math.max(0, Math.min(100, progress))
      state = updateEnhancedProgress(state, {
        stepProgress: clampedProgress,
      })

      updateEnhancedProgressBar(progressBar, state, config)
      return state
    },

    startNextStep: (stepName?: string) => {
      const nextIndex = Math.min(state.currentStepIndex + 1, state.steps.length - 1)
      const nextStep = state.steps[nextIndex]

      // Record completion time of previous step
      const completionTime = state.stepStartTime ? Date.now() - state.stepStartTime : 0
      const newCompletionTimes = [...state.stepCompletionTimes, completionTime]

      state = updateEnhancedProgress(state, {
        currentStepIndex: nextIndex,
        stepName: stepName || nextStep?.name || 'Unknown',
        stepProgress: 0,
        stepStartTime: Date.now(),
        stepCompletionTimes: newCompletionTimes,
      })

      updateEnhancedProgressBar(progressBar, state, config)
      return state
    },

    completeStep: (stepName?: string) => {
      // Record completion time
      const completionTime = state.stepStartTime ? Date.now() - state.stepStartTime : 0
      const newCompletionTimes = [...state.stepCompletionTimes, completionTime]

      state = updateEnhancedProgress(state, {
        stepProgress: 100,
        stepName: stepName || state.stepName,
        stepCompletionTimes: newCompletionTimes,
      })

      updateEnhancedProgressBar(progressBar, state, config)
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

  // Calculate overall progress based on step weights and current step progress
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

  // Calculate time estimates
  const completionTimes = updates.stepCompletionTimes ?? currentState.stepCompletionTimes
  const averageStepTime =
    completionTimes.length > 0
      ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length
      : undefined

  // Estimate remaining time based on remaining steps and average completion time
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
 * Update the cli-progress bar with enhanced state
 */
function updateEnhancedProgressBar(
  progressBar: SingleBar,
  state: EnhancedProgressState,
  config: EnhancedProgressOptions
): void {
  const eta = formatTimeEstimate(state.estimatedTimeRemaining)

  const payload = {
    step: state.currentStep,
    total: state.totalSteps,
    stepName: config.showStepNames ? state.stepName : '',
    eta: config.showTimeEstimates ? eta : '',
    stepProgress: state.stepProgress,
    timeElapsed: formatTimeEstimate(state.timeElapsed),
  }

  progressBar.update(state.percentage, payload)
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
