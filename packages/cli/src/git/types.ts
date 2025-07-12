/**
 * Git types for CLI package
 */

export interface GitOptions {
  cwd?: string;
  timeout?: number;
  env?: Record<string, string>;
  fetch?: boolean;
}

export interface BranchSyncStatus {
  currentBranch: string;
  remoteBranch?: string;
  ahead: number;
  behind: number;
  isUpToDate: boolean;
  canFastForward: boolean;
}

export interface GitCommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  command?: string;
}

export interface GitFileStatus {
  file: string;
  status: string;
  staged: boolean;
  modified: boolean;
}

export interface GitStatusResult {
  files: GitFileStatus[];
  branch: string;
  ahead: number;
  behind: number;
  clean: boolean;
}

export interface MergeBaseResult {
  base: string;
  ahead: number;
  behind: number;
}

export interface MergeBaseInfo {
  base: string;
  ahead: number;
  behind: number;
  commitSha: string;
  isAncestor: boolean;
  branch1: string;
  branch2: string;
}
