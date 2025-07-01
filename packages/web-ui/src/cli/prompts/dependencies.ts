/**
 * Dependency installation prompts
 * Minimal implementation to satisfy orchestrator requirements
 */

import chalk from 'chalk'

export interface DependencyPromptOptions {
  analysis: {
    missing: string[]
    outdated: string[]
    hasConflicts: boolean
  }
  currentDependencies: Record<string, string>
  existingDependencies: Record<string, string>
  canInstall: boolean
  isNpmOnline: boolean
  isYarnOnline: boolean
  isPnpmOnline: boolean
  hasExisting: boolean
  isOffline: boolean
  isCI: boolean
}

export interface DependencyStrategy {
  type: 'auto' | 'smart' | 'selective' | 'manual' | 'skip' | 'force'
}

/**
 * Run dependency installation prompts
 * In CI mode or when non-interactive, returns auto strategy
 */
export async function runDependencyPrompts(
  options: DependencyPromptOptions
): Promise<{ strategy: DependencyStrategy }> {
  // For now, always use auto strategy
  // This can be expanded with actual prompts if needed
  if (options.isCI || !options.canInstall) {
    return { strategy: { type: 'skip' } }
  }
  
  return { strategy: { type: 'auto' } }
}

/**
 * Show post-installation instructions
 */
export function showPostInstallInstructions(
  packageManager: string,
  strategy: DependencyStrategy,
  fallbackCommand?: string
): void {
  if (strategy.type === 'skip' || strategy.type === 'manual') {
    console.log(chalk.yellow('\n📦 Manual dependency installation required:'))
    console.log(chalk.cyan(`   ${fallbackCommand || `${packageManager} install`}`))
  }
}