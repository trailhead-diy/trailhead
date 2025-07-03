/**
 * Tests for default color update transforms
 *
 * NOTE: These tests are expected to fail as the update-defaults transforms are not yet implemented.
 * They serve as documentation for future implementation.
 */

import { describe, it, expect } from 'vitest';
import {
  buttonDefaultColorTransform,
  badgeDefaultColorTransform,
  checkboxDefaultColorTransform,
  radioDefaultColorTransform,
  switchDefaultColorTransform,
} from '@/transforms/components/common/semantic-tokens/update-defaults/index.js';

describe.skip('Default Color Update Transforms', () => {
  describe('Button transform', () => {
    it('should update button default color from dark/zinc to primary', () => {
      const input = `
export const CatalystButton = forwardRef(function CatalystButton(
  { color, outline, plain, className, children, ...props }: ButtonProps,
  ref: React.ForwardedRef<HTMLElement>
) {
  let classes = cn(
    styles.base,
    outline
      ? styles.outline
      : plain
        ? styles.plain
        : cn(styles.solid, styles.colors[color ?? 'dark/zinc']),
    className
  )
  return <button ref={ref}>{children}</button>
})`;

      const result = buttonDefaultColorTransform.execute(input);

      expect(result.hasChanges).toBe(true);
      expect(result.content).toContain("color ?? 'primary'");
      expect(result.content).not.toContain("color ?? 'dark/zinc'");
      expect(result.changes).toHaveLength(1);
      expect(result.changes[0]).toMatchObject({
        type: 'default-value',
        oldValue: 'dark/zinc',
        newValue: 'primary',
      });
    });
  });

  describe('Badge transform', () => {
    it('should update badge default color from zinc to primary', () => {
      const input = `
export function CatalystBadge({
  color = 'zinc',
  className,
  ...props
}: BadgeProps & React.ComponentPropsWithoutRef<'span'>) {
  return <span className={cn(colors[color], className)} {...props} />
}`;

      const result = badgeDefaultColorTransform.execute(input);

      expect(result.hasChanges).toBe(true);
      expect(result.content).toContain("color = 'primary'");
      expect(result.content).not.toContain("color = 'zinc'");
    });
  });

  describe('Checkbox transform', () => {
    it('should update checkbox default color from dark/zinc to primary', () => {
      const input = `
export function CatalystCheckbox({
  color = 'dark/zinc',
  className,
  ...props
}: {
  color?: Color
  className?: string
} & Omit<Headless.CheckboxProps, 'as' | 'className'>) {
  return <Headless.Checkbox {...props} />
}`;

      const result = checkboxDefaultColorTransform.execute(input);

      expect(result.hasChanges).toBe(true);
      expect(result.content).toContain("color = 'primary'");
      expect(result.content).not.toContain("color = 'dark/zinc'");
    });
  });

  describe('Radio transform', () => {
    it('should update radio default color from dark/zinc to primary', () => {
      const input = `
export function CatalystRadio({
  color = 'dark/zinc',
  className,
  ...props
}: { color?: Color; className?: string }) {
  return <Headless.Radio {...props} />
}`;

      const result = radioDefaultColorTransform.execute(input);

      expect(result.hasChanges).toBe(true);
      expect(result.content).toContain("color = 'primary'");
      expect(result.content).not.toContain("color = 'dark/zinc'");
    });
  });

  describe('Switch transform', () => {
    it('should update switch default color from dark/zinc to primary', () => {
      const input = `
export function CatalystSwitch({
  color = 'dark/zinc',
  className,
  ...props
}: {
  color?: Color
  className?: string
}) {
  return <Headless.Switch {...props} />
}`;

      const result = switchDefaultColorTransform.execute(input);

      expect(result.hasChanges).toBe(true);
      expect(result.content).toContain("color = 'primary'");
      expect(result.content).not.toContain("color = 'dark/zinc'");
    });
  });

  describe('Non-matching content', () => {
    it('should not transform files that do not match', () => {
      const input = 'export const SomeOtherComponent = () => <div>Hello</div>';

      expect(buttonDefaultColorTransform.execute(input).hasChanges).toBe(false);
      expect(badgeDefaultColorTransform.execute(input).hasChanges).toBe(false);
      expect(checkboxDefaultColorTransform.execute(input).hasChanges).toBe(false);
      expect(radioDefaultColorTransform.execute(input).hasChanges).toBe(false);
      expect(switchDefaultColorTransform.execute(input).hasChanges).toBe(false);
    });
  });
});
