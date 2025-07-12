import path from 'node:path';
import type { EventFilter, FilterConfig, FileEventType, PathMatcher, FileEvent } from '../types.js';
import type { CreateFilterOperations, FilterCache } from './types.js';
import { defaultFilterConfig } from './types.js';

// ========================================
// Filter Operations
// ========================================

export const createFilterOperations: CreateFilterOperations = (config = {}) => {
  const filterConfig = { ...defaultFilterConfig, ...config };
  const cache = filterConfig.enableCaching ? createFilterCache(filterConfig.cacheSize) : null;

  const createFilter = (filterConfig: FilterConfig): EventFilter => {
    return (event: FileEvent): boolean => {
      try {
        const cacheKey = cache ? generateCacheKey(event, filterConfig) : null;

        if (cache && cacheKey) {
          const cached = cache.get(cacheKey);
          if (cached !== undefined) {
            return cached;
          }
        }

        const result = applyFilterConfig(event, filterConfig);

        if (cache && cacheKey) {
          cache.set(cacheKey, result);
        }

        return result;
      } catch (_error) {
        return false;
      }
    };
  };

  const combineFilters = (...filters: EventFilter[]): EventFilter => {
    return (event: FileEvent): boolean => {
      try {
        return filters.every(filter => filter(event));
      } catch (_error) {
        return false;
      }
    };
  };

  const invertFilter = (filter: EventFilter): EventFilter => {
    return (event: FileEvent): boolean => {
      try {
        return !filter(event);
      } catch (_error) {
        return true; // If filter fails, inverted result is true
      }
    };
  };

  const eventTypeFilter = (types: FileEventType[]): EventFilter => {
    const typeSet = new Set(types);
    return (event: FileEvent): boolean => {
      return typeSet.has(event.type);
    };
  };

  const pathFilter = (matcher: PathMatcher): EventFilter => {
    return (event: FileEvent): boolean => {
      try {
        const normalizedPath = filterConfig.caseSensitive ? event.path : event.path.toLowerCase();

        // Check includes
        if (matcher.includes && matcher.includes.length > 0) {
          const includeMatch = matcher.includes.some(pattern =>
            typeof pattern === 'object' && 'pattern' in pattern
              ? matchPattern(normalizedPath, pattern.pattern)
              : matchPattern(normalizedPath, pattern)
          );
          if (!includeMatch) {
            return false;
          }
        }

        // Check excludes
        if (matcher.excludes && matcher.excludes.length > 0) {
          const excludeMatch = matcher.excludes.some(pattern =>
            typeof pattern === 'object' && 'pattern' in pattern
              ? matchPattern(normalizedPath, pattern.pattern)
              : matchPattern(normalizedPath, pattern)
          );
          if (excludeMatch) {
            return false;
          }
        }

        // Check extensions
        if (matcher.extensions && matcher.extensions.length > 0) {
          const ext = path.extname(normalizedPath).substring(1);
          const targetExt = filterConfig.caseSensitive ? ext : ext.toLowerCase();
          const allowedExts = filterConfig.caseSensitive
            ? matcher.extensions
            : matcher.extensions.map(e => e.toLowerCase());

          if (!allowedExts.includes(targetExt)) {
            return false;
          }
        }

        // Check directories
        if (matcher.directories && matcher.directories.length > 0) {
          const dirMatch = matcher.directories.some(dir => {
            const targetDir = filterConfig.caseSensitive ? dir : dir.toLowerCase();
            return normalizedPath.includes(targetDir);
          });
          if (!dirMatch) {
            return false;
          }
        }

        return true;
      } catch (_error) {
        return false;
      }
    };
  };

  const sizeFilter = (minSize?: number, maxSize?: number): EventFilter => {
    return (event: FileEvent): boolean => {
      if (!event.stats || typeof event.stats.size !== 'number') {
        return true; // If no stats, allow through
      }

      const size = event.stats.size;

      if (minSize !== undefined && size < minSize) {
        return false;
      }

      if (maxSize !== undefined && size > maxSize) {
        return false;
      }

      return true;
    };
  };

  const timeFilter = (after?: Date, before?: Date): EventFilter => {
    return (event: FileEvent): boolean => {
      if (!event.stats?.mtime) {
        return true; // If no modification time, allow through
      }

      const mtime = event.stats.mtime;

      if (after && mtime < after) {
        return false;
      }

      if (before && mtime > before) {
        return false;
      }

      return true;
    };
  };

  return {
    createFilter,
    combineFilters,
    invertFilter,
    eventTypeFilter,
    pathFilter,
    sizeFilter,
    timeFilter,
  };
};

// ========================================
// Helper Functions
// ========================================

const createFilterCache = (maxSize: number = 50): FilterCache => {
  const cache = new Map<string, boolean>();
  let metrics = {
    executionTime: 0,
    cacheHits: 0,
    cacheMisses: 0,
    totalExecutions: 0,
    averageExecutionTime: 0,
  };

  return {
    get: (key: string) => {
      const result = cache.get(key);
      if (result !== undefined) {
        metrics.cacheHits++;
      } else {
        metrics.cacheMisses++;
      }
      metrics.totalExecutions++;
      return result;
    },
    set: (key: string, result: boolean) => {
      if (cache.size >= maxSize) {
        // Remove oldest entry
        const firstKey = cache.keys().next().value;
        if (firstKey) {
          cache.delete(firstKey);
        }
      }
      cache.set(key, result);
    },
    clear: () => {
      cache.clear();
      metrics.executionTime = 0;
      metrics.cacheHits = 0;
      metrics.cacheMisses = 0;
      metrics.totalExecutions = 0;
      metrics.averageExecutionTime = 0;
    },
    get size() {
      return cache.size;
    },
    get metrics() {
      return { ...metrics };
    },
  };
};

const generateCacheKey = (event: FileEvent, config: FilterConfig): string => {
  const parts = [
    event.type,
    event.path,
    event.stats?.size?.toString() || '',
    event.stats?.mtime?.getTime().toString() || '',
    JSON.stringify(config),
  ];
  return parts.join('|');
};

const applyFilterConfig = (event: FileEvent, config: FilterConfig): boolean => {
  // Event type filter
  if (config.events && !config.events.includes(event.type)) {
    return false;
  }

  // File vs directory filter
  if (config.files === false && event.stats?.isFile) {
    return false;
  }
  if (config.directories === false && event.stats?.isDirectory) {
    return false;
  }

  // Size filter
  if (event.stats && typeof event.stats.size === 'number') {
    if (config.minSize && event.stats.size < config.minSize) {
      return false;
    }
    if (config.maxSize && event.stats.size > config.maxSize) {
      return false;
    }
  }

  // Time filter
  if (event.stats?.mtime) {
    if (config.modifiedAfter && event.stats.mtime < config.modifiedAfter) {
      return false;
    }
    if (config.modifiedBefore && event.stats.mtime > config.modifiedBefore) {
      return false;
    }
  }

  // Extension filter
  if (config.extensions && config.extensions.length > 0) {
    const ext = path.extname(event.path).substring(1).toLowerCase();
    const allowedExts = config.extensions.map(e => e.toLowerCase());
    if (!allowedExts.includes(ext)) {
      return false;
    }
  }

  // Custom filters
  if (config.custom && config.custom.length > 0) {
    if (!config.custom.every(filter => filter(event))) {
      return false;
    }
  }

  return true;
};

const matchPattern = (path: string, pattern: string | RegExp): boolean => {
  if (typeof pattern === 'string') {
    return path.includes(pattern);
  }
  return pattern.test(path);
};
