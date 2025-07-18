import type { Result } from "@esteban-url/core";

export type DependencyError =
  | { readonly type: "parse-error"; readonly message: string; readonly file: string }
  | { readonly type: "analysis-error"; readonly message: string }
  | { readonly type: "graph-error"; readonly message: string }
  | { readonly type: "grouping-error"; readonly message: string }
  | { readonly type: "validation-error"; readonly message: string };

export interface ImportInfo {
  readonly source: string;
  readonly specifiers: readonly string[];
  readonly isTypeOnly: boolean;
  readonly isApiSurface: boolean;
  readonly line: number;
}

export interface ExportInfo {
  readonly name: string;
  readonly isTypeOnly: boolean;
  readonly isDefault: boolean;
  readonly line: number;
}

export interface DependencyNode {
  readonly path: string;
  readonly imports: readonly ImportInfo[];
  readonly exports: readonly ExportInfo[];
  readonly type: "source" | "test" | "config" | "docs";
  readonly depth: number;
  readonly apiSurfaceChanges: boolean;
  readonly compilationDependencies: readonly string[];
  readonly riskLevel: "low" | "medium" | "high";
}

export interface DependencyGraph {
  readonly nodes: ReadonlyMap<string, DependencyNode>;
  readonly edges: ReadonlyMap<string, readonly string[]>;
  readonly roots: readonly string[];
  readonly cycles: readonly string[][];
}

export interface FileChange {
  readonly path: string;
  readonly type: "addition" | "modification" | "deletion";
  readonly package?: string;
  readonly hasImportChanges: boolean;
  readonly affectsPublicAPI: boolean;
  readonly riskLevel: "low" | "medium" | "high";
}

export interface AtomicCommitGroup {
  readonly id: string;
  readonly priority: number;
  readonly files: readonly string[];
  readonly description: string;
  readonly dependencies: readonly string[];
  readonly validationCommands: readonly string[];
  readonly estimatedRisk: "low" | "medium" | "high";
  readonly canParallelize: boolean;
  readonly type: "deletion" | "core-api" | "dependent" | "test" | "config" | "integration";
}

export interface AnalysisOptions {
  readonly mode?: "auto" | "simple" | "complex";
  readonly excludeFiles?: readonly string[];
  readonly complexityThreshold?: number;
  readonly preferSimpleGrouping?: boolean;
  readonly validationCommands?: readonly string[];
  readonly dryRun?: boolean;
}

export interface AnalysisResult {
  readonly mode: "simple" | "complex";
  readonly groups: readonly AtomicCommitGroup[];
  readonly totalFiles: number;
  readonly estimatedTime: string;
  readonly warnings: readonly string[];
}

export interface APIChange {
  readonly file: string;
  readonly type: "method-migration" | "import-replacement" | "type-update";
  readonly description: string;
  readonly affectedFiles: readonly string[];
  readonly riskLevel: "low" | "medium" | "high";
}

export interface ImportPatternChange {
  readonly file: string;
  readonly oldPattern: string;
  readonly newPattern: string;
  readonly affectedFiles: readonly string[];
  readonly riskLevel: "low" | "medium" | "high";
}

export interface DependencyAnalysisEngine {
  analyzeChanges(changes: readonly FileChange[], options?: AnalysisOptions): Promise<Result<AnalysisResult, DependencyError>>;
  generateDependencyGraph(files: readonly string[]): Promise<Result<DependencyGraph, DependencyError>>;
  groupChanges(changes: readonly FileChange[], graph: DependencyGraph, options?: AnalysisOptions): Promise<Result<readonly AtomicCommitGroup[], DependencyError>>;
}