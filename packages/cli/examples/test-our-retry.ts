#!/usr/bin/env node
import pRetry, { AbortError } from 'p-retry';

// Simulate our retryWithBackoff function inline to debug

async function testOurRetryImplementation() {
  console.log('\n=== Testing Our Retry Implementation ===');
  
  let attempts = 0;
  let lastError: any;
  
  const operation = async () => {
    attempts++;
    console.log(`Our implementation attempt ${attempts}`);
    
    if (attempts < 3) {
      return {
        success: false,
        error: {
          code: 'TEMP_ERROR',
          message: `Failed attempt ${attempts}`,
          recoverable: true,
        }
      };
    }
    
    return {
      success: true,
      value: 'Success after 3 attempts'
    };
  };
  
  try {
    const result = await pRetry(
      async () => {
        const operationResult = await operation();
        console.log('  Operation result:', operationResult);
        
        if (operationResult.success) {
          return operationResult;
        }
        
        lastError = operationResult.error;
        
        // Check if we should retry this error
        if (!operationResult.error.recoverable) {
          console.log('  Throwing AbortError');
          throw new AbortError(operationResult.error.message);
        }
        
        console.log('  Throwing error to trigger retry');
        // Throw the error to trigger retry
        throw operationResult.error;
      },
      {
        retries: 5,
        minTimeout: 100,
        maxTimeout: 1000,
        factor: 2,
        onFailedAttempt: (error) => {
          console.log(`  p-retry onFailedAttempt: attempt ${error.attemptNumber}, retries left: ${error.retriesLeft}`);
        },
      }
    );
    
    console.log('Final result:', result);
    return result;
  } catch (error) {
    console.log('Caught error in try/catch');
    console.log('  Error type:', error.constructor.name);
    console.log('  Is AbortError:', error instanceof AbortError);
    console.log('  Error:', error);
    
    // Handle abort errors (non-retryable errors)
    if (error instanceof AbortError && lastError) {
      console.log('  Returning lastError');
      return { success: false, error: lastError };
    }
    
    // Handle other errors (exhausted retries)
    if (lastError) {
      console.log('  Returning lastError (exhausted)');
      return { success: false, error: lastError };
    }
    
    // Fallback error
    console.log('  Returning fallback error');
    return {
      success: false,
      error: {
        code: 'RETRY_FAILED',
        message: error instanceof Error ? error.message : 'Unknown retry error',
        recoverable: false,
      },
    };
  }
}

testOurRetryImplementation().catch(console.error);