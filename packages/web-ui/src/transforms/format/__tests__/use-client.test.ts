import { describe, it, expect } from 'vitest';
import { addUseClientDirective } from '../use-client';
import { expectSuccess } from '@esteban-url/trailhead-cli/testing';

describe('addUseClientDirective', () => {
  describe('Component detection', () => {
    it('should add use client to button component', () => {
      const input = `import React from 'react';

export function Button() {
  return <button>Click me</button>;
}`;

      const result = addUseClientDirective(input, 'button.tsx');
      const { content, changed } = expectSuccess(result);

      expect(changed).toBe(true);
      expect(content.startsWith('"use client";\n\n')).toBe(true);
      expect(content).toContain("import React from 'react'");
    });

    it('should add use client to dropdown component', () => {
      const input = `import React from 'react';

export function Dropdown() {
  return <div>Dropdown</div>;
}`;

      const result = addUseClientDirective(input, 'dropdown.tsx');
      const { content, changed } = expectSuccess(result);

      expect(changed).toBe(true);
      expect(content.startsWith('"use client";\n\n')).toBe(true);
    });

    it('should add use client to alert component', () => {
      const input = `import React from 'react';

export function Alert() {
  return <div>Alert</div>;
}`;

      const result = addUseClientDirective(input, 'alert.tsx');
      const { content, changed } = expectSuccess(result);

      expect(changed).toBe(true);
      expect(content.startsWith('"use client";\n\n')).toBe(true);
    });

    it('should add use client to combobox component', () => {
      const input = `import React from 'react';

export function Combobox() {
  return <div>Combobox</div>;
}`;

      const result = addUseClientDirective(input, 'combobox.tsx');
      const { content, changed } = expectSuccess(result);

      expect(changed).toBe(true);
      expect(content.startsWith('"use client";\n\n')).toBe(true);
    });
  });

  describe('Non-target components', () => {
    it('should not add use client to input component', () => {
      const input = `import React from 'react';

export function Input() {
  return <input />;
}`;

      const result = addUseClientDirective(input, 'input.tsx');
      const { content, changed } = expectSuccess(result);

      expect(changed).toBe(false);
      expect(content).toBe(input);
    });

    it('should not add use client to text component', () => {
      const input = `import React from 'react';

export function Text() {
  return <span>Text</span>;
}`;

      const result = addUseClientDirective(input, 'text.tsx');
      const { content, changed } = expectSuccess(result);

      expect(changed).toBe(false);
      expect(content).toBe(input);
    });

    it('should not modify files without filename', () => {
      const input = `export function Button() { return <button />; }`;

      const result = addUseClientDirective(input);
      const { content, changed } = expectSuccess(result);

      expect(changed).toBe(false);
      expect(content).toBe(input);
    });
  });

  describe('Existing use client directive', () => {
    it('should not add duplicate use client with double quotes', () => {
      const input = `"use client";

import React from 'react';

export function Button() {
  return <button>Click me</button>;
}`;

      const result = addUseClientDirective(input, 'button.tsx');
      const { content, changed } = expectSuccess(result);

      expect(changed).toBe(false);
      expect(content).toBe(input);
    });

    it('should not add duplicate use client with single quotes', () => {
      const input = `'use client';

import React from 'react';

export function Button() {
  return <button>Click me</button>;
}`;

      const result = addUseClientDirective(input, 'button.tsx');
      const { content, changed } = expectSuccess(result);

      expect(changed).toBe(false);
      expect(content).toBe(input);
    });

    it('should detect use client anywhere in file', () => {
      const input = `import React from 'react';
// Some comment
'use client';

export function Button() {
  return <button>Click me</button>;
}`;

      const result = addUseClientDirective(input, 'button.tsx');
      const { content, changed } = expectSuccess(result);

      expect(changed).toBe(false);
      expect(content).toBe(input);
    });
  });

  describe('File path handling', () => {
    it('should work with full file paths', () => {
      const input = `export function Button() { return <button />; }`;

      const result = addUseClientDirective(input, '/src/components/button.tsx');
      const { content, changed } = expectSuccess(result);

      expect(changed).toBe(true);
      expect(content.startsWith('"use client";\n\n')).toBe(true);
    });

    it('should work with relative paths', () => {
      const input = `export function Dropdown() { return <div />; }`;

      const result = addUseClientDirective(input, './components/dropdown.tsx');
      const { content, changed } = expectSuccess(result);

      expect(changed).toBe(true);
      expect(content.startsWith('"use client";\n\n')).toBe(true);
    });

    it('should handle different file extensions', () => {
      const input = `export function Alert() { return <div />; }`;

      // Test .js, .jsx, .ts, .tsx
      const extensions = ['js', 'jsx', 'ts', 'tsx'];

      extensions.forEach(ext => {
        const result = addUseClientDirective(input, `alert.${ext}`);
        const { changed } = expectSuccess(result);
        expect(changed).toBe(true);
      });
    });

    it('should be case insensitive for component names', () => {
      const input = `export function Button() { return <button />; }`;

      const filenames = ['BUTTON.tsx', 'Button.tsx', 'button.tsx'];

      filenames.forEach(filename => {
        const result = addUseClientDirective(input, filename);
        const { changed } = expectSuccess(result);
        expect(changed).toBe(true);
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle empty file', () => {
      const result = addUseClientDirective('', 'button.tsx');
      const { content, changed } = expectSuccess(result);

      expect(changed).toBe(true);
      expect(content).toBe('"use client";\n\n');
    });

    it('should handle file with only whitespace', () => {
      const input = '   \n  \n  ';

      const result = addUseClientDirective(input, 'button.tsx');
      const { content, changed } = expectSuccess(result);

      expect(changed).toBe(true);
      expect(content).toBe('"use client";\n\n' + input);
    });

    it('should handle malformed filenames gracefully', () => {
      const input = `export function Button() { return <button />; }`;

      const malformedNames = ['', '.tsx', 'no-extension', '...tsx'];

      malformedNames.forEach(filename => {
        const result = addUseClientDirective(input, filename);
        const { changed } = expectSuccess(result);
        expect(changed).toBe(false); // Should not transform malformed names
      });
    });

    it('should preserve original content structure', () => {
      const input = `// Header comment
import React from 'react';
import { useState } from 'react';

export function Button({ onClick }: { onClick: () => void }) {
  const [clicked, setClicked] = useState(false);
  
  return (
    <button 
      onClick={() => {
        setClicked(true);
        onClick();
      }}
    >
      {clicked ? 'Clicked!' : 'Click me'}
    </button>
  );
}

export default Button;`;

      const result = addUseClientDirective(input, 'button.tsx');
      const { content, changed } = expectSuccess(result);

      expect(changed).toBe(true);
      expect(content).toBe('"use client";\n\n' + input);

      // Verify all original content is preserved
      expect(content).toContain('// Header comment');
      expect(content).toContain("import React from 'react'");
      expect(content).toContain('export default Button');
    });
  });
});
