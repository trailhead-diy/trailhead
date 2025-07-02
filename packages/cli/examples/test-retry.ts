#!/usr/bin/env node
import { retryWithBackoff, Err, Ok } from '../src/core/errors/index.js';
import { retryAdvanced, RetryStrategies } from '../src/core/errors/retry-advanced.js';

// Test the retry functionality

async function testBasicRetry() {
  console.log('\n=== Testing Basic Retry ===');
  
  let attempts = 0;
  const result = await retryWithBackoff(
    async () => {
      attempts++;
      console.log(`Attempt ${attempts}`);
      
      if (attempts < 3) {
        return Err({
          code: 'TEMP_ERROR',
          message: `Failed attempt ${attempts}`,
          recoverable: true,
        });
      }
      
      return Ok('Success after 3 attempts');
    },
    {
      maxRetries: 5,
      initialDelay: 100,
    }
  );
  
  console.log('Result:', result);
}

async function testAdvancedRetry() {
  console.log('\n=== Testing Advanced Retry ===');
  
  let attempts = 0;
  const result = await retryAdvanced(
    async () => {
      attempts++;
      console.log(`Advanced attempt ${attempts}`);
      
      if (attempts < 2) {
        return Err({
          code: 'API_ERROR',
          message: `API failed on attempt ${attempts}`,
          recoverable: true,
        });
      }
      
      return Ok('API Success!');
    },
    {
      ...RetryStrategies.network(),
      onFailedAttempt: (error, attempt, retriesLeft) => {
        console.log(`  Failed: ${error.message} (${retriesLeft} retries left)`);
      },
    }
  );
  
  console.log('Result:', result);
}

async function testNonRecoverableError() {
  console.log('\n=== Testing Non-Recoverable Error ===');
  
  let attempts = 0;
  const result = await retryWithBackoff(
    async () => {
      attempts++;
      console.log(`Non-recoverable attempt ${attempts}`);
      
      return Err({
        code: 'FATAL_ERROR',
        message: 'This error cannot be recovered',
        recoverable: false,
      });
    },
    {
      maxRetries: 5,
    }
  );
  
  console.log('Result:', result);
  console.log('Total attempts:', attempts);
}

async function main() {
  await testBasicRetry();
  await testAdvancedRetry();
  await testNonRecoverableError();
}

main().catch(console.error);