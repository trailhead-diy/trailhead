export type {
  DependencyError,
  ImportInfo,
  ExportInfo,
  DependencyNode,
  DependencyGraph,
  FileChange,
  AtomicCommitGroup,
  AnalysisOptions,
  AnalysisResult,
  APIChange,
  ImportPatternChange,
  DependencyAnalysisEngine,
} from './types.js'

export { createDependencyAnalysisEngine } from './analysis/index.js'
export { analyzeGitChanges, createAtomicCommits } from './analysis/index.js'
export type { GitContext, CommitCreationOptions, CommitResult } from './analysis/index.js'

// Export core utilities through subpath export
// Usage: import { globalProfiler, createLogger } from "@esteban-url/dependency-analysis/core";
