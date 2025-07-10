export {
  ok,
  err,
  Result,
  ResultAsync,
  fromThrowable,
  fromPromise,
  safeTry,
} from './errors/index.js';
export type { Result as ResultType, ResultAsync as ResultAsyncType } from './errors/index.js';

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
export type {
  CLIError,
  AdvancedRetryOptions,
  CircuitBreakerOptions,
  CircuitBreaker,
} from './errors/index.js';

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

export { createDefaultLogger, createSilentLogger, createPrefixedLogger } from './logger.js';
export type { Logger } from './logger.js';

// Flow Control & Error Handling - GitHub issue #113
export { pipeline, parallel, parallelSettled, retryPipeline } from './pipeline.js';
export type { Pipeline, PipelineStep, ConditionalStep, ErrorHandler } from './pipeline.js';

export {
  errorTemplates,
  errors,
  createErrorTemplate,
  createErrorTemplateRegistry,
  globalErrorTemplates,
} from './error-templates.js';
export type {
  ErrorTemplate,
  ErrorTemplateRegistry,
  ErrorTemplateRegistryState,
} from './error-templates.js';
