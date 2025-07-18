import type { FileChange, DependencyGraph, DependencyNode, AtomicCommitGroup } from "../types.js";

export function createMockFileChange(overrides: Partial<FileChange> = {}): FileChange {
  return {
    path: "src/test.ts",
    type: "modification",
    package: "test-package",
    hasImportChanges: false,
    affectsPublicAPI: false,
    riskLevel: "low",
    ...overrides,
  };
}

export function createMockDependencyNode(overrides: Partial<DependencyNode> = {}): DependencyNode {
  return {
    path: "src/test.ts",
    imports: [],
    exports: [],
    type: "source",
    depth: 0,
    apiSurfaceChanges: false,
    compilationDependencies: [],
    riskLevel: "low",
    ...overrides,
  };
}

export function createMockDependencyGraph(overrides: Partial<DependencyGraph> = {}): DependencyGraph {
  const defaultNodes = new Map([
    ["src/index.ts", createMockDependencyNode({ path: "src/index.ts" })],
    ["src/utils.ts", createMockDependencyNode({ path: "src/utils.ts" })],
  ]);
  
  const defaultEdges = new Map([
    ["src/index.ts", ["src/utils.ts"]],
    ["src/utils.ts", []],
  ]);
  
  return {
    nodes: overrides.nodes || defaultNodes,
    edges: overrides.edges || defaultEdges,
    roots: overrides.roots || ["src/index.ts"],
    cycles: overrides.cycles || [],
  };
}

export function createMockAtomicCommitGroup(overrides: Partial<AtomicCommitGroup> = {}): AtomicCommitGroup {
  return {
    id: "test-group",
    priority: 1,
    files: ["src/test.ts"],
    description: "test: update test files",
    dependencies: [],
    validationCommands: ["pnpm test"],
    estimatedRisk: "low",
    canParallelize: false,
    type: "test",
    ...overrides,
  };
}

export function createMockChanges(count: number, template: Partial<FileChange> = {}): FileChange[] {
  return Array.from({ length: count }, (_, i) => 
    createMockFileChange({
      path: `src/file-${i}.ts`,
      ...template,
    })
  );
}