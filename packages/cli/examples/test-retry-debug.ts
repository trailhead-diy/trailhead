#!/usr/bin/env node
import pRetry, { AbortError } from 'p-retry';

// Test p-retry directly to understand the issue

async function testPRetryDirectly() {
  console.log('\n=== Testing p-retry directly ===');
  
  let attempts = 0;
  
  try {
    const result = await pRetry(
      async () => {
        attempts++;
        console.log(`Direct p-retry attempt ${attempts}`);
        
        if (attempts < 3) {
          throw new Error(`Failed attempt ${attempts}`);
        }
        
        return `Success after ${attempts} attempts`;
      },
      {
        retries: 5,
        minTimeout: 100,
        maxTimeout: 1000,
        onFailedAttempt: (error) => {
          console.log(`  Failed attempt ${error.attemptNumber}: ${error.message}`);
          console.log(`  Retries left: ${error.retriesLeft}`);
        }
      }
    );
    
    console.log('Result:', result);
  } catch (error) {
    console.error('Final error:', error);
  }
}

async function testWithAbortError() {
  console.log('\n=== Testing with AbortError ===');
  
  let attempts = 0;
  
  try {
    const result = await pRetry(
      async () => {
        attempts++;
        console.log(`Abort test attempt ${attempts}`);
        
        if (attempts === 1) {
          throw new AbortError('This should not retry');
        }
        
        return 'Should not reach here';
      },
      {
        retries: 5,
        minTimeout: 100,
      }
    );
    
    console.log('Result:', result);
  } catch (error) {
    console.log('Caught error:', error.message);
    console.log('Is AbortError:', error instanceof AbortError);
    console.log('Total attempts:', attempts);
  }
}

async function main() {
  await testPRetryDirectly();
  await testWithAbortError();
}

main().catch(console.error);