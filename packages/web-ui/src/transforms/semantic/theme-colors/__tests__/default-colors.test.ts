/**
 * Tests for default colors transform
 */

import { describe, it, expect } from 'vitest';
import { executeThemeColorsTransform } from '../transform.js';
import { getComponentType, supportsDefaultColors } from '../mappings.js';

describe('Default Colors Transform', () => {
  describe('Component Detection', () => {
    it('should detect supported components', () => {
      expect(getComponentType('CatalystBadge')).toBe('Badge');
      expect(getComponentType('CatalystButton')).toBe('Button');
      expect(getComponentType('CatalystCheckbox')).toBe('Checkbox');
      expect(getComponentType('CatalystRadio')).toBe('Radio');
      expect(getComponentType('CatalystSwitch')).toBe('Switch');
    });

    it('should reject unsupported components', () => {
      expect(getComponentType('CatalystAlert')).toBe(null);
      expect(getComponentType('SomeOtherFunction')).toBe(null);
    });

    it('should check component support', () => {
      expect(supportsDefaultColors('CatalystBadge')).toBe(true);
      expect(supportsDefaultColors('CatalystAlert')).toBe(false);
    });
  });

  describe('Badge Transform', () => {
    it('should transform CatalystBadge with default parameter', () => {
      const input = `
import React from 'react';
import { cn } from '../utils/cn';

const colors = {
  red: 'bg-red-500',
  blue: 'bg-blue-500',
};

export function CatalystBadge({
  color = 'zinc',
  className,
  ...props
}: { color?: string; className?: string }) {
  return (
    <span className={cn('badge', colors[color], className)} {...props} />
  );
}`;

      const result = executeThemeColorsTransform(input);

      expect(result.changed).toBe(true);
      expect(result.content).toContain('import { useThemeColor } from');
      expect(result.content).toContain('../theme-colors');
      expect(result.content).toContain('const defaultColor = useThemeColor<keyof typeof colors>(');
      expect(result.content).toContain('badge');
      expect(result.content).toContain('color,'); // Default value removed
      expect(result.content).not.toContain("color = 'zinc'");
      expect(result.content).toContain('colors[color ?? defaultColor]');
    });

    it('should handle CatalystBadgeButton', () => {
      const input = `
import React from 'react';
import { cn } from '../utils/cn';

const colors = { red: 'bg-red-500' };

export function CatalystBadge({ color, ...props }) {
  const defaultColor = useThemeColor<keyof typeof colors>('badge');
  return <span className={cn(colors[color ?? defaultColor])} />;
}

export const CatalystBadgeButton = forwardRef(function CatalystBadgeButton({
  color = 'zinc',
  children,
  ...props
}) {
  return (
    <button>
      <CatalystBadge color={color}>{children}</CatalystBadge>
    </button>
  );
});`;

      const result = executeThemeColorsTransform(input);
      expect(result.changed).toBe(true);
      expect(result.content).toContain('color,'); // Default removed from CatalystBadgeButton
      expect(result.content).toContain('CatalystBadge color={color ?? defaultColor}');
    });
  });

  describe('Button Transform', () => {
    it('should transform CatalystButton with styles.colors pattern', () => {
      const input = `
import React from 'react';

const styles = {
  base: 'btn-base',
  colors: {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
  },
};

export function CatalystButton({
  color = 'primary',
  className,
  ...props
}) {
  return (
    <button className={cn(styles.base, styles.colors[color], className)} />
  );
}`;

      const result = executeThemeColorsTransform(input);

      expect(result.changed).toBe(true);
      expect(result.content).toContain('useThemeColor<keyof typeof styles.colors>');
      expect(result.content).toContain('button');
      expect(result.content).toContain('styles.colors[color ?? defaultColor]');
      expect(result.content).not.toContain("color = 'primary'");
    });

    it('should transform hardcoded fallback values in styles.colors pattern', () => {
      const input = `
import React from 'react';

const styles = {
  base: 'btn-base',
  colors: {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
  },
};

export function CatalystButton({
  color,
  className,
  ...props
}) {
  return (
    <button className={cn(styles.base, styles.colors[color ?? 'primary'], className)} />
  );
}`;

      const result = executeThemeColorsTransform(input);

      expect(result.changed).toBe(true);
      expect(result.content).toContain('useThemeColor<keyof typeof styles.colors>');
      expect(result.content).toContain('button');
      expect(result.content).toContain('styles.colors[color ?? defaultColor]');
      expect(result.content).not.toContain("color ?? 'primary'");
    });
  });

  describe('Edge Cases', () => {
    it('should not transform non-supported components', () => {
      const input = `
export function CatalystAlert({ color = 'red' }) {
  return <div>Alert</div>;
}`;

      const result = executeThemeColorsTransform(input);
      expect(result.changed).toBe(false);
      expect(result.warnings).toContain(
        'No supported components found for default colors transform'
      );
    });

    it('should not add duplicate imports', () => {
      const input = `
import { useThemeColor } from '../theme-colors';

export function CatalystBadge({ color = 'zinc' }) {
  return <span />;
}`;

      const result = executeThemeColorsTransform(input);
      // Should still transform the function but not add duplicate import
      expect((result.content.match(/import.*useThemeColor/g) || []).length).toBe(1);
    });

    it('should handle already transformed components', () => {
      const input = `
import { useThemeColor } from '../theme-colors';

export function CatalystBadge({ color, ...props }) {
  const defaultColor = useThemeColor<keyof typeof colors>('badge');
  return <span className={cn(colors[color ?? defaultColor])} />;
}`;

      const result = executeThemeColorsTransform(input);
      expect(result.changed).toBe(false);
    });
  });
});
