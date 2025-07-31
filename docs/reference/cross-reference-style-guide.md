---
type: reference
title: 'Cross-Reference Style Guide'
description: 'Standardized linking patterns and conventions for all Trailhead documentation'
related:
  - /docs/how-to/contributing/maintain-cross-references.md
  - /docs/reference/templates/
---

# Cross-Reference Style Guide

This guide establishes standardized cross-reference patterns for all Trailhead documentation to prevent link rot and ensure consistent navigation.

## Link Format Standards

### 1. Internal Documentation Links

**Use absolute paths from repository root** for all internal documentation links:

```markdown
✅ Good - Absolute from root
[Result Types Pattern](/docs/explanation/result-types-pattern)
[CLI API Reference](/packages/cli/docs/reference/command)
[Data Processing Tutorial](/docs/tutorials/data-pipeline-processing)

❌ Bad - Relative paths
[Result Types Pattern](/docs/explanation/result-types-pattern)
[CLI API Reference](/packages/cli/reference/command)
[Data Processing Tutorial](/docs/tutorials/data-pipeline-processing)
```

**Rationale**: Absolute paths work consistently across all documentation locations and are immune to file reorganization.

### 2. Package Documentation Links

**From package docs to monorepo docs**:

```markdown
✅ Good
[Functional Architecture](/docs/explanation/functional-architecture)
[Contributing Guide](/docs/how-to/contributing)
```

**From monorepo docs to package docs**:

```markdown
✅ Good
[CLI Getting Started](/packages/cli/docs/tutorials/config-getting-started/getting-started)
[Create CLI Templates](/packages/create-cli/docs/reference/templates)
```

### 3. README File Links

**README files may use relative paths** for package-specific navigation:

```markdown
✅ Acceptable for README.md files
[CLI Documentation](/packages/cli)
[API Reference](/packages/cli/reference/command)
```

**But prefer absolute paths for cross-package references**:

```markdown
✅ Preferred
[Monorepo Documentation](/docs/README)
[Other Package](/packages/other/README)
```

### 4. External Links

**Use full URLs with descriptive text**:

```markdown
✅ Good
[Diátaxis Framework](https://diataxis.fr/)
[GitHub Issues](https://github.com/esteban-url/trailhead/issues)

❌ Bad
[Link](https://diataxis.fr/)
[Here](https://github.com/esteban-url/trailhead/issues)
```

## Frontmatter Cross-References

### Standard Related Section

All documentation should include a `related` section in frontmatter using absolute paths:

```yaml
---
type: tutorial
title: 'Build Your First CLI'
description: 'Step-by-step guide to creating a CLI application'
related:
  - /docs/reference/cli-api.md
  - /packages/cli/docs/explanation/functional-architecture/architecture.md
  - /docs/how-to/contributing/handle-errors-in-cli.md
---
```

### Related Link Guidelines

1. **Maximum 5 related links** to avoid overwhelming users
2. **Order by relevance** to the current document
3. **Include different Diátaxis types** when relevant:
   - Link tutorials to relevant how-to guides
   - Link how-to guides to reference documentation
   - Link explanations to tutorials and how-to guides
   - Link reference to explanations

## Link Text Conventions

### Descriptive Link Text

**Use clear, descriptive text that explains the destination**:

```markdown
✅ Good
[CLI Command API Reference](/packages/cli/docs/reference/command)
[How to Handle Errors in CLI Applications](/packages/cli/docs/how-to/contributing/handle-errors-in-cli)
[Understanding Functional Architecture](/docs/explanation/functional-architecture)

❌ Bad
[API Reference](/packages/cli/docs/reference/command)
[Error Handling](/packages/cli/docs/how-to/contributing/handle-errors-in-cli)
[Architecture](/docs/explanation/functional-architecture)
```

### Link Text Patterns by Document Type

**Tutorials**: Use action-oriented text

```markdown
[Build Your First CLI Application](/packages/cli/docs/tutorials/config-getting-started/getting-started)
[Create a Data Processing Pipeline](/docs/tutorials/data-pipeline-processing)
```

**How-to Guides**: Use task-oriented text

```markdown
[How to Add Custom Validators](/docs/how-to/create-custom-validators)
[How to Handle CLI Errors](/packages/cli/docs/how-to/contributing/handle-errors-in-cli)
```

**Reference**: Use specific, technical text

```markdown
[FileSystem API Reference](/packages/fs/docs/reference/api)
[Command Module API](/packages/cli/docs/reference/command)
```

**Explanation**: Use conceptual text

```markdown
[Understanding Result Types Pattern](/docs/explanation/result-types-pattern)
[Package Ecosystem Overview](/docs/explanation/package-ecosystem)
```

## Bidirectional Navigation

### Implementing Bidirectional Links

**Related documents should link to each other**:

```markdown
<!-- In tutorial about CLI building -->

related:

- /packages/cli/docs/reference/command.md # Links TO reference

<!-- In command API reference -->

related:

- /packages/cli/docs/tutorials/config-getting-started/getting-started.md # Links BACK to tutorial
```

### Navigation Hierarchy

**Follow these bidirectional patterns**:

1. **Tutorial ↔ How-to Guide**: Learning connects to problem-solving
2. **How-to Guide ↔ Reference**: Solutions connect to specifications
3. **Reference ↔ Explanation**: Specifications connect to concepts
4. **Explanation ↔ Tutorial**: Concepts connect back to learning

## Link Validation Rules

### Valid Link Targets

**Only link to files that exist**:

- Documentation files (`.md`)
- README files
- Source code files (when relevant for reference)
- Valid external URLs

### Invalid Link Targets

**Never link to**:

- Non-existent files
- Build artifacts
- Temporary files
- node_modules content
- IDE-specific files

### Link Anchor Standards

**Use heading anchors consistently**:

```markdown
✅ Good
[Error Handling Section](/docs/reference/cli-api#error-handling)
[Installation Steps](/packages/cli/README#installation)

❌ Bad (custom anchors may break)
[Error Handling](/docs/reference/cli-api#custom-anchor)
```

## Directory-Specific Guidelines

### Root Documentation (`/docs/`)

**Link patterns for monorepo-level docs**:

- Reference package docs using `/packages/*/docs/` paths
- Cross-reference within `/docs/` using absolute paths
- Link to README files using `/packages/*/README.md` paths

### Package Documentation (`/packages/*/docs/`)

**Link patterns for package-specific docs**:

- Reference monorepo docs using `/docs/` paths
- Cross-reference within package using `/packages/[package]/docs/` paths
- Reference other packages using `/packages/*/docs/` paths

### README Files

**Special linking rules for README files**:

- May use relative paths for immediate children
- Must use absolute paths for cross-package references
- Should link to main documentation hubs

## Common Patterns

### Navigation Blocks

**Use consistent navigation patterns**:

```markdown
## Quick Navigation

**👋 New to [Package]?** → [Getting Started Guide](/packages/[package]/docs/tutorials/config-getting-started/getting-started)  
**🔧 Need to solve a problem?** → [How-to Guides](/packages/[package]/docs/how-to/contributing/)  
**📖 Looking up details?** → [API Reference](/packages/[package]/docs/reference/)  
**🤔 Want to understand?** → [Architecture Overview](/packages/[package]/docs/explanation/functional-architecture/architecture)
```

### Cross-Package References

**When referencing other packages**:

```markdown
## Related Packages

- **[@repo/core](/packages/core/README)** - Result types and utilities
- **[@repo/fs](/packages/fs/README)** - File system operations
- **[@repo/validation](/packages/validation/README)** - Data validation
```

### Documentation Tables

**Use tables for systematic navigation**:

```markdown
| Package             | Tutorial                                                           | How-to Guide                                                       | API Reference                                          |
| ------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **CLI Framework**   | [Getting Started](/packages/cli/docs/tutorials/config-getting-started/getting-started) | [Handle Errors](/packages/cli/docs/how-to/contributing/handle-errors-in-cli) | [Command API](/packages/cli/docs/reference/command) |
| **Data Processing** | [Data Pipeline](/docs/tutorials/data-pipeline-processing)       | [Convert Formats](/docs/how-to/convert-data-formats)            | [Data API](/packages/data/docs/reference/api)       |
```

## Validation and Maintenance

### Automated Validation

Link validation runs automatically:

- **Pre-commit**: Basic link format validation
- **CI Pipeline**: Full link target validation
- **Weekly Cron**: Comprehensive link health check

### Manual Review Process

**Before submitting documentation**:

1. Verify all links use absolute paths (except README relative links)
2. Confirm link text is descriptive and accurate
3. Check bidirectional relationships exist
4. Test links work in GitHub interface
5. Validate frontmatter `related` section follows standards

### Link Maintenance

**When moving or renaming files**:

1. Update all references using search/replace
2. Run link validation to catch missed references
3. Update related sections in affected documents
4. Consider redirect strategies for external links

## Tools and Automation

### Validation Commands

```bash
# Validate all documentation links
pnpm docs:validate-links

# Check specific directory
pnpm docs:validate-links docs/

# Fix common link format issues
pnpm docs:fix-links --dry-run
pnpm docs:fix-links
```

### Editor Integration

**Recommended VS Code extensions**:

- Markdown All in One (link validation)
- Markdown Link Check (automated checking)
- Path Intellisense (autocomplete paths)

## Migration Guide

### Converting Existing Links

**From relative to absolute paths**:

```bash
# Find relative links
grep -r "\]\(\.\." docs/

# Example conversions
[Guide](/docs/how-to/contributing) → [Guide](/docs/how-to/contributing/example)
[API](/packages/cli/reference/command) → [API](/packages/[package]/docs/reference/api)
```

### Updating Frontmatter

**Convert relative to absolute in frontmatter**:

```yaml
# Before
related:
  - ./reference/api.md
  - ../explanation/concepts.md

# After
related:
  - /packages/[package]/docs/reference/api.md
  - /docs/explanation/functional-architecture/concepts.md
```

## Examples

### Well-Structured Document Navigation

```markdown
---
type: tutorial
title: 'Build Your First CLI Application'
description: 'Complete walkthrough of creating a CLI tool with error handling and testing'
prerequisites:
  - Node.js 18+ installed
  - Basic TypeScript knowledge
related:
  - /packages/cli/docs/reference/command.md
  - /packages/cli/docs/how-to/contributing/handle-errors-in-cli.md
  - /docs/explanation/result-types-pattern
  - /packages/cli/docs/tutorials/config-getting-started/build-complete-cli.md
---

# Build Your First CLI Application

This tutorial guides you through creating a complete CLI application using the `@esteban-url/cli` framework.

## Prerequisites

Before starting, ensure you understand [Result Types Pattern](/docs/explanation/result-types-pattern) and have reviewed the [CLI Architecture Overview](/packages/cli/docs/explanation/functional-architecture/architecture).

## Next Steps

After completing this tutorial:

- Learn [How to Handle CLI Errors](/packages/cli/docs/how-to/contributing/handle-errors-in-cli)
- Review the [Command API Reference](/packages/cli/docs/reference/command)
- Build a [Complete CLI Application](/packages/cli/docs/tutorials/config-getting-started/build-complete-cli)
```

## Enforcement

These standards are enforced through:

1. **Automated validation** in pre-commit hooks and CI
2. **Required reviews** for all documentation changes
3. **Link health monitoring** via scheduled checks
4. **Style guide compliance** as part of documentation quality gates

**All documentation changes must pass link validation before merging.**
