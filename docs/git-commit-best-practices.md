---
type: reference
title: 'Git Commit Best Practices'
description: 'Comprehensive guide to atomic commits, conventional formatting, and modern git workflows for enhanced productivity'
related:
  - /docs/reference/documentation-standards.md
  - /docs/how-to/contributing.md
---

# Git Commit Best Practices (2025)

## Executive Summary

Atomic commits combined with conventional formatting and modern tooling create a development workflow that enhances productivity, simplifies debugging, and improves collaboration. This approach transforms large changesets into logical, independently revertible units that support both human reviewers and AI-assisted development tools.

**Key Benefits:**

- **Enhanced Productivity**: Forces logical problem-solving approach through atomic thinking
- **Better Debugging**: Precise commit isolation for faster bug identification
- **Improved Code Reviews**: Smaller, focused commits enable specific feedback
- **Automation Ready**: Structured commits enable semantic versioning and changelog generation

## Definitions

### Atomic Commits

An atomic commit represents the smallest meaningful change that:

- Does exactly one thing and nothing more
- Leaves the codebase in a working state (builds, passes tests)
- Can be reverted independently without unwanted side effects
- Is described clearly in a single, concise sentence

### Conventional Commits

Structured commit message format: `type(scope): description`

- **Types**: feat, fix, docs, style, refactor, test, chore, perf, ci, build, revert
- **Scope**: Optional noun describing affected codebase section
- **Description**: Imperative mood, lowercase, no period
- **Examples**: `feat(auth): add OAuth2 integration`, `fix(api): resolve null pointer in user service`

### Selective Staging

Precise change control using `git add --patch` principles:

- Stage related changes together into logical commits
- Separate unrelated modifications even within the same file
- Enable file-level and hunk-level granular control

## Current Tooling Excellence

Our modern stack is already optimized for 2025 best practices:

### Lefthook (1.11.16) - Superior Git Hooks

- **Parallel execution**: Multiple hooks run simultaneously vs sequential
- **Performance**: 71-97% faster than Husky in real-world scenarios
- **Cross-platform**: Language-agnostic, works beyond Node.js
- **Configuration**: YAML-based, more intuitive than JSON
- **Current setup**: 10 parallel pre-commit validations with priority ordering

### Oxlint (1.6.0) - High-Performance Linting

- **Speed**: Up to 10,000 files per second processing
- **Efficiency**: 71-97% faster than ESLint (Mercedes-Benz case study)
- **Integration**: Works alongside ESLint when needed
- **Rust-powered**: Memory-safe, concurrent processing

### Turbo (2.5.4) - Intelligent Build System

- **Caching**: Incremental builds with intelligent dependency detection
- **Parallel execution**: Concurrent task running across packages
- **Affected detection**: Build only what changed with `--filter='...[HEAD^1]'`

### Additional Modern Tools

- **PNPM (10.13.1)**: Fastest package manager with workspace support
- **Changesets**: Automated semantic versioning and release management
- **Conventional Commits Validation**: Enforced via Lefthook hooks

## Implementation Strategy

### Smart Atomic Commit Algorithm

```bash
# Enhanced git commit workflow:
1. Safety: Stash uncommitted work with timestamp
2. Pre-validate: Run format, critical lint, type checks
3. Analyze: Parse `git status --porcelain` for change patterns
4. Group by dependency hierarchy:
   a. Deletions (system/feature removals)
   b. Core implementations (grouped by module boundaries)
   c. Dependent updates (imports, types, configurations)
   d. Tests (grouped with related implementation changes)
   e. Documentation and cleanup
5. For each group:
   - Apply selective staging principles
   - Generate appropriate conventional commit message
   - Validate: pnpm types && pnpm lint && pnpm test --passWithNoTests
   - Commit or amend with necessary fixes if broken
6. Final verification: Ensure complete working state
7. Rollback capability if any step fails
```

### File Grouping Logic

**Priority Order (High to Low):**

1. **Deletions**: Entire system/feature removals as standalone commits
2. **Core Changes**: Group by module/directory boundaries
3. **Dependencies**: Import updates, type definitions, configuration changes
4. **Tests**: Group with related implementation, or separately if cross-cutting
5. **Documentation**: Separate unless tightly coupled to implementation
6. **Formatting**: Final cleanup commit for linting/style fixes

**Revertability Validation:**

- Each commit must pass: TypeScript compilation, linting, critical tests
- Use Turbo's affected detection for efficient validation
- Automatically include fixes in same commit if validation fails
- Abort process if unable to create working commit

## Practical Examples

### Example: Breaking Down a Large Commit

**Scenario**: Recent 63-file commit removing installation system

**Atomic Breakdown:**

```bash
# Commit 1: System removal
git add packages/web-ui/src/cli/core/installation/
git add packages/web-ui/src/cli/commands/install.ts
git commit -m "refactor: remove installation system core files"

# Commit 2: Import updates
git add packages/web-ui/src/cli/commands/transforms.ts
git add packages/web-ui/src/cli/commands/dev-refresh.ts
git add packages/web-ui/src/cli/core/filesystem/paths.ts
git commit -m "fix: update imports after installation system removal"

# Commit 3: Implementation replacement
git add packages/web-ui/src/cli/commands/transforms.ts
git add packages/web-ui/src/cli/commands/dev-refresh.ts
git commit -m "refactor: replace installation functions with transform pipeline"

# Commit 4: Test updates
git add tests/scripts/install/
git add packages/web-ui/src/cli/core/config/__tests__/
git commit -m "test: update tests for removed installation system"

# Commit 5: Final cleanup
git add . # remaining linting/formatting fixes
git commit -m "style: fix linting and formatting issues"
```

### Conventional Message Patterns

**By Change Type:**

- **Deletions**: `refactor: remove [system/feature] implementation`
- **New features**: `feat(scope): add [functionality]`
- **Bug fixes**: `fix(scope): resolve [issue]`
- **Dependencies**: `fix: update imports after [change]`
- **Tests**: `test: update tests for [feature]`
- **Types/Configs**: `refactor: update types after [change]`
- **Documentation**: `docs: update [section] documentation`
- **Formatting**: `style: fix linting and formatting issues`

## Automation and Tooling

### Current Lefthook Integration

Our pre-commit hooks already enforce quality:

```yaml
pre-commit:
  parallel: true
  commands:
    prettier: # Format code (auto-fix)
    oxlint: # Fast linting (auto-fix)
    typecheck: # Type validation
    smart-tests: # Intelligent test execution
    build-affected: # Validate builds
```

### Modern Alternatives and Additions

**Turbogit**: Opinionated CLI enforcing conventional commits and clean workflows
**Cocogitto**: Conventional commits toolbox with semver automation  
**AI-Powered Tools**: Commit message generation using GPT models
**Semantic Release**: Automated version bumping and changelog generation

### Integration with CI/CD

```bash
# Automated release workflow
pnpm changeset        # Generate changesets from conventional commits
pnpm version-packages # Bump versions based on commit types
pnpm release         # Automated publishing with generated changelogs
```

## Safety Mechanisms

### Pre-commit Validation

- Working directory must be clean before starting
- Create timestamped safety stash: `git stash push -m "safety-$(date)"`
- Validate each atomic commit independently

### Build Validation

- Each commit must pass: TypeScript, linting, critical tests
- Use Turbo's parallel execution for speed
- Automatic rollback if any commit breaks build

### Rollback Options

- Automatic stash restoration if process fails
- Interactive mode for complex scenarios
- Dry-run preview of planned commits
- Abort option at any stage

## Benefits for 2025 Development

### AI-Enhanced Workflows

- Clean commit history enables better AI code analysis
- Structured messages improve AI-generated summaries
- Atomic changes facilitate AI-powered debugging assistance

### Modern Development Practices

- Supports microservice and monorepo architectures
- Enables advanced CI/CD automation
- Facilitates collaborative development at scale
- Improves code review efficiency and quality

### Performance Optimizations

- Leverages modern tooling (Lefthook, Oxlint, Turbo) for speed
- Parallel validation reduces commit overhead
- Intelligent caching minimizes redundant operations

## Best Practices Summary

1. **Think Atomically**: Each commit should represent one logical change
2. **Use Conventional Format**: Enable automation and improve readability
3. **Validate Early**: Leverage pre-commit hooks for quality assurance
4. **Group Intelligently**: Related changes stay together, unrelated changes separate
5. **Maintain Working State**: Every commit should build and pass critical tests
6. **Write Clear Messages**: Focus on "why" rather than "what"
7. **Leverage Modern Tools**: Use performance-optimized tooling stack
8. **Plan for Automation**: Structure commits to enable release automation

## References

### Authoritative Sources

- [Conventional Commits Specification](https://www.conventionalcommits.org/)
- [Advanced Git Guide: Atomic Commits](https://medium.com/@krystalcampioni/advanced-git-guide-part-1-mastering-atomic-commits-and-enforcing-conventional-commits-1be401467a92)
- [Atomic Git Commits Guide](https://www.aleksandrhovhannisyan.com/blog/atomic-git-commits/)

### Modern Tooling

- [Lefthook Documentation](https://github.com/evilmartians/lefthook)
- [Oxlint Performance Benchmarks](https://oxc.rs/blog/2025-06-10-oxlint-stable.html)
- [Turbogit Workflow](https://b4nst.github.io/turbogit/)
- [Cocogitto Conventional Commits](https://github.com/cocogitto/cocogitto)

### Performance Studies

- [Mercedes-Benz Oxlint Case Study](https://dev.to/bernardkibathi/revolutionize-your-code-oxlint-launches-as-a-blazing-fast-rust-powered-alternative-to-eslint-403n)
- [Lefthook vs Husky Comparison](https://dev.to/quave/lefthook-benefits-vs-husky-and-how-to-use-30je)
- [Git Automation Workflows](https://medium.com/@ak.akki907/streamline-your-git-workflow-with-automation-scripts-f2191f12c53b)
