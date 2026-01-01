import { describe, it, expect } from 'vitest'
import { executeWithPhases } from '../src/command/patterns.js'
import { createMockContext } from '../src/testing/context.js'
import { ok, err, createCoreError } from '@trailhead/core'

describe('command patterns', () => {
  describe('executeWithPhases', () => {
    it('executes phases in sequence', async () => {
      const executionOrder: string[] = []

      const phases = [
        {
          name: 'phase1',
          execute: async (data: any) => {
            executionOrder.push('phase1')
            return ok({ ...data, phase1: true })
          },
        },
        {
          name: 'phase2',
          execute: async (data: any) => {
            executionOrder.push('phase2')
            return ok({ ...data, phase2: true })
          },
        },
        {
          name: 'phase3',
          execute: async (data: any) => {
            executionOrder.push('phase3')
            return ok({ ...data, phase3: true })
          },
        },
      ]

      const ctx = createMockContext()
      const result = await executeWithPhases(phases, {}, ctx)

      expect(result.isOk()).toBe(true)
      expect(executionOrder).toEqual(['phase1', 'phase2', 'phase3'])

      if (result.isOk()) {
        expect(result.value).toEqual({
          phase1: true,
          phase2: true,
          phase3: true,
        })
      }
    })

    it('stops on first error', async () => {
      const executionOrder: string[] = []

      const phases = [
        {
          name: 'phase1',
          execute: async (data: any) => {
            executionOrder.push('phase1')
            return ok(data)
          },
        },
        {
          name: 'phase2',
          execute: async (data: any) => {
            executionOrder.push('phase2')
            return err(createCoreError('PHASE_ERROR', 'CLI_ERROR', 'Phase 2 failed'))
          },
        },
        {
          name: 'phase3',
          execute: async (data: any) => {
            executionOrder.push('phase3')
            return ok(data)
          },
        },
      ]

      const ctx = createMockContext()
      const result = await executeWithPhases(phases, {}, ctx)

      expect(result.isErr()).toBe(true)
      expect(executionOrder).toEqual(['phase1', 'phase2']) // phase3 not executed
    })

    it('passes data between phases', async () => {
      const phases = [
        {
          name: 'init',
          execute: async (data: any) => {
            return ok({ count: 1 })
          },
        },
        {
          name: 'increment',
          execute: async (data: any) => {
            return ok({ ...data, count: data.count + 1 })
          },
        },
        {
          name: 'double',
          execute: async (data: any) => {
            return ok({ ...data, count: data.count * 2 })
          },
        },
      ]

      const ctx = createMockContext()
      const result = await executeWithPhases(phases, {}, ctx)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.count).toBe(4) // (1 + 1) * 2
      }
    })
  })
})
