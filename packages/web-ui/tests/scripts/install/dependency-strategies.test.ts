/**
 * @fileoverview High-ROI Tests for Dependency Strategy Selection
 *
 * Tests focus on business logic that affects user experience:
 * - Strategy selection rules and priority
 * - Context-driven decision making
 * - Framework-specific behavior
 * - Edge cases in strategy recommendation
 */

import { describe, it, expect } from 'vitest';
import {
  recommendStrategy,
  getMatchingRules,
  createDependencyContext,
  getInstallOptions,
  validateStrategy,
  getFrameworkStrategy,
  getStrategyDescription,
  isInteractiveStrategy,
  modifiesPackageJson,
  runsInstallCommand,
  type DependencyContext,
  type DependencyStrategy,
} from '../../../src/cli/core/installation/dependency-strategies.js';
import type { DependencyAnalysis } from '../../../src/cli/core/installation/dependency-resolution.js';

describe('Dependency Strategy Selection', () => {
  // Helper to create test context
  const createTestContext = (overrides: Partial<DependencyContext> = {}): DependencyContext => ({
    hasConflicts: false,
    conflictSeverity: 'none',
    isCI: false,
    isOffline: false,
    hasWorkspace: false,
    packageManager: 'npm',
    hasLockfile: false,
    ...overrides,
  });

  describe('Strategy Selection Rules', () => {
    it('should prioritize CI environment over all other conditions', () => {
      const context = createTestContext({
        isCI: true,
        hasConflicts: true,
        conflictSeverity: 'breaking',
        isOffline: false, // Should be overridden by CI priority
      });

      const strategy = recommendStrategy(context);

      expect(strategy.type).toBe('auto');
      expect(strategy.useLockfile).toBe(true);
      expect(strategy.reason).toBe('CI environment detected');
    });

    it('should fallback to manual for offline mode', () => {
      const context = createTestContext({
        isOffline: true,
        hasConflicts: true,
        conflictSeverity: 'major',
      });

      const strategy = recommendStrategy(context);

      expect(strategy.type).toBe('manual');
      expect(strategy.reason).toBe('Offline mode detected - manual installation required');
    });

    it('should recommend manual for breaking conflicts', () => {
      const context = createTestContext({
        conflictSeverity: 'breaking',
        hasConflicts: true,
      });

      const strategy = recommendStrategy(context);

      expect(strategy.type).toBe('manual');
      expect(strategy.reason).toBe('Breaking changes detected - manual review required');
    });

    it('should recommend selective for workspace with conflicts', () => {
      const context = createTestContext({
        hasWorkspace: true,
        hasConflicts: true,
        conflictSeverity: 'minor',
      });

      const strategy = recommendStrategy(context);

      expect(strategy.type).toBe('selective');
      expect(strategy.preferWorkspace).toBe(true);
      expect(strategy.reason).toBe('Workspace with conflicts - selective installation recommended');
    });

    it('should recommend smart for minor conflicts', () => {
      const context = createTestContext({
        conflictSeverity: 'minor',
        hasConflicts: true,
      });

      const strategy = recommendStrategy(context);

      expect(strategy.type).toBe('smart');
      expect(strategy.skipConflicts).toBe(false);
      expect(strategy.reason).toBe('Minor version conflicts - smart resolution available');
    });

    it('should recommend selective for major conflicts', () => {
      const context = createTestContext({
        conflictSeverity: 'major',
        hasConflicts: true,
      });

      const strategy = recommendStrategy(context);

      expect(strategy.type).toBe('selective');
      expect(strategy.reason).toBe('Major version conflicts - review needed');
    });

    it('should default to auto when no conflicts exist', () => {
      const context = createTestContext({
        hasConflicts: false,
        conflictSeverity: 'none',
      });

      const strategy = recommendStrategy(context);

      expect(strategy.type).toBe('auto');
      expect(strategy.reason).toBe('No conflicts detected - automatic installation');
    });
  });

  describe('Rule Priority Testing', () => {
    it('should return rules in priority order', () => {
      const context = createTestContext({
        isCI: true,
        isOffline: true, // Both should match but CI has higher priority
        conflictSeverity: 'breaking',
      });

      const rules = getMatchingRules(context);

      expect(rules.length).toBeGreaterThanOrEqual(2);
      expect(rules[0].priority).toBeGreaterThan(rules[1].priority);
      expect(rules[0].strategy.type).toBe('auto'); // CI rule should be first
    });

    it('should handle multiple matching rules correctly', () => {
      const context = createTestContext({
        hasWorkspace: true,
        hasConflicts: true,
        conflictSeverity: 'major',
      });

      const rules = getMatchingRules(context);
      const strategy = recommendStrategy(context);

      // Should match both workspace+conflicts and major conflicts rules
      expect(rules.length).toBeGreaterThanOrEqual(2);
      // Should pick the highest priority one (workspace+conflicts)
      expect(strategy.type).toBe('selective');
      expect(strategy.preferWorkspace).toBe(true);
    });
  });

  describe('Context Creation', () => {
    it('should create context with proper workspace preference', () => {
      const analysis: DependencyAnalysis = {
        missing: { react: '^18.0.0' },
        existing: { next: '^13.0.0' },
        conflicts: [],
        hasConflicts: false,
      };

      const context = createDependencyContext(
        analysis,
        { type: 'pnpm', root: '/workspace', packageJsons: [] },
        { name: 'github-actions', detected: true },
        'pnpm',
        true,
        false
      );

      expect(context.hasWorkspace).toBe(true);
      expect(context.isCI).toBe(true);
      expect(context.packageManager).toBe('pnpm');
      expect(context.hasLockfile).toBe(true);
    });

    it('should handle null workspace and CI correctly', () => {
      const analysis: DependencyAnalysis = {
        missing: {},
        existing: {},
        conflicts: [],
        hasConflicts: false,
      };

      const context = createDependencyContext(analysis, null, null, 'npm', false, true);

      expect(context.hasWorkspace).toBe(false);
      expect(context.isCI).toBe(false);
      expect(context.isOffline).toBe(true);
    });
  });

  describe('Install Options Generation', () => {
    it('should generate correct options for auto strategy with npm', () => {
      const strategy: DependencyStrategy = {
        type: 'auto',
        useLockfile: true,
      };

      const options = getInstallOptions(strategy, 'npm', true);

      expect(options.packageManager).toBe('npm');
      expect(options.useLockfile).toBe(true);
      expect(options.flags).toEqual(expect.arrayContaining(['--network-timeout']));
      expect(options.env).toEqual(expect.objectContaining({ FORCE_COLOR: '1' }));
    });

    it('should generate correct options for manual strategy', () => {
      const strategy: DependencyStrategy = {
        type: 'manual',
        reason: 'Test manual strategy',
      };

      const options = getInstallOptions(strategy, 'yarn', false);

      expect(options.packageManager).toBe('yarn');
      expect(options.useLockfile).toBe(false);
      expect(options.flags).not.toContain('--frozen-lockfile');
    });

    it('should handle workspace preference correctly', () => {
      const strategy: DependencyStrategy = {
        type: 'smart',
        preferWorkspace: true,
      };

      const options = getInstallOptions(strategy, 'pnpm', true);

      expect(options.packageManager).toBe('pnpm');
      // Should include workspace-related flags
      expect(options.flags).toEqual(expect.arrayContaining(['--workspace-root']));
    });
  });

  describe('Framework-Specific Strategies', () => {
    it('should prefer workspace for RedwoodJS', () => {
      const frameworkStrategy = getFrameworkStrategy('redwood-sdk', false);

      expect(frameworkStrategy.preferWorkspace).toBe(true);
    });

    it('should return empty strategy for Vite (flexible)', () => {
      const frameworkStrategy = getFrameworkStrategy('vite', true);

      expect(Object.keys(frameworkStrategy)).toHaveLength(0);
    });

    it('should return empty strategy for unknown frameworks', () => {
      const frameworkStrategy = getFrameworkStrategy('unknown-framework', true);

      expect(Object.keys(frameworkStrategy)).toHaveLength(0);
    });
  });

  describe('Strategy Validation', () => {
    it('should warn about force strategy in non-CI environments', () => {
      const strategy: DependencyStrategy = { type: 'force' };
      const context = createTestContext({ isCI: false });

      const warnings = validateStrategy(strategy, context);

      expect(warnings).toContain('Force strategy may break other packages - use with caution');
    });

    it('should warn about skipping with conflicts', () => {
      const strategy: DependencyStrategy = { type: 'skip' };
      const context = createTestContext({ hasConflicts: true });

      const warnings = validateStrategy(strategy, context);

      expect(warnings).toContain(
        'Skipping dependency management with conflicts may cause runtime errors'
      );
    });

    it('should warn about auto install in offline mode', () => {
      const strategy: DependencyStrategy = { type: 'auto' };
      const context = createTestContext({ isOffline: true });

      const warnings = validateStrategy(strategy, context);

      expect(warnings).toContain('Auto-install may fail in offline mode');
    });

    it('should return no warnings for safe configurations', () => {
      const strategy: DependencyStrategy = { type: 'smart' };
      const context = createTestContext({ hasConflicts: false });

      const warnings = validateStrategy(strategy, context);

      expect(warnings).toHaveLength(0);
    });
  });

  describe('Strategy Helper Functions', () => {
    it('should correctly identify interactive strategies', () => {
      expect(isInteractiveStrategy('selective')).toBe(true);
      expect(isInteractiveStrategy('manual')).toBe(true);
      expect(isInteractiveStrategy('auto')).toBe(false);
      expect(isInteractiveStrategy('smart')).toBe(false);
    });

    it('should correctly identify strategies that modify package.json', () => {
      expect(modifiesPackageJson('auto')).toBe(true);
      expect(modifiesPackageJson('manual')).toBe(true);
      expect(modifiesPackageJson('skip')).toBe(false);
    });

    it('should correctly identify strategies that run install command', () => {
      expect(runsInstallCommand('auto')).toBe(true);
      expect(runsInstallCommand('smart')).toBe(true);
      expect(runsInstallCommand('force')).toBe(true);
      expect(runsInstallCommand('manual')).toBe(false);
      expect(runsInstallCommand('selective')).toBe(false);
    });

    it('should provide human-readable strategy descriptions', () => {
      expect(getStrategyDescription('auto')).toBe('Automatically install all dependencies');
      expect(getStrategyDescription('smart')).toBe(
        'Smart resolution with automatic conflict handling'
      );
      expect(getStrategyDescription('selective')).toBe('Choose which dependencies to install');
      expect(getStrategyDescription('manual')).toBe(
        'Update package.json only (manual install required)'
      );
      expect(getStrategyDescription('skip')).toBe('Skip dependency management entirely');
      expect(getStrategyDescription('force')).toBe('Force install, overriding all conflicts');
    });
  });

  describe('Edge Cases', () => {
    it('should handle context with all conditions enabled', () => {
      const context = createTestContext({
        isCI: true,
        isOffline: true,
        hasWorkspace: true,
        hasConflicts: true,
        conflictSeverity: 'breaking',
      });

      const strategy = recommendStrategy(context);

      // CI should win due to highest priority
      expect(strategy.type).toBe('auto');
      expect(strategy.reason).toBe('CI environment detected');
    });

    it('should apply workspace preference even when not explicitly set', () => {
      const context = createTestContext({
        hasWorkspace: true,
        hasConflicts: false,
      });

      const strategy = recommendStrategy(context);

      expect(strategy.preferWorkspace).toBe(true);
    });

    it('should handle conflictSeverity edge cases', () => {
      // Test with unexpected severity value
      const context = createTestContext({
        conflictSeverity: 'unknown' as any,
        hasConflicts: false,
      });

      const strategy = recommendStrategy(context);

      // Should fall back to default rule
      expect(strategy.type).toBe('auto');
    });
  });
});
