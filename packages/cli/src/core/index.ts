export {
  Ok,
  Err,
  isOk,
  isErr,
  unwrap,
  unwrapOr,
  map,
  mapErr,
  chain,
  expect,
  toNullable,
  toOptional,
  getErrorMessage,
  match,
  all,
  tryCatch,
  tryCatchAsync,
} from './errors/index.js';
export type { Result, AsyncResult } from './errors/index.js';

export {
  createError,
  fileSystemError,
  validationError,
  configurationError,
  displayError,
  formatError,
  createExitHandler,
  retryWithBackoff,
  tryRecover,
  retryAdvanced,
  RetryStrategies,
  createRetryWrapper,
  createCircuitBreaker,
  retryWithTimeout,
  retryParallel,
  createProgressiveRetry,
} from './errors/index.js';
export type { CLIError, AdvancedRetryOptions, CircuitBreakerOptions, CircuitBreaker } from './errors/index.js';

export {
  createValidationPipeline,
  createRule,
  createAsyncRule,
  string,
  nonEmptyString,
  number,
  boolean,
  array,
  object,
  framework,
  semver,
  tsConfig,
  packageJson,
  installOptions,
  projectConfig,
  importStatement,
  jsonContent,
  directoryPath,
  filePath,
  ValidationOk,
  ValidationErr,
} from './validation/index.js';
export type {
  ValidationPipeline,
  ValidationRule,
  ValidationResult,
  ValidationSummary,
  ValidationContext,
  Validator,
  Framework,
} from './validation/index.js';

export {
  createDefaultLogger,
  createSilentLogger,
  createPrefixedLogger,
} from './logger.js';
export type { Logger } from './logger.js';
