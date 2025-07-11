// Re-export from @trailhead/core for backward compatibility
export {
  // Core Result types and functions
  Result,
  ok,
  err,
  combine,
  combineWithAllErrors,
  getErrorMessage,

  // Legacy exports for backward compatibility
  fromThrowable,
  fromPromise,
  fromSafePromise,
  safeTry,
} from '@trailhead/core';
