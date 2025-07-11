import { describe, it, expect } from 'vitest';
import {
  createASTContext,
  generateTransformedCode,
  detectHeadlessReferences,
  type ASTContext,
} from '../core';
import {
  updateFunctionParameterTypes,
  updateTypeofUsages,
  updateJSXReferences,
  updateTypeReferences,
  updateDirectIdentifiers,
} from '../references';

describe('updateFunctionParameterTypes', () => {
  function createTestContext(input: string): ASTContext {
    const result = createASTContext(input);
    if (result.isErr()) throw new Error('Failed to create context');
    return result.value;
  }

  it('should update arrow function parameter types', () => {
    const input = `const CatalystButton = ({ color }: ButtonProps) => <button />;`;
    const context = createTestContext(input);

    const transformedSourceFile = updateFunctionParameterTypes(context);
    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain('({ color }: CatalystButtonProps)');
    expect(context.oldToNewMap.get('ButtonProps')).toBe('CatalystButtonProps');
    expect(context.changes).toContain(
      'Updated function parameter type from ButtonProps to CatalystButtonProps in CatalystButton'
    );
  });

  it('should update forwardRef function parameter types', () => {
    const input = `
      const CatalystInput = forwardRef(function Input({ value }: InputProps, ref) {
        return <input ref={ref} value={value} />;
      });
    `;
    const context = createTestContext(input);

    const transformedSourceFile = updateFunctionParameterTypes(context);
    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain('({ value }: CatalystInputProps, ref)');
    expect(context.oldToNewMap.get('InputProps')).toBe('CatalystInputProps');
  });

  it('should update forwardRef arrow function parameter types', () => {
    const input = `
      const CatalystDialog = forwardRef(({ open }: DialogProps, ref) => (
        <dialog ref={ref} open={open} />
      ));
    `;
    const context = createTestContext(input);

    const transformedSourceFile = updateFunctionParameterTypes(context);
    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain('({ open }: CatalystDialogProps, ref)');
    expect(context.oldToNewMap.get('DialogProps')).toBe('CatalystDialogProps');
  });

  it('should not update non-Catalyst components', () => {
    const input = `const MyButton = ({ color }: ButtonProps) => <button />;`;
    const context = createTestContext(input);

    const transformedSourceFile = updateFunctionParameterTypes(context);
    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain('({ color }: ButtonProps)');
    expect(context.oldToNewMap.has('ButtonProps')).toBe(false);
    expect(context.changes).toHaveLength(0);
  });

  it('should not update protected Headless UI types', () => {
    const input = `
      import { ButtonProps } from '@headlessui/react';
      const CatalystButton = ({ color }: ButtonProps) => <button />;
    `;
    const context = createTestContext(input);

    detectHeadlessReferences(context);
    const transformedSourceFile = updateFunctionParameterTypes(context);
    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain('({ color }: ButtonProps)');
    expect(context.oldToNewMap.has('ButtonProps')).toBe(false);
    expect(context.changes).toHaveLength(0);
  });

  it('should handle specific component Props patterns', () => {
    const input = `
      const CatalystCombobox = ({ items }: ComboboxProps) => <div />;
      const CatalystDropdown = ({ children }: DropdownProps) => <div />;
      const CatalystListbox = ({ options }: ListboxProps) => <div />;
    `;
    const context = createTestContext(input);

    const transformedSourceFile = updateFunctionParameterTypes(context);
    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain('({ items }: CatalystComboboxProps)');
    expect(output).toContain('({ children }: CatalystDropdownProps)');
    expect(output).toContain('({ options }: CatalystListboxProps)');
  });

  it('should handle generic Props types', () => {
    const input = `
      const CatalystButton = ({ children }: ButtonProps & { custom: string }) => <button />;
    `;
    const context = createTestContext(input);

    const transformedSourceFile = updateFunctionParameterTypes(context);
    const output = generateTransformedCode(transformedSourceFile);

    // Should not transform intersection types or complex type expressions
    expect(output).toContain('ButtonProps & { custom: string }');
    expect(context.changes).toHaveLength(0);
  });

  it('should preserve function body and other parameters', () => {
    const input = `
      const CatalystButton = ({ children }: ButtonProps, ref: React.Ref<HTMLButtonElement>) => {
        return <button ref={ref}>{children}</button>;
      };
    `;
    const context = createTestContext(input);

    const transformedSourceFile = updateFunctionParameterTypes(context);
    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain(
      '({ children }: CatalystButtonProps, ref: React.Ref<HTMLButtonElement>)'
    );
    expect(output).toContain('return <button ref={ref}>{children}</button>');
  });
});

describe('updateTypeofUsages', () => {
  function createTestContext(input: string): ASTContext {
    const result = createASTContext(input);
    if (result.isErr()) throw new Error('Failed to create context');
    return result.value;
  }

  it('should update typeof expressions', () => {
    const input = `type ButtonElement = typeof Button;`;
    const context = createTestContext(input);
    context.oldToNewMap.set('Button', 'CatalystButton');

    const transformedSourceFile = updateTypeofUsages(context);
    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain('type ButtonElement = typeof CatalystButton');
    expect(context.changes).toContain(
      'Updated typeof reference from typeof Button to typeof CatalystButton'
    );
  });

  it('should update typeof in ComponentPropsWithoutRef', () => {
    const input = `type Props = ComponentPropsWithoutRef<typeof Input>;`;
    const context = createTestContext(input);
    context.oldToNewMap.set('Input', 'CatalystInput');

    const transformedSourceFile = updateTypeofUsages(context);
    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain('ComponentPropsWithoutRef<typeof CatalystInput>');
  });

  it('should update typeof in complex type expressions', () => {
    const input = `
      type ButtonType = typeof Button;
      type InputElement = React.ElementRef<typeof Input>;
      type DialogProps = React.ComponentProps<typeof Dialog>;
    `;
    const context = createTestContext(input);
    context.oldToNewMap.set('Button', 'CatalystButton');
    context.oldToNewMap.set('Input', 'CatalystInput');
    context.oldToNewMap.set('Dialog', 'CatalystDialog');

    const transformedSourceFile = updateTypeofUsages(context);
    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain('typeof CatalystButton');
    expect(output).toContain('typeof CatalystInput');
    expect(output).toContain('typeof CatalystDialog');
  });

  it('should not update typeof for unmapped identifiers', () => {
    const input = `type Element = typeof SomeComponent;`;
    const context = createTestContext(input);

    const transformedSourceFile = updateTypeofUsages(context);
    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain('typeof SomeComponent');
    expect(context.changes).toHaveLength(0);
  });
});

describe('updateJSXReferences', () => {
  function createTestContext(input: string): ASTContext {
    const result = createASTContext(input);
    if (result.isErr()) throw new Error('Failed to create context');
    return result.value;
  }

  it('should update JSX opening and closing elements', () => {
    const input = `const App = () => <Button>Click me</Button>;`;
    const context = createTestContext(input);
    context.oldToNewMap.set('Button', 'CatalystButton');

    const transformedSourceFile = updateJSXReferences(context);
    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain('<CatalystButton>Click me</CatalystButton>');
    expect(context.changes).toContain(
      'Updated JSX opening element from <Button> to <CatalystButton>'
    );
    expect(context.changes).toContain(
      'Updated JSX closing element from </Button> to </CatalystButton>'
    );
  });

  it('should update JSX self-closing elements', () => {
    const input = `const App = () => <Input value="test" />;`;
    const context = createTestContext(input);
    context.oldToNewMap.set('Input', 'CatalystInput');

    const transformedSourceFile = updateJSXReferences(context);
    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain('<CatalystInput value="test" />');
    expect(context.changes).toContain(
      'Updated JSX self-closing element from <Input /> to <CatalystInput />'
    );
  });

  it('should update JSX expressions in attributes', () => {
    const input = `const App = () => <Component as={Button} />;`;
    const context = createTestContext(input);
    context.oldToNewMap.set('Button', 'CatalystButton');

    const transformedSourceFile = updateJSXReferences(context);
    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain('<Component as={CatalystButton} />');
    expect(context.changes).toContain(
      'Updated JSX expression from as={Button} to as={CatalystButton}'
    );
  });

  it('should handle nested JSX elements', () => {
    const input = `
      const App = () => (
        <Dialog>
          <DialogPanel>
            <Button>Submit</Button>
          </DialogPanel>
        </Dialog>
      );
    `;
    const context = createTestContext(input);
    context.oldToNewMap.set('Dialog', 'CatalystDialog');
    context.oldToNewMap.set('DialogPanel', 'CatalystDialogPanel');
    context.oldToNewMap.set('Button', 'CatalystButton');

    const transformedSourceFile = updateJSXReferences(context);
    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain('<CatalystDialog>');
    expect(output).toContain('<CatalystDialogPanel>');
    expect(output).toContain('<CatalystButton>Submit</CatalystButton>');
    expect(output).toContain('</CatalystDialogPanel>');
    expect(output).toContain('</CatalystDialog>');
  });

  it('should not update unmapped JSX elements', () => {
    const input = `const App = () => <CustomButton>Click</CustomButton>;`;
    const context = createTestContext(input);

    const transformedSourceFile = updateJSXReferences(context);
    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain('<CustomButton>Click</CustomButton>');
    expect(context.changes).toHaveLength(0);
  });

  it('should handle JSX fragments and native elements', () => {
    const input = `
      const App = () => (
        <>
          <div>
            <Button>Click me</Button>
          </div>
          <span>Text</span>
        </>
      );
    `;
    const context = createTestContext(input);
    context.oldToNewMap.set('Button', 'CatalystButton');

    const transformedSourceFile = updateJSXReferences(context);
    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain('<>');
    expect(output).toContain('<div>');
    expect(output).toContain('<CatalystButton>Click me</CatalystButton>');
    expect(output).toContain('<span>Text</span>');
    expect(output).toContain('</>');
  });
});

describe('updateTypeReferences', () => {
  function createTestContext(input: string): ASTContext {
    const result = createASTContext(input);
    if (result.isErr()) throw new Error('Failed to create context');
    return result.value;
  }

  it('should update simple type references', () => {
    const input = `const props: ButtonProps = { children: 'Click' };`;
    const context = createTestContext(input);
    context.oldToNewMap.set('ButtonProps', 'CatalystButtonProps');

    const transformedSourceFile = updateTypeReferences(context);
    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain('const props: CatalystButtonProps =');
    expect(context.changes).toContain(
      'Updated type reference from ButtonProps to CatalystButtonProps'
    );
  });

  it('should update qualified type references', () => {
    const input = `type Props = React.ComponentProps<Button>;`;
    const context = createTestContext(input);
    context.oldToNewMap.set('Button', 'CatalystButton');

    const transformedSourceFile = updateTypeReferences(context);
    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain('React.ComponentProps<CatalystButton>');
    expect(context.changes).toContain('Updated type reference from Button to CatalystButton');
  });

  it('should not update Headless namespace references', () => {
    const input = `type Props = Headless.ButtonProps;`;
    const context = createTestContext(input);
    context.oldToNewMap.set('ButtonProps', 'CatalystButtonProps');

    const transformedSourceFile = updateTypeReferences(context);
    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain('Headless.ButtonProps');
    expect(context.changes).toHaveLength(0);
  });

  it('should handle generic type references', () => {
    const input = `
      type ButtonRef = React.ElementRef<Button>;
      type InputProps = React.ComponentPropsWithoutRef<Input>;
      type DialogElement = HTMLElementTagNameMap<Dialog>;
    `;
    const context = createTestContext(input);
    context.oldToNewMap.set('Button', 'CatalystButton');
    context.oldToNewMap.set('Input', 'CatalystInput');
    context.oldToNewMap.set('Dialog', 'CatalystDialog');

    const transformedSourceFile = updateTypeReferences(context);
    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain('React.ElementRef<CatalystButton>');
    expect(output).toContain('React.ComponentPropsWithoutRef<CatalystInput>');
    expect(output).toContain('HTMLElementTagNameMap<CatalystDialog>');
  });

  it('should handle union and intersection types', () => {
    const input = `
      type Props = ButtonProps | InputProps;
      type Enhanced = ButtonProps & { custom: string };
    `;
    const context = createTestContext(input);
    context.oldToNewMap.set('ButtonProps', 'CatalystButtonProps');
    context.oldToNewMap.set('InputProps', 'CatalystInputProps');

    const transformedSourceFile = updateTypeReferences(context);
    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain('CatalystButtonProps | CatalystInputProps');
    expect(output).toContain('CatalystButtonProps & { custom: string }');
  });

  it('should handle conditional types', () => {
    const input = `
      type ConditionalProps<T> = T extends Button ? ButtonProps : never;
    `;
    const context = createTestContext(input);
    context.oldToNewMap.set('Button', 'CatalystButton');
    context.oldToNewMap.set('ButtonProps', 'CatalystButtonProps');

    const transformedSourceFile = updateTypeReferences(context);
    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain('T extends CatalystButton ? CatalystButtonProps : never');
  });
});

describe('updateDirectIdentifiers', () => {
  function createTestContext(input: string): ASTContext {
    const result = createASTContext(input);
    if (result.isErr()) throw new Error('Failed to create context');
    return result.value;
  }

  it('should update variable assignments', () => {
    const input = `const MyButton = Button;`;
    const context = createTestContext(input);
    context.oldToNewMap.set('Button', 'CatalystButton');

    const transformedSourceFile = updateDirectIdentifiers(context);
    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain('const MyButton = CatalystButton');
    expect(context.changes).toContain('Updated identifier reference from Button to CatalystButton');
  });

  it('should update function calls', () => {
    const input = `const element = Button({ children: 'Click' });`;
    const context = createTestContext(input);
    context.oldToNewMap.set('Button', 'CatalystButton');

    const transformedSourceFile = updateDirectIdentifiers(context);
    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain("CatalystButton({ children: 'Click' })");
  });

  it('should not update Headless namespace member expressions', () => {
    const input = `const HeadlessBtn = Headless.Button;`;
    const context = createTestContext(input);
    context.oldToNewMap.set('Button', 'CatalystButton');

    const transformedSourceFile = updateDirectIdentifiers(context);
    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain('Headless.Button');
    expect(context.changes).toHaveLength(0);
  });

  it('should not update Headless qualified names', () => {
    const input = `type Props = Headless.ButtonProps;`;
    const context = createTestContext(input);
    context.oldToNewMap.set('ButtonProps', 'CatalystButtonProps');

    const transformedSourceFile = updateDirectIdentifiers(context);
    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain('Headless.ButtonProps');
    expect(context.changes).toHaveLength(0);
  });

  it('should not update import specifiers', () => {
    const input = `import { Button } from './button';`;
    const context = createTestContext(input);
    context.oldToNewMap.set('Button', 'CatalystButton');

    const transformedSourceFile = updateDirectIdentifiers(context);
    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain("import { Button } from './button'");
    expect(context.changes).toHaveLength(0);
  });

  it('should not update export specifiers', () => {
    const input = `export { Button };`;
    const context = createTestContext(input);
    context.oldToNewMap.set('Button', 'CatalystButton');

    const transformedSourceFile = updateDirectIdentifiers(context);
    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain('export { Button }');
    expect(context.changes).toHaveLength(0);
  });

  it('should not update function declarations', () => {
    const input = `function Button() { return <button />; }`;
    const context = createTestContext(input);
    context.oldToNewMap.set('Button', 'CatalystButton');

    const transformedSourceFile = updateDirectIdentifiers(context);
    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain('function Button()');
    expect(context.changes).toHaveLength(0);
  });

  it('should not update variable declaration names', () => {
    const input = `const Button = () => <button />;`;
    const context = createTestContext(input);
    context.oldToNewMap.set('Button', 'CatalystButton');

    const transformedSourceFile = updateDirectIdentifiers(context);
    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain('const Button =');
    expect(context.changes).toHaveLength(0);
  });

  it('should not update property names in object literals', () => {
    const input = `const config = { Button: 'primary' };`;
    const context = createTestContext(input);
    context.oldToNewMap.set('Button', 'CatalystButton');

    const transformedSourceFile = updateDirectIdentifiers(context);
    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain("{ Button: 'primary' }");
    expect(context.changes).toHaveLength(0);
  });

  it('should not update property access expressions (left side)', () => {
    const input = `const value = Button.displayName;`;
    const context = createTestContext(input);
    context.oldToNewMap.set('Button', 'CatalystButton');

    const transformedSourceFile = updateDirectIdentifiers(context);
    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain('Button.displayName');
    expect(context.changes).toHaveLength(0);
  });

  it('should only update component-like identifiers (uppercase)', () => {
    const input = `
      const MyButton = Button;
      const myFunction = button;
    `;
    const context = createTestContext(input);
    context.oldToNewMap.set('Button', 'CatalystButton');
    context.oldToNewMap.set('button', 'catalystButton');

    const transformedSourceFile = updateDirectIdentifiers(context);
    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain('const MyButton = CatalystButton');
    expect(output).toContain('const myFunction = button'); // Not updated (lowercase)
  });

  it('should handle complex expressions', () => {
    const input = `
      const elements = [Button, Input, Dialog];
      const component = condition ? Button : Input;
      const factory = (Component = Button) => Component;
    `;
    const context = createTestContext(input);
    context.oldToNewMap.set('Button', 'CatalystButton');
    context.oldToNewMap.set('Input', 'CatalystInput');
    context.oldToNewMap.set('Dialog', 'CatalystDialog');

    const transformedSourceFile = updateDirectIdentifiers(context);
    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain('[CatalystButton, CatalystInput, CatalystDialog]');
    expect(output).toContain('condition ? CatalystButton : CatalystInput');
    expect(output).toContain('(Component = CatalystButton) => Component');
  });
});

describe('integration tests', () => {
  function createTestContext(input: string): ASTContext {
    const result = createASTContext(input);
    if (result.isErr()) throw new Error('Failed to create context');
    return result.value;
  }

  it('should handle complete reference transformation pipeline', () => {
    const input = `
      import * as Headless from '@headlessui/react';
      
      const CatalystButton = ({ children }: ButtonProps) => {
        const MyButton = Button;
        return (
          <Button onClick={() => MyButton()}>
            <Headless.Button>Headless</Headless.Button>
            {children}
          </Button>
        );
      };
      
      type Props = React.ComponentProps<typeof Button>;
    `;
    const context = createTestContext(input);
    context.oldToNewMap.set('Button', 'CatalystButton');
    context.oldToNewMap.set('ButtonProps', 'CatalystButtonProps');

    // Run all reference transformations
    let transformedSourceFile = updateFunctionParameterTypes(context);
    context.sourceFile = transformedSourceFile;

    transformedSourceFile = updateTypeofUsages(context);
    context.sourceFile = transformedSourceFile;

    transformedSourceFile = updateJSXReferences(context);
    context.sourceFile = transformedSourceFile;

    transformedSourceFile = updateTypeReferences(context);
    context.sourceFile = transformedSourceFile;

    transformedSourceFile = updateDirectIdentifiers(context);

    const output = generateTransformedCode(transformedSourceFile);

    // Function parameter should be updated
    expect(output).toContain('({ children }: CatalystButtonProps)');

    // Variable assignment should be updated
    expect(output).toContain('const MyButton = CatalystButton');

    // JSX elements should be updated
    expect(output).toContain('<CatalystButton onClick');

    // Headless UI should remain unchanged
    expect(output).toContain('<Headless.Button>Headless</Headless.Button>');

    // Typeof expression should be updated
    expect(output).toContain('React.ComponentProps<typeof CatalystButton>');
  });

  it('should preserve complex component patterns', () => {
    const input = `
      const CatalystButton = forwardRef<HTMLButtonElement, ButtonProps>(
        function Button({ children, onClick }, ref) {
          const buttonElement = Button as typeof Button;
          return (
            <Button ref={ref} onClick={onClick}>
              {children}
            </Button>
          );
        }
      );
      
      export type { ButtonProps as CatalystButtonProps };
    `;
    const context = createTestContext(input);
    context.oldToNewMap.set('Button', 'CatalystButton');
    context.oldToNewMap.set('ButtonProps', 'CatalystButtonProps');

    let transformedSourceFile = updateFunctionParameterTypes(context);
    context.sourceFile = transformedSourceFile;

    transformedSourceFile = updateTypeofUsages(context);
    context.sourceFile = transformedSourceFile;

    transformedSourceFile = updateJSXReferences(context);
    context.sourceFile = transformedSourceFile;

    transformedSourceFile = updateTypeReferences(context);
    context.sourceFile = transformedSourceFile;

    transformedSourceFile = updateDirectIdentifiers(context);

    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain('forwardRef<HTMLButtonElement, CatalystButtonProps>');
    expect(output).toContain('({ children, onClick }, ref)');
    expect(output).toContain('const buttonElement = CatalystButton as typeof CatalystButton');
    expect(output).toContain('<CatalystButton ref={ref}');
  });
});
