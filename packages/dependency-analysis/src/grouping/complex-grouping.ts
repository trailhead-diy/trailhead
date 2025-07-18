import { ok, type Result } from '@esteban-url/core'
import type { AtomicCommitGroup, FileChange, DependencyGraph, DependencyError } from '../types.js'
import { findDependents } from '../graph/index.js'

interface GroupingContext {
  readonly graph: DependencyGraph
  readonly changes: ReadonlyMap<string, FileChange>
  readonly excludedFiles: Set<string>
}

function createDeletionGroup(changes: readonly FileChange[]): AtomicCommitGroup {
  const count = changes.length

  return {
    id: 'deletions',
    priority: 1,
    files: changes.map((c) => c.path),
    description: `refactor: remove ${count} unused file${count > 1 ? 's' : ''}`,
    dependencies: [],
    validationCommands: ['pnpm lint', 'pnpm types'],
    estimatedRisk: 'low',
    canParallelize: false,
    type: 'deletion',
  }
}

function groupByDependencyDepth(
  changes: readonly FileChange[],
  context: GroupingContext
): readonly AtomicCommitGroup[] {
  const groups: AtomicCommitGroup[] = []
  const changesByDepth = new Map<number, FileChange[]>()

  for (const change of changes) {
    const node = context.graph.nodes.get(change.path)
    if (node) {
      const depth = node.depth
      if (!changesByDepth.has(depth)) {
        changesByDepth.set(depth, [])
      }
      changesByDepth.get(depth)!.push(change)
    }
  }

  const sortedDepths = Array.from(changesByDepth.keys()).sort((a, b) => b - a)

  for (const depth of sortedDepths) {
    const depthChanges = changesByDepth.get(depth) || []

    if (depthChanges.length === 0) continue

    const hasApiChanges = depthChanges.some((c) => c.affectsPublicAPI)
    const riskLevel = hasApiChanges ? 'high' : 'medium'

    groups.push({
      id: `core-api-depth-${depth}`,
      priority: 2,
      files: depthChanges.map((c) => c.path),
      description: `refactor: update core modules at depth ${depth}`,
      dependencies: depthChanges.flatMap(
        (c) => context.graph.nodes.get(c.path)?.compilationDependencies || []
      ),
      validationCommands: ['pnpm format', 'pnpm lint', 'pnpm types', 'pnpm build'],
      estimatedRisk: riskLevel,
      canParallelize: false,
      type: 'core-api',
    })
  }

  return groups
}

function groupDependents(
  dependents: readonly string[],
  _context: GroupingContext
): readonly AtomicCommitGroup[] {
  const groups: AtomicCommitGroup[] = []
  const moduleGroups = new Map<string, string[]>()

  for (const dependent of dependents) {
    const parts = dependent.split('/')
    const module = parts.length > 1 ? parts[0] : 'root'

    if (!moduleGroups.has(module)) {
      moduleGroups.set(module, [])
    }
    moduleGroups.get(module)!.push(dependent)
  }

  for (const [module, files] of moduleGroups) {
    groups.push({
      id: `dependents-${module}`,
      priority: 3,
      files,
      description: `fix: update ${module} module dependencies`,
      dependencies: [],
      validationCommands: ['pnpm lint', 'pnpm types'],
      estimatedRisk: 'medium',
      canParallelize: true,
      type: 'dependent',
    })
  }

  return groups
}

function createIntegrationGroup(changes: readonly FileChange[]): AtomicCommitGroup {
  const hasTests = changes.some((c) => c.path.includes('test') || c.path.includes('spec'))
  const hasConfig = changes.some((c) => c.path.endsWith('.json') || c.path.includes('config'))

  let description = 'chore: '
  const parts: string[] = []

  if (hasTests) parts.push('test updates')
  if (hasConfig) parts.push('configuration changes')
  if (parts.length === 0) parts.push('final integration fixes')

  description += parts.join(' and ')

  return {
    id: 'integration',
    priority: 4,
    files: changes.map((c) => c.path),
    description,
    dependencies: [],
    validationCommands: ['pnpm format', 'pnpm lint', 'pnpm types', 'pnpm test'],
    estimatedRisk: 'low',
    canParallelize: false,
    type: 'integration',
  }
}

export function groupByRiskAndDependency(
  changes: readonly FileChange[],
  graph: DependencyGraph,
  excludedFiles: readonly string[] = []
): Result<readonly AtomicCommitGroup[], DependencyError> {
  const context: GroupingContext = {
    graph,
    changes: new Map(changes.map((c) => [c.path, c])),
    excludedFiles: new Set(excludedFiles),
  }

  const groups: AtomicCommitGroup[] = []
  const processedFiles = new Set<string>()

  const deletions = changes.filter(
    (c) => c.type === 'deletion' && !context.excludedFiles.has(c.path)
  )
  if (deletions.length > 0) {
    groups.push(createDeletionGroup(deletions))
    deletions.forEach((d) => processedFiles.add(d.path))
  }

  const apiChanges = changes.filter(
    (c) => c.affectsPublicAPI && !processedFiles.has(c.path) && !context.excludedFiles.has(c.path)
  )

  if (apiChanges.length > 0) {
    const apiGroups = groupByDependencyDepth(apiChanges, context)
    groups.push(...apiGroups)
    apiChanges.forEach((c) => processedFiles.add(c.path))
  }

  const dependentPaths = findDependents(
    graph,
    apiChanges.map((c) => c.path)
  )
  const dependentChanges = dependentPaths.filter(
    (p) => context.changes.has(p) && !processedFiles.has(p) && !context.excludedFiles.has(p)
  )

  if (dependentChanges.length > 0) {
    const dependentGroups = groupDependents(dependentChanges, context)
    groups.push(...dependentGroups)
    dependentChanges.forEach((p) => processedFiles.add(p))
  }

  const remainingChanges = changes.filter(
    (c) => !processedFiles.has(c.path) && !context.excludedFiles.has(c.path)
  )

  if (remainingChanges.length > 0) {
    groups.push(createIntegrationGroup(remainingChanges))
  }

  return ok(groups)
}
