import { cruise, type ICruiseOptions, type IReporterOutput } from 'dependency-cruiser'
import { err, ok, type Result } from '@esteban-url/core'
import type { DependencyError, DependencyGraph, DependencyNode } from '../types.js'
import { graphLogger, globalProfiler } from '../core/index.js'

export interface CruiserOptions {
  readonly includeOnly?: string
  readonly exclude?: string
  readonly tsPreCompilationDeps?: boolean
  readonly skipAnalysisNotInRules?: boolean
}

function mapFileTypeToNodeType(fileType: string): DependencyNode['type'] {
  if (fileType.includes('test') || fileType.includes('spec')) {
    return 'test'
  }
  if (fileType.includes('config') || fileType.includes('rc') || fileType.includes('json')) {
    return 'config'
  }
  if (fileType.includes('md') || fileType.includes('docs')) {
    return 'docs'
  }
  return 'source'
}

function calculateRiskLevel(dependencies: readonly string[]): DependencyNode['riskLevel'] {
  if (dependencies.length === 0) {
    return 'low'
  }
  if (dependencies.length > 10) {
    return 'high'
  }
  return 'medium'
}

export async function generateDependencyGraphWithCruiser(
  paths: readonly string[],
  options: CruiserOptions = {}
): Promise<Result<DependencyGraph, DependencyError>> {
  const stopProfiling = globalProfiler.start('dependency-cruiser:analyze')
  graphLogger.debug('Starting dependency graph generation', { paths, options })

  try {
    const cruiseOptions: ICruiseOptions = {
      includeOnly: options.includeOnly,
      exclude: options.exclude,
      doNotFollow: 'node_modules',
      tsPreCompilationDeps: options.tsPreCompilationDeps ?? true,
      enhancedResolveOptions: {
        exportsFields: ['exports'],
        conditionNames: ['import', 'require', 'node', 'default'],
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json'],
      },
      reporterOptions: {
        dot: {
          collapsePattern: 'node_modules/[^/]+',
        },
      },
    }

    graphLogger.debug('Running dependency-cruiser with options', cruiseOptions)

    const cruiseResult: IReporterOutput = await cruise(paths as string[], cruiseOptions)

    graphLogger.debug('Dependency-cruiser completed')

    if (!cruiseResult.output || typeof cruiseResult.output !== 'object') {
      graphLogger.error('Invalid dependency-cruiser output', { output: cruiseResult.output })
      return err({
        type: 'analysis-error',
        message: 'Invalid dependency-cruiser output format',
      })
    }

    const modules = (cruiseResult.output as any).modules || []
    const nodes = new Map<string, DependencyNode>()
    const edges = new Map<string, string[]>()
    const roots: string[] = []

    for (const module of modules) {
      const dependencies = module.dependencies || []
      const dependencyPaths = dependencies
        .filter((dep: any) => !dep.circular && !dep.couldNotResolve)
        .map((dep: any) => dep.resolved)

      const node: DependencyNode = {
        path: module.source,
        imports: dependencies.map((dep: any) => ({
          source: dep.resolved || dep.module,
          specifiers: [],
          isTypeOnly: dep.dependencyTypes?.includes('type-only') || false,
          isApiSurface: !dep.dependencyTypes?.includes('local') || false,
          line: 0,
        })),
        exports: [],
        type: mapFileTypeToNodeType(module.source),
        depth: module.reachable?.length || 0,
        apiSurfaceChanges: false,
        compilationDependencies: dependencyPaths,
        riskLevel: calculateRiskLevel(dependencyPaths),
      }

      nodes.set(module.source, node)
      edges.set(module.source, dependencyPaths)

      if (dependencies.length === 0 || module.orphan) {
        roots.push(module.source)
      }
    }

    const cycles = modules
      .filter((m: any) => m.dependencies?.some((d: any) => d.circular))
      .map((m: any) => {
        const circularDeps = m.dependencies
          .filter((d: any) => d.circular)
          .map((d: any) => d.resolved)
        return [m.source, ...circularDeps]
      })

    const metrics = stopProfiling({
      nodeCount: nodes.size,
      edgeCount: edges.size,
      cycleCount: cycles.length,
    })

    graphLogger.info('Dependency graph generated', {
      nodes: nodes.size,
      edges: edges.size,
      roots: roots.length,
      cycles: cycles.length,
      duration: metrics.duration,
    })

    return ok({
      nodes,
      edges,
      roots,
      cycles,
    })
  } catch (error) {
    stopProfiling()
    graphLogger.error('Failed to generate dependency graph', error)
    return err({
      type: 'analysis-error',
      message: error instanceof Error ? error.message : 'Unknown error during dependency analysis',
    })
  }
}
