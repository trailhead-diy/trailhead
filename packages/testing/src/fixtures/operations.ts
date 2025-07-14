import { ok, err } from '@esteban-url/core'
import type { FixtureOperations, FixtureRegistry, TestFixture, TestResult } from '../types.js'

// ========================================
// Fixture Operations
// ========================================

export const createFixtureOperations = (): FixtureOperations => {
  const createRegistry = (): FixtureRegistry => {
    return createFixtureRegistry()
  }

  const createFixture = <T>(
    name: string,
    options: Omit<TestFixture<T>, 'name'>
  ): TestFixture<T> => {
    return {
      name,
      ...options,
    }
  }

  const withFixtures = async <T>(
    fixtures: readonly TestFixture<any>[],
    fn: (registry: FixtureRegistry) => Promise<TestResult<T>> | TestResult<T>
  ): Promise<TestResult<T>> => {
    const registry = createRegistry()

    try {
      // Register all fixtures
      for (const fixture of fixtures) {
        registry.register(fixture)
      }

      // Execute function with registry
      const result = await fn(registry)

      // Cleanup
      await registry.cleanup()

      return result
    } catch (error) {
      await registry.cleanup()
      return err({
        type: 'FixtureError',
        code: 'FIXTURE_EXECUTION_FAILED',
        message: 'Failed to execute with fixtures',
        cause: error,
        recoverable: false,
      } as any)
    }
  }

  return {
    createRegistry,
    createFixture,
    withFixtures,
  }
}

// ========================================
// Fixture Registry Implementation
// ========================================

const createFixtureRegistry = (): FixtureRegistry => {
  const fixtures = new Map<string, TestFixture<any>>()
  const instances = new Map<string, unknown>()
  const creationOrder: string[] = []

  const register = <T>(fixture: TestFixture<T>): void => {
    if (fixtures.has(fixture.name)) {
      throw new Error(`Fixture ${fixture.name} is already registered`)
    }

    fixtures.set(fixture.name, fixture)
  }

  const get = async <T>(name: string): Promise<TestResult<T>> => {
    try {
      // Return existing instance if available
      if (instances.has(name)) {
        return ok(instances.get(name) as T)
      }

      const fixture = fixtures.get(name)
      if (!fixture) {
        return err({
          type: 'FixtureError',
          code: 'FIXTURE_NOT_FOUND',
          message: `Fixture ${name} is not registered`,
          recoverable: false,
        } as any)
      }

      // Check dependencies
      if (fixture.dependencies) {
        for (const dep of fixture.dependencies) {
          const depResult = await get(dep)
          if (depResult.isErr()) {
            return err({
              type: 'FixtureError',
              code: 'DEPENDENCY_FAILED',
              message: `Failed to create dependency ${dep} for fixture ${name}`,
              cause: depResult.error,
              recoverable: false,
            } as any)
          }
        }
      }

      // Create the fixture
      const createResult = await fixture.create()
      if (createResult.isErr()) {
        return createResult
      }

      const instance = createResult.value
      instances.set(name, instance)
      creationOrder.push(name)

      return ok(instance as T)
    } catch (error) {
      return err({
        type: 'FixtureError',
        code: 'FIXTURE_CREATION_FAILED',
        message: `Failed to create fixture ${name}`,
        cause: error,
        recoverable: false,
      } as any)
    }
  }

  const cleanup = async (): Promise<TestResult<void>> => {
    const errors: Error[] = []

    // Cleanup in reverse order of creation
    for (let i = creationOrder.length - 1; i >= 0; i--) {
      const name = creationOrder[i]
      const fixture = fixtures.get(name)
      const instance = instances.get(name)

      if (fixture?.cleanup && instance !== undefined) {
        try {
          const cleanupResult = await fixture.cleanup(instance)
          if (cleanupResult.isErr()) {
            errors.push(
              new Error(`Cleanup failed for fixture ${name}: ${cleanupResult.error.message}`)
            )
          }
        } catch (error) {
          errors.push(new Error(`Cleanup threw for fixture ${name}: ${error}`))
        }
      }
    }

    // Clear all state
    instances.clear()
    creationOrder.length = 0

    if (errors.length > 0) {
      return err({
        type: 'FixtureError',
        code: 'CLEANUP_FAILED',
        message: `Cleanup failed: ${errors.map((e) => e.message).join(', ')}`,
        cause: errors,
        recoverable: false,
      } as any)
    }

    return ok(undefined)
  }

  const clear = (): void => {
    fixtures.clear()
    instances.clear()
    creationOrder.length = 0
  }

  return {
    register,
    get,
    cleanup,
    clear,
  }
}
