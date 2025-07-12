import { describe, it, expect } from 'vitest';
import { cn } from '../cn';

describe('cn utility', () => {
  describe('basic functionality', () => {
    it('should merge simple class strings', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
    });

    it('should handle empty inputs', () => {
      expect(cn()).toBe('');
      expect(cn('')).toBe('');
      expect(cn(null, undefined, false)).toBe('');
    });

    it('should handle conditional classes', () => {
      const showConditional = true;
      const showHidden = false;
      expect(cn('base', showConditional && 'conditional', showHidden && 'hidden')).toBe(
        'base conditional'
      );
      expect(cn('base', null, undefined, 'visible')).toBe('base visible');
    });
  });

  describe('tailwind merge functionality', () => {
    it('should merge conflicting Tailwind classes correctly', () => {
      // Later classes should override earlier ones for same property
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
      expect(cn('bg-red-100', 'bg-green-200')).toBe('bg-green-200');
      expect(cn('p-4', 'p-2')).toBe('p-2');
    });

    it('should keep non-conflicting Tailwind classes', () => {
      expect(cn('text-red-500', 'bg-blue-500')).toBe('text-red-500 bg-blue-500');
      expect(cn('flex', 'items-center', 'justify-between')).toBe(
        'flex items-center justify-between'
      );
    });

    it('should handle responsive classes correctly', () => {
      expect(cn('text-sm', 'md:text-lg', 'lg:text-xl')).toBe('text-sm md:text-lg lg:text-xl');
      expect(cn('p-2', 'md:p-4', 'p-3')).toBe('md:p-4 p-3');
    });

    it('should handle hover/focus states', () => {
      expect(cn('text-black', 'hover:text-red-500', 'focus:text-blue-500')).toBe(
        'text-black hover:text-red-500 focus:text-blue-500'
      );
      expect(cn('bg-white', 'hover:bg-gray-100', 'hover:bg-gray-200')).toBe(
        'bg-white hover:bg-gray-200'
      );
    });
  });

  describe('clsx functionality', () => {
    it('should handle object syntax', () => {
      expect(cn({ 'text-red-500': true, 'text-blue-500': false })).toBe('text-red-500');
      expect(cn({ hidden: false, block: true })).toBe('block');
    });

    it('should handle array syntax', () => {
      expect(cn(['text-red-500', 'bg-blue-100'])).toBe('text-red-500 bg-blue-100');
      expect(cn(['base-class', { conditional: true }])).toBe('base-class conditional');
    });

    it('should handle mixed input types', () => {
      expect(cn('base', { conditional: true, hidden: false }, ['array-class'], null, 'final')).toBe(
        'base conditional array-class final'
      );
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle undefined and null gracefully', () => {
      expect(cn(undefined, null, 'visible')).toBe('visible');
      expect(cn('base', undefined, null)).toBe('base');
    });

    it('should handle numbers', () => {
      expect(cn('base', 0, 1, 'end')).toBe('base 1 end');
    });

    it('should handle complex nested structures', () => {
      const result = cn(
        'base-class',
        {
          'text-red-500': true,
          'text-blue-500': false,
          'bg-white': true,
        },
        ['array-class', { flex: true }, ['nested-array', { 'items-center': true }]],
        'final-class'
      );
      expect(result).toBe(
        'base-class text-red-500 bg-white array-class flex nested-array items-center final-class'
      );
    });
  });

  describe('real-world component scenarios', () => {
    it('should handle button variant merging', () => {
      const baseButton = 'px-4 py-2 rounded font-medium';
      const primaryVariant = 'bg-blue-500 text-white';
      const sizeSmall = 'px-2 py-1 text-sm';

      // Size should override base padding
      expect(cn(baseButton, primaryVariant, sizeSmall)).toBe(
        'rounded font-medium bg-blue-500 text-white px-2 py-1 text-sm'
      );
    });

    it('should handle conditional states in components', () => {
      const isLoading = true;
      const isDisabled = false;
      const isActive = true;

      expect(
        cn(
          'btn',
          isLoading && 'opacity-50 cursor-wait',
          isDisabled && 'opacity-25 cursor-not-allowed',
          isActive && 'bg-blue-600'
        )
      ).toBe('btn opacity-50 cursor-wait bg-blue-600');
    });

    it('should handle theme and responsive breakpoints', () => {
      expect(
        cn(
          'text-gray-900 dark:text-gray-100',
          'text-sm md:text-base lg:text-lg',
          'p-2 md:p-4 lg:p-6'
        )
      ).toBe('text-gray-900 dark:text-gray-100 text-sm md:text-base lg:text-lg p-2 md:p-4 lg:p-6');
    });

    it('should handle custom CSS classes mixed with Tailwind', () => {
      expect(cn('custom-component-class', 'flex items-center', 'another-custom-class')).toBe(
        'custom-component-class flex items-center another-custom-class'
      );
    });
  });

  describe('performance considerations', () => {
    it('should handle large numbers of classes efficiently', () => {
      const manyClasses = Array.from({ length: 100 }, (_, i) => `class-${i}`);
      const result = cn(...manyClasses);
      expect(result).toContain('class-0');
      expect(result).toContain('class-99');
      expect(result.split(' ')).toHaveLength(100);
    });

    it('should handle repeated calls consistently', () => {
      const classes = ['text-red-500', 'bg-blue-100', 'p-4'];
      const result1 = cn(...classes);
      const result2 = cn(...classes);
      expect(result1).toBe(result2);
    });
  });
});
