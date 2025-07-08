import { describe, it, expect } from 'vitest';
import { buttonAddSemanticColorsTransform } from '@/transforms/components/button/add-semantic-colors';

describe('buttonAddSemanticColorsTransform', () => {
  it('should add semantic color definitions to the colors object', () => {
    const input = `
import * as Headless from '@headlessui/react'
import React, { forwardRef } from 'react'

const styles = {
  base: ['some base styles'],
  solid: ['some solid styles'],
  colors: {
    'dark/zinc': [
      'text-white [--btn-bg:var(--color-foreground)]'
    ],
    zinc: [
      'text-white [--btn-bg:var(--color-muted-foreground)]'
    ]
  }
}

export const CatalystButton = forwardRef(function CatalystButton(props, ref) {
  return <button ref={ref} />
})
`;

    const result = buttonAddSemanticColorsTransform.execute(input);

    expect(result.hasChanges).toBe(true);
    expect(result.changes).toHaveLength(5); // Should add 5 semantic colors

    // Check that the transform added all semantic colors
    expect(result.content).toContain('primary:');
    expect(result.content).toContain('secondary:');
    expect(result.content).toContain('destructive:');
    expect(result.content).toContain('accent:');
    expect(result.content).toContain('muted:');

    // Check that existing colors are preserved
    expect(result.content).toContain("'dark/zinc':");
    expect(result.content).toContain('zinc:');

    // Check that semantic colors use correct CSS variables
    expect(result.content).toContain('[--btn-bg:var(--color-primary)]');
    expect(result.content).toContain('[--btn-bg:var(--color-secondary)]');
    expect(result.content).toContain('[--btn-bg:var(--color-destructive)]');
    expect(result.content).toContain('[--btn-bg:var(--color-accent)]');
    expect(result.content).toContain('[--btn-bg:var(--color-muted)]');
  });

  it.skip('should not add semantic colors if they already exist', () => {
    const input = `
const styles = {
  colors: {
    primary: ['existing primary styles'],
    secondary: ['existing secondary styles'],
    zinc: ['text-white']
  }
}

export const CatalystButton = forwardRef(function CatalystButton(props, ref) {
  return <button ref={ref} />
})
`;

    const result = buttonAddSemanticColorsTransform.execute(input);

    // Should only add missing semantic colors (destructive, accent, muted)
    expect(result.changes).toHaveLength(3);
    expect(result.changes.map(c => c.description)).toContain('destructive');
    expect(result.changes.map(c => c.description)).toContain('accent');
    expect(result.changes.map(c => c.description)).toContain('muted');

    // Existing colors should be preserved
    expect(result.content).toContain("primary: ['existing primary styles']");
    expect(result.content).toContain("secondary: ['existing secondary styles']");
  });

  it('should not transform non-Button components', () => {
    const input = `
const styles = {
  colors: {
    zinc: ['text-white']
  }
}

export const SomeOtherComponent = () => {
  return <div />
}
`;

    const result = buttonAddSemanticColorsTransform.execute(input);

    expect(result.hasChanges).toBe(false);
    expect(result.content).toBe(input);
  });

  it('should handle components without colors object', () => {
    const input = `
const styles = {
  base: ['some base styles']
}

export const CatalystButton = forwardRef(function CatalystButton(props, ref) {
  return <button ref={ref} />
})
`;

    const result = buttonAddSemanticColorsTransform.execute(input);

    expect(result.hasChanges).toBe(false);
    expect(result.content).toBe(input);
  });
});
