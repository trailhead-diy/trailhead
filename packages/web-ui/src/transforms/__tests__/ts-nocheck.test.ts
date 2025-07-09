import { describe, it, expect } from 'vitest';
import { transformTsNocheck } from '../transforms/ts-nocheck.js';

describe('transformTsNocheck', () => {
  it('should add @ts-nocheck directive to target file without it', () => {
    const input = `'use client'
// WARNING: This file is auto-generated and will be overwritten.
// Auto generated on DEVELOPMENT

import React from 'react'

export function Component() {
  return <div>Hello</div>
}`;

    const result = transformTsNocheck(input, 'catalyst-combobox.tsx');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.changed).toBe(true);
      expect(result.value.content).toBe(`// @ts-nocheck
'use client'
// WARNING: This file is auto-generated and will be overwritten.
// Auto generated on DEVELOPMENT

import React from 'react'

export function Component() {
  return <div>Hello</div>
}`);
    }
  });

  it('should add @ts-nocheck directive to target file without use client', () => {
    const input = `// WARNING: This file is auto-generated and will be overwritten.
// Auto generated on DEVELOPMENT

import React from 'react'

export function Component() {
  return <div>Hello</div>
}`;

    const result = transformTsNocheck(input, 'catalyst-dropdown.tsx');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.changed).toBe(true);
      expect(result.value.content).toBe(`// @ts-nocheck
// WARNING: This file is auto-generated and will be overwritten.
// Auto generated on DEVELOPMENT

import React from 'react'

export function Component() {
  return <div>Hello</div>
}`);
    }
  });

  it('should skip target file that already has @ts-nocheck directive', () => {
    const input = `// @ts-nocheck
'use client'
// WARNING: This file is auto-generated and will be overwritten.
// Auto generated on DEVELOPMENT

import React from 'react'

export function Component() {
  return <div>Hello</div>
}`;

    const result = transformTsNocheck(input, 'catalyst-listbox.tsx');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.changed).toBe(false);
      expect(result.value.warnings).toContain('File already has @ts-nocheck directive');
      expect(result.value.content).toBe(input);
    }
  });

  it('should skip non-target files', () => {
    const input = `'use client'
// WARNING: This file is auto-generated and will be overwritten.
// Auto generated on DEVELOPMENT

import React from 'react'

export function Component() {
  return <div>Hello</div>
}`;

    const result = transformTsNocheck(input, 'catalyst-button.tsx');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.changed).toBe(false);
      expect(result.value.warnings).toHaveLength(0);
      expect(result.value.content).toBe(input);
    }
  });

  it('should skip files when no filename is provided', () => {
    const input = `'use client'
// WARNING: This file is auto-generated and will be overwritten.
// Auto generated on DEVELOPMENT

import React from 'react'

export function Component() {
  return <div>Hello</div>
}`;

    const result = transformTsNocheck(input);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.changed).toBe(false);
      expect(result.value.warnings).toHaveLength(0);
      expect(result.value.content).toBe(input);
    }
  });

  it('should handle target file with full path', () => {
    const input = `'use client'`;

    const result = transformTsNocheck(input, 'src/components/lib/catalyst-combobox.tsx');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.changed).toBe(true);
      expect(result.value.content).toBe(`// @ts-nocheck
'use client'`);
    }
  });

  it('should handle all three target files', () => {
    const input = `export function Component() { return <div>Hello</div>; }`;

    const targetFiles = ['catalyst-combobox.tsx', 'catalyst-dropdown.tsx', 'catalyst-listbox.tsx'];

    for (const filename of targetFiles) {
      const result = transformTsNocheck(input, filename);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.changed).toBe(true);
        expect(result.value.content).toBe(`// @ts-nocheck
export function Component() { return <div>Hello</div>; }`);
      }
    }
  });
});
