export { createDependencyAnalysisEngine } from "./engine.js";
export { 
  createAtomicCommits, 
  analyzeGitChanges,
  type GitContext,
  type CommitCreationOptions,
  type CommitResult 
} from "./git-integration.js";