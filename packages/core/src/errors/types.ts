// Re-export core neverthrow types
import type { Result, ResultAsync } from 'neverthrow';
export type { Result, ResultAsync, Err as ErrType, Ok as OkType } from 'neverthrow';

// Trailhead Error System - Unified error types for the entire ecosystem
export interface TrailheadError {
  readonly type: string;
  readonly message: string;
  readonly details?: string;
  readonly cause?: unknown;
  readonly suggestion?: string;
  readonly recoverable: boolean;
  readonly context?: Record<string, unknown>;
}

// Core error categories for the Trailhead System
export type ErrorCategory =
  | 'validation'
  | 'filesystem'
  | 'network'
  | 'configuration'
  | 'execution'
  | 'user-input'
  | 'dependency'
  | 'data'
  | 'git'
  | 'cli'
  | 'db'
  | 'unknown';

// Base categorized error interface
export interface CategorizedError extends TrailheadError {
  readonly category: ErrorCategory;
}

// Specific error types for different domains
export interface ValidationError extends CategorizedError {
  readonly category: 'validation';
  readonly field?: string;
  readonly value?: unknown;
  readonly constraints?: Record<string, unknown>;
}

export interface FileSystemError extends CategorizedError {
  readonly category: 'filesystem';
  readonly path: string;
  readonly operation: 'read' | 'write' | 'delete' | 'create' | 'copy' | 'move' | 'stat' | 'watch';
  readonly errno?: number;
}

export interface NetworkError extends CategorizedError {
  readonly category: 'network';
  readonly url?: string;
  readonly statusCode?: number;
  readonly timeout?: boolean;
}

export interface ConfigurationError extends CategorizedError {
  readonly category: 'configuration';
  readonly configFile?: string;
  readonly missingFields?: string[];
  readonly invalidFields?: string[];
}

export interface ExecutionError extends CategorizedError {
  readonly category: 'execution';
  readonly command?: string;
  readonly exitCode?: number;
  readonly stdout?: string;
  readonly stderr?: string;
}

export interface UserInputError extends CategorizedError {
  readonly category: 'user-input';
  readonly input?: string;
  readonly expectedFormat?: string;
}

export interface DependencyError extends CategorizedError {
  readonly category: 'dependency';
  readonly packageName?: string;
  readonly requiredVersion?: string;
  readonly installedVersion?: string;
}

export interface DataError extends CategorizedError {
  readonly category: 'data';
  readonly format?: 'csv' | 'json' | 'excel' | 'yaml' | 'xml';
  readonly row?: number;
  readonly column?: string;
}

export interface GitError extends CategorizedError {
  readonly category: 'git';
  readonly repository?: string;
  readonly branch?: string;
  readonly operation?: string;
}

export interface CLIError extends CategorizedError {
  readonly category: 'cli';
  readonly code?: string;
  readonly command?: string;
  readonly args?: string[];
}

export interface DatabaseError extends CategorizedError {
  readonly category: 'db';
  readonly query?: string;
  readonly table?: string;
  readonly operation?: 'select' | 'insert' | 'update' | 'delete' | 'migrate' | 'connect';
}

// Union of all specific error types
export type SpecificError =
  | ValidationError
  | FileSystemError
  | NetworkError
  | ConfigurationError
  | ExecutionError
  | UserInputError
  | DependencyError
  | DataError
  | GitError
  | CLIError
  | DatabaseError;

// Convenience type aliases for Result types
export type TrailheadResult<T> = Result<T, TrailheadError>;
export type TrailheadResultAsync<T> = ResultAsync<T, TrailheadError>;

// Error context for enhanced debugging
export interface ErrorContext {
  readonly operation: string;
  readonly component: string;
  readonly timestamp: Date;
  readonly environment?: Record<string, string>;
  readonly metadata?: Record<string, unknown>;
}

// Error severity levels
export type ErrorSeverity = 'fatal' | 'error' | 'warning' | 'info';

export interface SeverityError extends TrailheadError {
  readonly severity: ErrorSeverity;
}

// Error chain for tracking error propagation
export interface ErrorChain {
  readonly error: TrailheadError;
  readonly chain: readonly TrailheadError[];
}
