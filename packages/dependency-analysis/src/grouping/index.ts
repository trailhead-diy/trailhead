import { err, ok, type Result } from "@esteban-url/core";
import type { AtomicCommitGroup, FileChange, DependencyGraph, AnalysisOptions, DependencyError } from "../types.js";
import { detectSimpleGroups, isSimpleChange } from "./simple-grouping.js";
import { groupByRiskAndDependency } from "./complex-grouping.js";

export function determineAnalysisMode(
  changes: readonly FileChange[],
  options: AnalysisOptions = {},
): "simple" | "complex" {
  if (options.mode && options.mode !== "auto") {
    return options.mode;
  }

  const threshold = options.complexityThreshold ?? 10;
  
  if (changes.length > threshold) {
    return "complex";
  }
  
  if (options.preferSimpleGrouping && isSimpleChange(changes)) {
    return "simple";
  }
  
  const packages = new Set(changes.map(c => c.package).filter(Boolean));
  const apiChanges = changes.filter(c => c.affectsPublicAPI).length;
  const importChanges = changes.filter(c => c.hasImportChanges).length;
  const deletionRatio = changes.filter(c => c.type === "deletion").length / changes.length;
  
  if (packages.size > 1 || apiChanges > 0 || importChanges > 3 || deletionRatio > 0.5) {
    return "complex";
  }
  
  return isSimpleChange(changes) ? "simple" : "complex";
}

export async function groupChanges(
  changes: readonly FileChange[],
  graph: DependencyGraph | null,
  options: AnalysisOptions = {},
): Promise<Result<readonly AtomicCommitGroup[], DependencyError>> {
  const mode = determineAnalysisMode(changes, options);
  const excludedFiles = options.excludeFiles || [];
  
  const filteredChanges = changes.filter(c => !excludedFiles.includes(c.path));
  
  if (filteredChanges.length === 0) {
    return ok([]);
  }
  
  if (mode === "simple") {
    return detectSimpleGroups(filteredChanges);
  }
  
  if (!graph) {
    return err({
      type: "grouping-error",
      message: "Dependency graph required for complex grouping mode",
    });
  }
  
  return groupByRiskAndDependency(filteredChanges, graph, excludedFiles);
}

export function validateGroups(
  groups: readonly AtomicCommitGroup[],
): Result<readonly AtomicCommitGroup[], DependencyError> {
  const fileSet = new Set<string>();
  
  for (const group of groups) {
    for (const file of group.files) {
      if (fileSet.has(file)) {
        return err({
          type: "validation-error",
          message: `File ${file} appears in multiple groups`,
        });
      }
      fileSet.add(file);
    }
  }
  
  if (groups.length === 0) {
    return err({
      type: "validation-error",
      message: "No groups generated from changes",
    });
  }
  
  const sortedGroups = [...groups].sort((a, b) => a.priority - b.priority);
  
  return ok(sortedGroups);
}

export { detectSimpleGroups, isSimpleChange, groupByRiskAndDependency, determineAnalysisMode as detectComplexityMode };