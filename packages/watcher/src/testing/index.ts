/**
 * @esteban-url/watcher/testing
 *
 * File watcher testing utilities for simulating file system events and testing watch operations.
 * Provides domain-focused utilities for testing file watching, change detection, and event handling.
 *
 * @example
 * ```typescript
 * import {
 *   createMockWatcher,
 *   simulateFileChange,
 *   assertFileWatchEvent,
 *   watcherFixtures,
 * } from '@esteban-url/watcher/testing'
 * 
 * // Create mock watcher
 * const mockWatcher = createMockWatcher()
 * 
 * // Simulate file changes
 * await simulateFileChange(mockWatcher, 'src/index.ts', 'change')
 * 
 * // Assert events were fired
 * assertFileWatchEvent(mockWatcher.events, 'change', 'src/index.ts')
 * ```
 */

import { ok, err, type Result } from '@esteban-url/core'
import type { CoreError } from '@esteban-url/core'

// ========================================
// File Watcher Event Types
// ========================================

export type WatchEventType = 'change' | 'add' | 'unlink' | 'addDir' | 'unlinkDir'

export interface WatchEvent {
  type: WatchEventType
  path: string
  timestamp: number
  stats?: {
    size: number
    mtime: Date
    isFile: boolean
    isDirectory: boolean
  }
}

export interface MockWatcherState {
  readonly events: WatchEvent[]
  readonly watchers: Map<string, MockFileWatcher>
  readonly isWatching: boolean
}

// ========================================
// Mock File Watcher
// ========================================

export interface MockFileWatcher {
  readonly path: string
  readonly options: WatchOptions
  readonly events: WatchEvent[]
  on(event: WatchEventType, handler: (path: string) => void): void
  off(event: WatchEventType, handler: (path: string) => void): void
  close(): void
  simulateEvent(type: WatchEventType, filePath: string): void
}

export interface WatchOptions {
  ignored?: string[]
  persistent?: boolean
  ignoreInitial?: boolean
  followSymlinks?: boolean
  cwd?: string
  disableGlobbing?: boolean
}

/**
 * Creates a mock file watcher for testing
 */
export function createMockWatcher(
  watchPath: string = process.cwd(),
  options: WatchOptions = {}
): MockFileWatcher {
  const events: WatchEvent[] = []
  const handlers = new Map<WatchEventType, Array<(path: string) => void>>()
  
  return {
    path: watchPath,
    options,
    events,
    
    on(event: WatchEventType, handler: (path: string) => void): void {
      if (!handlers.has(event)) {
        handlers.set(event, [])
      }
      handlers.get(event)!.push(handler)
    },
    
    off(event: WatchEventType, handler: (path: string) => void): void {
      const eventHandlers = handlers.get(event)
      if (eventHandlers) {
        const index = eventHandlers.indexOf(handler)
        if (index > -1) {
          eventHandlers.splice(index, 1)
        }
      }
    },
    
    close(): void {
      handlers.clear()
    },
    
    simulateEvent(type: WatchEventType, filePath: string): void {
      const event: WatchEvent = {
        type,
        path: filePath,
        timestamp: Date.now(),
        stats: {
          size: Math.floor(Math.random() * 10000),
          mtime: new Date(),
          isFile: !type.includes('Dir'),
          isDirectory: type.includes('Dir'),
        },
      }
      
      events.push(event)
      
      // Trigger handlers
      const eventHandlers = handlers.get(type)
      if (eventHandlers) {
        eventHandlers.forEach(handler => handler(filePath))
      }
    },
  }
}

// ========================================
// Watcher Test Simulation
// ========================================

/**
 * Simulates a file change event
 */
export async function simulateFileChange(
  watcher: MockFileWatcher,
  filePath: string,
  changeType: WatchEventType = 'change',
  delay: number = 0
): Promise<void> {
  if (delay > 0) {
    await new Promise(resolve => setTimeout(resolve, delay))
  }
  
  watcher.simulateEvent(changeType, filePath)
}

/**
 * Simulates multiple file changes in sequence
 */
export async function simulateFileChanges(
  watcher: MockFileWatcher,
  changes: Array<{ path: string; type: WatchEventType; delay?: number }>
): Promise<void> {
  for (const change of changes) {
    await simulateFileChange(watcher, change.path, change.type, change.delay)
  }
}

/**
 * Simulates a burst of file changes (common in build tools)
 */
export async function simulateFileBurst(
  watcher: MockFileWatcher,
  files: string[],
  changeType: WatchEventType = 'change'
): Promise<void> {
  // Simulate all changes happening nearly simultaneously
  files.forEach(file => {
    watcher.simulateEvent(changeType, file)
  })
}

// ========================================
// Watcher Fixtures and Test Data
// ========================================

export const watcherFixtures = {
  /**
   * Common file patterns for testing
   */
  filePaths: {
    source: [
      'src/index.ts',
      'src/components/Button.tsx',
      'src/utils/helpers.ts',
      'src/types/index.ts',
    ],
    
    config: [
      'package.json',
      'tsconfig.json',
      'vite.config.ts',
      '.env',
    ],
    
    build: [
      'dist/index.js',
      'dist/index.d.ts',
      'dist/components/Button.js',
      'build/assets/style.css',
    ],
    
    docs: [
      'README.md',
      'docs/api.md',
      'docs/guide.md',
      'CHANGELOG.md',
    ],
  },
  
  /**
   * Common watch patterns and ignores
   */
  watchPatterns: {
    sourceOnly: {
      paths: ['src/**/*'],
      ignored: ['node_modules/**', 'dist/**', '**/*.test.ts'],
    },
    
    allFiles: {
      paths: ['**/*'],
      ignored: ['node_modules/**', '.git/**', '**/.DS_Store'],
    },
    
    buildOutput: {
      paths: ['dist/**/*', 'build/**/*'],
      ignored: ['**/*.map', '**/*.tmp'],
    },
  },
  
  /**
   * Sample event sequences for testing
   */
  eventSequences: {
    fileEdit: [
      { path: 'src/index.ts', type: 'change' as WatchEventType },
    ],
    
    fileCreation: [
      { path: 'src/new-file.ts', type: 'add' as WatchEventType },
      { path: 'src/new-file.ts', type: 'change' as WatchEventType, delay: 100 },
    ],
    
    fileDeletion: [
      { path: 'src/old-file.ts', type: 'unlink' as WatchEventType },
    ],
    
    directoryOperations: [
      { path: 'src/components', type: 'addDir' as WatchEventType },
      { path: 'src/components/Button.tsx', type: 'add' as WatchEventType, delay: 50 },
      { path: 'src/components/Input.tsx', type: 'add' as WatchEventType, delay: 100 },
    ],
    
    buildProcess: [
      { path: 'src/index.ts', type: 'change' as WatchEventType },
      { path: 'dist/index.js', type: 'change' as WatchEventType, delay: 200 },
      { path: 'dist/index.d.ts', type: 'change' as WatchEventType, delay: 250 },
    ],
  },
}

// ========================================
// Watcher Assertions
// ========================================

/**
 * Asserts that a specific watch event occurred
 */
export function assertFileWatchEvent(
  events: WatchEvent[],
  expectedType: WatchEventType,
  expectedPath: string
): void {
  const event = events.find(e => e.type === expectedType && e.path === expectedPath)
  
  if (!event) {
    const eventSummary = events.map(e => `${e.type}:${e.path}`).join(', ')
    throw new Error(
      `Expected watch event "${expectedType}:${expectedPath}" not found. Found: ${eventSummary}`
    )
  }
}

/**
 * Asserts that events occurred in a specific order
 */
export function assertEventOrder(
  events: WatchEvent[],
  expectedOrder: Array<{ type: WatchEventType; path: string }>
): void {
  if (events.length < expectedOrder.length) {
    throw new Error(
      `Expected at least ${expectedOrder.length} events, but got ${events.length}`
    )
  }
  
  for (let i = 0; i < expectedOrder.length; i++) {
    const expected = expectedOrder[i]
    const actual = events[i]
    
    if (actual.type !== expected.type || actual.path !== expected.path) {
      throw new Error(
        `Event at position ${i}: expected "${expected.type}:${expected.path}", got "${actual.type}:${actual.path}"`
      )
    }
  }
}

/**
 * Asserts that no events occurred for a specific file
 */
export function assertNoEventsForFile(events: WatchEvent[], filePath: string): void {
  const fileEvents = events.filter(e => e.path === filePath)
  
  if (fileEvents.length > 0) {
    const eventTypes = fileEvents.map(e => e.type).join(', ')
    throw new Error(`Expected no events for "${filePath}", but found: ${eventTypes}`)
  }
}

/**
 * Asserts that events occurred within a time window
 */
export function assertEventsWithinTimeWindow(
  events: WatchEvent[],
  windowMs: number,
  startTime?: number
): void {
  const start = startTime || events[0]?.timestamp || Date.now()
  const end = start + windowMs
  
  const eventsOutsideWindow = events.filter(e => e.timestamp < start || e.timestamp > end)
  
  if (eventsOutsideWindow.length > 0) {
    throw new Error(
      `${eventsOutsideWindow.length} events occurred outside the ${windowMs}ms time window`
    )
  }
}

// ========================================
// Watcher Test Helpers
// ========================================

/**
 * Creates a test scenario for file watching
 */
export function createWatcherTestScenario(options: {
  watchPath?: string
  watchOptions?: WatchOptions
  simulatedChanges?: Array<{ path: string; type: WatchEventType; delay?: number }>
} = {}): {
  watcher: MockFileWatcher
  runScenario: () => Promise<void>
  getEvents: () => WatchEvent[]
  cleanup: () => void
} {
  const watcher = createMockWatcher(options.watchPath, options.watchOptions)
  
  return {
    watcher,
    
    async runScenario(): Promise<void> {
      if (options.simulatedChanges) {
        await simulateFileChanges(watcher, options.simulatedChanges)
      }
    },
    
    getEvents(): WatchEvent[] {
      return [...watcher.events]
    },
    
    cleanup(): void {
      watcher.close()
    },
  }
}

// ========================================
// Export Collections
// ========================================

/**
 * Watcher testing utilities grouped by functionality
 */
export const watcherTesting = {
  // Mock creation
  createMockWatcher,
  createWatcherTestScenario,
  
  // Event simulation
  simulateFileChange,
  simulateFileChanges,
  simulateFileBurst,
  
  // Fixtures and test data
  fixtures: watcherFixtures,
  
  // Assertions
  assertFileWatchEvent,
  assertEventOrder,
  assertNoEventsForFile,
  assertEventsWithinTimeWindow,
}