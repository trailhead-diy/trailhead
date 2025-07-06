# Two-Tier CI Strategy

## Overview

This repository implements a **two-tier CI strategy** to optimize testing efficiency and developer experience by running different test suites based on context and criticality.

## Strategy Components

### Tier 1: Fast Essential CI (< 2 minutes)

**Philosophy**: Simple is better - proven performance over complex abstractions

**Target**: Ubuntu-only, essential validation with battle-tested simplicity
**Triggers**:

- Pull requests to main (`ci-fast-pr.yml`)
- Main branch pushes (non-CLI) (`ci-main.yml`)

**What it runs**:

- ✅ Quality checks (lint, format, types) - parallelized matrix
- ✅ Unit tests with coverage
- ✅ Generator integration tests
- ✅ Quick security audit
- ✅ Build validation

**Optimizations**:

- **Proven architecture**: Uses battle-tested legacy CI structure
- **Direct execution**: No reusable workflow overhead
- **Parallel jobs**: Matrix strategy for maximum speed
- **Simple caching**: Efficient without over-engineering
- **No artifacts**: Eliminates upload/download overhead

**Performance**: Consistently 1-1.5 minutes (proven in production)

### Tier 2: Comprehensive Pre-Release CI (15-20 minutes)

**Target**: Cross-platform, thorough validation
**Triggers**:

- Git tags (`v*`)
- GitHub releases
- CLI package changes (`packages/cli/**`)
- Weekly regression testing (Mondays 8am UTC)
- Manual workflow dispatch

**What it runs**:

- 🔄 **CLI Cross-Platform Matrix**: Windows/macOS/Ubuntu × Node 18/20/22
- 🔄 **Security Deep Scan**: Dependency audit, license compliance, secret detection
- 🔄 **Performance Testing**: Startup time, generation speed, build performance
- 🔄 **Comprehensive E2E**: All templates × multiple package managers
- 🔄 **Integration Testing**: Cross-package validation

## Caching Strategy

We use **GitHub Actions built-in caching** instead of remote TurboRepo caching:

### Cache Layers

1. **pnpm store cache**: Package downloads
2. **node_modules cache**: Installed dependencies
3. **TurboRepo cache**: Build outputs and task results
4. **Tool-specific caches**: TypeScript, Vitest, etc.

### Cache Keys

- **Primary**: Hash of lockfiles + config files + source files
- **Fallback**: Hash of lockfiles + config files
- **Final**: OS-specific base cache

### Benefits

- ✅ No external dependencies (Vercel account not needed)
- ✅ Faster cache restoration
- ✅ Better cache hit rates with granular keys
- ✅ Automatic cleanup and rotation

## Decision Tree

```
PR → Tier 1 Fast (Proven)
     └── Quality + Tests + Build (1-1.5min)

Main Push (non-CLI) → Tier 1 Main
                      └── Smart detection + Fast validation

CLI Changes → Tier 2 (Comprehensive)
              └── Cross-platform + Security + Performance + E2E

Tag/Release → Tier 2 (Comprehensive)
              └── Full validation matrix

Weekly → Tier 2 (Regression)
         └── Complete cross-platform testing
```

## Pragmatic Philosophy

### Why Simple Beats Complex

Our Tier 1 strategy prioritizes **proven performance** over theoretical optimizations:

- **Legacy CI architecture**: Battle-tested, consistently fast (1-1.5min)
- **No premature optimization**: Avoided over-engineering for marginal gains
- **YAGNI compliance**: Built what's needed, not what might be needed
- **Developer experience**: Fast feedback loops are more valuable than perfect abstractions

### Lessons Learned

1. **Performance trumps patterns**: 1.5min simple CI beats 5min "optimized" CI
2. **Simplicity scales**: Easier to debug, maintain, and understand
3. **Proven > Theoretical**: Real performance data beats architectural ideals
4. **KISS principle**: Keep It Simple, Stupid - especially for critical path operations

## Performance Targets

### Tier 1 Targets

- **Total time**: < 5 minutes
- **Quality checks**: < 2 minutes (parallel)
- **Tests**: < 3 minutes
- **Build**: < 2 minutes

### Tier 2 Targets

- **Total time**: < 20 minutes
- **CLI cross-platform**: < 15 minutes
- **Security scan**: < 5 minutes
- **Performance tests**: < 10 minutes
- **E2E tests**: < 15 minutes (parallel)

## Monitoring

### Success Criteria

- **Tier 1**: All jobs must pass for PR merge
- **Tier 2**: Critical jobs (CLI, Security, Integration) must pass for release

### Failure Handling

- **Tier 1 failure**: Blocks PR merge
- **Tier 2 critical failure**: Blocks release
- **Tier 2 optional failure**: Warning, review recommended

## Usage Examples

### Triggering Tier 2 Manually

```bash
# Via GitHub CLI
gh workflow run "Tier 2 - Pre-Release Comprehensive Validation" \
  --field install_dependencies=true \
  --field run_performance_tests=true

# Via GitHub UI
Actions → Tier 2 - Pre-Release → Run workflow
```

### CLI-Specific Changes

When you modify `packages/cli/**` or `packages/create-trailhead-cli/**`, Tier 2 will automatically run to ensure cross-platform compatibility.

### Release Process

1. Create tag: `git tag v1.0.0 && git push origin v1.0.0`
2. Tier 2 automatically runs comprehensive validation
3. If all critical tests pass → Ready for release
4. If any critical tests fail → Fix issues before release

## Troubleshooting

### Cache Issues

```bash
# Clear GitHub Actions cache (if needed)
gh api repos/:owner/:repo/actions/caches --method DELETE
```

### Slow Builds

- Check cache hit rates in workflow logs
- Verify TurboRepo task configuration
- Look for missing cache keys

### Test Failures

- **Tier 1**: Focus on unit tests and basic functionality
- **Tier 2**: Check cross-platform compatibility and security issues

## Migration Notes

### From Previous CI

- Removed Vercel remote caching dependency
- Enhanced change detection with package-level granularity
- Added comprehensive security scanning
- Implemented performance benchmarking
- Optimized cache strategies for 2025 best practices

### Benefits Achieved

- **56% faster** regular CI (< 5min vs 12min)
- **Enhanced security** with deep scanning
- **Better coverage** with cross-platform testing
- **Cost optimization** with smart triggering
- **Improved DX** with faster feedback loops
