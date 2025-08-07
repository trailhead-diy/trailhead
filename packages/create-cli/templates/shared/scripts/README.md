# Smart Git Hooks

This directory contains intelligent git hooks that optimize your development workflow by running tests only when necessary.

## Overview

The smart test runner analyzes your staged files and determines the appropriate level of testing:

- **🔴 High Risk** (Code changes): Runs full test suite
- **🟡 Medium Risk** (Package changes): Runs tests for affected packages only
- **🟢 Low Risk** (Docs/config only): Skips tests entirely

## Features

### ⚡ Performance Optimizations

- **File risk analysis**: Only runs tests when code might be affected
- **Parallel testing**: {{#if IS_MONOREPO}}Enabled for monorepo packages{{else}}Not applicable (single package){{/if}}
- **Git caching**: Avoids repeated git status calls
- **Smart timeouts**: Configurable timeout limits

### 🛡️ Reliability Features

- **Retry logic**: Automatically retries flaky tests (max 2 attempts)
- **Graceful degradation**: Works without jq if needed
- **Error reporting**: Clear error messages with context
- **Progress indicators**: Shows progress for long-running tests

### 🔧 Configuration

- **Customizable patterns**: Define your own high-risk and skip patterns
- **Package mappings**: Configure package name mappings for monorepos
- **Flexible timeouts**: Adjust timeout limits per project needs
- **Environment overrides**: Override behavior with environment variables

## Files

### TypeScript CLI Test Runner

Intelligent test runner with git integration and risk analysis, now implemented as TypeScript CLI commands.

**Usage:**

```bash
pnpm scripts-cli test-runner [options]

Options:
  --dry-run    Show what would be executed without running tests
  --verbose    Show detailed information about file detection
  --force      Force full test suite execution
  --skip       Skip all test execution
  --help       Show help message
```

**Environment Variables:**

```bash
FORCE_TESTS=1    # Force full test suite execution
SKIP_TESTS=1     # Skip all test execution
```

### Configuration (`.smart-test-config.json`)

```json
{
  "highRiskPatterns": [
    "\\.(ts|tsx|js|jsx)$",     // Source code files
    "package\\.json$",          // Dependencies
    "tsconfig",                 // TypeScript config
    "vitest\\.config"           // Test config
  ],
  "skipPatterns": [
    "\\.md$",                   // Documentation
    "README",                   // README files
    "docs/",                    // Documentation directory
    "\\.github/"                // GitHub workflows
  ],
  {{#if IS_MONOREPO}}
  "packageMappings": {
    {{#each PACKAGE_MAPPINGS}}
    "{{@key}}": "{{this}}"{{#unless @last}},{{/unless}}
    {{/each}}
  },
  {{/if}}
  "testCommand": "{{TEST_COMMAND}}",
  "timeout": {{TIMEOUT}},
  "maxRetries": 2,
  "retryFlaky": true,
  "parallelTesting": {{#if IS_MONOREPO}}true{{else}}false{{/if}}
}
```

## Workflow Integration

### Pre-commit Hook (via Lefthook)

The smart test runner is integrated into your git workflow:

1. **Prettier** - Format staged files
2. **Linting** - Check code quality
3. **Type checking** - Verify TypeScript types
4. **Smart tests** - Run appropriate test level

This sequential approach provides fast feedback - if linting fails, you get immediate feedback without waiting for tests.

## Performance Benefits

Based on file analysis, you can expect:

- **60% faster** for documentation-only changes (skips tests entirely)
- **40% faster** for single package changes ({{#if IS_MONOREPO}}runs package-specific tests{{else}}runs targeted tests{{/if}})
- **Progress indicators** for tests taking longer than 30 seconds
- **Parallel execution** {{#if IS_MONOREPO}}for independent packages{{else}}(not applicable for single package){{/if}}

## Risk Detection Examples

### High Risk (Full Test Suite)

```bash
# Source code changes
src/components/Button.tsx
src/utils/helpers.ts

# Configuration changes
package.json
tsconfig.json
vitest.config.ts
```

### Medium Risk ({{#if IS_MONOREPO}}Package-Specific Tests{{else}}Targeted Tests{{/if}})

```bash
{{#if IS_MONOREPO}}
# Package-specific changes
packages/cli/README.md
packages/web-ui/assets/logo.png
{{else}}
# Non-source changes within project
assets/images/logo.png
docs/internal/notes.md
{{/if}}
```

### Low Risk (Skip Tests)

```bash
# Documentation changes
README.md
CHANGELOG.md
docs/getting-started.md

# GitHub workflows
.github/workflows/ci.yml
.github/ISSUE_TEMPLATE.md
```

## Troubleshooting

### Tests Not Running

Check if tests are being skipped:

```bash
pnpm scripts-cli test-runner --verbose --dry-run
```

### jq Not Available

The script gracefully degrades to a fallback JSON parser if `jq` is not installed. For full functionality, install jq:

```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq

# Windows (via chocolatey)
choco install jq
```

### Flaky Tests

Increase retry attempts in `.smart-test-config.json`:

```json
{
  "maxRetries": 3,
  "retryFlaky": true
}
```

### Performance Issues

{{#if IS_MONOREPO}}
Disable parallel testing if you experience issues:

```json
{
  "parallelTesting": false
}
```

{{else}}
Reduce timeout for faster feedback:

```json
{
  "timeout": 60
}
```

{{/if}}

## Advanced Configuration

### Custom Risk Patterns

Add your own patterns to `.smart-test-config.json`:

```json
{
  "highRiskPatterns": ["\\.(ts|tsx|js|jsx)$", "database/migrations/", "config/app\\.php$"]
}
```

### Environment-Specific Behavior

```bash
# Always run full tests in CI
export FORCE_TESTS=1

# Skip tests during quick commits
export SKIP_TESTS=1
```

### Package Manager Integration

{{#if IS_MONOREPO}}
The script automatically detects your package manager and adjusts commands:

- **pnpm**: Uses `--filter` for workspace targeting
- **yarn**: Uses workspace-aware commands
- **npm**: Falls back to directory-based execution
  {{else}}
  The script uses `{{PACKAGE_MANAGER}}` commands based on your project configuration.
  {{/if}}

## Generated by Trailhead CLI

This smart git hooks system was generated by [@esteban-url/trailhead-cli](https://github.com/esteban-url/trailhead) v{{CLI_VERSION}}.

For updates and more information, visit the [Trailhead CLI documentation](https://github.com/esteban-url/trailhead).
