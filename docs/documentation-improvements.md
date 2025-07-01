# Documentation Improvement Roadmap

This document outlines potential improvements to the Trailhead monorepo documentation system to enhance maintainability, accuracy, and developer experience.

## Available Libraries and Tools

Each improvement can be implemented using existing, well-maintained libraries that integrate seamlessly with the Trailhead monorepo's TypeScript and pnpm setup.

## 1. Cross-Reference Validation System

### Problem

Internal documentation links can break when files are moved, renamed, or deleted. Currently, there's no automated way to validate these references.

### Proposed Solution

Create a documentation validation script that:

- Scans all markdown files for internal links
- Validates that referenced files exist
- Checks anchor links within documents
- Reports broken links with file locations

### Implementation Ideas

```bash
# Example command
pnpm validate-docs

# Output
❌ Broken link in /packages/web-ui/README.md:106
   → ./docs/migration.md (file not found)
✅ 234 links validated successfully
```

### Benefits

- Prevents broken documentation links
- Catches issues during CI/CD
- Improves documentation reliability

### Recommended Libraries

- **[remark-validate-links](https://www.npmjs.com/package/remark-validate-links)** - Validates internal links, checks anchors, integrates with unified ecosystem
- **[markdown-link-check](https://www.npmjs.com/package/markdown-link-check)** - Checks internal/external links with retry support
- **[linkinator](https://www.npmjs.com/package/linkinator)** - Fast concurrent link checking with pattern filtering

## 2. Documentation Code Example Testing

### Problem

Code examples in documentation can become outdated as APIs change, leading to frustration for developers who copy non-working code.

### Proposed Solution

Implement a system to:

- Extract code blocks from markdown files
- Run them as actual tests
- Validate that examples compile and execute correctly
- Support different languages/frameworks

### Implementation Ideas

```typescript
// docs/examples.test.ts
import { extractCodeExamples } from "./test-utils";

describe("Documentation Examples", () => {
  const examples = extractCodeExamples("**/*.md");

  examples.forEach(({ file, lineNumber, code, language }) => {
    it(`${file}:${lineNumber} - ${language} example should work`, async () => {
      if (language === "typescript") {
        expect(() => compileTypeScript(code)).not.toThrow();
      }
      // Additional language handlers...
    });
  });
});
```

### Benefits

- Ensures documentation examples always work
- Catches API changes that break examples
- Builds developer trust in documentation

### Recommended Libraries

- **[markdown-doctest](https://www.npmjs.com/package/markdown-doctest)** - Extracts and runs code examples as tests
- **[eslint-plugin-markdown](https://www.npmjs.com/package/eslint-plugin-markdown)** - Lints code blocks to ensure quality
- **[jest-runner-docs](https://www.npmjs.com/package/jest-runner-docs)** - Run markdown code blocks as Jest tests
- **Custom Vitest solution** - Build extractor using unified/remark + Vitest (already in monorepo)

## 3. Version Synchronization System

### Problem

Version numbers, package names, and dependency versions can drift between documentation and actual code, causing confusion.

### Proposed Solution

Create a version sync system that:

- Reads version information from package.json files
- Updates documentation with correct versions
- Validates version references are accurate
- Supports version placeholders in docs

### Implementation Ideas

````markdown
<!-- Before -->

Install version 1.0.0:

```bash
pnpm add @trailhead/web-ui@1.0.0
```
````

<!-- Using placeholders -->

Install version {{VERSION}}:

```bash
pnpm add @trailhead/web-ui@{{VERSION}}
```

````

### Benefits
- Documentation always shows correct versions
- Reduces manual update burden
- Prevents version mismatch confusion

### Recommended Libraries
- **[syncpack](https://www.npmjs.com/package/syncpack)** - Synchronize versions across monorepo packages
- **[markdown-magic](https://www.npmjs.com/package/markdown-magic)** - Transform markdown with dynamic content injection
- **[@changesets/cli](https://www.npmjs.com/package/@changesets/cli)** - Version management with documentation updates
- **Custom Node.js scripts** - Read package.json and replace placeholders during build

## 4. Documentation Style Guide & Linter

### Problem
Inconsistent documentation style makes the docs harder to read and maintain.

### Proposed Solution
Develop a comprehensive style guide and automated linter:
- Consistent heading hierarchy
- Code block formatting standards
- Terminology consistency (e.g., "npm" vs "pnpm")
- Link format standards
- Example structure patterns

### Implementation Ideas
```yaml
# .markdownlint.yml
rules:
  heading-increment: true
  no-trailing-punctuation:
    punctuation: ".,;:"
  code-block-style:
    style: "fenced"
  terminology:
    preferred:
      - term: "pnpm"
        not: ["npm", "yarn"]
      - term: "transformation"
        not: ["conversion", "convert"]
````

### Benefits

- Consistent documentation quality
- Easier maintenance
- Better reading experience

### Recommended Libraries

- **[markdownlint-cli2](https://www.npmjs.com/package/markdownlint-cli2)** - Comprehensive markdown linting with auto-fix
- **[remark-lint](https://www.npmjs.com/package/remark-lint)** - Extensible linting as part of unified ecosystem
- **[textlint](https://www.npmjs.com/package/textlint)** - Natural language linting with terminology checking
- **[vale](https://vale.sh/)** - Advanced prose linting (external tool, not npm)

## 5. Interactive Documentation Features

### Problem

Static documentation can be limiting for complex concepts like theme customization.

### Proposed Solution

Add interactive elements:

- Live theme preview for color documentation
- Interactive API playground
- Embeddable component demos
- Copy-to-clipboard for all code blocks

### Implementation Ideas

```typescript
// Theme preview component
<ThemePreview
  theme="purple"
  interactive={true}
  showCode={true}
/>

// Would render an interactive widget showing theme colors
```

### Benefits

- Better learning experience
- Immediate visual feedback
- Reduced context switching

### Recommended Libraries

- **[react-live](https://www.npmjs.com/package/react-live)** - Live editing of React components in docs
- **[@storybook/addon-docs](https://www.npmjs.com/package/@storybook/addon-docs)** - MDX support with component previews
- **[shiki](https://www.npmjs.com/package/shiki) + [@typescript/twoslash](https://www.npmjs.com/package/@typescript/twoslash)** - Beautiful highlighting with TS intellisense
- **[Docusaurus](https://www.npmjs.com/package/@docusaurus/core)** - Full documentation framework with interactive features

## 6. Automated API Documentation Generation

### Problem

Manually maintaining API documentation is error-prone and time-consuming.

### Proposed Solution

Implement automated API doc generation:

- Extract from TypeScript types and JSDoc
- Generate markdown files automatically
- Include examples from test files
- Update on each build

### Implementation Ideas

````typescript
/**
 * Creates a new theme with the specified name
 * @param name - The theme name
 * @returns A theme builder instance
 * @example
 * ```typescript
 * const theme = createTheme('my-theme')
 *   .withPrimaryColor('oklch(0.7 0.15 250)')
 *   .build()
 * ```
 */
export function createTheme(name: string): ThemeBuilder {
  // Implementation
}
````

### Benefits

- Always up-to-date API docs
- Reduces documentation burden
- Consistent format

### Recommended Libraries

- **[typedoc](https://www.npmjs.com/package/typedoc)** - TypeScript-focused with markdown output and monorepo support
- **[@microsoft/api-extractor](https://www.npmjs.com/package/@microsoft/api-extractor)** - Microsoft's solution for API documentation
- **[jsdoc-to-markdown](https://www.npmjs.com/package/jsdoc-to-markdown)** - Generate markdown from JSDoc comments
- **[ts-morph](https://www.npmjs.com/package/ts-morph)** - Build custom generators with TypeScript AST

## 7. Documentation Search & Discovery

### Problem

Finding specific information in extensive documentation can be challenging.

### Proposed Solution

Implement advanced search features:

- Full-text search across all docs
- Smart suggestions
- Category filtering
- Recent/popular searches
- Keyboard navigation

### Benefits

- Faster information discovery
- Better user experience
- Reduced support questions

### Recommended Libraries

- **[Algolia DocSearch](https://docsearch.algolia.com/)** - Free for open source, AI-powered search
- **[pagefind](https://www.npmjs.com/package/pagefind)** - Static search with build-time indexing
- **[flexsearch](https://www.npmjs.com/package/flexsearch)** - Fast client-side search with small bundle
- **[lunr](https://www.npmjs.com/package/lunr)** - Mature full-text search library

## Implementation Strategy

### Quick Wins (Immediate Implementation)

These can be added with minimal configuration:

```bash
# Add to package.json scripts
"scripts": {
  "docs:lint": "markdownlint-cli2 '**/*.md' --fix",
  "docs:links": "remark . --use validate-links",
  "docs:sync-versions": "syncpack fix-mismatches"
}
```

1. **remark-validate-links** - Add to existing build pipeline
2. **markdownlint-cli2** - Configure with `.markdownlint.json`
3. **syncpack** - Perfect for monorepo version management

### Medium-term Additions

Require more setup but provide high value:

4. **typedoc** - Generate API docs from TypeScript source
5. **Custom Vitest solution** - Test code examples using existing test infrastructure
6. **markdown-magic** - Automate version injection in docs

### Long-term Enhancements

Full feature implementations:

7. **react-live** - Interactive component demos
8. **pagefind** or **Algolia DocSearch** - Advanced search capabilities

## Recommended Initial Setup

```bash
# Install high-priority tools
pnpm add -D remark-cli remark-validate-links markdownlint-cli2 syncpack -w

# Add to turbo.json pipeline
{
  "pipeline": {
    "docs:validate": {
      "dependsOn": ["^build"],
      "outputs": []
    }
  }
}
```

## Integration with Existing Tools

The Trailhead monorepo already uses:

- **Vitest** - Can extend for documentation testing
- **TypeScript** - Works perfectly with typedoc
- **Turborepo** - Can add documentation tasks to pipeline
- **pnpm workspaces** - Syncpack designed for this

These recommendations leverage the existing toolchain while adding specialized documentation capabilities.
