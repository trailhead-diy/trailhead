/**
 * Core verification that Result-based testing works
 */

import { describe, test, expect, beforeAll } from 'vitest'

describe('Core Result Testing Verification', () => {
  beforeAll(async () => {
    const { setupResultMatchers } = await import('@esteban-url/core/testing')
    setupResultMatchers()
  })

  test('should work with Result matchers', async () => {
    const { createOkResult, createErrResult } = await import('@esteban-url/core/testing')
    
    const okResult = createOkResult('success')
    const errResult = createErrResult('failure')

    expect(okResult).toBeOk()
    expect(okResult).toHaveValue('success')
    
    expect(errResult).toBeErr()
  })

  test('should work with enhanced assertions', async () => {
    const { assertOk, assertErr, unwrapOk, createOkResult, createErrResult } = await import('@esteban-url/core/testing')
    
    const okResult = createOkResult('test-value')
    const errResult = createErrResult('test-error')

    // These should not throw
    assertOk(okResult)
    assertErr(errResult)
    
    // Value extraction
    const value = unwrapOk(okResult)
    expect(value).toBe('test-value')
  })

  test('should verify core testing exports are available', async () => {
    const exports = await import('@esteban-url/core/testing')
    
    const expectedExports = [
      'setupResultMatchers',
      'createOkResult', 
      'createErrResult',
      'assertOk',
      'assertErr', 
      'unwrapOk',
      'unwrapErr',
      'createTestError'
    ]

    for (const exportName of expectedExports) {
      expect(exports[exportName]).toBeDefined()
      expect(typeof exports[exportName]).toBe('function')
    }
  })

  test('should work with array Results', async () => {
    const { createOkResult } = await import('@esteban-url/core/testing')
    
    const arrayResult = createOkResult(['item1', 'item2', 'item3'])
    
    expect(arrayResult).toBeOk()
    expect(arrayResult).toHaveLength(3)
  })
})