#!/usr/bin/env node
import {
  createCLI,
  Ok,
  Err,
  isOk,
  type CLIError,
} from '@trailhead/cli';
import {
  retryAdvanced,
  RetryStrategies,
  createRetryWrapper,
  createCircuitBreaker,
  retryWithTimeout,
  retryParallel,
  createProgressiveRetry,
} from '@trailhead/cli/core';
import { createCommand } from '@trailhead/cli/command';

// Example: Advanced retry patterns

// Simulate an unreliable API
let apiCallCount = 0;
async function unreliableApi(): Promise<{ data: string }> {
  apiCallCount++;
  
  // Fail first 2 attempts
  if (apiCallCount < 3) {
    throw new Error(`API temporarily unavailable (attempt ${apiCallCount})`);
  }
  
  return { data: 'Success!' };
}

// Example 1: Basic retry with custom strategy
const apiCommand = createCommand({
  name: 'api',
  description: 'Call unreliable API with retry',
  action: async (_, context) => {
    apiCallCount = 0;
    
    const result = await retryAdvanced(
      async () => {
        try {
          const response = await unreliableApi();
          return Ok(response);
        } catch (error) {
          return Err({
            code: 'API_ERROR',
            message: error instanceof Error ? error.message : 'API failed',
            recoverable: true,
          });
        }
      },
      {
        ...RetryStrategies.network(),
        onFailedAttempt: (error, attempt, retriesLeft) => {
          context.logger.warn(
            `Attempt ${attempt} failed: ${error.message} (${retriesLeft} retries left)`
          );
        },
      }
    );
    
    if (isOk(result)) {
      context.logger.success(`API call succeeded: ${result.value.data}`);
    } else {
      context.logger.error(`API call failed: ${result.error.message}`);
    }
    
    return result;
  },
});

// Example 2: Circuit breaker pattern
const circuitBreaker = createCircuitBreaker({
  failureThreshold: 3,
  resetTimeout: 5000,
  windowSize: 10000,
});

const protectedCommand = createCommand({
  name: 'protected',
  description: 'API call with circuit breaker protection',
  action: async (_, context) => {
    const result = await circuitBreaker.execute(
      async () => {
        // Simulate random failures
        if (Math.random() < 0.7) {
          return Err({
            code: 'RANDOM_FAILURE',
            message: 'Random API failure',
            recoverable: true,
          });
        }
        return Ok('Success!');
      },
      RetryStrategies.aggressive()
    );
    
    context.logger.info(`Circuit breaker state: ${circuitBreaker.getState()}`);
    
    if (isOk(result)) {
      context.logger.success('Operation succeeded');
    } else {
      context.logger.error(`Operation failed: ${result.error.message}`);
    }
    
    return result;
  },
});

// Example 3: Retry with timeout
const timeoutCommand = createCommand({
  name: 'timeout',
  description: 'Retry with overall timeout',
  action: async (_, context) => {
    const result = await retryWithTimeout(
      async () => {
        // Simulate slow operation
        await new Promise(resolve => setTimeout(resolve, 2000));
        return Ok('Eventually succeeded');
      },
      5000, // 5 second timeout
      {
        retries: 10,
        minTimeout: 100,
      }
    );
    
    if (isOk(result)) {
      context.logger.success('Operation completed within timeout');
    } else {
      context.logger.error(`Operation timed out: ${result.error.message}`);
    }
    
    return result;
  },
});

// Example 4: Custom retry wrapper for specific error types
const errorDelayMap = new Map<string, number>([
  ['RATE_LIMIT', 5000],
  ['SERVER_ERROR', 2000],
  ['NETWORK_ERROR', 1000],
]);

const smartRetry = createProgressiveRetry(errorDelayMap);

const smartCommand = createCommand({
  name: 'smart',
  description: 'Smart retry with error-specific delays',
  action: async (_, context) => {
    let attemptCount = 0;
    
    const result = await smartRetry(
      async () => {
        attemptCount++;
        
        // Simulate different error types
        if (attemptCount === 1) {
          return Err({
            code: 'RATE_LIMIT',
            message: 'Rate limit exceeded',
            recoverable: true,
          });
        } else if (attemptCount === 2) {
          return Err({
            code: 'SERVER_ERROR',
            message: 'Internal server error',
            recoverable: true,
          });
        }
        
        return Ok('Success after smart retry');
      },
      { retries: 5 }
    );
    
    if (isOk(result)) {
      context.logger.success(`Succeeded after ${attemptCount} attempts`);
    }
    
    return result;
  },
});

// Example 5: Parallel operations with individual retry
const parallelCommand = createCommand({
  name: 'parallel',
  description: 'Retry multiple operations in parallel',
  action: async (_, context) => {
    const operations = [
      async () => {
        if (Math.random() < 0.5) {
          return Err<string, CLIError>({
            code: 'OP1_FAILED',
            message: 'Operation 1 failed',
            recoverable: true,
          });
        }
        return Ok('Op1 success');
      },
      async () => {
        if (Math.random() < 0.5) {
          return Err<string, CLIError>({
            code: 'OP2_FAILED',
            message: 'Operation 2 failed',
            recoverable: true,
          });
        }
        return Ok('Op2 success');
      },
      async () => {
        if (Math.random() < 0.5) {
          return Err<string, CLIError>({
            code: 'OP3_FAILED',
            message: 'Operation 3 failed',
            recoverable: true,
          });
        }
        return Ok('Op3 success');
      },
    ];
    
    const result = await retryParallel(operations, {
      retries: 3,
      minTimeout: 500,
    });
    
    if (isOk(result)) {
      context.logger.success('All operations succeeded');
      result.value.forEach((val, i) => {
        context.logger.info(`  Operation ${i + 1}: ${val}`);
      });
    } else {
      context.logger.error(`Some operations failed: ${result.error.message}`);
    }
    
    return result;
  },
});

// Example 6: Custom retry wrapper for a service
const apiRetry = createRetryWrapper({
  ...RetryStrategies.network(),
  shouldRetry: (error) => {
    // Don't retry 4xx errors except 429 (rate limit)
    if ('statusCode' in error) {
      const code = (error as any).statusCode;
      return code >= 500 || code === 429;
    }
    return error.recoverable;
  },
  beforeRetry: async (attempt, error) => {
    console.log(`🔄 Retrying attempt ${attempt} after error: ${error.message}`);
  },
});

const serviceCommand = createCommand({
  name: 'service',
  description: 'Use custom retry wrapper',
  action: async (_, context) => {
    const result = await apiRetry(async () => {
      // Simulate API call
      const random = Math.random();
      if (random < 0.3) {
        return Err({
          code: 'NOT_FOUND',
          message: 'Resource not found',
          statusCode: 404,
          recoverable: false,
        } as CLIError & { statusCode: number });
      } else if (random < 0.6) {
        return Err({
          code: 'SERVER_ERROR',
          message: 'Internal server error',
          statusCode: 500,
          recoverable: true,
        } as CLIError & { statusCode: number });
      }
      return Ok('Service call succeeded');
    });
    
    if (isOk(result)) {
      context.logger.success(result.value);
    } else {
      context.logger.error(`Service call failed: ${result.error.message}`);
    }
    
    return result;
  },
});

// Create CLI
const cli = createCLI({
  name: 'retry-demo',
  version: '1.0.0',
  description: 'Advanced retry patterns demonstration',
  commands: [
    apiCommand,
    protectedCommand,
    timeoutCommand,
    smartCommand,
    parallelCommand,
    serviceCommand,
  ],
});

// Run CLI
cli.run(process.argv);