import { describe, it, expect } from 'vitest';
import { getSemanticColorsForComponent } from '../mappings';

describe('getSemanticColorsForComponent', () => {
  describe('Badge component detection', () => {
    it('should detect Badge component and return badge-specific colors', () => {
      const content = `
        export function CatalystBadge({ children, className, ...props }) {
          return (
            <span className={cn(
              'inline-flex items-center gap-x-1.5 rounded-md px-2 py-1 text-xs font-medium',
              className
            )} {...props}>
              {children}
            </span>
          );
        }
      `;

      const colors = getSemanticColorsForComponent(content);

      expect(colors).toHaveLength(5);
      expect(colors[0]).toContain("primary: 'bg-primary-500/15");
      expect(colors[1]).toContain("secondary: 'bg-secondary-500/15");
      expect(colors[2]).toContain("destructive: 'bg-destructive-500/15");
      expect(colors[3]).toContain("accent: 'bg-accent-500/15");
      expect(colors[4]).toContain("muted: 'bg-muted-500/15");

      // Verify dark mode variants
      expect(colors[0]).toContain('dark:bg-primary-500/10');
      expect(colors[0]).toContain('dark:text-primary-400');
    });

    it('should prioritize Badge detection over Button when both patterns exist', () => {
      const content = `
        export function CatalystBadge({ children }) {
          return <span className="inline-flex items-center gap-x-1.5">{children}</span>;
        }
        // Some button-like CSS variables
        --btn-bg: blue;
      `;

      const colors = getSemanticColorsForComponent(content);

      expect(colors[0]).toContain("primary: 'bg-primary-500/15");
      expect(colors[0]).not.toContain('--btn-');
    });
  });

  describe('Button component detection', () => {
    it('should detect Button component with const export', () => {
      const content = `
        export const CatalystButton = forwardRef(function Button(props, ref) {
          return <button {...props} ref={ref} />;
        });
      `;

      const colors = getSemanticColorsForComponent(content);

      expect(colors).toHaveLength(20); // 5 variants × 4 lines each
      expect(colors[0]).toBe('primary: [');
      expect(colors[1]).toContain('--btn-bg:var(--color-blue-600)');
      expect(colors[2]).toContain('--btn-icon:var(--color-blue-300)');
      expect(colors[3]).toBe('],');
    });

    it('should detect Button component with function export', () => {
      const content = `
        export function CatalystButton({ children, className, ...props }) {
          return (
            <button className={cn('btn', className)} {...props}>
              {children}
            </button>
          );
        }
      `;

      const colors = getSemanticColorsForComponent(content);

      expect(colors).toHaveLength(20);
      expect(colors[0]).toBe('primary: [');
      expect(colors[4]).toBe('secondary: [');
      expect(colors[8]).toBe('destructive: [');
    });

    it('should include all semantic color variants for Button', () => {
      const content = `export const CatalystButton = () => <button />;`;

      const colors = getSemanticColorsForComponent(content);

      const variants = colors
        .filter(line => line.endsWith(': ['))
        .map(line => line.replace(': [', ''));
      expect(variants).toEqual(['primary', 'secondary', 'destructive', 'accent', 'muted']);
    });

    it('should include proper CSS custom properties for Button', () => {
      const content = `export function CatalystButton() { return <button />; }`;

      const colors = getSemanticColorsForComponent(content);

      const primaryBgLine = colors[1];
      expect(primaryBgLine).toContain('--btn-bg:var(--color-blue-600)');
      expect(primaryBgLine).toContain('--btn-border:var(--color-blue-700)');
      expect(primaryBgLine).toContain('--btn-hover-overlay:var(--color-white)');

      const primaryIconLine = colors[2];
      expect(primaryIconLine).toContain('--btn-icon:var(--color-blue-300)');
      expect(primaryIconLine).toContain('data-active:[--btn-icon:var(--color-blue-200)]');
      expect(primaryIconLine).toContain('data-hover:[--btn-icon:var(--color-blue-200)]');
    });
  });

  describe('Switch component detection', () => {
    it('should detect Switch component with CSS custom properties', () => {
      const content = `
        export function CatalystSwitch({ checked, onChange }) {
          return (
            <button
              className={cn(
                'switch',
                '[--switch-bg:var(--color-gray-200)]',
                checked && '[--switch-bg:var(--color-blue-500)]'
              )}
              onClick={() => onChange(!checked)}
            />
          );
        }
      `;

      const colors = getSemanticColorsForComponent(content);

      expect(colors).toHaveLength(20); // 5 variants × 4 lines each
      expect(colors[0]).toBe('primary: [');
      expect(colors[1]).toContain('--switch-bg-ring:var(--color-blue-600)');
      expect(colors[1]).toContain('--switch-bg:var(--color-blue-500)');
      expect(colors[2]).toContain('--switch:white');
      expect(colors[2]).toContain('--switch-ring:var(--color-blue-600)');
    });

    it('should require both CatalystSwitch and --switch- to detect Switch', () => {
      const contentWithoutProps = `export function CatalystSwitch() { return <button />; }`;
      const contentWithoutSwitch = `export function Other() { return <div className="--switch-bg" />; }`;

      expect(getSemanticColorsForComponent(contentWithoutProps)).toEqual([]);
      expect(getSemanticColorsForComponent(contentWithoutSwitch)).toEqual([]);
    });

    it('should include dark mode variants for Switch', () => {
      const content = `
        export function CatalystSwitch({ className }) {
          return <button className={cn('[--switch-bg:blue]', className)} />;
        }
      `;

      const colors = getSemanticColorsForComponent(content);

      expect(colors[1]).toContain('dark:[--switch-bg-ring:transparent]');
    });
  });

  describe('Radio component detection', () => {
    it('should detect Radio component with CSS custom properties', () => {
      const content = `
        export function CatalystRadio({ checked }) {
          return (
            <input
              type="radio"
              className={cn(
                'radio',
                '[--radio-checked-bg:var(--color-blue-600)]',
                checked && 'checked'
              )}
            />
          );
        }
      `;

      const colors = getSemanticColorsForComponent(content);

      expect(colors).toHaveLength(5);
      expect(colors[0]).toContain("primary: '[--radio-checked-indicator:var(--color-white)]");
      expect(colors[0]).toContain('[--radio-checked-bg:var(--color-blue-600)]');
      expect(colors[0]).toContain('[--radio-checked-border:var(--color-blue-700)]/90');
    });

    it('should require both CatalystRadio and --radio- to detect Radio', () => {
      const contentWithoutProps = `export function CatalystRadio() { return <input />; }`;
      const contentWithoutRadio = `export function Other() { return <div className="--radio-bg" />; }`;

      expect(getSemanticColorsForComponent(contentWithoutProps)).toEqual([]);
      expect(getSemanticColorsForComponent(contentWithoutRadio)).toEqual([]);
    });

    it('should include all color variants for Radio', () => {
      const content = `
        export function CatalystRadio() {
          return <input className="[--radio-checked-bg:blue]" />;
        }
      `;

      const colors = getSemanticColorsForComponent(content);

      expect(colors[0]).toContain('primary:');
      expect(colors[1]).toContain('secondary:');
      expect(colors[2]).toContain('destructive:');
      expect(colors[3]).toContain('accent:');
      expect(colors[4]).toContain('muted:');
    });
  });

  describe('Checkbox component detection', () => {
    it('should detect Checkbox component with CSS custom properties', () => {
      const content = `
        export function CatalystCheckbox({ checked }) {
          return (
            <input
              type="checkbox"
              className={cn(
                'checkbox',
                '[--checkbox-checked-bg:var(--color-blue-600)]',
                checked && 'checked'
              )}
            />
          );
        }
      `;

      const colors = getSemanticColorsForComponent(content);

      expect(colors).toHaveLength(5);
      expect(colors[0]).toContain("primary: '[--checkbox-check:var(--color-white)]");
      expect(colors[0]).toContain('[--checkbox-checked-bg:var(--color-blue-600)]');
      expect(colors[0]).toContain('[--checkbox-checked-border:var(--color-blue-700)]/90');
    });

    it('should require both CatalystCheckbox and --checkbox- to detect Checkbox', () => {
      const contentWithoutProps = `export function CatalystCheckbox() { return <input />; }`;
      const contentWithoutCheckbox = `export function Other() { return <div className="--checkbox-bg" />; }`;

      expect(getSemanticColorsForComponent(contentWithoutProps)).toEqual([]);
      expect(getSemanticColorsForComponent(contentWithoutCheckbox)).toEqual([]);
    });

    it('should use white check color for all variants', () => {
      const content = `
        export function CatalystCheckbox() {
          return <input className="[--checkbox-check:blue]" />;
        }
      `;

      const colors = getSemanticColorsForComponent(content);

      colors.forEach(color => {
        expect(color).toContain('--checkbox-check:var(--color-white)');
      });
    });
  });

  describe('Alert component detection', () => {
    it('should detect Alert component', () => {
      const content = `
        export function CatalystAlert({ children, variant = 'primary' }) {
          return (
            <div className={cn(
              'alert',
              'border rounded-lg p-4',
              alertVariants[variant]
            )}>
              {children}
            </div>
          );
        }
      `;

      const colors = getSemanticColorsForComponent(content);

      expect(colors).toHaveLength(5);
      expect(colors[0]).toContain("primary: 'bg-primary-50");
      expect(colors[0]).toContain('border-primary-200');
      expect(colors[0]).toContain('text-primary-800');
      expect(colors[0]).toContain('dark:bg-primary-900/50');
      expect(colors[0]).toContain('dark:border-primary-800');
      expect(colors[0]).toContain('dark:text-primary-200');
    });

    it('should include proper background and text colors for Alert', () => {
      const content = `export function CatalystAlert() { return <div />; }`;

      const colors = getSemanticColorsForComponent(content);

      expect(colors[0]).toContain('bg-primary-50');
      expect(colors[1]).toContain('bg-secondary-50');
      expect(colors[2]).toContain('bg-destructive-50');
      expect(colors[3]).toContain('bg-accent-50');
      expect(colors[4]).toContain('bg-muted-50');
    });

    it('should include dark mode variants for Alert', () => {
      const content = `export function CatalystAlert() { return <div />; }`;

      const colors = getSemanticColorsForComponent(content);

      colors.forEach(color => {
        expect(color).toContain('dark:bg-');
        expect(color).toContain('dark:border-');
        expect(color).toContain('dark:text-');
      });
    });
  });

  describe('Unknown component detection', () => {
    it('should return empty array for unknown components', () => {
      const content = `
        export function CatalystUnknown() {
          return <div>Unknown component</div>;
        }
      `;

      const colors = getSemanticColorsForComponent(content);

      expect(colors).toEqual([]);
    });

    it('should return empty array for non-Catalyst components', () => {
      const content = `
        export function MyButton() {
          return <button>Not a Catalyst component</button>;
        }
      `;

      const colors = getSemanticColorsForComponent(content);

      expect(colors).toEqual([]);
    });

    it('should return empty array for empty content', () => {
      expect(getSemanticColorsForComponent('')).toEqual([]);
    });

    it('should return empty array for malformed content', () => {
      const malformedContent = `
        This is not valid JavaScript/TypeScript
        export function { missing name
      `;

      expect(getSemanticColorsForComponent(malformedContent)).toEqual([]);
    });
  });

  describe('Edge cases and component detection logic', () => {
    it('should handle components with complex forwardRef patterns', () => {
      const content = `
        export const CatalystButton = forwardRef<HTMLButtonElement, ButtonProps>(
          function Button({ className, ...props }, ref) {
            return (
              <button
                ref={ref}
                className={cn('btn', className)}
                {...props}
              />
            );
          }
        );
      `;

      const colors = getSemanticColorsForComponent(content);

      expect(colors).toHaveLength(20);
      expect(colors[0]).toBe('primary: [');
    });

    it('should handle components with comments and documentation', () => {
      const content = `
        /**
         * A beautiful Badge component
         */
        export function CatalystBadge({ children }) {
          // This is a badge implementation
          return (
            <span className="inline-flex items-center gap-x-1.5">
              {children}
            </span>
          );
        }
      `;

      const colors = getSemanticColorsForComponent(content);

      expect(colors).toHaveLength(5);
      expect(colors[0]).toContain('primary:');
    });

    it('should handle components with multiple export patterns in one file', () => {
      const content = `
        export function CatalystBadge() { return <span />; }
        export function CatalystButton() { return <button />; }
      `;

      // Should detect Badge first (higher priority)
      const colors = getSemanticColorsForComponent(content);

      expect(colors).toHaveLength(5);
      expect(colors[0]).toContain("primary: 'bg-primary-500/15");
    });

    it('should be case-sensitive for component detection', () => {
      const content = `
        export function catalystbutton() { return <button />; }
        export function CatalystBUTTON() { return <button />; }
      `;

      expect(getSemanticColorsForComponent(content)).toEqual([]);
    });

    it('should handle components with conditional CSS custom properties', () => {
      const content = `
        export function CatalystSwitch({ checked }) {
          return (
            <button
              className={cn(
                checked ? '[--switch-bg:var(--color-blue-500)]' : '[--switch-bg:var(--color-gray-200)]'
              )}
            />
          );
        }
      `;

      const colors = getSemanticColorsForComponent(content);

      expect(colors).toHaveLength(20);
      expect(colors[1]).toContain('--switch-bg:var(--color-blue-500)');
    });

    it('should handle nested component structures', () => {
      const content = `
        export function CatalystAlert({ children }) {
          const InnerComponent = () => <span>Inner</span>;
          
          return (
            <div className="alert">
              <InnerComponent />
              {children}
            </div>
          );
        }
      `;

      const colors = getSemanticColorsForComponent(content);

      expect(colors).toHaveLength(5);
      expect(colors[0]).toContain('primary:');
    });
  });

  describe('Color variant consistency', () => {
    it('should use consistent color variants across all components', () => {
      const components = [
        'export function CatalystBadge() { return <span />; }',
        'export function CatalystButton() { return <button />; }',
        'export function CatalystSwitch() { return <button className="[--switch-bg:blue]" />; }',
        'export function CatalystRadio() { return <input className="[--radio-bg:blue]" />; }',
        'export function CatalystCheckbox() { return <input className="[--checkbox-bg:blue]" />; }',
        'export function CatalystAlert() { return <div />; }',
      ];

      const expectedVariants = ['primary', 'secondary', 'destructive', 'accent', 'muted'];

      components.forEach(content => {
        const colors = getSemanticColorsForComponent(content);
        if (colors.length > 0) {
          const foundVariants = colors
            .filter(line => line.includes(':'))
            .map(line => line.split(':')[0].trim());

          if (content.includes('Button') && !content.includes('Badge')) {
            // Button has array structure, so variants appear differently
            const buttonVariants = colors
              .filter(line => line.endsWith(': ['))
              .map(line => line.replace(': [', ''));
            expect(buttonVariants).toEqual(expectedVariants);
          } else {
            expectedVariants.forEach(variant => {
              expect(foundVariants.some(found => found === variant)).toBe(true);
            });
          }
        }
      });
    });

    it('should use appropriate color mappings for each component type', () => {
      const badgeColors = getSemanticColorsForComponent(
        'export function CatalystBadge() { return <span />; }'
      );
      const buttonColors = getSemanticColorsForComponent(
        'export function CatalystButton() { return <button />; }'
      );
      const alertColors = getSemanticColorsForComponent(
        'export function CatalystAlert() { return <div />; }'
      );

      // Badge uses background with opacity
      expect(badgeColors[0]).toContain('bg-primary-500/15');

      // Button uses CSS custom properties
      expect(buttonColors[1]).toContain('--btn-bg:var(--color-blue-600)');

      // Alert uses solid backgrounds
      expect(alertColors[0]).toContain('bg-primary-50');
    });
  });
});
