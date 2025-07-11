// Re-export from @trailhead/core for backward compatibility
export type {
  Result,
  ResultAsync,
  TrailheadError as CLIError,
  ValidationError,
  FileSystemError,
  NetworkError,
  ConfigurationError,
  ExecutionError,
  UserInputError,
  DependencyError,
  DataError,
  GitError,
  CLIError as SpecificCLIError,
  ErrorContext,
  ErrorSeverity,
  SeverityError,
  CategorizedError,
  ErrorCategory,
} from '@trailhead/core';

// Convenience type aliases for backward compatibility
export type CLIResult<T> = Result<T, CLIError>;
export type CLIResultAsync<T> = ResultAsync<T, CLIError>;

export interface ErrorChain {
  readonly error: CLIError;
  readonly chain: readonly CLIError[];
}
