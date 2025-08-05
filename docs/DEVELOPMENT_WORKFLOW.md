---
title: Development Workflow
description: How to set up and use pre-commit hooks and development tools
type: how-to
---

# Development Workflow

This guide explains how to set up and use the development workflow tools in the Trailhead monorepo.

## Pre-commit Hooks

The project uses **Lefthook** for Git hooks management, providing 2-3x better performance than traditional tools through parallel execution and Go-based implementation.

### Initial Setup

```bash
# Install dependencies (hooks are installed automatically)
pnpm install

# Manually reinstall hooks if needed
pnpm lefthook:install

# Test hooks are working
lefthook run pre-commit
```

### What Runs on Pre-commit

1. **Code Formatting** (Prettier) - Formats all staged files
2. **Documentation Validation** - Validates Diátaxis compliance for docs
3. **Linting** (Oxlint) - Ultra-fast linting (50-100x faster than ESLint)
4. **Type Checking** - Validates TypeScript types
5. **Secret Detection** - Warns about potential secrets
6. **File Size Check** - Warns about files >1MB

### Performance Optimizations

Performance optimizations:

- Prettier cache: `.turbo/.prettiercache`
- Oxlint: No caching needed due to Rust performance
- Parallel execution of all tasks

### Skipping Hooks

Sometimes you need to skip hooks (e.g., emergency fixes):

```bash
# Skip all hooks
SKIP_HOOKS=1 git commit -m "Emergency fix"
# or
LEFTHOOK=0 git commit -m "Emergency fix"
# or
git commit -m "Emergency fix" --no-verify

# Skip specific hooks with .lefthook-local.yml
cp .lefthook-local.yml.example .lefthook-local.yml
# Edit the file to customize behavior
```

### Commit Message Format

Commits must follow conventional commit format:

```
type(scope?): description

Types: feat, fix, docs, style, refactor, test, chore, perf, ci, build, revert

Examples:
- feat(web-ui): add dark mode support
- fix(cli): resolve path resolution issue
- docs: update installation guide
```

### Troubleshooting

**Hooks not running?**

```bash
# Reinstall hooks
pnpm lefthook:install
# or
pnpm prepare
```

**Hooks too slow?**

1. Check if Prettier cache is working: Look for `.turbo/.prettiercache`
2. Skip type checking locally: Create `.lefthook-local.yml`
3. Use `--quiet` flag for oxlint to reduce output

**False positive in secret detection?**
The basic secret detection may flag example code. If it's safe, use:

```bash
git commit --no-verify -m "docs: add API example"
```

**Large file warning?**
Consider:

1. Compressing images
2. Moving binaries to Git LFS
3. Using CDN for assets

### Development Tips

1. **Faster commits**: Use `.lefthook-local.yml` to skip non-critical checks
2. **Auto-format on save**: Configure your editor to run Prettier
3. **Run checks manually**: `pnpm lint`, `pnpm format`, `pnpm types`
4. **Check what would run**: `lefthook run pre-commit --dry-run`

### Related Documentation

- [Testing Guidelines](./testing-guide.md)- Writing high-ROI tests
- [Documentation Standards](./reference/documentation-standards.md)- Writing docs
