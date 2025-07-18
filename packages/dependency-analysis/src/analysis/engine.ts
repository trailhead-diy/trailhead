import { err, ok, type Result } from '@esteban-url/core'
import type {
  DependencyAnalysisEngine,
  AnalysisOptions,
  AnalysisResult,
  FileChange,
  DependencyGraph,
  DependencyError,
  AtomicCommitGroup,
} from '../types.js'
import { generateDependencyGraph } from '../graph/index.js'
import { groupChanges, validateGroups, determineAnalysisMode } from '../grouping/index.js'
import { analysisLogger, globalProfiler } from '../core/index.js'

class DependencyAnalysisEngineImpl implements DependencyAnalysisEngine {
  async analyzeChanges(
    changes: readonly FileChange[],
    options: AnalysisOptions = {}
  ): Promise<Result<AnalysisResult, DependencyError>> {
    const stopProfiling = globalProfiler.start('analysis:full')
    analysisLogger.info('Starting dependency analysis', {
      changeCount: changes.length,
      options,
    })

    const mode = determineAnalysisMode(changes, options)
    analysisLogger.debug('Analysis mode determined', { mode })
    const startTime = Date.now()

    let graph: DependencyGraph | null = null

    if (mode === 'complex') {
      const paths = [...new Set(changes.map((c) => c.path))]
      const graphResult = await generateDependencyGraph(paths, {
        enhanceWithAST: true,
        tsPreCompilationDeps: true,
        skipAnalysisNotInRules: true,
      })

      if (!graphResult.isOk()) {
        analysisLogger.error('Failed to generate dependency graph', graphResult.error)
        stopProfiling()
        return err(graphResult.error)
      }

      graph = graphResult.value
    }

    const groupsResult = await groupChanges(changes, graph, options)

    if (!groupsResult.isOk()) {
      analysisLogger.error('Failed to group changes', groupsResult.error)
      stopProfiling()
      return err(groupsResult.error)
    }

    const validatedGroupsResult = validateGroups(groupsResult.value)

    if (!validatedGroupsResult.isOk()) {
      analysisLogger.error('Group validation failed', validatedGroupsResult.error)
      stopProfiling()
      return err(validatedGroupsResult.error)
    }

    const groups = validatedGroupsResult.value
    const elapsedMs = Date.now() - startTime
    const estimatedTime = elapsedMs < 1000 ? `${elapsedMs}ms` : `${(elapsedMs / 1000).toFixed(1)}s`

    const warnings: string[] = []

    if (graph && graph.cycles.length > 0) {
      warnings.push(`Found ${graph.cycles.length} circular dependencies`)
    }

    const highRiskGroups = groups.filter((g: AtomicCommitGroup) => g.estimatedRisk === 'high')
    if (highRiskGroups.length > 0) {
      warnings.push(
        `${highRiskGroups.length} high-risk groups detected - careful review recommended`
      )
    }

    const metrics = stopProfiling({
      mode,
      groupCount: groups.length,
      fileCount: changes.length,
    })

    analysisLogger.info('Analysis completed', {
      mode,
      groupCount: groups.length,
      totalFiles: changes.length,
      duration: metrics.duration,
      warnings: warnings.length,
    })

    return ok({
      mode,
      groups,
      totalFiles: changes.length,
      estimatedTime,
      warnings,
    })
  }

  async generateDependencyGraph(
    files: readonly string[]
  ): Promise<Result<DependencyGraph, DependencyError>> {
    return generateDependencyGraph(files, {
      enhanceWithAST: true,
      tsPreCompilationDeps: true,
    })
  }

  async groupChanges(
    changes: readonly FileChange[],
    graph: DependencyGraph,
    options: AnalysisOptions = {}
  ): Promise<Result<readonly AtomicCommitGroup[], DependencyError>> {
    const groupsResult = await groupChanges(changes, graph, options)

    if (!groupsResult.isOk()) {
      return groupsResult
    }

    return validateGroups(groupsResult.value)
  }
}

/**
 * Creates a new dependency analysis engine instance
 *
 * @returns A dependency analysis engine with methods for analyzing changes,
 * generating dependency graphs, and grouping changes into atomic commits
 *
 * @remarks
 * The engine provides:
 * - Automatic mode detection (simple vs complex)
 * - Dependency graph generation using dependency-cruiser and tree-sitter
 * - Intelligent file grouping based on dependencies and risk
 * - Performance profiling and debug logging
 *
 * @example
 * ```typescript
 * const engine = createDependencyAnalysisEngine();
 *
 * const result = await engine.analyzeChanges(fileChanges, {
 *   mode: "auto",
 *   excludeFiles: ["package-lock.json"],
 *   validationCommands: ["pnpm test", "pnpm lint"]
 * });
 *
 * if (result.isOk()) {
 *   console.log(`Created ${result.value.groups.length} commit groups`);
 * }
 * ```
 */
export function createDependencyAnalysisEngine(): DependencyAnalysisEngine {
  analysisLogger.debug('Creating dependency analysis engine')
  return new DependencyAnalysisEngineImpl()
}
