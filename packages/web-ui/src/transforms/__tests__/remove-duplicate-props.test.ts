/**
 * Tests for remove duplicate props transform
 */

import { describe, it, expect } from 'vitest';
import { expectResult } from '@esteban-url/trailhead-cli/testing';
import { transformRemoveDuplicateProps } from '../format/remove-duplicate-props.js';

describe('RemoveDuplicatePropsTransform', () => {
  describe('Core Transform Logic', () => {
    it('should remove duplicate prop spreads from JSX elements', () => {
      const input = `
<div
  {...props}
  data-slot="label"
  className={cn(className, 'col-start-2 row-start-1')}
  {...props}
/>
      `.trim();

      const result = transformRemoveDuplicateProps(input);

      expectResult(result);
      expect(result.value.changed).toBe(true);
      expect(result.value.content).not.toContain('  {...props}\n  data-slot');
      expect(result.value.content).toContain('  {...props}\n/>');
      expect(result.value.warnings).toContain('Removed duplicate {...props} spread in div element');
    });

    it('should handle multiple different prop spreads without removing them', () => {
      const input = `
<button
  {...buttonProps}
  className={styles.button}
  {...eventHandlers}
>
  Click me
</button>
      `.trim();

      const result = transformRemoveDuplicateProps(input);

      expectResult(result);
      expect(result.value.changed).toBe(false);
      expect(result.value.content).toContain('{...buttonProps}');
      expect(result.value.content).toContain('{...eventHandlers}');
    });

    it('should handle complex cases with multiple duplicate spreads', () => {
      const input = `
<span
  {...props}
  className="test"
  {...otherProps}
  data-test="value"
  {...props}
  {...otherProps}
/>
      `.trim();

      const result = transformRemoveDuplicateProps(input);

      expectResult(result);
      expect(result.value.changed).toBe(true);
      // Should keep only the last occurrence of each spread
      const occurrences = (result.value.content.match(/\{\.\.\.props\}/g) || []).length;
      expect(occurrences).toBe(1);
      const otherPropsOccurrences = (result.value.content.match(/\{\.\.\.otherProps\}/g) || [])
        .length;
      expect(otherPropsOccurrences).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle JSX with no prop spreads', () => {
      const input = `
<div className="test" data-value="123">
  <span>Content</span>
</div>
      `.trim();

      const result = transformRemoveDuplicateProps(input);

      expectResult(result);
      expect(result.value.changed).toBe(false);
      expect(result.value.content).toBe(input);
    });

    it('should handle single prop spread', () => {
      const input = `
<button {...props} className="btn">
  Click
</button>
      `.trim();

      const result = transformRemoveDuplicateProps(input);

      expectResult(result);
      expect(result.value.changed).toBe(false);
      expect(result.value.content).toBe(input);
    });

    it('should handle empty file', () => {
      const input = '';

      const result = transformRemoveDuplicateProps(input);

      expectResult(result);
      expect(result.value.changed).toBe(false);
      expect(result.value.content).toBe('');
    });

    it('should handle malformed JSX gracefully', () => {
      const input = `
<div {...props
  className="broken"
      `.trim();

      const result = transformRemoveDuplicateProps(input);

      expectResult(result);
      expect(result.value.changed).toBe(false);
    });
  });

  describe('Whitespace Preservation', () => {
    it('should preserve formatting when removing duplicate spreads', () => {
      const input = `<Component
  {...props}
  className="test"
  {...props}
/>`;

      const result = transformRemoveDuplicateProps(input);

      expectResult(result);
      expect(result.value.changed).toBe(true);
      expect(result.value.content).toContain('className="test"\n  {...props}');
    });
  });
});
