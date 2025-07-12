import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { expectSuccess } from '@esteban-url/trailhead-cli/testing';
import { transformClsxToCn } from '../imports/clsx-to-cn';
import { transformFileHeaders } from '../format/file-headers';

describe('Transform Edge Cases', () => {
  describe('clsx-to-cn edge cases', () => {
    it('should handle multiple clsx imports in single file', () => {
      const input = `
        import clsx from 'clsx';
        import clsx from "clsx";
      `;

      const result = transformClsxToCn(input);

      const transformed = expectSuccess(result);
      expect(transformed.changed).toBe(true);
      expect(transformed.content).toContain('import { cn } from ');
      expect(transformed.content).toContain('../utils/cn');
      // Should not contain clsx imports anymore
      expect(transformed.content).not.toMatch(/import.*clsx.*from/);
    });

    it('should handle clsx imports with different quote styles', () => {
      const input = `
        import clsx from 'clsx'
        import clsx from "clsx"
        import clsx from \`clsx\`
      `;

      const result = transformClsxToCn(input);

      const transformed = expectSuccess(result);
      expect(transformed.changed).toBe(true);
      const lines = transformed.content.split('\n').filter(line => line.trim());
      const cnImports = lines.filter(line => line.includes("import { cn } from '../utils/cn';"));
      expect(cnImports.length).toBeGreaterThan(0);
    });

    it('should handle clsx function calls in complex expressions', () => {
      const input = `
        const classes1 = clsx('base', condition && 'conditional');
        const classes2 = someArray.map(item => clsx(item.class, 'extra'));
        const classes3 = { 
          wrapper: clsx('wrapper-base', props.className),
          inner: clsx({ active: isActive })
        };
        return <div className={clsx('flex', nested.clsx('nested'))} />;
      `;

      const result = transformClsxToCn(input);

      const transformed = expectSuccess(result);
      expect(transformed.changed).toBe(true);
      expect(transformed.content).toContain("cn('base', condition && 'conditional')");
      expect(transformed.content).toContain("cn(item.class, 'extra')");
      expect(transformed.content).toContain("cn('wrapper-base', props.className)");
      expect(transformed.content).toContain('cn({ active: isActive })');
      expect(transformed.content).toContain("cn('flex'");
      expect(transformed.content).not.toMatch(/\bclsx\(/);
    });

    it('should handle edge case with clsx in comments and strings', () => {
      const input = `
        // This uses clsx for styling
        import clsx from 'clsx';
        const message = "Use clsx() for conditional classes";
        const template = \`clsx is useful\`;
        /*
         * clsx documentation
         * Use clsx(...) pattern
         */
        const classes = clsx('actual-usage');
      `;

      const result = transformClsxToCn(input);

      const transformed = expectSuccess(result);
      expect(transformed.changed).toBe(true);
      expect(transformed.content).toContain('import { cn } from ');
      expect(transformed.content).toContain('../utils/cn');
      expect(transformed.content).toContain("cn('actual-usage')");
      // Should have warnings about remaining clsx references in comments/strings
      expect(transformed.warnings).toContain(
        'Found remaining clsx references that may need manual review'
      );
    });

    it('should handle clsx with no imports (already converted)', () => {
      const input = `
        import { cn } from '../utils/cn';
        const classes = cn('flex items-center', className);
      `;

      const result = transformClsxToCn(input);

      const transformed = expectSuccess(result);
      expect(transformed.changed).toBe(false);
      expect(transformed.content).toBe(input);
      expect(transformed.warnings).toEqual([]);
    });

    it('should handle mixed clsx and cn usage', () => {
      const input = `
        import clsx from 'clsx';
        import { cn } from '../utils/cn';
        
        const classes1 = clsx('old-style');
        const classes2 = cn('new-style');
      `;

      const result = transformClsxToCn(input);

      const transformed = expectSuccess(result);
      expect(transformed.changed).toBe(true);
      expect(transformed.content).toContain('import { cn } from ');
      expect(transformed.content).toContain('../utils/cn');
      expect(transformed.content).toContain("cn('old-style')");
      expect(transformed.content).toContain("cn('new-style')");
    });

    it('should handle whitespace variations in clsx imports', () => {
      const input = `
        import   clsx   from   'clsx'   
        import\tclsx\tfrom\t"clsx"
        import
        clsx
        from
        'clsx'
      `;

      const result = transformClsxToCn(input);

      const transformed = expectSuccess(result);
      expect(transformed.changed).toBe(true);
      expect(transformed.content).not.toMatch(/import.*clsx.*from.*['"]clsx['"]/);
    });

    it('should handle clsx in template literals', () => {
      const input = `
        import clsx from 'clsx';
        const template = \`\${clsx('dynamic', condition && 'active')}\`;
        const jsx = <div className={\`base \${clsx('extra')}\`} />;
      `;

      const result = transformClsxToCn(input);

      const transformed = expectSuccess(result);
      expect(transformed.changed).toBe(true);
      expect(transformed.content).toContain(`\`\${cn('dynamic', condition && 'active')}\``);
      expect(transformed.content).toContain(`\`base \${cn('extra')}\``);
    });

    it('should handle empty clsx calls', () => {
      const input = `
        import clsx from 'clsx';
        const empty1 = clsx();
        const empty2 = clsx(   );
        const empty3 = clsx(
        );
      `;

      const result = transformClsxToCn(input);

      const transformed = expectSuccess(result);
      expect(transformed.changed).toBe(true);
      expect(transformed.content).toContain('cn()');
      expect(transformed.content).toContain('cn(   )');
      expect(transformed.content).toMatch(/cn\(\s*\)/);
    });

    it('should handle clsx with complex nested structures', () => {
      const input = `
        import clsx from 'clsx';
        const complexClasses = clsx(
          'base-class',
          {
            'state-class': isActive,
            'disabled': !enabled,
          },
          variant === 'primary' && 'primary-variant',
          size && \`size-\${size}\`,
          [
            condition1 && 'conditional-1',
            condition2 && 'conditional-2',
          ],
          props.className
        );
      `;

      const result = transformClsxToCn(input);

      const transformed = expectSuccess(result);
      expect(transformed.changed).toBe(true);
      expect(transformed.content).toContain('cn(');
      expect(transformed.content).toContain("'base-class'");
      expect(transformed.content).toContain("'state-class': isActive");
      expect(transformed.content).toContain("'disabled': !enabled");
      expect(transformed.content).toContain('props.className');
      expect(transformed.content).not.toMatch(/\bclsx\(/);
    });
  });

  describe('file-headers edge cases', () => {
    let originalEnv: string | undefined;

    beforeEach(() => {
      originalEnv = process.env.NODE_ENV;
    });

    afterEach(() => {
      if (originalEnv !== undefined) {
        process.env.NODE_ENV = originalEnv;
      } else {
        delete process.env.NODE_ENV;
      }
    });

    it('should not add header if already exists', () => {
      const input = `
        // WARNING: This file is auto-generated and will be overwritten.
        // Auto generated on DEVELOPMENT
        
        import React from 'react';
        export function Component() {}
      `;

      const result = transformFileHeaders(input);

      const transformed = expectSuccess(result);
      expect(transformed.changed).toBe(false);
      expect(transformed.content).toBe(input);
      expect(transformed.warnings).toContain('File already has auto-generated header');
    });

    it('should add header to empty file', () => {
      const input = '';

      const result = transformFileHeaders(input);

      const transformed = expectSuccess(result);
      expect(transformed.changed).toBe(true);
      expect(transformed.content).toContain(
        '// WARNING: This file is auto-generated and will be overwritten.'
      );
      expect(transformed.content).toContain('// Auto generated on DEVELOPMENT');
      expect(transformed.content).toMatch(/^\/\/ WARNING:.*\n\/\/ Auto generated.*\n\n$/);
    });

    it('should add header to file with only whitespace', () => {
      const input = '   \n\t\n   ';

      const result = transformFileHeaders(input);

      const transformed = expectSuccess(result);
      expect(transformed.changed).toBe(true);
      expect(transformed.content).toContain(
        '// WARNING: This file is auto-generated and will be overwritten.'
      );
      expect(transformed.content.endsWith(input)).toBe(true);
    });

    it('should use development timestamp in development mode', () => {
      process.env.NODE_ENV = 'development';

      const input = 'export function Component() {}';
      const result = transformFileHeaders(input);

      const transformed = expectSuccess(result);
      expect(transformed.changed).toBe(true);
      expect(transformed.content).toContain('// Auto generated on DEVELOPMENT');
    });

    it('should use ISO timestamp in production mode', () => {
      process.env.NODE_ENV = 'production';

      // Mock Date to have predictable output
      const mockDate = '2024-01-15T10:30:00.000Z';
      vi.spyOn(Date.prototype, 'toISOString').mockReturnValue(mockDate);

      const input = 'export function Component() {}';
      const result = transformFileHeaders(input);

      const transformed = expectSuccess(result);
      expect(transformed.changed).toBe(true);
      expect(transformed.content).toContain(`// Auto generated on ${mockDate}`);
      expect(transformed.content).not.toContain('DEVELOPMENT');

      vi.restoreAllMocks();
    });

    it('should handle undefined NODE_ENV as development', () => {
      delete process.env.NODE_ENV;

      const input = 'export function Component() {}';
      const result = transformFileHeaders(input);

      const transformed = expectSuccess(result);
      expect(transformed.changed).toBe(true);
      expect(transformed.content).toContain('// Auto generated on DEVELOPMENT');
    });

    it('should preserve existing content after header', () => {
      const input = `import React from 'react';
import { useState } from 'react';

/**
 * Component documentation
 */
export function Component({ prop1, prop2 }: Props) {
  const [state, setState] = useState(false);
  
  return (
    <div className="component">
      {/* Comment */}
      <span>{prop1}</span>
    </div>
  );
}

export type Props = {
  prop1: string;
  prop2?: number;
};`;

      const result = transformFileHeaders(input);

      const transformed = expectSuccess(result);
      expect(transformed.changed).toBe(true);
      expect(
        transformed.content.startsWith(
          '// WARNING: This file is auto-generated and will be overwritten.\n// Auto generated on DEVELOPMENT\n\n'
        )
      ).toBe(true);
      expect(transformed.content.endsWith(input)).toBe(true);
      expect(transformed.content).toContain("import React from 'react';");
      expect(transformed.content).toContain('Component documentation');
      expect(transformed.content).toContain('export function Component');
      expect(transformed.content).toContain('export type Props');
    });

    it('should handle files that already have comments at the top', () => {
      const input = `// Some existing comment
/* Block comment */
import React from 'react';
export function Component() {}`;

      const result = transformFileHeaders(input);

      const transformed = expectSuccess(result);
      expect(transformed.changed).toBe(true);
      expect(
        transformed.content.startsWith(
          '// WARNING: This file is auto-generated and will be overwritten.'
        )
      ).toBe(true);
      expect(transformed.content).toContain('// Some existing comment');
      expect(transformed.content).toContain('/* Block comment */');
    });

    it('should handle files with shebang', () => {
      const input = `#!/usr/bin/env node
import React from 'react';
export function Component() {}`;

      const result = transformFileHeaders(input);

      const transformed = expectSuccess(result);
      expect(transformed.changed).toBe(true);
      expect(
        transformed.content.startsWith(
          '// WARNING: This file is auto-generated and will be overwritten.'
        )
      ).toBe(true);
      expect(transformed.content).toContain('#!/usr/bin/env node');
    });

    it('should handle partial warning text that should not trigger duplicate detection', () => {
      const input = `
        // WARNING: Be careful when editing this file
        // This file might be auto-generated
        import React from 'react';
        export function Component() {}
      `;

      const result = transformFileHeaders(input);

      const transformed = expectSuccess(result);
      expect(transformed.changed).toBe(true);
      expect(transformed.content).toContain(
        '// WARNING: This file is auto-generated and will be overwritten.'
      );
      expect(transformed.content).toContain('// WARNING: Be careful when editing this file');
    });

    it('should handle very large files efficiently', () => {
      const largeContent =
        'export function Component() { return <div>Large content</div>; }\n'.repeat(10000);

      const result = transformFileHeaders(largeContent);

      const transformed = expectSuccess(result);
      expect(transformed.changed).toBe(true);
      expect(
        transformed.content.startsWith(
          '// WARNING: This file is auto-generated and will be overwritten.'
        )
      ).toBe(true);
      expect(transformed.content.endsWith(largeContent)).toBe(true);
    });

    it('should handle files with unusual line endings', () => {
      const input = "import React from 'react';\r\nexport function Component() {}\r\n";

      const result = transformFileHeaders(input);

      const transformed = expectSuccess(result);
      expect(transformed.changed).toBe(true);
      expect(transformed.content).toContain(
        '// WARNING: This file is auto-generated and will be overwritten.'
      );
      expect(transformed.content).toContain('\r\n'); // Preserve original line endings
    });

    it('should handle files with unicode characters', () => {
      const input = `// 文档注释
import React from 'react';
export function Component() {
  return <div>Unicode: 🎉 αβγ</div>;
}`;

      const result = transformFileHeaders(input);

      const transformed = expectSuccess(result);
      expect(transformed.changed).toBe(true);
      expect(transformed.content).toContain(
        '// WARNING: This file is auto-generated and will be overwritten.'
      );
      expect(transformed.content).toContain('文档注释');
      expect(transformed.content).toContain('🎉 αβγ');
    });
  });

  describe('Combined edge cases', () => {
    it('should handle file that needs both clsx-to-cn and file-headers transforms', () => {
      const input = `import clsx from 'clsx';
import React from 'react';

export function Component({ className }) {
  return (
    <div className={clsx('base-class', className)}>
      Content
    </div>
  );
}`;

      // Apply clsx-to-cn first
      const clsxResult = transformClsxToCn(input);
      const clsxTransformed = expectSuccess(clsxResult);

      // Then apply file headers
      const headerResult = transformFileHeaders(clsxTransformed.content);
      const headerTransformed = expectSuccess(headerResult);

      expect(headerTransformed.content).toContain(
        '// WARNING: This file is auto-generated and will be overwritten.'
      );
      expect(headerTransformed.content).toContain('import { cn } from ');
      expect(headerTransformed.content).toContain('../utils/cn');
      expect(headerTransformed.content).toContain("cn('base-class', className)");
      expect(headerTransformed.content).not.toContain('clsx');
    });

    it('should handle file with existing header that needs clsx-to-cn transform', () => {
      const input = `// WARNING: This file is auto-generated and will be overwritten.
// Auto generated on DEVELOPMENT

import clsx from 'clsx';
import React from 'react';

export function Component({ className }) {
  return <div className={clsx('test')} />;
}`;

      // Apply file headers first (should be no-op)
      const headerResult = transformFileHeaders(input);
      const headerTransformed = expectSuccess(headerResult);
      expect(headerTransformed.changed).toBe(false);

      // Then apply clsx-to-cn
      const clsxResult = transformClsxToCn(headerTransformed.content);
      const clsxTransformed = expectSuccess(clsxResult);

      expect(clsxTransformed.changed).toBe(true);
      expect(clsxTransformed.content).toContain(
        '// WARNING: This file is auto-generated and will be overwritten.'
      );
      expect(clsxTransformed.content).toContain('import { cn } from ');
      expect(clsxTransformed.content).toContain('../utils/cn');
      expect(clsxTransformed.content).toContain("cn('test')");
    });
  });
});
