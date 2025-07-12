import type { PatternOperations } from '../types.js';

// ========================================
// Pattern Configuration Defaults
// ========================================

export const defaultPatternConfig = {
  caseSensitive: true,
  dot: false,
  noglobstar: false,
  matchBase: false,
  nocase: false,
} as const;

// ========================================
// Pattern Creation Types
// ========================================

export type CreatePatternOperations = (
  config?: Partial<typeof defaultPatternConfig>
) => PatternOperations;

export interface PatternConfig {
  readonly caseSensitive?: boolean;
  readonly dot?: boolean;
  readonly noglobstar?: boolean;
  readonly matchBase?: boolean;
  readonly nocase?: boolean;
}

// ========================================
// Pattern Matching Types
// ========================================

export interface CompiledPattern {
  readonly pattern: string | RegExp;
  readonly matcher: (path: string) => boolean;
  readonly source: string;
  readonly flags?: string;
}

export interface PatternCache {
  readonly get: (pattern: string) => CompiledPattern | undefined;
  readonly set: (pattern: string, compiled: CompiledPattern) => void;
  readonly clear: () => void;
  readonly size: number;
}

// ========================================
// Glob Pattern Types
// ========================================

export interface GlobOptions {
  readonly dot?: boolean;
  readonly noglobstar?: boolean;
  readonly matchBase?: boolean;
  readonly nocase?: boolean;
  readonly nonegate?: boolean;
  readonly noext?: boolean;
  readonly nonull?: boolean;
  readonly windowsPathsNoEscape?: boolean;
}

// ========================================
// Path Normalization Types
// ========================================

export interface PathNormalizer {
  readonly normalize: (path: string) => string;
  readonly denormalize: (path: string) => string;
  readonly isNormalized: (path: string) => boolean;
}

// ========================================
// Pattern Analysis Types
// ========================================

export interface PatternAnalysis {
  readonly isGlob: boolean;
  readonly isRegex: boolean;
  readonly isLiteral: boolean;
  readonly hasWildcards: boolean;
  readonly hasNegation: boolean;
  readonly segments: readonly string[];
  readonly depth: number;
  readonly specificity: number;
}
