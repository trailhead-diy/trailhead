/**
 * Report generation utilities
 */

import { writeFile } from 'fs/promises'
import { join } from 'path'
import { cpus } from 'os'
import type { ComparisonResult, ProfileOptions, ReportFormat } from './types.js'
import { formatDuration, formatMemory, generateTimestamp, ensureDirectory } from './utils.js'

/**
 * Pure function to generate markdown report
 */
export function generateMarkdownReport(
  comparison: ComparisonResult,
  options: ProfileOptions
): string {
  const lines: string[] = []

  // Header
  lines.push('# Transform Performance Profile Report')
  lines.push('')
  lines.push(`Generated: ${generateTimestamp()}`)
  lines.push('')

  // Configuration section
  lines.push('## Configuration')
  lines.push('')
  lines.push('| Setting | Value |')
  lines.push('|---------|-------|')
  lines.push(`| Mode | ${options.mode} |`)
  lines.push(`| Iterations | ${options.iterations} |`)
  lines.push(`| Comparison | ${options.compare ? 'Enabled' : 'Disabled'} |`)
  lines.push(`| Environment | Node.js ${process.version} |`)

  if (options.warmupIterations) {
    lines.push(`| Warmup Iterations | ${options.warmupIterations} |`)
  }

  lines.push('')

  // Primary results
  lines.push('## Primary Results')
  lines.push('')
  lines.push(`### ${comparison.transforms2.approach}`)
  lines.push('')
  lines.push('| Metric | Value |')
  lines.push('|--------|-------|')
  lines.push(`| Average Time | ${formatDuration(comparison.transforms2.averageTime)} |`)
  lines.push(`| Median Time | ${formatDuration(comparison.transforms2.medianTime)} |`)
  lines.push(`| Min Time | ${formatDuration(comparison.transforms2.minTime)} |`)
  lines.push(`| Max Time | ${formatDuration(comparison.transforms2.maxTime)} |`)
  lines.push(`| Memory (Average) | ${formatMemory(comparison.transforms2.memoryAverage)} |`)
  lines.push(`| Memory (Peak) | ${formatMemory(comparison.transforms2.memoryPeak)} |`)
  lines.push(
    `| Throughput | ${comparison.transforms2.componentsPerSecond.toFixed(1)} components/sec |`
  )
  lines.push('')

  // Comparison results
  if (comparison.traditional && comparison.speedupFactor) {
    lines.push('## Comparison Results')
    lines.push('')
    lines.push(`### ${comparison.traditional.approach}`)
    lines.push('')
    lines.push('| Metric | Value |')
    lines.push('|--------|-------|')
    lines.push(`| Average Time | ${formatDuration(comparison.traditional.averageTime)} |`)
    lines.push(`| Median Time | ${formatDuration(comparison.traditional.medianTime)} |`)
    lines.push(`| Min Time | ${formatDuration(comparison.traditional.minTime)} |`)
    lines.push(`| Max Time | ${formatDuration(comparison.traditional.maxTime)} |`)
    lines.push(`| Memory (Average) | ${formatMemory(comparison.traditional.memoryAverage)} |`)
    lines.push(`| Memory (Peak) | ${formatMemory(comparison.traditional.memoryPeak)} |`)
    lines.push(
      `| Throughput | ${comparison.traditional.componentsPerSecond.toFixed(1)} components/sec |`
    )
    lines.push('')

    // Performance comparison table
    lines.push('### Performance Comparison')
    lines.push('')
    lines.push('| Metric | Primary | Traditional | Improvement |')
    lines.push('|--------|---------|-------------|-------------|')
    lines.push(
      `| Average Time | ${formatDuration(comparison.transforms2.averageTime)} | ${formatDuration(comparison.traditional.averageTime)} | **${comparison.speedupFactor.toFixed(1)}x faster** |`
    )

    const memoryImprovement =
      comparison.memoryEfficiency! > 0
        ? `**${comparison.memoryEfficiency!.toFixed(0)}% less**`
        : `${Math.abs(comparison.memoryEfficiency!).toFixed(0)}% more`
    lines.push(
      `| Memory Usage | ${formatMemory(comparison.transforms2.memoryAverage)} | ${formatMemory(comparison.traditional.memoryAverage)} | ${memoryImprovement} |`
    )

    const throughputImprovement =
      (comparison.transforms2.componentsPerSecond / comparison.traditional.componentsPerSecond -
        1) *
      100
    lines.push(
      `| Throughput | ${comparison.transforms2.componentsPerSecond.toFixed(1)}/sec | ${comparison.traditional.componentsPerSecond.toFixed(1)}/sec | **${throughputImprovement.toFixed(0)}% higher** |`
    )
    lines.push('')

    // Visual performance comparison
    lines.push('### Visual Performance Comparison')
    lines.push('')
    lines.push('```')
    lines.push('Execution Time (lower is better):')
    lines.push('')
    const maxTime = Math.max(comparison.transforms2.averageTime, comparison.traditional.averageTime)
    const t2Bars = Math.round((comparison.transforms2.averageTime / maxTime) * 50)
    const tradBars = Math.round((comparison.traditional.averageTime / maxTime) * 50)
    lines.push(
      `Primary:     ${'█'.repeat(t2Bars)} ${formatDuration(comparison.transforms2.averageTime)}`
    )
    lines.push(
      `Traditional: ${'█'.repeat(tradBars)} ${formatDuration(comparison.traditional.averageTime)}`
    )
    lines.push('```')
    lines.push('')
  }

  // Analysis section
  lines.push('## Analysis')
  lines.push('')

  if (comparison.speedupFactor && comparison.speedupFactor > 10) {
    lines.push(
      `The primary approach demonstrates exceptional performance, running **${comparison.speedupFactor.toFixed(1)}x faster** than the traditional approach. This significant improvement is achieved through:`
    )
    lines.push('')
    lines.push('1. **Modular Transform Architecture**: Each transform is focused and optimized')
    lines.push(
      '2. **Efficient Pattern Matching**: Using targeted patterns instead of broad searches'
    )
    lines.push('3. **Minimal File I/O**: Transforms are applied in memory with batch writes')
    lines.push('4. **Functional Composition**: Pure functions enable better optimization')
    lines.push('5. **Parallel Execution**: Independent transforms can run concurrently')
    lines.push('')
  }

  // Component breakdown if available
  if (comparison.transforms2.componentProfiles.length > 0) {
    lines.push('## Component Performance Breakdown')
    lines.push('')
    lines.push('| Component | Execution Time | Memory Used | Transform Count |')
    lines.push('|-----------|----------------|-------------|-----------------|')

    comparison.transforms2.componentProfiles
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, 10)
      .forEach((comp) => {
        lines.push(
          `| ${comp.name} | ${formatDuration(comp.executionTime)} | ${formatMemory(comp.memoryUsed)} | ${comp.transformCount} |`
        )
      })

    lines.push('')
  }

  // Recommendations
  lines.push('## Recommendations')
  lines.push('')

  if (comparison.transforms2.averageTime < 100) {
    lines.push('1. ✅ **Performance is Excellent**: Sub-100ms transformation time is optimal')
    lines.push('2. ✅ **No Optimization Needed**: Current performance exceeds requirements')
  } else if (comparison.transforms2.averageTime < 1000) {
    lines.push('1. ✅ **Performance is Good**: Sub-second transformation time is acceptable')
    lines.push('2. 🔍 **Monitor Performance**: Watch for performance regressions')
  } else {
    lines.push('1. 🔍 **Consider Optimization**: Look for bottlenecks in specific transforms')
    lines.push(
      '2. 📊 **Profile Individual Transforms**: Identify which transforms take the most time'
    )
  }

  if (comparison.speedupFactor && comparison.speedupFactor > 2) {
    lines.push('3. 🚀 **Use Primary Approach**: The optimized pipeline is the recommended choice')
  }

  lines.push('')

  // Technical details
  lines.push('## Technical Details')
  lines.push('')
  lines.push(`- **Test Environment**: ${process.platform} ${process.arch}`)
  lines.push(`- **Node.js Version**: ${process.version}`)
  lines.push(`- **Memory**: ${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB heap`)
  lines.push(`- **CPU Cores**: ${cpus().length}`)
  lines.push('')

  return lines.join('\n')
}
/**
 * Report generator factory
 */
export class ReportGenerator {
  /**
   * Generate markdown report
   */
  static generate(
    format: ReportFormat['type'],
    comparison: ComparisonResult,
    options: ProfileOptions
  ): string {
    if (format !== 'markdown') {
      throw new Error(`Unsupported report format: ${format}. Only markdown is supported.`)
    }
    return generateMarkdownReport(comparison, options)
  }

  /**
   * Get file extension for markdown format
   */
  static getFileExtension(format: ReportFormat['type']): string {
    if (format !== 'markdown') {
      throw new Error(`Unsupported report format: ${format}. Only markdown is supported.`)
    }
    return '.md'
  }

  /**
   * Generate filename for report
   */
  static generateFilename(
    format: ReportFormat['type'],
    options: ProfileOptions,
    timestamp?: string
  ): string {
    const ts = timestamp || generateTimestamp().replace(/[:.]/g, '-')
    const mode = options.mode
    const comparison = options.compare ? '-comparison' : ''
    const ext = this.getFileExtension(format)

    return `transform-performance-${mode}${comparison}-${ts}${ext}`
  }
}

/**
 * Save report to file
 */
export async function saveReport(
  format: ReportFormat['type'],
  comparison: ComparisonResult,
  options: ProfileOptions,
  outputDir: string = './docs'
): Promise<string> {
  const content = ReportGenerator.generate(format, comparison, options)
  const filename = ReportGenerator.generateFilename(format, options)
  const filepath = join(outputDir, filename)

  // Ensure output directory exists
  await ensureDirectory(outputDir)

  // Write report file
  await writeFile(filepath, content, 'utf-8')

  return filepath
}

/**
 * Save multiple report formats
 */
export async function saveMultipleReports(
  formats: ReportFormat['type'][],
  comparison: ComparisonResult,
  options: ProfileOptions,
  outputDir: string = './docs'
): Promise<string[]> {
  const savedFiles = await Promise.all(
    formats.map((format) => saveReport(format, comparison, options, outputDir))
  )

  return savedFiles
}

/**
 * Create report summary for console output
 */
export function createReportSummary(savedFiles: string[], options: ProfileOptions): string[] {
  const lines: string[] = []

  lines.push('\n📄 Reports Generated:')
  savedFiles.forEach((file) => {
    lines.push(`  ${file}`)
  })

  if (options.verbose) {
    lines.push('\nReport contents:')
    lines.push('  - Performance metrics and comparisons')
    lines.push('  - Configuration details')
    lines.push('  - Visual performance charts')
    lines.push('  - Technical analysis and recommendations')
  }

  return lines
}
