import { err, ok, type Result } from '@esteban-url/core'
import type { DependencyError, DependencyGraph, DependencyNode } from '../types.js'
import { generateDependencyGraphWithCruiser, type CruiserOptions } from './dependency-cruiser.js'
import { parseTypeScriptModule } from './tree-sitter-parser.js'

export interface GraphGenerationOptions extends CruiserOptions {
  readonly enhanceWithAST?: boolean
  readonly includeTestFiles?: boolean
}

async function enhanceNodeWithAST(node: DependencyNode): Promise<DependencyNode> {
  if (node.type !== 'source' || (!node.path.endsWith('.ts') && !node.path.endsWith('.tsx'))) {
    return node
  }

  const parseResult = await parseTypeScriptModule(node.path)

  if (!parseResult.isOk()) {
    return node
  }

  const { imports, exports, hasApiChanges } = parseResult.value

  return {
    ...node,
    imports: imports,
    exports: exports,
    apiSurfaceChanges: hasApiChanges,
    riskLevel: hasApiChanges ? 'high' : node.riskLevel,
  }
}

export async function generateDependencyGraph(
  paths: readonly string[],
  options: GraphGenerationOptions = {}
): Promise<Result<DependencyGraph, DependencyError>> {
  const graphResult = await generateDependencyGraphWithCruiser(paths, options)

  if (!graphResult.isOk()) {
    return graphResult
  }

  const graph = graphResult.value

  if (!options.enhanceWithAST) {
    return ok(graph)
  }

  try {
    const enhancedNodes = new Map<string, DependencyNode>()

    for (const [path, node] of graph.nodes) {
      const enhancedNode = await enhanceNodeWithAST(node)
      enhancedNodes.set(path, enhancedNode)
    }

    return ok({
      ...graph,
      nodes: enhancedNodes,
    })
  } catch (error) {
    return err({
      type: 'graph-error',
      message: error instanceof Error ? error.message : 'Unknown error enhancing graph with AST',
    })
  }
}

export function findDependents(
  graph: DependencyGraph,
  targetPaths: readonly string[]
): readonly string[] {
  const dependents = new Set<string>()
  const targets = new Set(targetPaths)

  for (const [path, dependencies] of graph.edges) {
    for (const dep of dependencies) {
      if (targets.has(dep)) {
        dependents.add(path)
      }
    }
  }

  return Array.from(dependents)
}

export function topologicalSort(
  graph: DependencyGraph
): Result<readonly string[], DependencyError> {
  const sorted: string[] = []
  const visited = new Set<string>()
  const visiting = new Set<string>()

  function visit(node: string): boolean {
    if (visited.has(node)) {
      return true
    }

    if (visiting.has(node)) {
      return false
    }

    visiting.add(node)

    const dependencies = graph.edges.get(node) || []
    for (const dep of dependencies) {
      if (!visit(dep)) {
        return false
      }
    }

    visiting.delete(node)
    visited.add(node)
    sorted.push(node)

    return true
  }

  for (const node of graph.nodes.keys()) {
    if (!visit(node)) {
      return err({
        type: 'graph-error',
        message: 'Circular dependency detected during topological sort',
      })
    }
  }

  return ok(sorted)
}

export { generateDependencyGraphWithCruiser, parseTypeScriptModule }
