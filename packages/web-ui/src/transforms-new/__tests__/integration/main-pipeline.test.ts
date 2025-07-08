/**
 * Integration tests for the main transformation pipeline
 */

import { describe, it, expect } from 'vitest';
import { MainTransformPipeline, createCompletePipeline } from '../../pipelines/main-pipeline';
import { addCatalystPrefix } from '../../business-logic/catalyst-integration/add-catalyst-prefix';
import { reorderParameters } from '../../ast-operations/parameters/reorder-parameters';

describe('MainTransformPipeline', () => {
  it('should execute transforms in sequence', () => {
    const pipeline = new MainTransformPipeline({ verbose: false });

    // Add a simple transform
    pipeline.addTransform(reorderParameters);

    const source = `
      function test({ ...props, className }) {
        return <div className={className} {...props} />;
      }
    `;

    const result = pipeline.execute(source);

    expect(result.success).toBe(true);
    expect(result.transformResults).toHaveLength(1);
    expect(result.transformResults[0].name).toBe('reorder-parameters');
  });

  it('should handle transform errors gracefully', () => {
    const pipeline = new MainTransformPipeline({ verbose: false });

    // Add a transform that might fail
    const failingTransform = {
      name: 'failing-transform',
      description: 'A transform that fails',
      apply: () => {
        throw new Error('Transform failed');
      },
    };

    pipeline.addTransform(failingTransform);

    const result = pipeline.execute('const x = 1;');

    expect(result.success).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('failing-transform failed');
  });

  it('should apply the complete pipeline correctly', () => {
    const source = `
      export function Avatar({ ...props, className }) {
        return <span className="base-class" {...props} />;
      }
    `;

    const pipeline = createCompletePipeline({ verbose: false });
    const result = pipeline.execute(source);

    expect(result.success).toBe(true);
    expect(result.totalChanges).toBeGreaterThan(0);

    // Check that some transforms were applied
    const transformNames = result.transformResults.map(r => r.name);
    expect(transformNames).toContain('add-catalyst-prefix');
    expect(transformNames).toContain('reorder-parameters');
  });
});

describe('Atomic Transforms', () => {
  describe('reorderParameters', () => {
    it('should fix invalid rest parameter ordering', () => {
      const source = `
        function test({ ...props, className }) {
          return <div />;
        }
      `;

      const result = reorderParameters.apply(source);

      expect(result.hasChanges).toBe(true);
      expect(result.changes).toHaveLength(1);
      expect(result.changes[0].type).toBe('reorder-parameters');
      expect(result.changes[0].description).toContain('Fixed invalid rest parameter ordering');
    });

    it('should not modify correct parameter ordering', () => {
      const source = `
        function test({ className, ...props }) {
          return <div />;
        }
      `;

      const result = reorderParameters.apply(source);

      expect(result.hasChanges).toBe(false);
      expect(result.changes).toHaveLength(0);
    });
  });

  describe('addCatalystPrefix', () => {
    it('should add Catalyst prefix to specified components', () => {
      const source = `
        import { Avatar } from './avatar';
        export function MyAvatar() {
          return <Avatar />;
        }
      `;

      const result = addCatalystPrefix.apply(source, {
        components: ['Avatar'],
        scope: 'all',
      });

      expect(result.hasChanges).toBe(true);
      expect(result.changes.length).toBeGreaterThan(0);

      // Should have changes for import and usage
      const changeTypes = result.changes.map(c => c.type);
      expect(changeTypes).toContain('add-prefix-import');
    });
  });
});
