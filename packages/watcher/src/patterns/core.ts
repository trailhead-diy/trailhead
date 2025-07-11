import { ok, err } from '@trailhead/core';
import path from 'node:path';
import type { PatternOperations, GlobPattern, PathMatcher, WatcherResult } from '../types.js';
import type { CreatePatternOperations, CompiledPattern, PatternCache } from './types.js';
import { defaultPatternConfig } from './types.js';
import { createPatternError, mapLibraryError } from '../errors.js';

// ========================================
// Pattern Operations
// ========================================

export const createPatternOperations: CreatePatternOperations = (config = {}) => {
  const patternConfig = { ...defaultPatternConfig, ...config };
  const cache = createPatternCache();

  const match = (filePath: string, pattern: string | RegExp | GlobPattern): boolean => {
    try {
      const normalizedPath = path.normalize(filePath);

      if (typeof pattern === 'string') {
        return matchStringPattern(normalizedPath, pattern);
      }

      if (pattern instanceof RegExp) {
        return pattern.test(normalizedPath);
      }

      // GlobPattern
      return matchGlobPattern(normalizedPath, pattern);
    } catch (error) {
      return false;
    }
  };

  const matchAny = (
    filePath: string,
    patterns: ReadonlyArray<string | RegExp | GlobPattern>
  ): boolean => {
    try {
      return patterns.some(pattern => match(filePath, pattern));
    } catch (error) {
      return false;
    }
  };

  const createMatcher = (config: PathMatcher): ((path: string) => boolean) => {
    return (filePath: string): boolean => {
      try {
        const normalizedPath = patternConfig.caseSensitive ? filePath : filePath.toLowerCase();

        // Check includes (if specified, path must match at least one)
        if (config.includes && config.includes.length > 0) {
          const includeMatch = config.includes.some(pattern => match(normalizedPath, pattern));
          if (!includeMatch) {
            return false;
          }
        }

        // Check excludes (if any match, exclude the path)
        if (config.excludes && config.excludes.length > 0) {
          const excludeMatch = config.excludes.some(pattern => match(normalizedPath, pattern));
          if (excludeMatch) {
            return false;
          }
        }

        // Check extensions
        if (config.extensions && config.extensions.length > 0) {
          const ext = path.extname(normalizedPath).substring(1);
          const targetExt = patternConfig.caseSensitive ? ext : ext.toLowerCase();
          const allowedExts = patternConfig.caseSensitive
            ? config.extensions
            : config.extensions.map(e => e.toLowerCase());

          if (!allowedExts.includes(targetExt)) {
            return false;
          }
        }

        // Check directories
        if (config.directories && config.directories.length > 0) {
          const dirMatch = config.directories.some(dir => {
            const targetDir = patternConfig.caseSensitive ? dir : dir.toLowerCase();
            return normalizedPath.includes(targetDir);
          });
          if (!dirMatch) {
            return false;
          }
        }

        return true;
      } catch (error) {
        return false;
      }
    };
  };

  const globToRegex = (pattern: string): RegExp => {
    try {
      const cached = cache.get(pattern);
      if (cached && cached.pattern instanceof RegExp) {
        return cached.pattern;
      }

      const regex = convertGlobToRegex(pattern);
      cache.set(pattern, {
        pattern: regex,
        matcher: (path: string) => regex.test(path),
        source: pattern,
        flags: regex.flags,
      });

      return regex;
    } catch (error) {
      throw createPatternError(pattern, 'globToRegex', error);
    }
  };

  const isGlobPattern = (pattern: string): boolean => {
    return /[*?[\]{}()]/.test(pattern);
  };

  return {
    match,
    matchAny,
    createMatcher,
    globToRegex,
    isGlobPattern,
  };
};

// ========================================
// Helper Functions
// ========================================

const createPatternCache = (): PatternCache => {
  const cache = new Map<string, CompiledPattern>();
  const maxSize = 100;

  return {
    get: (pattern: string) => cache.get(pattern),
    set: (pattern: string, compiled: CompiledPattern) => {
      if (cache.size >= maxSize) {
        // Remove oldest entry
        const firstKey = cache.keys().next().value;
        if (firstKey) {
          cache.delete(firstKey);
        }
      }
      cache.set(pattern, compiled);
    },
    clear: () => cache.clear(),
    get size() {
      return cache.size;
    },
  };
};

const matchStringPattern = (filePath: string, pattern: string): boolean => {
  if (pattern.includes('*') || pattern.includes('?')) {
    // Convert glob to regex
    const regex = convertGlobToRegex(pattern);
    return regex.test(filePath);
  }

  // Exact match or substring match
  return filePath === pattern || filePath.includes(pattern);
};

const matchGlobPattern = (filePath: string, globPattern: GlobPattern): boolean => {
  const regex = convertGlobToRegex(globPattern.pattern, globPattern.options);
  return regex.test(filePath);
};

const convertGlobToRegex = (
  pattern: string,
  options: { dot?: boolean; nocase?: boolean; matchBase?: boolean } = {}
): RegExp => {
  let regexStr = '';
  let inGroup = false;
  let inClass = false;

  for (let i = 0; i < pattern.length; i++) {
    const char = pattern[i];

    switch (char) {
      case '\\':
        regexStr += '\\\\';
        break;
      case '/':
        regexStr += '/';
        break;
      case '$':
      case '^':
      case '+':
      case '.':
      case '(':
      case ')':
      case '=':
      case '!':
      case '|':
        regexStr += '\\' + char;
        break;
      case '?':
        regexStr += inClass ? '?' : '[^/]';
        break;
      case '[':
        inClass = true;
        regexStr += '[';
        break;
      case ']':
        inClass = false;
        regexStr += ']';
        break;
      case '{':
        inGroup = true;
        regexStr += '(';
        break;
      case '}':
        inGroup = false;
        regexStr += ')';
        break;
      case ',':
        regexStr += inGroup ? '|' : '\\,';
        break;
      case '*':
        if (pattern[i + 1] === '*' && pattern[i + 2] === '/') {
          // **/ matches zero or more directories
          regexStr += '(?:[^/]*(?:/|$))*';
          i += 2;
        } else if (pattern[i + 1] === '*') {
          // ** matches everything including /
          regexStr += '.*';
          i += 1;
        } else {
          // * matches anything except /
          regexStr += '[^/]*';
        }
        break;
      default:
        regexStr += char;
    }
  }

  const flags = options.nocase ? 'i' : '';
  return new RegExp('^' + regexStr + '$', flags);
};
