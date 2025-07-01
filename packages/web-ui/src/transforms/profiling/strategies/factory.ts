/**
 * Strategy factory for creating profiling strategies
 */

import type { ProfileStrategy, StrategyFactory } from './base.js'
import { FullPipelineStrategy } from './full.js'
import { SimpleStrategy } from './simple.js'

/**
 * Concrete strategy factory implementation
 */
export class ProfilingStrategyFactory implements StrategyFactory {
  private strategies: Map<string, () => ProfileStrategy> = new Map()

  constructor() {
    this.registerStrategies()
  }

  /**
   * Register all available strategies
   */
  private registerStrategies(): void {
    this.strategies.set('full', () => new FullPipelineStrategy())
    this.strategies.set('simple', () => new SimpleStrategy())
  }

  /**
   * Create strategy instance by mode
   */
  createStrategy(mode: string): ProfileStrategy | null {
    const strategyFactory = this.strategies.get(mode)
    return strategyFactory ? strategyFactory() : null
  }

  /**
   * Get list of available strategy modes
   */
  getAvailableStrategies(): string[] {
    return Array.from(this.strategies.keys())
  }

  /**
   * Get description for a specific strategy
   */
  getStrategyDescription(mode: string): string | null {
    const strategy = this.createStrategy(mode)
    return strategy ? strategy.description : null
  }

  /**
   * Validate if a mode is supported
   */
  isValidMode(mode: string): boolean {
    return this.strategies.has(mode)
  }

  /**
   * Get strategy information without creating instance
   */
  getStrategyInfo(mode: string): { name: string; description: string } | null {
    if (!this.isValidMode(mode)) {
      return null
    }

    const strategy = this.createStrategy(mode)
    if (!strategy) {
      return null
    }

    return {
      name: strategy.name,
      description: strategy.description,
    }
  }

  /**
   * Get all strategy information
   */
  getAllStrategyInfo(): Array<{ mode: string; name: string; description: string }> {
    return this.getAvailableStrategies().map((mode) => {
      const info = this.getStrategyInfo(mode)
      return {
        mode,
        name: info?.name || mode,
        description: info?.description || 'No description available',
      }
    })
  }
}

/**
 * Singleton factory instance
 */
export const strategyFactory = new ProfilingStrategyFactory()

/**
 * Convenience functions for creating strategies
 */
export function createFullPipelineStrategy(): ProfileStrategy {
  return new FullPipelineStrategy()
}

export function createSimpleStrategy(): ProfileStrategy {
  return new SimpleStrategy()
}

/**
 * Factory function that determines strategy based on options
 */
export function createStrategyFromOptions(mode: string): ProfileStrategy | null {
  return strategyFactory.createStrategy(mode)
}

/**
 * Strategy pair for comparison
 */
export interface StrategyPair {
  primary: ProfileStrategy
  comparison?: ProfileStrategy
}

/**
 * Create strategy pair for comparison profiling
 */
export function createStrategyPair(primaryMode: string): StrategyPair | null {
  const primary = strategyFactory.createStrategy(primaryMode)

  if (!primary) {
    return null
  }

  // Comparison functionality has been removed
  return {
    primary,
    comparison: undefined,
  }
}
