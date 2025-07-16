/**
 * Progress Tracker Tests - High-ROI Testing
 *
 * Tests focus on:
 * - User-facing progress tracking behavior
 * - Business logic for weighted progress calculations
 * - Error handling and edge cases
 * - Integration with CLI workflows
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createProgressTracker, updateProgress, calculateWeightedProgress } from './tracker.js'
import type { ProgressOptions, ProgressState } from './types.js'

describe('Progress Tracker - Core Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createProgressTracker', () => {
    it('should create tracker with default configuration', () => {
      const tracker = createProgressTracker({ totalSteps: 100 })

      expect(tracker).toBeDefined()
      expect(typeof tracker.nextStep).toBe('function')
      expect(typeof tracker.setStep).toBe('function')
      expect(typeof tracker.complete).toBe('function')
      expect(typeof tracker.getState).toBe('function')
      expect(typeof tracker.reset).toBe('function')
      expect(typeof tracker.stop).toBe('function')
    })

    it('should create tracker with custom options', () => {
      const options: ProgressOptions = {
        totalSteps: 100,
        format: 'Test Progress [{bar}] {percentage}% | {step}/{total}',
        showStepNames: true,
        barOptions: {
          barCompleteChar: '=',
          barIncompleteChar: '-',
          hideCursor: true,
        },
      }

      const tracker = createProgressTracker(options)
      const state = tracker.getState()

      expect(state.totalSteps).toBe(100)
      expect(state.currentStep).toBe(0)
      expect(state.percentage).toBe(0)
      expect(state.stepName).toBe('Starting...')
    })

    it('should handle zero total gracefully', () => {
      const tracker = createProgressTracker({ totalSteps: 0 })
      const state = tracker.getState()

      expect(state.totalSteps).toBe(0)
      expect(state.percentage).toBe(0) // 0% when total is 0 due to division safety
    })
  })

  describe('Progress Updates', () => {
    it('should update progress correctly with nextStep', () => {
      const tracker = createProgressTracker({ totalSteps: 4 })

      tracker.nextStep('Step 1')

      const state = tracker.getState()
      expect(state.currentStep).toBe(1)
      expect(state.percentage).toBe(25)
      expect(state.stepName).toBe('Step 1')
    })

    it('should update progress with setStep', () => {
      const tracker = createProgressTracker({ totalSteps: 4 })

      tracker.setStep(2, 'Step 2')

      const state = tracker.getState()
      expect(state.currentStep).toBe(2)
      expect(state.percentage).toBe(50)
      expect(state.stepName).toBe('Step 2')
    })

    it('should handle progress exceeding total', () => {
      const tracker = createProgressTracker({ totalSteps: 4 })

      tracker.setStep(10, 'Beyond total') // Exceeds total

      const state = tracker.getState()
      expect(state.currentStep).toBe(4) // Should clamp to totalSteps
      expect(state.percentage).toBe(100)
    })

    it('should handle negative progress values', () => {
      const tracker = createProgressTracker({ totalSteps: 4 })

      tracker.setStep(-1, 'Negative')

      const state = tracker.getState()
      expect(state.currentStep).toBe(0) // Should clamp to 0
      expect(state.percentage).toBe(0)
    })
  })

  describe('Progress State Management', () => {
    it('should track completion state correctly', () => {
      const tracker = createProgressTracker({ totalSteps: 4 })

      let state = tracker.getState()
      expect(state.completed).toBe(false)

      tracker.setStep(4, 'Last step')
      state = tracker.getState()
      expect(state.completed).toBe(true)
      expect(state.percentage).toBe(100)
    })

    it('should complete tracker explicitly', () => {
      const tracker = createProgressTracker({ totalSteps: 4 })

      tracker.setStep(2, 'Mid progress')
      const completeState = tracker.complete()

      expect(completeState.currentStep).toBe(4)
      expect(completeState.percentage).toBe(100)
      expect(completeState.completed).toBe(true)
      expect(completeState.stepName).toBe('Complete')
    })

    it('should reset tracker properly', () => {
      const tracker = createProgressTracker({ totalSteps: 4 })

      tracker.setStep(2, 'Mid progress')
      const resetState = tracker.reset(10)

      expect(resetState.currentStep).toBe(0)
      expect(resetState.totalSteps).toBe(10)
      expect(resetState.percentage).toBe(0)
      expect(resetState.stepName).toBe('Starting...')
      expect(resetState.completed).toBe(false)
    })
  })

  describe('Progress with Metadata', () => {
    it('should support custom metadata', () => {
      const tracker = createProgressTracker({ totalSteps: 4 })

      tracker.nextStep('Processing files', { fileName: 'test.txt', size: 1024 })

      const state = tracker.getState()
      expect(state.currentStep).toBe(1)
      expect(state.metadata).toEqual({ fileName: 'test.txt', size: 1024 })
    })

    it('should update metadata with setStep', () => {
      const tracker = createProgressTracker({ totalSteps: 4 })

      tracker.setStep(1, 'Reading', { phase: 'start' })
      tracker.setStep(1, 'Processing', { phase: 'middle' }) // Same step, different metadata

      const state = tracker.getState()
      expect(state.currentStep).toBe(1)
      expect(state.stepName).toBe('Processing')
      expect(state.metadata).toEqual({ phase: 'middle' })
    })
  })
})

describe('updateProgress - Standalone Function', () => {
  it('should update existing progress state', () => {
    const initialState: ProgressState = {
      currentStep: 0,
      totalSteps: 100,
      stepName: 'Starting...',
      percentage: 0,
      startTime: Date.now(),
      completed: false,
      metadata: {},
    }

    const updatedState = updateProgress(initialState, { currentStep: 50 })

    expect(updatedState.currentStep).toBe(50)
    expect(updatedState.percentage).toBe(50)
    expect(updatedState.totalSteps).toBe(100) // Unchanged
    expect(updatedState.completed).toBe(false)
  })

  it('should handle metadata updates', () => {
    const initialState: ProgressState = {
      currentStep: 25,
      totalSteps: 100,
      stepName: 'Processing',
      percentage: 25,
      startTime: Date.now(),
      completed: false,
      metadata: { task: 'initial' },
    }

    const updatedState = updateProgress(initialState, {
      currentStep: 50,
      metadata: { task: 'updated', file: 'test.js' },
    })

    expect(updatedState.currentStep).toBe(50)
    expect(updatedState.metadata).toEqual({ task: 'updated', file: 'test.js' })
  })

  it('should preserve existing metadata when none provided', () => {
    const initialState: ProgressState = {
      currentStep: 25,
      totalSteps: 100,
      stepName: 'Working',
      percentage: 25,
      startTime: Date.now(),
      completed: false,
      metadata: { important: 'data' },
    }

    const updatedState = updateProgress(initialState, { currentStep: 75 })

    expect(updatedState.currentStep).toBe(75)
    expect(updatedState.metadata).toEqual({ important: 'data' })
  })
})

describe('calculateWeightedProgress - Business Logic', () => {
  it('should calculate progress with equal weights', () => {
    const weights = [1, 1, 1]
    const currentStep = 2
    const totalSteps = 3

    const result = calculateWeightedProgress(currentStep, totalSteps, weights)

    // 2 steps completed out of 3 with equal weights = 66.67%
    expect(result).toBe(67) // Rounded
  })

  it('should calculate progress with different weights', () => {
    const weights = [3, 1] // First step has weight 3, second has weight 1
    const currentStep = 1
    const totalSteps = 2

    const result = calculateWeightedProgress(currentStep, totalSteps, weights)

    // First step (weight 3) completed out of total weight 4 = 75%
    expect(result).toBe(75)
  })

  it('should handle missing weights array', () => {
    const result = calculateWeightedProgress(2, 4)

    // Falls back to equal weights: 2/4 = 50%
    expect(result).toBe(50)
  })

  it('should handle weights array with wrong length', () => {
    const weights = [1, 2] // Only 2 weights for 4 steps
    const result = calculateWeightedProgress(2, 4, weights)

    // Falls back to equal weights when length mismatch
    expect(result).toBe(50)
  })

  it('should handle zero total steps', () => {
    const result = calculateWeightedProgress(0, 0)

    // 0/0 case, but handled safely
    expect(result).toBe(0)
  })

  it('should handle edge case with zero weights', () => {
    const weights = [0, 1]
    const currentStep = 1
    const totalSteps = 2

    const result = calculateWeightedProgress(currentStep, totalSteps, weights)

    // First step has 0 weight, so progress is 0%
    expect(result).toBe(0)
  })
})

describe('Integration Scenarios', () => {
  it('should handle typical CLI workflow', () => {
    const tracker = createProgressTracker({
      totalSteps: 4,
      format: 'Processing [{bar}] {percentage}% | {step}/{total} | {stepName}',
    })

    // Process files incrementally
    tracker.nextStep('Reading files', { count: 25 })
    tracker.nextStep('Transforming files', { count: 50 })
    tracker.nextStep('Writing output', { count: 75 })
    tracker.complete()

    const finalState = tracker.getState()
    expect(finalState.currentStep).toBe(4)
    expect(finalState.percentage).toBe(100)
    expect(finalState.stepName).toBe('Complete')
    expect(finalState.completed).toBe(true)
  })

  it('should handle multi-step weighted progress', () => {
    // Simulate a build process with multiple weighted steps
    const weights = [1, 3, 2, 1] // Dependencies, Compilation, Testing, Packaging
    const currentStep = 2 // Completed Dependencies and Compilation
    const totalSteps = 4

    const result = calculateWeightedProgress(currentStep, totalSteps, weights)

    // (1 + 3) / 7 = 4/7 ≈ 57.1%
    expect(result).toBe(57) // Rounded
  })

  it('should handle error scenarios gracefully', () => {
    const tracker = createProgressTracker({ totalSteps: 4 })

    // Simulate error during processing
    tracker.setStep(2, 'Processing', { status: 'running' })
    tracker.setStep(2, 'Error occurred', { status: 'error', error: 'File not found' })

    const state = tracker.getState()
    expect(state.metadata?.error).toBe('File not found')
    expect(state.currentStep).toBe(2) // Progress should remain at error point
  })
})
