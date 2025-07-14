import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createWatcherOperations } from './core.js'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { mkdir, rm } from 'node:fs/promises'

describe('Watcher Operations', () => {
  const watcherOps = createWatcherOperations()
  let testDir: string

  beforeEach(async () => {
    testDir = join(tmpdir(), `watcher-test-${Date.now()}`)
    await mkdir(testDir, { recursive: true })
  })

  afterEach(async () => {
    await watcherOps.closeAll()
    try {
      await rm(testDir, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  describe('create', () => {
    it('should create a file watcher successfully', () => {
      const result = watcherOps.create(testDir)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        const watcher = result.value
        expect(watcher).toBeDefined()
        expect(typeof watcher.getState).toBe('function')
        expect(typeof watcher.close).toBe('function')
      }
    })

    it('should handle multiple paths', async () => {
      const paths = [testDir, tmpdir()]
      const result = watcherOps.create(paths)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        const watcher = result.value

        // Wait for watcher to initialize before checking watched paths
        await new Promise((resolve) => setTimeout(resolve, 100))

        const watched = watcher.getWatched()
        expect(Object.keys(watched).length).toBeGreaterThan(0)
      }
    })

    it('should handle watcher options', () => {
      const result = watcherOps.create(testDir, {
        ignoreInitial: true,
        depth: 1,
      })

      expect(result.isOk()).toBe(true)
    })
  })

  describe('isWatching', () => {
    it('should return false for unwatched paths', () => {
      const isWatching = watcherOps.isWatching('/non/existent/path')
      expect(isWatching).toBe(false)
    })

    it('should return true for watched paths', async () => {
      const result = watcherOps.create(testDir)
      expect(result.isOk()).toBe(true)

      if (result.isOk()) {
        // Need to wait a bit for watcher to initialize
        await new Promise((resolve) => setTimeout(resolve, 100))

        const isWatching = watcherOps.isWatching(testDir)
        expect(isWatching).toBe(true)
      }
    })
  })

  describe('getActiveWatchers', () => {
    it('should return empty array initially', () => {
      const watchers = watcherOps.getActiveWatchers()
      expect(watchers).toHaveLength(0)
    })

    it('should track active watchers', () => {
      const result1 = watcherOps.create(testDir)
      const result2 = watcherOps.create(tmpdir())

      expect(result1.isOk()).toBe(true)
      expect(result2.isOk()).toBe(true)

      const watchers = watcherOps.getActiveWatchers()
      expect(watchers.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('closeAll', () => {
    it('should close all active watchers', async () => {
      // Create multiple watchers
      watcherOps.create(testDir)
      watcherOps.create(tmpdir())

      const beforeClose = watcherOps.getActiveWatchers()
      expect(beforeClose.length).toBeGreaterThanOrEqual(2)

      const result = await watcherOps.closeAll()
      expect(result.isOk()).toBe(true)

      const afterClose = watcherOps.getActiveWatchers()
      expect(afterClose).toHaveLength(0)
    })
  })

  describe('FileWatcher', () => {
    it('should provide watcher state', () => {
      const result = watcherOps.create(testDir)
      expect(result.isOk()).toBe(true)

      if (result.isOk()) {
        const watcher = result.value
        const state = watcher.getState()

        expect(state).toBeDefined()
        expect(typeof state.isWatching).toBe('boolean')
        expect(typeof state.eventCount).toBe('number')
        expect(typeof state.startTime).toBe('number')
      }
    })

    it('should provide watcher metrics', () => {
      const result = watcherOps.create(testDir)
      expect(result.isOk()).toBe(true)

      if (result.isOk()) {
        const watcher = result.value
        const metrics = watcher.getMetrics()

        expect(metrics).toBeDefined()
        expect(typeof metrics.totalEvents).toBe('number')
        expect(typeof metrics.uptime).toBe('number')
        expect(typeof metrics.eventsPerSecond).toBe('number')
        expect(metrics.eventTypeDistribution).toBeDefined()
      }
    })

    it('should support adding and removing paths', () => {
      const result = watcherOps.create([])
      expect(result.isOk()).toBe(true)

      if (result.isOk()) {
        const watcher = result.value

        const addResult = watcher.add(testDir)
        expect(addResult.isOk()).toBe(true)

        const unwatchResult = watcher.unwatch(testDir)
        expect(unwatchResult.isOk()).toBe(true)
      }
    })

    it('should support event handlers', () => {
      const result = watcherOps.create(testDir)
      expect(result.isOk()).toBe(true)

      if (result.isOk()) {
        const watcher = result.value
        let eventReceived = false

        watcher.on('ready', () => {
          eventReceived = true
        })

        // The ready event should fire automatically
        setTimeout(() => {
          expect(eventReceived).toBe(true)
        }, 200)
      }
    })

    it('should support closing watcher', async () => {
      const result = watcherOps.create(testDir)
      expect(result.isOk()).toBe(true)

      if (result.isOk()) {
        const watcher = result.value
        const closeResult = await watcher.close()
        expect(closeResult.isOk()).toBe(true)

        const state = watcher.getState()
        expect(state.isWatching).toBe(false)
      }
    })
  })
})
