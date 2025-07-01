/**
 * Display utilities for console output
 */

import chalk from 'chalk'
import type { ProfileResult, ComparisonResult, ProfileOptions } from './types.js'
import { formatDuration, formatMemory, createProgressBar } from './utils.js'

/**
 * Pure function to create section header
 */
export function createSectionHeader(title: string, width: number = 60): string {
  return chalk.blue('\n' + '═'.repeat(width)) + 
         chalk.blue(`\n${title}`) +
         chalk.blue('\n' + '═'.repeat(width))
}

/**
 * Pure function to create section divider
 */
export function createSectionDivider(width: number = 60): string {
  return chalk.gray('─'.repeat(width))
}

/**
 * Pure function to format metric line
 */
export function formatMetricLine(label: string, value: string, color: 'green' | 'yellow' | 'blue' | 'white' | 'red' = 'white'): string {
  const colorFn = chalk[color]
  return `  ${label}: ${colorFn(value)}`
}

/**
 * Pure function to create comparison table row
 */
export function createComparisonRow(
  metric: string,
  value1: string,
  value2: string,
  improvement: string
): string {
  return `| ${metric.padEnd(15)} | ${value1.padEnd(12)} | ${value2.padEnd(12)} | ${improvement.padEnd(15)} |`
}

/**
 * Pure function to display single profile result
 */
export function displayProfileResult(result: ProfileResult, emoji: string = '🚀'): string[] {
  const lines: string[] = []
  
  lines.push(chalk.white(`\n${emoji} ${result.approach} Results:`))
  lines.push(formatMetricLine('Average Time', formatDuration(result.averageTime), 'green'))
  lines.push(formatMetricLine('Median Time', formatDuration(result.medianTime)))
  lines.push(formatMetricLine('Range', `${formatDuration(result.minTime)} - ${formatDuration(result.maxTime)}`))
  lines.push(formatMetricLine('Memory (avg)', formatMemory(result.memoryAverage)))
  lines.push(formatMetricLine('Memory (peak)', formatMemory(result.memoryPeak)))
  lines.push(formatMetricLine('Throughput', `${result.componentsPerSecond.toFixed(1)} components/sec`, 'green'))
  lines.push(formatMetricLine('Iterations', result.iterations.toString()))
  
  return lines
}

/**
 * Pure function to create visual comparison bar
 */
export function createVisualComparison(
  transforms2: ProfileResult,
  traditional: ProfileResult,
  width: number = 50
): string[] {
  const lines: string[] = []
  
  // Calculate relative bar lengths
  const maxTime = Math.max(transforms2.averageTime, traditional.averageTime)
  const t2BarLength = Math.max(1, Math.round((transforms2.averageTime / maxTime) * width))
  const tradBarLength = Math.max(1, Math.round((traditional.averageTime / maxTime) * width))
  
  lines.push(chalk.gray('\n  Performance Comparison (shorter is better):'))
  lines.push(`  transforms: ${chalk.green('█'.repeat(t2BarLength))} ${formatDuration(transforms2.averageTime)}`)
  lines.push(`  traditional:  ${chalk.yellow('█'.repeat(tradBarLength))} ${formatDuration(traditional.averageTime)}`)
  
  return lines
}

/**
 * Pure function to create memory comparison
 */
export function createMemoryComparison(
  transforms2: ProfileResult,
  traditional: ProfileResult
): string[] {
  const lines: string[] = []
  
  const memoryReduction = ((traditional.memoryAverage - transforms2.memoryAverage) / traditional.memoryAverage) * 100
  const memoryColor = memoryReduction > 0 ? 'green' : 'red'
  const memoryDirection = memoryReduction > 0 ? 'less' : 'more'
  
  lines.push(chalk.white('\n📊 Memory Comparison:'))
  lines.push(`  transforms: ${formatMemory(transforms2.memoryAverage)} (peak: ${formatMemory(transforms2.memoryPeak)})`)
  lines.push(`  traditional:  ${formatMemory(traditional.memoryAverage)} (peak: ${formatMemory(traditional.memoryPeak)})`)
  lines.push(`  Difference:   ${chalk[memoryColor](`${Math.abs(memoryReduction).toFixed(1)}% ${memoryDirection} memory`)}`)
  
  return lines
}

/**
 * Pure function to create performance summary
 */
export function createPerformanceSummary(comparison: ComparisonResult): string[] {
  const lines: string[] = []
  
  if (!comparison.traditional || !comparison.speedupFactor) {
    return lines
  }
  
  lines.push(chalk.white('\n⚡ Performance Summary:'))
  lines.push(formatMetricLine('Speed Improvement', `${comparison.speedupFactor.toFixed(1)}x faster`, 'green'))
  
  if (comparison.memoryEfficiency !== undefined) {
    const memoryColor = comparison.memoryEfficiency > 0 ? 'green' : 'red'
    const memoryText = comparison.memoryEfficiency > 0 
      ? `${comparison.memoryEfficiency.toFixed(0)}% less memory`
      : `${Math.abs(comparison.memoryEfficiency).toFixed(0)}% more memory`
    lines.push(formatMetricLine('Memory Efficiency', memoryText, memoryColor))
  }
  
  const throughputImprovement = ((comparison.transforms2.componentsPerSecond / comparison.traditional.componentsPerSecond - 1) * 100)
  lines.push(formatMetricLine('Throughput Gain', `${throughputImprovement.toFixed(0)}% higher`, 'green'))
  
  return lines
}

/**
 * Pure function to create detailed comparison table
 */
export function createComparisonTable(comparison: ComparisonResult): string[] {
  const lines: string[] = []
  
  if (!comparison.traditional) {
    return lines
  }
  
  const t2 = comparison.transforms2
  const trad = comparison.traditional
  
  lines.push(chalk.white('\n📋 Detailed Comparison:'))
  lines.push('')
  lines.push('| Metric          | Transforms | Traditional  | Improvement     |')
  lines.push('|-----------------|--------------|--------------|-----------------|')
  lines.push(createComparisonRow(
    'Average Time',
    formatDuration(t2.averageTime),
    formatDuration(trad.averageTime),
    `${comparison.speedupFactor!.toFixed(1)}x faster`
  ))
  lines.push(createComparisonRow(
    'Memory Usage',
    formatMemory(t2.memoryAverage),
    formatMemory(trad.memoryAverage),
    comparison.memoryEfficiency! > 0 
      ? `${comparison.memoryEfficiency!.toFixed(0)}% less`
      : `${Math.abs(comparison.memoryEfficiency!).toFixed(0)}% more`
  ))
  lines.push(createComparisonRow(
    'Throughput',
    `${t2.componentsPerSecond.toFixed(1)}/s`,
    `${trad.componentsPerSecond.toFixed(1)}/s`,
    `${((t2.componentsPerSecond / trad.componentsPerSecond - 1) * 100).toFixed(0)}% higher`
  ))
  
  return lines
}

/**
 * Pure function to create component breakdown
 */
export function createComponentBreakdown(
  result: ProfileResult,
  maxComponents: number = 5
): string[] {
  const lines: string[] = []
  
  if (result.componentProfiles.length === 0) {
    return lines
  }
  
  lines.push(chalk.white('\n📦 Component Breakdown:'))
  
  const sortedComponents = [...result.componentProfiles]
    .sort((a, b) => b.executionTime - a.executionTime)
    .slice(0, maxComponents)
  
  sortedComponents.forEach(comp => {
    const bar = createProgressBar(comp.executionTime, result.averageTime, 15)
    lines.push(`  ${comp.name.padEnd(20)} ${formatDuration(comp.executionTime)} ${chalk.gray(bar)}`)
  })
  
  if (result.componentProfiles.length > maxComponents) {
    lines.push(chalk.gray(`  ... and ${result.componentProfiles.length - maxComponents} more components`))
  }
  
  return lines
}

/**
 * Pure function to create configuration summary
 */
export function createConfigSummary(options: ProfileOptions): string[] {
  const lines: string[] = []
  
  lines.push(chalk.blue('\n🔧 Configuration:'))
  lines.push(formatMetricLine('Mode', options.mode))
  lines.push(formatMetricLine('Iterations', options.iterations.toString()))
  lines.push(formatMetricLine('Comparison', options.compare ? 'Enabled' : 'Disabled'))
  lines.push(formatMetricLine('Verbose', options.verbose ? 'Yes' : 'No'))
  
  
  if (options.warmupIterations) {
    lines.push(formatMetricLine('Warmup Iterations', options.warmupIterations.toString()))
  }
  
  if (options.forceGc) {
    lines.push(formatMetricLine('Garbage Collection', 'Forced'))
  }
  
  return lines
}

/**
 * Main display function for profiling results
 */
export function displayResults(
  comparison: ComparisonResult,
  options: ProfileOptions
): void {
  console.log(createSectionHeader('🔬 Transform Performance Profile Results'))
  
  // Configuration summary
  createConfigSummary(options).forEach(line => console.log(line))
  
  // Primary results
  displayProfileResult(comparison.transforms2, '🚀').forEach(line => console.log(line))
  
  // Traditional results if available
  if (comparison.traditional) {
    displayProfileResult(comparison.traditional, '📦').forEach(line => console.log(line))
    
    // Performance comparison
    createPerformanceSummary(comparison).forEach(line => console.log(line))
    
    // Visual comparison
    createVisualComparison(comparison.transforms2, comparison.traditional).forEach(line => console.log(line))
    
    // Memory comparison
    createMemoryComparison(comparison.transforms2, comparison.traditional).forEach(line => console.log(line))
    
    // Detailed table if verbose
    if (options.verbose) {
      createComparisonTable(comparison).forEach(line => console.log(line))
    }
  }
  
  // Component breakdown if verbose and available
  if (options.verbose) {
    createComponentBreakdown(comparison.transforms2).forEach(line => console.log(line))
  }
  
  console.log(chalk.blue('\n' + '═'.repeat(60)))
}

/**
 * Display error message
 */
export function displayError(error: string): void {
  console.error(chalk.red('\n❌ Error:'), error)
}

/**
 * Display warning message
 */
export function displayWarning(warning: string): void {
  console.warn(chalk.yellow('\n⚠️  Warning:'), warning)
}

/**
 * Display success message
 */
export function displaySuccess(message: string): void {
  console.log(chalk.green('\n✅'), message)
}

/**
 * Display info message
 */
export function displayInfo(message: string): void {
  console.log(chalk.blue('\nℹ️ '), message)
}

/**
 * Clear console (if supported)
 */
export function clearConsole(): void {
  if (process.stdout.isTTY) {
    console.clear()
  }
}