export { Ok, Err, isOk, isErr } from './errors/index.js'
export type { Result } from './errors/index.js'

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
} from './errors/index.js'
export type { CLIError } from './errors/index.js'

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
} from './validation/index.js'
export type {
  ValidationPipeline,
  ValidationRule,
  ValidationResult,
  ValidationSummary,
  ValidationContext,
  Validator,
  Framework,
} from './validation/index.js'

export { createLogger, createSilentLogger } from './logger.js'
export type { Logger } from './logger.js'
