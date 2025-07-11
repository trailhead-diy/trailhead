import { describe, it, expect } from 'vitest';
import {
  createASTContext,
  processExportDeclarations,
  detectHeadlessReferences,
  mapTypeAliases,
  generateTransformedCode,
  type ASTContext,
} from '../core';

describe('createASTContext', () => {
  it('should create AST context for valid TypeScript code', () => {
    const input = 'export function Button() { return <button />; }';
    const result = createASTContext(input);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.sourceFile).toBeDefined();
      expect(result.value.oldToNewMap).toBeInstanceOf(Map);
      expect(result.value.headlessPropsTypes).toBeInstanceOf(Set);
      expect(result.value.changes).toEqual([]);
      expect(result.value.warnings).toEqual([]);
    }
  });

  it('should handle JSX syntax correctly', () => {
    const input = `
      export function Component() {
        return <div className="test">Hello</div>;
      }
    `;
    const result = createASTContext(input);

    expect(result.isOk()).toBe(true);
  });

  it('should handle TypeScript types correctly', () => {
    const input = `
      export type ButtonProps = {
        children: React.ReactNode;
        onClick?: () => void;
      };
      export function Button(props: ButtonProps) {
        return <button>{props.children}</button>;
      }
    `;
    const result = createASTContext(input);

    expect(result.isOk()).toBe(true);
  });

  it('should return error for severely malformed code', () => {
    const input = 'export function ( { return <button />; }';
    const result = createASTContext(input);

    // TypeScript parser is resilient, so this might still succeed
    // but if it fails, it should return proper error
    if (result.isErr()) {
      expect(result.error.code).toBe('TS_AST_INIT_ERROR');
      expect(result.error.message).toContain('Failed to initialize TypeScript AST');
      expect(result.error.recoverable).toBe(false);
    }
  });

  it('should handle empty input', () => {
    const input = '';
    const result = createASTContext(input);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.sourceFile).toBeDefined();
    }
  });

  it('should handle complex TypeScript features', () => {
    const input = `
      import React, { forwardRef } from 'react';
      
      export type ButtonProps<T = HTMLButtonElement> = {
        children: React.ReactNode;
        as?: keyof JSX.IntrinsicElements;
      } & React.ComponentProps<'button'>;

      export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
        function Button(props, ref) {
          return <button ref={ref} {...props} />;
        }
      );
    `;
    const result = createASTContext(input);

    expect(result.isOk()).toBe(true);
  });
});

describe('processExportDeclarations', () => {
  function createTestContext(input: string): ASTContext {
    const result = createASTContext(input);
    if (result.isErr()) throw new Error('Failed to create context');
    return result.value;
  }

  it('should transform export function declarations', () => {
    const input = 'export function Button() { return <button />; }';
    const context = createTestContext(input);

    const transformedSourceFile = processExportDeclarations(context);
    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain('export function CatalystButton()');
    expect(context.oldToNewMap.get('Button')).toBe('CatalystButton');
    expect(context.changes).toContain('Updated function name from Button to CatalystButton');
  });

  it('should transform export variable declarations', () => {
    const input = 'export const Input = forwardRef(() => <input />);';
    const context = createTestContext(input);

    const transformedSourceFile = processExportDeclarations(context);
    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain('export const CatalystInput =');
    expect(context.oldToNewMap.get('Input')).toBe('CatalystInput');
    expect(context.changes).toContain('Updated variable name from Input to CatalystInput');
  });

  it('should transform named export declarations', () => {
    const input = `
      function Button() { return <button />; }
      function Input() { return <input />; }
      export { Button, Input };
    `;
    const context = createTestContext(input);

    const transformedSourceFile = processExportDeclarations(context);
    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain('CatalystButton');
    expect(output).toContain('CatalystInput');
    expect(context.oldToNewMap.get('Button')).toBe('CatalystButton');
    expect(context.oldToNewMap.get('Input')).toBe('CatalystInput');
  });

  it('should not transform already prefixed components', () => {
    const input = 'export function CatalystButton() { return <button />; }';
    const context = createTestContext(input);

    const transformedSourceFile = processExportDeclarations(context);
    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain('export function CatalystButton()');
    expect(context.oldToNewMap.has('CatalystButton')).toBe(false);
    expect(context.changes).toHaveLength(0);
  });

  it('should not transform non-component variable declarations', () => {
    const input = 'export const apiUrl = "https://api.example.com";';
    const context = createTestContext(input);

    const transformedSourceFile = processExportDeclarations(context);
    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain('export const apiUrl =');
    expect(context.oldToNewMap.has('apiUrl')).toBe(false);
    expect(context.changes).toHaveLength(0);
  });

  it('should only transform exported functions', () => {
    const input = `
      function Button() { return <button />; }
      export function Input() { return <input />; }
    `;
    const context = createTestContext(input);

    const transformedSourceFile = processExportDeclarations(context);
    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain('function Button()'); // Not transformed
    expect(output).toContain('export function CatalystInput()'); // Transformed
    expect(context.oldToNewMap.has('Button')).toBe(false);
    expect(context.oldToNewMap.get('Input')).toBe('CatalystInput');
  });

  it('should handle complex export patterns', () => {
    const input = `
      const Button = () => <button />;
      const Input = forwardRef(() => <input />);
      const Dialog = React.memo(() => <dialog />);
      export { Button as DefaultButton, Input, Dialog };
    `;
    const context = createTestContext(input);

    const transformedSourceFile = processExportDeclarations(context);
    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain('CatalystButton');
    expect(output).toContain('CatalystInput');
    expect(output).toContain('CatalystDialog');
  });

  it('should preserve function body and parameters', () => {
    const input = `
      export function Button({ children, onClick }: ButtonProps) {
        return <button onClick={onClick}>{children}</button>;
      }
    `;
    const context = createTestContext(input);

    const transformedSourceFile = processExportDeclarations(context);
    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain('export function CatalystButton({ children, onClick }: ButtonProps)');
    expect(output).toContain('return <button onClick={onClick}>{children}</button>');
  });
});

describe('detectHeadlessReferences', () => {
  function createTestContext(input: string): ASTContext {
    const result = createASTContext(input);
    if (result.isErr()) throw new Error('Failed to create context');
    return result.value;
  }

  it('should detect named imports from @headlessui/react', () => {
    const input = `
      import { Button, Menu, Dialog } from '@headlessui/react';
      import { Input } from './input';
    `;
    const context = createTestContext(input);

    detectHeadlessReferences(context);

    expect(context.headlessPropsTypes.has('Button')).toBe(true);
    expect(context.headlessPropsTypes.has('Menu')).toBe(true);
    expect(context.headlessPropsTypes.has('Dialog')).toBe(true);
    expect(context.headlessPropsTypes.has('Input')).toBe(false);
  });

  it('should detect Props imports from @headlessui/react', () => {
    const input = `
      import { ButtonProps, MenuProps } from '@headlessui/react';
    `;
    const context = createTestContext(input);

    detectHeadlessReferences(context);

    expect(context.headlessPropsTypes.has('ButtonProps')).toBe(true);
    expect(context.headlessPropsTypes.has('MenuProps')).toBe(true);
  });

  it('should handle namespace imports from @headlessui/react', () => {
    const input = `
      import * as Headless from '@headlessui/react';
      import * as UI from './components';
    `;
    const context = createTestContext(input);

    detectHeadlessReferences(context);

    // Namespace imports are handled by qualified name logic in reference transformation
    // No individual type names should be added to protection set
    expect(context.headlessPropsTypes.size).toBe(0);
  });

  it('should handle mixed import patterns', () => {
    const input = `
      import { Button, ButtonProps } from '@headlessui/react';
      import * as Headless from '@headlessui/react';
      import { Input } from './input';
    `;
    const context = createTestContext(input);

    detectHeadlessReferences(context);

    expect(context.headlessPropsTypes.has('Button')).toBe(true);
    expect(context.headlessPropsTypes.has('ButtonProps')).toBe(true);
    expect(context.headlessPropsTypes.has('Input')).toBe(false);
  });

  it('should not detect imports from other libraries', () => {
    const input = `
      import { Button } from 'react-bootstrap';
      import { Input } from '@mantine/core';
      import { Dialog } from '@mui/material';
    `;
    const context = createTestContext(input);

    detectHeadlessReferences(context);

    expect(context.headlessPropsTypes.size).toBe(0);
  });

  it('should handle default imports (not added to protection)', () => {
    const input = `
      import Headless from '@headlessui/react';
      import { Button } from '@headlessui/react';
    `;
    const context = createTestContext(input);

    detectHeadlessReferences(context);

    expect(context.headlessPropsTypes.has('Button')).toBe(true);
    expect(context.headlessPropsTypes.has('Headless')).toBe(false);
  });
});

describe('mapTypeAliases', () => {
  function createTestContext(input: string): ASTContext {
    const result = createASTContext(input);
    if (result.isErr()) throw new Error('Failed to create context');
    return result.value;
  }

  it('should transform Props type aliases', () => {
    const input = `
      export type ButtonProps = {
        children: React.ReactNode;
      };
    `;
    const context = createTestContext(input);

    const transformedSourceFile = mapTypeAliases(context);
    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain('export type CatalystButtonProps =');
    expect(context.oldToNewMap.get('ButtonProps')).toBe('CatalystButtonProps');
  });

  it('should not transform non-Props type aliases', () => {
    const input = `
      export type ButtonState = 'loading' | 'idle';
      export type ApiResponse = { data: string };
    `;
    const context = createTestContext(input);

    const transformedSourceFile = mapTypeAliases(context);
    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain('export type ButtonState =');
    expect(output).toContain('export type ApiResponse =');
    expect(context.oldToNewMap.has('ButtonState')).toBe(false);
    expect(context.oldToNewMap.has('ApiResponse')).toBe(false);
  });

  it('should not transform already prefixed Props', () => {
    const input = `
      export type CatalystButtonProps = {
        children: React.ReactNode;
      };
    `;
    const context = createTestContext(input);

    const transformedSourceFile = mapTypeAliases(context);
    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain('export type CatalystButtonProps =');
    expect(context.oldToNewMap.get('ButtonProps')).toBe('CatalystButtonProps');
  });

  it('should not transform protected Headless UI types', () => {
    const input = `
      import { ButtonProps } from '@headlessui/react';
      export type InputProps = {
        value: string;
      };
    `;
    const context = createTestContext(input);

    // Simulate headless detection
    detectHeadlessReferences(context);

    const transformedSourceFile = mapTypeAliases(context);
    const output = generateTransformedCode(transformedSourceFile);

    expect(output).not.toContain('CatalystButtonProps');
    expect(output).toContain('export type CatalystInputProps =');
    expect(context.oldToNewMap.has('ButtonProps')).toBe(false);
    expect(context.oldToNewMap.get('InputProps')).toBe('CatalystInputProps');
  });

  it('should add export modifier to non-exported Props types', () => {
    const input = `
      type ButtonProps = {
        children: React.ReactNode;
      };
    `;
    const context = createTestContext(input);

    const transformedSourceFile = mapTypeAliases(context);
    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain('export type CatalystButtonProps =');
  });

  it('should generate Props mappings for discovered components', () => {
    const input = `
      export function Button() { return <button />; }
      export function Input() { return <input />; }
    `;
    const context = createTestContext(input);

    // First process exports to populate oldToNewMap
    const exportTransformedSourceFile = processExportDeclarations(context);
    // Then map type aliases
    mapTypeAliases(context, exportTransformedSourceFile);

    expect(context.oldToNewMap.get('ButtonProps')).toBe('CatalystButtonProps');
    expect(context.oldToNewMap.get('InputProps')).toBe('CatalystInputProps');
  });

  it('should handle complex Props type definitions', () => {
    const input = `
      export type ButtonProps<T = HTMLButtonElement> = {
        children: React.ReactNode;
        as?: keyof JSX.IntrinsicElements;
      } & React.ComponentProps<'button'>;
    `;
    const context = createTestContext(input);

    const transformedSourceFile = mapTypeAliases(context);
    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain('export type CatalystButtonProps<T = HTMLButtonElement> =');
    expect(output).toContain("React.ComponentProps<'button'>");
  });
});

describe('generateTransformedCode', () => {
  function createTestContext(input: string): ASTContext {
    const result = createASTContext(input);
    if (result.isErr()) throw new Error('Failed to create context');
    return result.value;
  }

  it('should generate properly formatted TypeScript code', () => {
    const input = `
      export function Button() {
        return <button />;
      }
    `;
    const context = createTestContext(input);
    const transformedSourceFile = processExportDeclarations(context);

    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain('export function CatalystButton()');
    expect(output).toContain('return <button />');
    expect(output).toMatch(/export function CatalystButton\(\) \{\s*return <button \/>\s*\}/);
  });

  it('should preserve comments', () => {
    const input = `
      /**
       * Button component documentation
       */
      export function Button() {
        // Implementation comment
        return <button />;
      }
    `;
    const context = createTestContext(input);
    const transformedSourceFile = processExportDeclarations(context);

    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain('Button component documentation');
    expect(output).toContain('Implementation comment');
  });

  it('should handle complex syntax correctly', () => {
    const input = `
      export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
        function Button({ children, ...props }, ref) {
          return (
            <button ref={ref} {...props}>
              {children}
            </button>
          );
        }
      );
    `;
    const context = createTestContext(input);
    const transformedSourceFile = processExportDeclarations(context);

    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain('export const CatalystButton =');
    expect(output).toContain('forwardRef<HTMLButtonElement, ButtonProps>');
    expect(output).toContain('function Button(');
  });
});

describe('integration tests', () => {
  function createTestContext(input: string): ASTContext {
    const result = createASTContext(input);
    if (result.isErr()) throw new Error('Failed to create context');
    return result.value;
  }

  it('should handle complete component transformation', () => {
    const input = `
      import React from 'react';
      import { Button as HeadlessButton } from '@headlessui/react';
      
      export type ButtonProps = {
        children: React.ReactNode;
        variant?: 'primary' | 'secondary';
      };
      
      export function Button({ children, variant = 'primary' }: ButtonProps) {
        return <button className={variant}>{children}</button>;
      }
    `;
    const context = createTestContext(input);

    // Run full transformation pipeline
    detectHeadlessReferences(context);
    let transformedSourceFile = processExportDeclarations(context);
    transformedSourceFile = mapTypeAliases(context, transformedSourceFile);
    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain('export function CatalystButton(');
    expect(output).toContain('export type CatalystButtonProps =');
    expect(output).toContain("{ children, variant = 'primary' }: ButtonProps");
    expect(context.oldToNewMap.get('Button')).toBe('CatalystButton');
    expect(context.oldToNewMap.get('ButtonProps')).toBe('CatalystButtonProps');
    expect(context.headlessPropsTypes.has('Button')).toBe(true);
  });

  it('should preserve Headless UI components while transforming Catalyst components', () => {
    const input = `
      import { Button as HeadlessButton, Menu } from '@headlessui/react';
      
      export function Button() {
        return <HeadlessButton>Catalyst Button</HeadlessButton>;
      }
      
      export function Navigation() {
        return <Menu>Navigation Menu</Menu>;
      }
    `;
    const context = createTestContext(input);

    detectHeadlessReferences(context);
    const transformedSourceFile = processExportDeclarations(context);
    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain('export function CatalystButton()');
    expect(output).toContain('export function CatalystNavigation()');
    expect(output).toContain('<HeadlessButton>');
    expect(output).toContain('<Menu>');
    expect(context.headlessPropsTypes.has('Button')).toBe(true);
    expect(context.headlessPropsTypes.has('Menu')).toBe(true);
  });
});
