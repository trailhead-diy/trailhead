import { describe, it, expect, vi, beforeEach } from "vitest";
import { ok } from "@esteban-url/core";
import { createDependencyAnalysisEngine } from "../analysis/engine.js";
import { createMockChanges, createMockDependencyGraph } from "../testing/index.js";
import type { FileChange } from "../types.js";
import * as depCruiser from "../graph/dependency-cruiser.js";
import * as treeSitter from "../graph/tree-sitter-parser.js";

vi.mock("../graph/dependency-cruiser.js", () => ({
  generateDependencyGraphWithCruiser: vi.fn(),
}));

vi.mock("../graph/tree-sitter-parser.js", () => ({
  parseTypeScriptModule: vi.fn(),
}));

describe("DependencyAnalysisEngine", () => {
  beforeEach(() => {
    vi.mocked(depCruiser.generateDependencyGraphWithCruiser).mockResolvedValue(
      ok(createMockDependencyGraph())
    );
    
    vi.mocked(treeSitter.parseTypeScriptModule).mockResolvedValue(
      ok({
        imports: [],
        exports: [],
        hasApiChanges: false,
      })
    );
  });

  it("should analyze simple changes without generating dependency graph", async () => {
    const engine = createDependencyAnalysisEngine();
    const changes = createMockChanges(3);
    
    const result = await engine.analyzeChanges(changes);
    
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.mode).toBe("simple");
      expect(result.value.totalFiles).toBe(3);
      expect(result.value.groups.length).toBeGreaterThan(0);
    }
  });

  it("should analyze complex changes with dependency graph", async () => {
    const engine = createDependencyAnalysisEngine();
    const changes = createMockChanges(15, { affectsPublicAPI: true });
    
    const result = await engine.analyzeChanges(changes);
    
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.mode).toBe("complex");
      expect(result.value.totalFiles).toBe(15);
      expect(result.value.estimatedTime).toMatch(/\d+(\.\d+)?[ms]?s?/);
    }
  });

  it("should respect analysis options", async () => {
    const engine = createDependencyAnalysisEngine();
    const changes = createMockChanges(5);
    
    const result = await engine.analyzeChanges(changes, { mode: "complex" });
    
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.mode).toBe("complex");
    }
  });

  it("should include warnings for circular dependencies", async () => {
    const engine = createDependencyAnalysisEngine();
    const changes = createMockChanges(10, { affectsPublicAPI: true });
    
    vi.mocked(depCruiser.generateDependencyGraphWithCruiser)
      .mockResolvedValueOnce(
        ok(createMockDependencyGraph({
          cycles: [["src/a.ts", "src/b.ts", "src/a.ts"]],
        }))
      );
    
    const result = await engine.analyzeChanges(changes);
    
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.warnings).toContainEqual(
        expect.stringContaining("circular dependencies")
      );
    }
  });

  it("should include warnings for high-risk groups", async () => {
    const engine = createDependencyAnalysisEngine();
    const changes: FileChange[] = [
      {
        path: "src/api.ts",
        type: "modification",
        package: "core",
        hasImportChanges: true,
        affectsPublicAPI: true,
        riskLevel: "high",
      },
    ];
    
    const result = await engine.analyzeChanges(changes);
    
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const hasHighRiskWarning = result.value.warnings.some((w: string) => 
        w.includes("high-risk")
      );
      expect(hasHighRiskWarning).toBe(true);
    }
  });

  it("should handle excluded files", async () => {
    const engine = createDependencyAnalysisEngine();
    const changes = createMockChanges(5);
    
    const result = await engine.analyzeChanges(changes, {
      excludeFiles: ["src/file-0.ts", "src/file-1.ts"],
    });
    
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const allFiles = result.value.groups.flatMap(g => g.files);
      expect(allFiles).not.toContain("src/file-0.ts");
      expect(allFiles).not.toContain("src/file-1.ts");
    }
  });

  it("should measure performance accurately", async () => {
    const engine = createDependencyAnalysisEngine();
    const changes = createMockChanges(20, { affectsPublicAPI: true });
    
    const start = Date.now();
    const result = await engine.analyzeChanges(changes);
    const elapsed = Date.now() - start;
    
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const timeString = result.value.estimatedTime;
      if (timeString.endsWith("ms")) {
        const ms = parseInt(timeString.slice(0, -2));
        expect(ms).toBeGreaterThanOrEqual(0);
        expect(ms).toBeLessThanOrEqual(elapsed + 100);
      } else if (timeString.endsWith("s")) {
        const seconds = parseFloat(timeString.slice(0, -1));
        expect(seconds).toBeGreaterThanOrEqual(0);
        expect(seconds).toBeLessThanOrEqual((elapsed + 100) / 1000);
      }
    }
  });
});