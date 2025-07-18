import { ok, type Result } from "@esteban-url/core";
import type { AtomicCommitGroup, FileChange, DependencyError } from "../types.js";
import { groupingLogger, globalProfiler } from "../core/index.js";

function isTestFile(path: string): boolean {
  return path.includes("test") || path.includes("spec") || path.includes("__tests__");
}

function isCoreImplementation(path: string): boolean {
  return !isTestFile(path) && !isInfrastructure(path) && path.endsWith(".ts") || path.endsWith(".tsx") || path.endsWith(".js") || path.endsWith(".jsx");
}

function isInfrastructure(path: string): boolean {
  const infraPatterns = [
    "package.json",
    "tsconfig.json",
    "pnpm-lock.yaml",
    "yarn.lock",
    "package-lock.json",
    ".eslintrc",
    ".prettierrc",
    "turbo.json",
  ];
  
  return infraPatterns.some(pattern => path.endsWith(pattern));
}

function createTestGroup(changes: readonly FileChange[]): AtomicCommitGroup {
  const deletions = changes.filter(c => c.type === "deletion");
  const additions = changes.filter(c => c.type === "addition");
  const modifications = changes.filter(c => c.type === "modification");

  let description = "";
  if (deletions.length > 0 && additions.length === 0) {
    description = `test: remove ${deletions.length} test file${deletions.length > 1 ? "s" : ""}`;
  } else if (additions.length > 0 && deletions.length === 0) {
    description = `test: add ${additions.length} new test file${additions.length > 1 ? "s" : ""}`;
  } else {
    description = `test: update test files`;
  }

  return {
    id: "test-changes",
    priority: 1,
    files: changes.map(c => c.path),
    description,
    dependencies: [],
    validationCommands: ["pnpm test"],
    estimatedRisk: "low",
    canParallelize: true,
    type: "test",
  };
}

function createSingleFileGroup(change: FileChange, index: number): AtomicCommitGroup {
  const typePrefix = change.type === "addition" ? "feat" : 
                    change.type === "deletion" ? "refactor" : "fix";
  
  const fileName = change.path.split("/").pop() || change.path;
  
  return {
    id: `core-${index}`,
    priority: 2,
    files: [change.path],
    description: `${typePrefix}: update ${fileName}`,
    dependencies: [],
    validationCommands: ["pnpm lint", "pnpm types"],
    estimatedRisk: change.affectsPublicAPI ? "medium" : "low",
    canParallelize: false,
    type: "core-api",
  };
}

function createInfraGroup(changes: readonly FileChange[]): AtomicCommitGroup {
  const hasPackageJson = changes.some(c => c.path.endsWith("package.json"));
  const hasLockFile = changes.some(c => 
    c.path.endsWith("pnpm-lock.yaml") || 
    c.path.endsWith("yarn.lock") || 
    c.path.endsWith("package-lock.json")
  );

  let description = "chore: update ";
  const types: string[] = [];
  
  if (hasPackageJson) types.push("dependencies");
  if (hasLockFile) types.push("lock file");
  if (types.length === 0) types.push("infrastructure files");
  
  description += types.join(" and ");

  return {
    id: "infrastructure",
    priority: 3,
    files: changes.map(c => c.path),
    description,
    dependencies: [],
    validationCommands: hasPackageJson ? ["pnpm install", "pnpm build"] : ["pnpm lint"],
    estimatedRisk: hasPackageJson ? "medium" : "low",
    canParallelize: false,
    type: "config",
  };
}

export function detectSimpleGroups(changes: readonly FileChange[]): Result<readonly AtomicCommitGroup[], DependencyError> {
  const stopProfiling = globalProfiler.start("simple-grouping:detect");
  groupingLogger.debug("Starting simple grouping", { changeCount: changes.length });
  
  const groups: AtomicCommitGroup[] = [];
  
  const testChanges = changes.filter(c => isTestFile(c.path));
  if (testChanges.length > 0) {
    groupingLogger.debug("Creating test group", { fileCount: testChanges.length });
    groups.push(createTestGroup(testChanges));
  }
  
  const coreChanges = changes.filter(c => isCoreImplementation(c.path));
  coreChanges.forEach((change, index) => {
    groups.push(createSingleFileGroup(change, index));
  });
  groupingLogger.debug("Created core file groups", { count: coreChanges.length });
  
  const infraChanges = changes.filter(c => isInfrastructure(c.path));
  if (infraChanges.length > 0) {
    groupingLogger.debug("Creating infrastructure group", { fileCount: infraChanges.length });
    groups.push(createInfraGroup(infraChanges));
  }
  
  const metrics = stopProfiling({ groupCount: groups.length });
  groupingLogger.info("Simple grouping completed", {
    changeCount: changes.length,
    groupCount: groups.length,
    duration: metrics.duration,
  });
  
  return ok(groups);
}

export function isSimpleChange(changes: readonly FileChange[]): boolean {
  if (changes.length > 10) {
    return false;
  }
  
  const packages = new Set(changes.map(c => c.package).filter(Boolean));
  if (packages.size > 1) {
    return false;
  }
  
  const hasApiChanges = changes.some(c => c.affectsPublicAPI);
  if (hasApiChanges) {
    return false;
  }
  
  const testFiles = changes.filter(c => isTestFile(c.path));
  const coreFiles = changes.filter(c => isCoreImplementation(c.path));
  const infraFiles = changes.filter(c => isInfrastructure(c.path));
  
  const categorizedCount = testFiles.length + coreFiles.length + infraFiles.length;
  
  return categorizedCount === changes.length;
}