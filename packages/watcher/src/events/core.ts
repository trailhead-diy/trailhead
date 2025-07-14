import type {
  FileEvent,
  FileEventType,
  FileStats,
  EventDetails,
  FilterConfig,
  EventTransformer,
  EventBatch,
} from '../types.js'
import type { CreateEventOperations } from './types.js'
import { defaultEventConfig } from './types.js'
import { createWatcherEventError } from '../errors.js'

// ========================================
// Event Operations
// ========================================

export const createEventOperations: CreateEventOperations = (config = {}) => {
  const eventConfig = { ...defaultEventConfig, ...config }

  const createEvent = (
    type: FileEventType,
    path: string,
    stats?: FileStats,
    details?: EventDetails
  ): FileEvent => {
    const event: FileEvent = {
      type,
      path,
      timestamp: eventConfig.enableTimestamps ? Date.now() : 0,
    }

    if (stats && eventConfig.includeStats) {
      ;(event as any).stats = stats
    }

    if (details && eventConfig.includeDetails) {
      ;(event as any).details = details
    }

    if (eventConfig.generateEventIds) {
      ;(event as any).details = {
        ...details,
        eventId: generateEventId(),
      }
    }

    return event
  }

  const filterEvents = (
    events: readonly FileEvent[],
    filter: FilterConfig
  ): readonly FileEvent[] => {
    try {
      return events.filter((event) => {
        // Filter by event types
        if (filter.events && !filter.events.includes(event.type)) {
          return false
        }

        // Filter by file vs directory
        if (filter.files === false && event.stats?.isFile) {
          return false
        }
        if (filter.directories === false && event.stats?.isDirectory) {
          return false
        }

        // Filter by file size
        if (event.stats && typeof event.stats.size === 'number') {
          if (filter.minSize && event.stats.size < filter.minSize) {
            return false
          }
          if (filter.maxSize && event.stats.size > filter.maxSize) {
            return false
          }
        }

        // Filter by modification time
        if (event.stats?.mtime) {
          if (filter.modifiedAfter && event.stats.mtime < filter.modifiedAfter) {
            return false
          }
          if (filter.modifiedBefore && event.stats.mtime > filter.modifiedBefore) {
            return false
          }
        }

        // Filter by file extensions
        if (filter.extensions && filter.extensions.length > 0) {
          const ext = getFileExtension(event.path)
          if (!filter.extensions.includes(ext)) {
            return false
          }
        }

        // Apply custom filters
        if (filter.custom && filter.custom.length > 0) {
          return filter.custom.every((customFilter) => customFilter(event))
        }

        return true
      })
    } catch {
      // Return empty array on filter error
      return []
    }
  }

  const transformEvent = async <T>(
    event: FileEvent,
    transformer: EventTransformer<T>
  ): Promise<T> => {
    try {
      const result = transformer(event)
      return result instanceof Promise ? await result : result
    } catch (error) {
      // INTENTIONAL THROW: This function follows the EventOperations interface contract
      // which requires throwing on transformation errors for compatibility with event
      // processing libraries. The caller expects synchronous error propagation.
      // Converting to Result<T, Error> would break the interface contract.
      throw createWatcherEventError(event.type, event.path, error, { operation: 'transform' })
    }
  }

  const batchEvents = (events: readonly FileEvent[], size: number): readonly EventBatch[] => {
    try {
      if (size <= 0) {
        return []
      }

      const batches: EventBatch[] = []
      for (let i = 0; i < events.length; i += size) {
        const batchEvents = events.slice(i, i + size)
        const timestamp = Date.now()

        batches.push({
          events: batchEvents,
          size: batchEvents.length,
          timestamp,
          duration: 0, // Duration will be calculated when processing
        })
      }

      return batches
    } catch {
      return []
    }
  }

  return {
    createEvent,
    filterEvents,
    transformEvent,
    batchEvents,
  }
}

// ========================================
// Helper Functions
// ========================================

const generateEventId = (): string => {
  return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

const getFileExtension = (filePath: string): string => {
  const lastDotIndex = filePath.lastIndexOf('.')
  const lastSlashIndex = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'))

  if (lastDotIndex > lastSlashIndex && lastDotIndex > 0) {
    return filePath.substring(lastDotIndex + 1).toLowerCase()
  }

  return ''
}
