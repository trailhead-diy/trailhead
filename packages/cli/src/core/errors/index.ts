export * from './types.js';

export * from './factory.js';

export * from './handlers.js';

export { Ok, Err } from './factory.js';
export type { Result, AsyncResult, CLIError } from './types.js';

export { Ok as ok, Err as err } from './factory.js';

export { isOk, isErr, unwrap, unwrapOr, map, mapErr } from './utils.js';
export {
  displayError,
  formatError,
  createExitHandler,
  retryWithBackoff,
  tryRecover,
} from './handlers.js';
export {
  validationError,
  fileSystemError,
  networkError,
  configurationError,
  executionError,
  userInputError,
  dependencyError,
  fileNotFoundError,
  permissionError,
  httpError,
  missingDependencyError,
} from './factory.js';
