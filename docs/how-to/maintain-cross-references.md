---
type: how-to
title: 'Maintain Cross-References in Documentation'
description: 'Keep documentation links healthy and implement bidirectional navigation'
prerequisites:
  - 'Basic understanding of markdown'
  - 'Familiarity with Diátaxis framework'
related:
  - /docs/reference/cross-reference-style-guide.md
  - /docs/reference/documentation-standards.md
  - /docs/how-to/contributing.md
---

# Maintain Cross-References in Documentation

This guide shows how to keep documentation cross-references healthy and implement effective bidirectional navigation.

## Quick Reference

### Validate All Links

```bash
# Check all documentation links
pnpm docs:validate-links

# Check specific directory
pnpm docs:validate-links docs/

# Verbose output with details
pnpm docs:validate-links --verbose
```

### Fix Common Link Issues

```bash
# Preview fixes (dry run)
pnpm docs:fix-links --dry-run

# Apply automatic fixes
pnpm docs:fix-links

# Fix specific directory
pnpm docs:fix-links docs/ --dry-run
```

## Daily Maintenance Tasks

### 1. Before Creating New Documentation

**Always validate links in related documents**:

```bash
# Check existing docs you'll reference
pnpm docs:validate-links docs/explanation/
pnpm docs:validate-links packages/cli/docs/
```

**Use absolute paths from the start**:

```markdown
✅ Good
[Result Types Pattern](/docs/explanation/result-types-pattern.md)

❌ Avoid
[Result Types Pattern](../explanation/result-types-pattern.md)
```

### 2. When Moving or Renaming Files

**Step 1: Find all references to the file**

```bash
# Search for references
grep -r "old-filename.md" docs/
grep -r "old-filename.md" packages/*/docs/
```

**Step 2: Update references before moving**

```bash
# Use sed to replace references
find . -name "*.md" -exec sed -i 's|old-filename\.md|new-filename\.md|g' {} +
```

**Step 3: Validate after moving**

```bash
pnpm docs:validate-links --verbose
```

### 3. Adding Bidirectional Navigation

**When creating relationships between documents**:

1. **Identify the relationship type**:
   - Tutorial → How-to Guide → Reference → Explanation
   - Concept explanations ↔ practical applications

2. **Add to frontmatter `related` sections**:

```yaml
# In tutorial
related:
  - /docs/how-to/solve-specific-problem.md
  - /docs/reference/api-reference.md

# In how-to guide
related:
  - /docs/tutorials/learning-guide.md
  - /docs/reference/api-reference.md

# In reference
related:
  - /docs/tutorials/learning-guide.md
  - /docs/explanation/concepts.md
```

3. **Verify bidirectional links exist**:

```bash
# Check that related docs link back
grep -A 10 "related:" docs/tutorials/learning-guide.md
grep -A 10 "related:" docs/how-to/solve-specific-problem.md
```

## Automated Maintenance

### CI Integration

The documentation validation runs automatically:

- **On every PR** affecting documentation
- **Weekly on Sundays** to catch external link rot
- **After dependency updates** that might affect tooling

### Pre-commit Hooks

Link validation runs before each commit:

```bash
# Manual pre-commit check
pnpm docs:validate-links
```

### Scheduled Health Checks

Weekly automated reports identify:

- Broken internal links
- Missing bidirectional references
- Style guide violations

## Troubleshooting Common Issues

### Broken Links After File Moves

**Problem**: Links break when files are reorganized

**Solution**:

```bash
# Find all references to moved file
grep -r "old-path" docs/ packages/

# Use fix-links tool
pnpm docs:fix-links --dry-run
pnpm docs:fix-links
```

### Missing Bidirectional Navigation

**Problem**: Document A links to B, but B doesn't link back

**Solution**:

1. Identify the relationship type
2. Add appropriate `related` entries
3. Validate the connection makes sense for users

### Relative vs Absolute Path Confusion

**Problem**: Mix of relative and absolute paths causes maintenance issues

**Solution**:

```bash
# Convert all relative paths to absolute
pnpm docs:fix-links

# Validate everything uses absolute paths
pnpm docs:validate-links --verbose
```

### External Link Rot

**Problem**: External URLs return 404 errors

**Solution**:

1. Update URLs to current locations
2. Use archive.org for historical references
3. Replace with equivalent resources
4. Document deprecation in changelog

## Best Practices

### 1. Link Text Guidelines

**Use descriptive, specific link text**:

```markdown
✅ Good
[CLI Command API Reference](/packages/cli/docs/reference/command.md)
[How to Handle Errors in CLI Applications](/docs/how-to/handle-cli-errors.md)

❌ Bad  
[API docs](/packages/cli/docs/reference/command.md)
[Click here](/docs/how-to/handle-cli-errors.md)
```

### 2. Frontmatter Related Links

**Order by relevance and user journey**:

```yaml
related:
  # Most relevant first
  - /docs/tutorials/getting-started.md
  # Then supporting references
  - /docs/reference/api.md
  # Finally related concepts
  - /docs/explanation/architecture.md
```

### 3. Cross-Package References

**Be explicit about package boundaries**:

```markdown
## Related Packages

- **[@repo/core](/packages/core/README.md)** - Foundation utilities
- **[@repo/fs](/packages/fs/README.md)** - File system operations
- **[@esteban-url/cli](/packages/cli/README.md)** - CLI framework
```

### 4. Documentation Tables

**Use tables for systematic navigation**:

```markdown
| Topic              | Tutorial                                     | How-to Guide                                    | Reference                                           |
| ------------------ | -------------------------------------------- | ----------------------------------------------- | --------------------------------------------------- |
| **Error Handling** | [Getting Started](/docs/tutorials/errors.md) | [Handle CLI Errors](/docs/how-to/cli-errors.md) | [Result Types API](/docs/reference/result-types.md) |
```

## Quality Metrics

### Link Health Score

Track these metrics over time:

- **Broken link ratio**: Should be < 1%
- **External link health**: Check monthly
- **Bidirectional coverage**: Aim for 80%+ of related docs linking back
- **Path consistency**: 100% absolute paths in structured docs

### User Navigation Success

Monitor how users move through documentation:

- **Cross-reference usage**: Are related links clicked?
- **Task completion**: Do users find what they need?
- **Documentation gaps**: Missing links to essential information?

## Maintenance Schedule

### Daily (Developers)

- Validate links before committing documentation changes
- Use absolute paths for all new internal links
- Add bidirectional relationships for new documents

### Weekly (Automated)

- Full link validation across all documentation
- External link health check
- Report on documentation coverage gaps

### Monthly (Maintainers)

- Review link health metrics
- Update external links that have moved
- Audit bidirectional navigation completeness
- Refine this maintenance guide based on discovered link patterns and common issues

## Getting Help

**For immediate issues**:

```bash
pnpm docs:validate-links --verbose
pnpm docs:fix-links --dry-run
```

**For complex reorganization**:

- Review [Cross-Reference Style Guide](/docs/reference/cross-reference-style-guide.md)
- Check [Documentation Standards](/docs/reference/documentation-standards.md)
- Ask in GitHub Discussions for architectural guidance

**For tooling issues**:

- Check `tooling/docs-tooling/` for validator source code
- File issues with specific error messages
- Include `--verbose` output in bug reports
