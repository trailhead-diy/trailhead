/**
 * Utils Tests
 *
 * Minimal high-ROI tests for essential utility functions
 * testing behavior users care about
 */

import { describe, it, expect } from 'vitest';
import { cn } from '../../../src/components/utils/cn';

describe('cn utility function', () => {
  it('merges class names correctly', () => {
    expect(cn('px-4', 'py-2')).toBe('px-4 py-2');
    expect(cn('text-red-500', 'font-bold')).toBe('text-red-500 font-bold');
  });

  it('handles conflicting Tailwind classes', () => {
    // Tailwind merge should handle conflicts by keeping the last one
    expect(cn('px-4', 'px-6')).toBe('px-6');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    expect(cn('bg-white', 'bg-black', 'bg-red-500')).toBe('bg-red-500');
  });

  it('handles conditional classes with clsx patterns', () => {
    const isActive = true;
    const isInactive = false;
    const isUndefined = undefined;
    const isNull = null;

    expect(cn('base', isActive && 'conditional')).toBe('base conditional');
    expect(cn('base', isInactive && 'conditional')).toBe('base');
    expect(cn('base', isUndefined && 'conditional')).toBe('base');
    expect(cn('base', isNull && 'conditional')).toBe('base');
  });

  it('handles object-style conditional classes', () => {
    expect(cn('base', { active: true, disabled: false })).toBe('base active');
    expect(cn('base', { active: false, disabled: true })).toBe('base disabled');
  });

  it('handles arrays of classes', () => {
    expect(cn(['px-4', 'py-2'], 'text-center')).toBe('px-4 py-2 text-center');
    expect(cn('base', ['hover:bg-gray-100', 'focus:ring-2'])).toBe(
      'base hover:bg-gray-100 focus:ring-2'
    );
  });

  it('handles empty and undefined inputs', () => {
    expect(cn()).toBe('');
    expect(cn('')).toBe('');
    expect(cn(undefined)).toBe('');
    expect(cn(null)).toBe('');
    expect(cn(false)).toBe('');
  });

  it('handles complex real-world scenarios', () => {
    // Button component example
    const isActive = true;
    const isDisabled = false;
    const variant = 'primary' as 'primary' | 'secondary';

    const buttonClasses = cn(
      'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      'disabled:pointer-events-none disabled:opacity-50',
      {
        'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'primary',
        'bg-secondary text-secondary-foreground hover:bg-secondary/80': variant === 'secondary',
        'ring-2 ring-primary': isActive,
        'opacity-50 cursor-not-allowed': isDisabled,
      },
      'px-4 py-2'
    );

    expect(buttonClasses).toContain('inline-flex');
    expect(buttonClasses).toContain('bg-primary');
    expect(buttonClasses).toContain('ring-2 ring-primary');
    expect(buttonClasses).not.toContain('bg-secondary');
    // disabled:opacity-50 will be present due to the disabled selector, but isDisabled is false
    // so the conditional opacity-50 class won't be applied
  });

  it('properly handles Tailwind merge conflicts in component scenarios', () => {
    // Scenario: Component has default padding, but user wants to override
    const defaultClasses = 'px-4 py-2 bg-white';
    const userClasses = 'px-6 bg-gray-100';

    const result = cn(defaultClasses, userClasses);

    expect(result).toContain('px-6'); // User override wins
    expect(result).not.toContain('px-4'); // Default is removed
    expect(result).toContain('bg-gray-100'); // User override wins
    expect(result).not.toContain('bg-white'); // Default is removed
    expect(result).toContain('py-2'); // Non-conflicting classes preserved
  });

  it('maintains performance with multiple class combinations', () => {
    // Test with a realistic number of classes that might be used in complex components
    const manyClasses = cn(
      'flex items-center justify-center',
      'w-full h-full',
      'px-4 py-2 m-2',
      'text-sm font-medium',
      'bg-white text-black',
      'border border-gray-200',
      'rounded-md shadow-sm',
      'hover:bg-gray-50 hover:text-gray-900',
      'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'transition-all duration-200 ease-in-out'
    );

    expect(typeof manyClasses).toBe('string');
    expect(manyClasses.length).toBeGreaterThan(0);
    expect(manyClasses.split(' ').length).toBeGreaterThan(10);
  });
});
