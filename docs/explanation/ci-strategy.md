---
type: explanation
title: CI Strategy
description: Cost-optimized continuous integration using Turborepo and minimal GitHub Actions
---

# CI Strategy: Local-First with Minimal Cloud

## Overview

Trailhead uses a local-first CI strategy that reduces GitHub Actions costs by 90% while maintaining code quality. The approach leverages Turborepo's caching and parallelization capabilities to run most validation locally, using GitHub Actions only for platform-specific tasks.

## Architecture

### Local CI (95% of validation)

Run with `pnpm ci:run`:

- ✅ Format checking (Prettier)
- ✅ Lint (oxlint)
- ✅ Type checking (TypeScript)
- ✅ Unit tests (Vitest)
- ✅ Integration tests
- ✅ Build validation
- ✅ Documentation validation (Diátaxis)
- ✅ Bundle size checks
- ✅ Security audit (advisory only)

### GitHub Actions (5% of validation)

Only runs what CANNOT execute locally:

- ✅ Cross-platform testing (Windows/macOS)
- ✅ Package publishing with credentials
- ✅ CodeQL security analysis
- ✅ Snyk security scanning

## Cost Analysis

**Before**: $20/month (2,500 GitHub Actions minutes)  
**After**: $2/month (250 GitHub Actions minutes)  
**Savings**: $18/month (90% reduction)

## Implementation

### Git Hooks Integration

Lefthook automatically runs CI on:

- **Pre-commit**: Light checks (format, lint, types)
- **Pre-push**: Full CI on affected packages

### Developer Workflow

```bash
# Daily development
pnpm ci:quick     # ~30s - During development
pnpm ci:affected  # ~1-2m - Before pushing
pnpm ci:run       # ~2-3m - Full validation

# Automatic via git
git commit  # Runs pre-commit hooks
git push    # Runs pre-push validation
```

### Performance

- Local CI: 2-3 minutes (was 10 min on GitHub)
- Full Turbo cache: &lt;200ms
- Pre-push (affected only): 1-2 minutes

## Trade-offs

### What We Don't Have Locally

1. **Exact GitHub Environment** - Acceptable as 99% of issues are code, not environment
2. **Multi-OS Testing** - Covered by main branch smoke tests
3. **GitHub Actions Testing** - Keep workflows simple, test in draft PR if needed

### Why This Works

1. **Turborepo caching** makes local runs fast
2. **Affected detection** reduces scope
3. **Parallel execution** maximizes CPU usage
4. **Git hooks** ensure quality before push

## Comparison: Local vs GitHub

| Feature    | Local CI   | GitHub PR   | GitHub Main |
| ---------- | ---------- | ----------- | ----------- |
| Lint       | ✅ All     | ❌          | ❌          |
| Types      | ✅ All     | ❌          | ❌          |
| Tests      | ✅ All     | ✅ Smoke    | ✅ Smoke    |
| Docs       | ✅ All     | ❌          | ❌          |
| Build      | ✅ All     | ✅ Packages | ✅ Packages |
| Security   | ✅ pnpm    | ✅ CodeQL   | ✅ Snyk     |
| Platforms  | ✅ Current | ✅ Linux    | ✅ All      |
| Publishing | ❌         | ❌          | ✅          |

## Migration Path

1. **Week 1**: Run both systems in parallel
2. **Week 2**: Switch to minimal GitHub workflows
3. **Week 3**: Remove old workflows, optimize caching

## Monitoring

Track success through:

- GitHub Actions usage (target: &lt;250 min/month)
- Developer feedback on CI speed
- Build failure rates
- Time to feedback metrics
