import pRetry, { AbortError, type Options as PRetryOptions } from 'p-retry';
import type { CLIError, Result, AsyncResult } from './types.js';
import { RetryableError } from './retry-error.js';

/**
 * Advanced retry options extending p-retry's capabilities
 */
export interface AdvancedRetryOptions<E extends CLIError = CLIError> {
  /**
   * Number of retry attempts. Default is 10.
   */
  retries?: number;
  
  /**
   * Factor by which the retry interval increases. Default is 2.
   */
  factor?: number;
  
  /**
   * Minimum timeout between retries in milliseconds. Default is 1000.
   */
  minTimeout?: number;
  
  /**
   * Maximum timeout between retries in milliseconds. Default is Infinity.
   */
  maxTimeout?: number;
  
  /**
   * Randomizes the timeouts by multiplying with a factor between 1 and 2.
   */
  randomize?: boolean;
  
  /**
   * Custom function to determine if an error should be retried
   * @default (error) => error.recoverable
   */
  shouldRetry?: (error: E) => boolean;
  
  /**
   * Add random jitter to prevent thundering herd
   * @default false
   */
  jitter?: boolean;
  
  /**
   * Maximum jitter in milliseconds
   * @default 100
   */
  maxJitter?: number;
  
  /**
   * Called before each retry attempt
   */
  beforeRetry?: (attemptNumber: number, error: E) => void | Promise<void>;
  
  /**
   * Called after each failed attempt
   */
  onFailedAttempt?: (error: E, attemptNumber: number, retriesLeft: number) => void | Promise<void>;
  
  /**
   * Abort signal for cancellation
   */
  signal?: AbortSignal;
  
  /**
   * Custom backoff strategy
   */
  customBackoff?: (attemptNumber: number) => number;
}

/**
 * Retry strategies for common use cases
 */
export const RetryStrategies = {
  /**
   * Conservative strategy for critical operations
   */
  conservative: (): Partial<AdvancedRetryOptions> => ({
    retries: 5,
    minTimeout: 2000,
    maxTimeout: 30000,
    factor: 2,
    jitter: true,
  }),
  
  /**
   * Aggressive strategy for fast failures
   */
  aggressive: (): Partial<AdvancedRetryOptions> => ({
    retries: 10,
    minTimeout: 100,
    maxTimeout: 5000,
    factor: 1.5,
    jitter: true,
  }),
  
  /**
   * Network-optimized strategy
   */
  network: (): Partial<AdvancedRetryOptions> => ({
    retries: 3,
    minTimeout: 1000,
    maxTimeout: 10000,
    factor: 2,
    jitter: true,
    maxJitter: 500,
  }),
  
  /**
   * Filesystem-optimized strategy
   */
  filesystem: (): Partial<AdvancedRetryOptions> => ({
    retries: 2,
    minTimeout: 50,
    maxTimeout: 1000,
    factor: 2,
    jitter: false,
  }),
  
  /**
   * Infinite retry with exponential backoff (use with caution)
   */
  infinite: (): Partial<AdvancedRetryOptions> => ({
    retries: Infinity,
    minTimeout: 1000,
    maxTimeout: 60000,
    factor: 2,
    jitter: true,
  }),
} as const;

/**
 * Advanced retry function with comprehensive error handling and Result types
 * 
 * Provides enhanced retry capabilities including jitter, custom backoff strategies,
 * abort signals, and detailed retry hooks.
 * 
 * @param operation - Async function that returns a Result type
 * @param options - Advanced retry configuration options
 * @returns Promise resolving to Result<T, E>
 * 
 * @example
 * ```typescript
 * const result = await retryAdvanced(
 *   async () => callAPI(),
 *   {
 *     ...RetryStrategies.network(),
 *     jitter: true,
 *     onFailedAttempt: (error, attempt, retriesLeft) => {
 *       logger.warn(`Attempt ${attempt} failed: ${error.message}`);
 *     }
 *   }
 * );
 * ```
 */
export async function retryAdvanced<T, E extends CLIError = CLIError>(
  operation: () => AsyncResult<T, E>,
  options: AdvancedRetryOptions<E> = {},
): AsyncResult<T, E> {
  const {
    retries,
    factor,
    minTimeout,
    maxTimeout,
    randomize,
    shouldRetry = (error: E) => error.recoverable,
    jitter = false,
    maxJitter = 100,
    beforeRetry,
    onFailedAttempt,
    signal,
    customBackoff,
  } = options;
  
  let lastError: E | undefined;
  let attemptNumber = 0;
  
  try {
    const result = await pRetry(
      async () => {
        attemptNumber++;
        
        // Check abort signal
        if (signal?.aborted) {
          throw new AbortError('Operation aborted');
        }
        
        // Call beforeRetry hook
        if (beforeRetry && attemptNumber > 1) {
          await beforeRetry(attemptNumber, lastError!);
        }
        
        const operationResult = await operation();
        
        if (operationResult.success) {
          return operationResult;
        }
        
        lastError = operationResult.error;
        
        // Check if we should retry this error
        if (!shouldRetry(operationResult.error)) {
          throw new AbortError(operationResult.error.message);
        }
        
        // Throw a RetryableError to trigger retry (p-retry requires Error instances)
        throw new RetryableError(operationResult.error.message, operationResult.error);
      },
      {
        retries,
        factor,
        minTimeout,
        maxTimeout,
        randomize,
        onFailedAttempt: async (error) => {
          // Add jitter if enabled
          if (jitter && minTimeout) {
            const jitterAmount = Math.random() * maxJitter;
            await new Promise(resolve => setTimeout(resolve, jitterAmount));
          }
          
          // Call user's onFailedAttempt hook
          if (onFailedAttempt && lastError) {
            await onFailedAttempt(
              lastError,
              error.attemptNumber,
              error.retriesLeft
            );
          }
        },
        // Use custom backoff if provided
        ...(customBackoff && {
          minTimeout: customBackoff(1),
          factor: 1, // Disable built-in exponential backoff
        }),
      }
    );
    
    return result;
  } catch (error) {
    // Handle abort errors (non-retryable errors or signal aborted)
    if (error instanceof AbortError) {
      if (signal?.aborted) {
        return {
          success: false,
          error: {
            code: 'OPERATION_ABORTED',
            message: 'Operation was aborted',
            recoverable: false,
          } as E,
        };
      }
      
      if (lastError) {
        return { success: false, error: lastError };
      }
    }
    
    // Handle other errors (exhausted retries)
    if (lastError) {
      return { success: false, error: lastError };
    }
    
    // Fallback error
    return {
      success: false,
      error: {
        code: 'RETRY_FAILED',
        message: error instanceof Error ? error.message : 'Unknown retry error',
        recoverable: false,
      } as E,
    };
  }
}

/**
 * Create a retry wrapper with preset options
 * 
 * Useful for creating reusable retry configurations for specific use cases.
 * 
 * @param defaultOptions - Default retry options to use
 * @returns Function that retries operations with the preset options
 * 
 * @example
 * ```typescript
 * const apiRetry = createRetryWrapper({
 *   ...RetryStrategies.network(),
 *   shouldRetry: (error) => error.code !== 'NOT_FOUND'
 * });
 * 
 * const result = await apiRetry(() => fetchUserData());
 * ```
 */
export function createRetryWrapper<E extends CLIError = CLIError>(
  defaultOptions: AdvancedRetryOptions<E>
) {
  return <T>(
    operation: () => AsyncResult<T, E>,
    overrideOptions?: Partial<AdvancedRetryOptions<E>>
  ): AsyncResult<T, E> => {
    return retryAdvanced(operation, { ...defaultOptions, ...overrideOptions });
  };
}

/**
 * Options for circuit breaker pattern
 * 
 * Circuit breakers prevent cascading failures by stopping retry attempts
 * when a threshold of failures is reached.
 */
export interface CircuitBreakerOptions {
  /**
   * Number of failures before opening circuit
   * @default 5
   */
  failureThreshold?: number;
  
  /**
   * Time in ms before attempting to close circuit
   * @default 60000 (1 minute)
   */
  resetTimeout?: number;
  
  /**
   * Time window in ms to count failures
   * @default 60000 (1 minute)
   */
  windowSize?: number;
}

/**
 * Circuit breaker interface returned by createCircuitBreaker
 */
export interface CircuitBreaker {
  execute: <T, E extends CLIError = CLIError>(
    operation: () => AsyncResult<T, E>,
    retryOptions?: AdvancedRetryOptions<E>
  ) => AsyncResult<T, E>;
  reset: () => void;
  getState: () => 'closed' | 'open' | 'half-open';
}

/**
 * Create a circuit breaker for preventing cascading failures
 * 
 * The circuit breaker has three states:
 * - **Closed**: Normal operation, requests pass through
 * - **Open**: Too many failures, requests are blocked
 * - **Half-open**: Testing if service recovered, limited requests allowed
 * 
 * @param options - Circuit breaker configuration
 * @returns Circuit breaker interface with execute, reset, and getState functions
 * 
 * @example Basic usage
 * ```typescript
 * const breaker = createCircuitBreaker({
 *   failureThreshold: 5,
 *   resetTimeout: 60000 // 1 minute
 * });
 * 
 * const result = await breaker.execute(
 *   () => unreliableService(),
 *   { retries: 3 }
 * );
 * ```
 * 
 * @example Monitoring circuit state
 * ```typescript
 * const breaker = createCircuitBreaker({ failureThreshold: 3 });
 * 
 * // Check state
 * console.log(breaker.getState()); // 'closed'
 * 
 * // After failures
 * if (breaker.getState() === 'open') {
 *   console.log('Circuit is open, backing off...');
 *   // Wait before trying again
 * }
 * ```
 * 
 * @example Manual reset
 * ```typescript
 * const breaker = createCircuitBreaker();
 * 
 * // Force reset after fixing underlying issue
 * breaker.reset();
 * console.log(breaker.getState()); // 'closed'
 * ```
 * 
 * @example Integration with retry strategies
 * ```typescript
 * const apiBreaker = createCircuitBreaker({
 *   failureThreshold: 5,
 *   windowSize: 30000 // 30 second window
 * });
 * 
 * async function callAPI() {
 *   return apiBreaker.execute(
 *     () => fetch('/api/data'),
 *     RetryStrategies.network()
 *   );
 * }
 * ```
 */
export function createCircuitBreaker(
  options: CircuitBreakerOptions = {}
): CircuitBreaker {
  const {
    failureThreshold = 5,
    resetTimeout = 60000,
    windowSize = 60000,
  } = options;
  
  // Internal state with optimized circular buffer for failures
  const maxFailures = failureThreshold * 2; // Keep a reasonable history
  let failures: number[] = [];
  let circuitState: 'closed' | 'open' | 'half-open' = 'closed';
  let lastFailureTime = 0;
  
  const execute = async <T, E extends CLIError = CLIError>(
    operation: () => AsyncResult<T, E>,
    retryOptions?: AdvancedRetryOptions<E>
  ): AsyncResult<T, E> => {
    const now = Date.now();
    
    // Clean old failures outside window (optimized)
    if (failures.length > 0) {
      const cutoff = now - windowSize;
      let firstValidIndex = 0;
      while (firstValidIndex < failures.length && failures[firstValidIndex] < cutoff) {
        firstValidIndex++;
      }
      if (firstValidIndex > 0) {
        failures = failures.slice(firstValidIndex);
      }
    }
    
    // Check circuit state
    if (circuitState === 'open') {
      if (now - lastFailureTime > resetTimeout) {
        circuitState = 'half-open';
      } else {
        return {
          success: false,
          error: {
            code: 'CIRCUIT_BREAKER_OPEN',
            message: 'Circuit breaker is open, operation blocked',
            recoverable: true,
          } as E,
        };
      }
    }
    
    // Execute with retry
    const result = await retryAdvanced(operation, retryOptions);
    
    if (result.success) {
      // Success - close circuit if half-open
      if (circuitState === 'half-open') {
        circuitState = 'closed';
        failures = [];
      }
    } else {
      // Failure - record and check threshold
      const failureTime = Date.now();
      failures.push(failureTime);
      lastFailureTime = failureTime;
      
      // Limit array size to prevent unbounded growth
      if (failures.length > maxFailures) {
        failures = failures.slice(-failureThreshold);
      }
      
      if (failures.length >= failureThreshold) {
        circuitState = 'open';
      }
    }
    
    return result;
  };
  
  const reset = (): void => {
    failures = [];
    circuitState = 'closed';
    lastFailureTime = 0;
  };
  
  const getState = (): 'closed' | 'open' | 'half-open' => {
    return circuitState;
  };
  
  return {
    execute,
    reset,
    getState,
  };
}

/**
 * Retry with overall operation timeout
 * 
 * Wraps retry logic with a timeout that aborts all retry attempts if exceeded.
 * 
 * @param operation - Async function that returns a Result type
 * @param timeout - Maximum time in milliseconds for all retry attempts
 * @param retryOptions - Standard retry options
 * @returns Promise resolving to Result<T, E>
 * 
 * @example
 * ```typescript
 * const result = await retryWithTimeout(
 *   async () => slowDatabaseQuery(),
 *   5000, // 5 second timeout
 *   { retries: 3 }
 * );
 * ```
 */
export async function retryWithTimeout<T, E extends CLIError = CLIError>(
  operation: () => AsyncResult<T, E>,
  timeout: number,
  retryOptions?: AdvancedRetryOptions<E>
): AsyncResult<T, E> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    return await retryAdvanced(operation, {
      ...retryOptions,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Execute multiple operations in parallel with individual retry logic
 * 
 * Each operation is retried independently according to the shared retry options.
 * Fails if any operation fails after exhausting retries.
 * 
 * @param operations - Array of async functions that return Result types
 * @param options - Retry options applied to each operation
 * @returns Promise resolving to Result with array of all values or first error
 * 
 * @example
 * ```typescript
 * const results = await retryParallel([
 *   () => fetchUser(id1),
 *   () => fetchUser(id2),
 *   () => fetchUser(id3)
 * ], RetryStrategies.network());
 * ```
 */
export async function retryParallel<T, E extends CLIError = CLIError>(
  operations: Array<() => AsyncResult<T, E>>,
  options?: AdvancedRetryOptions<E>
): AsyncResult<T[], E> {
  const results = await Promise.all(
    operations.map(op => retryAdvanced(op, options))
  );
  
  const errors = results.filter(r => !r.success).map(r => r.error);
  
  if (errors.length > 0) {
    return {
      success: false,
      error: {
        code: 'PARALLEL_RETRY_FAILED',
        message: `${errors.length} operations failed`,
        details: errors.map((e, i) => `${i + 1}. ${e.message}`).join('\n'),
        recoverable: false,
      } as E,
    };
  }
  
  return {
    success: true,
    value: results.map(r => (r as { success: true; value: T }).value),
  };
}

/**
 * Create a retry function with progressive delays based on error types
 * 
 * Different error types can have different retry delays, useful for handling
 * rate limits vs server errors differently.
 * 
 * @param errorDelayMap - Map of error codes to base delay in milliseconds
 * @returns Retry function with error-specific delays
 * 
 * @example
 * ```typescript
 * const smartRetry = createProgressiveRetry(
 *   new Map([
 *     ['RATE_LIMIT', 5000],
 *     ['SERVER_ERROR', 1000],
 *     ['NETWORK_ERROR', 500]
 *   ])
 * );
 * 
 * const result = await smartRetry(() => apiCall());
 * ```
 */
export function createProgressiveRetry<E extends CLIError = CLIError>(
  errorDelayMap: Map<string, number>
) {
  return async <T>(
    operation: () => AsyncResult<T, E>,
    baseOptions?: AdvancedRetryOptions<E>
  ): AsyncResult<T, E> => {
    return retryAdvanced(operation, {
      ...baseOptions,
      customBackoff: (attemptNumber) => {
        const lastErrorCode = (operation as any).lastError?.code;
        const baseDelay = errorDelayMap.get(lastErrorCode) || 1000;
        return baseDelay * Math.pow(2, attemptNumber - 1);
      },
    });
  };
}