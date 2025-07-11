import { describe, it, expect } from 'vitest';
import { createASTContext, generateTransformedCode, type ASTContext } from '../core';
import { processImportDeclarations } from '../imports';

describe('processImportDeclarations', () => {
  function createTestContext(input: string): ASTContext {
    const result = createASTContext(input);
    if (result.isErr()) throw new Error('Failed to create context');
    return result.value;
  }

  it('should transform relative import paths with catalyst- prefix', () => {
    const input = `import { Button } from './button';`;
    const context = createTestContext(input);

    const transformedSourceFile = processImportDeclarations(context);
    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain('import { CatalystButton } from "./catalyst-button"');
    expect(context.oldToNewMap.get('Button')).toBe('CatalystButton');
    expect(context.changes).toContain('Updated import from ./button to ./catalyst-button');
  });

  it('should transform multiple import specifiers', () => {
    const input = `import { Button, Input, Dialog } from './components';`;
    const context = createTestContext(input);

    const transformedSourceFile = processImportDeclarations(context);
    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain(
      'import { CatalystButton, CatalystInput, CatalystDialog } from "./catalyst-components"'
    );
    expect(context.oldToNewMap.get('Button')).toBe('CatalystButton');
    expect(context.oldToNewMap.get('Input')).toBe('CatalystInput');
    expect(context.oldToNewMap.get('Dialog')).toBe('CatalystDialog');
  });

  it('should not transform @headlessui/react imports', () => {
    const input = `import { Button, ButtonProps, Menu } from '@headlessui/react';`;
    const context = createTestContext(input);

    const transformedSourceFile = processImportDeclarations(context);
    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain("import { Button, ButtonProps, Menu } from '@headlessui/react'");
    expect(context.oldToNewMap.has('Button')).toBe(false);
    expect(context.oldToNewMap.has('ButtonProps')).toBe(false);
    expect(context.oldToNewMap.has('Menu')).toBe(false);
    expect(context.changes).toHaveLength(0);
  });

  it('should not transform already prefixed imports', () => {
    const input = `import { CatalystButton } from './catalyst-button';`;
    const context = createTestContext(input);

    const transformedSourceFile = processImportDeclarations(context);
    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain("import { CatalystButton } from './catalyst-button'");
    expect(context.oldToNewMap.has('CatalystButton')).toBe(false);
    expect(context.changes).toHaveLength(0);
  });

  it('should not transform non-relative imports', () => {
    const input = `
      import React from 'react';
      import { cn } from '@/lib/utils';
      import { Button } from 'react-bootstrap';
    `;
    const context = createTestContext(input);

    const transformedSourceFile = processImportDeclarations(context);
    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain("import React from 'react'");
    expect(output).toContain("import { cn } from '@/lib/utils'");
    expect(output).toContain("import { Button } from 'react-bootstrap'");
    expect(context.oldToNewMap.size).toBe(0);
    expect(context.changes).toHaveLength(0);
  });

  it('should handle default imports with relative paths', () => {
    const input = `import Button from './button';`;
    const context = createTestContext(input);

    const transformedSourceFile = processImportDeclarations(context);
    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain('import Button from "./catalyst-button"');
    expect(context.changes).toContain('Updated import from ./button to ./catalyst-button');
  });

  it('should handle mixed import styles', () => {
    const input = `import Button, { ButtonProps, ButtonGroup } from './button';`;
    const context = createTestContext(input);

    const transformedSourceFile = processImportDeclarations(context);
    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain(
      'import Button, { CatalystButtonProps, CatalystButtonGroup } from "./catalyst-button"'
    );
    expect(context.oldToNewMap.get('ButtonProps')).toBe('CatalystButtonProps');
    expect(context.oldToNewMap.get('ButtonGroup')).toBe('CatalystButtonGroup');
  });

  it('should handle import aliases', () => {
    const input = `import { Button as OriginalButton, Input } from './components';`;
    const context = createTestContext(input);

    const transformedSourceFile = processImportDeclarations(context);
    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain(
      'import { Button as CatalystOriginalButton, CatalystInput } from "./catalyst-components"'
    );
    expect(context.oldToNewMap.get('OriginalButton')).toBe('CatalystOriginalButton');
    expect(context.oldToNewMap.get('Input')).toBe('CatalystInput');
  });

  it('should handle namespace imports', () => {
    const input = `import * as Components from './components';`;
    const context = createTestContext(input);

    const transformedSourceFile = processImportDeclarations(context);
    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain('import * as Components from "./catalyst-components"');
    expect(context.changes).toContain('Updated import from ./components to ./catalyst-components');
  });

  it('should preserve side-effect imports', () => {
    const input = `import './styles.css';`;
    const context = createTestContext(input);

    const transformedSourceFile = processImportDeclarations(context);
    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain('import "./catalyst-styles.css"');
    expect(context.changes).toContain('Updated import from ./styles.css to ./catalyst-styles.css');
  });

  it('should handle complex relative paths', () => {
    const input = `
      import { Button } from './button';
      import { Input } from '../input';
      import { Dialog } from '../../dialog';
    `;
    const context = createTestContext(input);

    const transformedSourceFile = processImportDeclarations(context);
    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain('import { CatalystButton } from "./catalyst-button"');
    expect(output).not.toContain('../catalyst-input'); // Only ./ paths are transformed
    expect(output).not.toContain('../../catalyst-dialog'); // Only ./ paths are transformed
    expect(output).toContain("import { Input } from '../input'");
    expect(output).toContain("import { Dialog } from '../../dialog'");
  });

  it('should handle imports with type-only imports', () => {
    const input = `import type { ButtonProps } from './button';`;
    const context = createTestContext(input);

    const transformedSourceFile = processImportDeclarations(context);
    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain('import { CatalystButtonProps } from "./catalyst-button"');
    expect(context.oldToNewMap.get('ButtonProps')).toBe('CatalystButtonProps');
  });

  it('should handle mixed type and value imports', () => {
    const input = `import Button, { type ButtonProps, ButtonGroup } from './button';`;
    const context = createTestContext(input);

    const transformedSourceFile = processImportDeclarations(context);
    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain(
      'import Button, { CatalystButtonProps, CatalystButtonGroup } from "./catalyst-button"'
    );
    expect(context.oldToNewMap.get('ButtonProps')).toBe('CatalystButtonProps');
    expect(context.oldToNewMap.get('ButtonGroup')).toBe('CatalystButtonGroup');
  });

  it('should not modify imports that already have Catalyst prefix in specifiers', () => {
    const input = `import { CatalystButton, Input } from './components';`;
    const context = createTestContext(input);

    const transformedSourceFile = processImportDeclarations(context);
    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain(
      'import { CatalystButton, CatalystInput } from "./catalyst-components"'
    );
    expect(context.oldToNewMap.has('CatalystButton')).toBe(false);
    expect(context.oldToNewMap.get('Input')).toBe('CatalystInput');
  });

  it('should handle empty named imports', () => {
    const input = `import {} from './empty';`;
    const context = createTestContext(input);

    const transformedSourceFile = processImportDeclarations(context);
    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain('import {} from "./catalyst-empty"');
    expect(context.changes).toContain('Updated import from ./empty to ./catalyst-empty');
  });

  it('should preserve import assertions', () => {
    const input = `import data from './data.json' assert { type: 'json' };`;
    const context = createTestContext(input);

    const transformedSourceFile = processImportDeclarations(context);
    const output = generateTransformedCode(transformedSourceFile);

    expect(output).toContain('import data from "./catalyst-data.json" assert { type: \'json\' }');
  });

  it('should handle import with dynamic patterns', () => {
    const input = `
      import { Button } from './button';
      import { Menu } from '@headlessui/react';
      import { Input } from '../input';
      import { Dialog } from './dialog';
    `;
    const context = createTestContext(input);

    const transformedSourceFile = processImportDeclarations(context);
    const output = generateTransformedCode(transformedSourceFile);

    // Relative ./ imports should be transformed
    expect(output).toContain('import { CatalystButton } from "./catalyst-button"');
    expect(output).toContain('import { CatalystDialog } from "./catalyst-dialog"');

    // Headless UI should remain unchanged
    expect(output).toContain("import { Menu } from '@headlessui/react'");

    // Non-./ relative imports should remain unchanged
    expect(output).toContain("import { Input } from '../input'");

    expect(context.oldToNewMap.get('Button')).toBe('CatalystButton');
    expect(context.oldToNewMap.get('Dialog')).toBe('CatalystDialog');
    expect(context.oldToNewMap.has('Menu')).toBe(false);
    expect(context.oldToNewMap.has('Input')).toBe(false);
  });
});
