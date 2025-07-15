/**
 * Basic verification that domain-driven testing infrastructure works
 */

import { describe, test, expect } from 'vitest'

describe('Domain-Driven Testing Infrastructure', () => {
  test('should be able to import from core/testing', async () => {
    const { setupResultMatchers, createOkResult, createErrResult } = await import(
      '@esteban-url/core/testing'
    )

    expect(typeof setupResultMatchers).toBe('function')
    expect(typeof createOkResult).toBe('function')
    expect(typeof createErrResult).toBe('function')
  })

  test('should be able to import from CLI dependency testing exports', async () => {
    const packages = ['@esteban-url/core/testing', '@esteban-url/fs/testing']

    for (const pkg of packages) {
      try {
        const exports = await import(pkg)
        expect(typeof exports).toBe('object')
        expect(Object.keys(exports).length).toBeGreaterThan(0)
      } catch (error) {
        throw new Error(`Failed to import ${pkg}: ${error.message}`)
      }
    }
  })

  test('should work with basic Result operations', async () => {
    const { setupResultMatchers, createOkResult, createErrResult } = await import(
      '@esteban-url/core/testing'
    )

    setupResultMatchers()

    const okResult = createOkResult('success')
    const errResult = createErrResult('failure')

    expect(okResult).toBeOk()
    expect(okResult).toHaveValue('success')

    expect(errResult).toBeErr()
  })

  test('should verify tsup build outputs exist', async () => {
    const packages = [
      '@esteban-url/core',
      '@esteban-url/fs',
      '@esteban-url/git',
      '@esteban-url/config',
    ]

    for (const pkg of packages) {
      // Test that we can import both main and testing exports
      const mainExports = await import(pkg)
      const testingExports = await import(`${pkg}/testing`)

      expect(typeof mainExports).toBe('object')
      expect(typeof testingExports).toBe('object')
    }
  })
})
