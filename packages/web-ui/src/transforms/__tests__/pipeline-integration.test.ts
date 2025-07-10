/**
 * Integration tests for transform pipeline
 * Verifies that transforms work correctly after refactoring
 */

import { describe, it, expect } from 'vitest';
import { transformClsxToCn } from '../transforms/clsx-to-cn.js';
import { transformSemanticColors } from '../transforms/semantic-colors.js';
import { transformFileHeaders } from '../transforms/file-headers.js';
import { transformCatalystPrefix } from '../transforms/catalyst-prefix.js';

describe('Transform Pipeline Integration', () => {
  describe('clsx-to-cn transform', () => {
    it('should convert clsx imports to cn imports', () => {
      const input = `import clsx from 'clsx';
export function Button() {
  return <button className={clsx('btn', 'btn-primary')} />;
}`;

      const result = transformClsxToCn(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.changed).toBe(true);
        expect(result.value.content).toContain("import { cn } from '../utils/cn';");
        expect(result.value.content).toContain('cn(');
        expect(result.value.content).not.toContain('clsx(');
      }
    });
  });

  describe('semantic-colors transform', () => {
    it('should add semantic colors to colors object', () => {
      const input = `const colors = {
  red: 'bg-red-500 text-red-900',
};

export function CatalystBadge({ color = 'red', ...props }) {
  return <span className={colors[color]} {...props} />;
}`;

      const result = transformSemanticColors(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.changed).toBe(true);
        expect(result.value.content).toContain('primary:');
        expect(result.value.content).toContain('secondary:');
        expect(result.value.content).toContain('destructive:');
      }
    });

    it('should skip files without colors object', () => {
      const input = `export function Button() {
  return <button>Click me</button>;
}`;

      const result = transformSemanticColors(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.changed).toBe(false);
        expect(result.value.warnings).toContain('No colors object found in component');
      }
    });
  });

  describe('file-headers transform', () => {
    it('should add file headers to components', () => {
      const input = `export function Button() {
  return <button>Click me</button>;
}`;

      const result = transformFileHeaders(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.changed).toBe(true);
        expect(result.value.content).toContain('WARNING: This file is auto-generated');
        expect(result.value.content).toContain('Auto generated on');
      }
    });

    it('should handle use client files', () => {
      const input = `'use client'

export function Button() {
  return <button>Click me</button>;
}`;

      const result = transformFileHeaders(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.changed).toBe(true);
        expect(result.value.content.startsWith("'use client'")).toBe(true);
        expect(result.value.content).toContain('WARNING: This file is auto-generated');
      }
    });
  });

  describe('catalyst-prefix transform', () => {
    it('should add Catalyst prefix to exported functions', () => {
      const input = `export function Button() {
  return <button>Click me</button>;
}`;

      const result = transformCatalystPrefix(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.changed).toBe(true);
        expect(result.value.content).toContain('CatalystButton');
      }
    });

    it('should handle already prefixed functions', () => {
      const input = `export function CatalystButton() {
  return <button>Click me</button>;
}`;

      const result = transformCatalystPrefix(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.changed).toBe(false);
      }
    });
  });
});
