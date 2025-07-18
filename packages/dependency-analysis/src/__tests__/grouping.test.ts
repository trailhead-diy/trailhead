import { describe, it, expect } from "vitest";
import { 
  isSimpleChange, 
  detectSimpleGroups, 
  groupByRiskAndDependency,
  determineAnalysisMode,
  groupChanges
} from "../grouping/index.js";
import { 
  createMockFileChange, 
  createMockDependencyGraph,
  createMockChanges 
} from "../testing/index.js";
import type { FileChange } from "../types.js";

describe("Grouping Strategy Detection", () => {
  it("should detect simple changes correctly", () => {
    const simpleChanges: FileChange[] = [
      createMockFileChange({ path: "src/utils.test.ts", type: "deletion" }),
      createMockFileChange({ path: "src/index.ts", type: "modification" }),
      createMockFileChange({ path: "package.json", type: "modification" }),
    ];
    
    expect(isSimpleChange(simpleChanges)).toBe(true);
  });

  it("should detect complex changes with API surface changes", () => {
    const complexChanges: FileChange[] = [
      createMockFileChange({ path: "src/api.ts", affectsPublicAPI: true }),
      createMockFileChange({ path: "src/utils.ts" }),
    ];
    
    expect(isSimpleChange(complexChanges)).toBe(false);
  });

  it("should detect complex changes with multiple packages", () => {
    const complexChanges: FileChange[] = [
      createMockFileChange({ path: "packages/cli/src/index.ts", package: "cli" }),
      createMockFileChange({ path: "packages/core/src/index.ts", package: "core" }),
    ];
    
    expect(isSimpleChange(complexChanges)).toBe(false);
  });

  it("should detect complex changes when file count exceeds threshold", () => {
    const manyChanges = createMockChanges(15);
    expect(isSimpleChange(manyChanges)).toBe(false);
  });
});

describe("Simple Grouping", () => {
  it("should group test file deletions separately", () => {
    const changes: FileChange[] = [
      createMockFileChange({ path: "src/utils.test.ts", type: "deletion" }),
      createMockFileChange({ path: "src/index.test.ts", type: "deletion" }),
      createMockFileChange({ path: "src/helpers.spec.ts", type: "deletion" }),
    ];
    
    const result = detectSimpleGroups(changes);
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const groups = result.value;
      expect(groups).toHaveLength(1);
      expect(groups[0].type).toBe("test");
      expect(groups[0].description).toContain("remove 3 test files");
    }
  });

  it("should create individual groups for core implementation files", () => {
    const changes: FileChange[] = [
      createMockFileChange({ path: "src/utils.ts", type: "modification" }),
      createMockFileChange({ path: "src/helpers.ts", type: "modification" }),
    ];
    
    const result = detectSimpleGroups(changes);
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const groups = result.value;
      expect(groups).toHaveLength(2);
      expect(groups.every(g => g.type === "core-api")).toBe(true);
    }
  });

  it("should group infrastructure files together", () => {
    const changes: FileChange[] = [
      createMockFileChange({ path: "package.json", type: "modification" }),
      createMockFileChange({ path: "pnpm-lock.yaml", type: "modification" }),
      createMockFileChange({ path: "tsconfig.json", type: "modification" }),
    ];
    
    const result = detectSimpleGroups(changes);
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const groups = result.value;
      expect(groups).toHaveLength(1);
      expect(groups[0].type).toBe("config");
      expect(groups[0].description).toContain("dependencies");
    }
  });
});

describe("Complex Grouping", () => {
  it("should prioritize deletions first", () => {
    const changes: FileChange[] = [
      createMockFileChange({ path: "src/old-api.ts", type: "deletion" }),
      createMockFileChange({ path: "src/deprecated.ts", type: "deletion" }),
      createMockFileChange({ path: "src/new-api.ts", type: "addition" }),
    ];
    
    const graph = createMockDependencyGraph();
    const result = groupByRiskAndDependency(changes, graph);
    
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const groups = result.value;
      expect(groups[0].type).toBe("deletion");
      expect(groups[0].priority).toBe(1);
    }
  });

  it("should group API changes by dependency depth", () => {
    const changes: FileChange[] = [
      createMockFileChange({ 
        path: "src/core.ts", 
        affectsPublicAPI: true,
        riskLevel: "high" 
      }),
      createMockFileChange({ 
        path: "src/utils.ts", 
        affectsPublicAPI: true,
        riskLevel: "medium" 
      }),
    ];
    
    const graph = createMockDependencyGraph({
      nodes: new Map([
        ["src/core.ts", { 
          path: "src/core.ts",
          imports: [],
          exports: [{ name: "CoreAPI", isTypeOnly: false, isDefault: false, line: 1 }],
          type: "source",
          depth: 2,
          apiSurfaceChanges: true,
          compilationDependencies: [],
          riskLevel: "high"
        }],
        ["src/utils.ts", {
          path: "src/utils.ts",
          imports: [],
          exports: [],
          type: "source", 
          depth: 1,
          apiSurfaceChanges: true,
          compilationDependencies: ["src/core.ts"],
          riskLevel: "medium"
        }],
      ]),
    });
    
    const result = groupByRiskAndDependency(changes, graph);
    
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const groups = result.value;
      const apiGroups = groups.filter(g => g.type === "core-api");
      expect(apiGroups.length).toBeGreaterThan(0);
      expect(apiGroups[0].estimatedRisk).toBe("high");
    }
  });

  it("should respect excluded files", () => {
    const changes: FileChange[] = [
      createMockFileChange({ path: "src/index.ts" }),
      createMockFileChange({ path: "package.json" }),
      createMockFileChange({ path: "turbo.json" }),
    ];
    
    const graph = createMockDependencyGraph();
    const result = groupByRiskAndDependency(changes, graph, ["package.json", "turbo.json"]);
    
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const groups = result.value;
      const allFiles = groups.flatMap(g => g.files);
      expect(allFiles).not.toContain("package.json");
      expect(allFiles).not.toContain("turbo.json");
    }
  });
});

describe("Analysis Mode Detection", () => {
  it("should use simple mode for small changes without API impact", () => {
    const changes = createMockChanges(5, { affectsPublicAPI: false });
    expect(determineAnalysisMode(changes)).toBe("simple");
  });

  it("should use complex mode for changes with API impact", () => {
    const changes = createMockChanges(3, { affectsPublicAPI: true });
    expect(determineAnalysisMode(changes)).toBe("complex");
  });

  it("should respect explicit mode option", () => {
    const changes = createMockChanges(3);
    expect(determineAnalysisMode(changes, { mode: "complex" })).toBe("complex");
    expect(determineAnalysisMode(changes, { mode: "simple" })).toBe("simple");
  });

  it("should use complex mode when threshold is exceeded", () => {
    const changes = createMockChanges(15);
    expect(determineAnalysisMode(changes)).toBe("complex");
    expect(determineAnalysisMode(changes, { complexityThreshold: 20 })).toBe("simple");
  });
});

describe("Integrated Grouping", () => {
  it("should handle empty changes gracefully", async () => {
    const result = await groupChanges([], null);
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toHaveLength(0);
    }
  });

  it("should use simple grouping when appropriate", async () => {
    const changes: FileChange[] = [
      createMockFileChange({ path: "src/test.spec.ts", type: "deletion" }),
      createMockFileChange({ path: "src/index.ts" }),
    ];
    
    const result = await groupChanges(changes, null);
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.length).toBeGreaterThan(0);
    }
  });

  it("should require graph for complex grouping", async () => {
    const changes = createMockChanges(15, { affectsPublicAPI: true });
    const result = await groupChanges(changes, null);
    
    expect(result.isOk()).toBe(false);
    if (!result.isOk()) {
      expect(result.error.type).toBe("grouping-error");
      expect(result.error.message).toContain("Dependency graph required");
    }
  });
});