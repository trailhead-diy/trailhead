# @esteban-url/dependency-analysis

Intelligent dependency analysis for creating atomic commits based on code relationships. This package analyzes file changes, builds dependency graphs, and automatically groups related changes into logical, atomic commits following conventional commit format.

## Features

- 🎯 **Dual-mode analysis**: Automatic detection of simple vs complex changes
- 🔍 **Dependency graph generation**: Uses dependency-cruiser for accurate dependency analysis
- 🌳 **AST-based analysis**: Tree-sitter integration for import/export analysis
- 🎨 **Intelligent grouping**: Groups files by risk level, dependencies, and module boundaries
- 🔄 **Git integration**: Works with @esteban-url/git for atomic commit creation
- 🛡️ **Safety mechanisms**: Stash/rollback support with validation
- ⚡ **Performance optimized**: Fast path for simple changes, <5 minute target for complex refactors

## Installation

```bash
pnpm add @esteban-url/dependency-analysis
```

## Usage

### Basic Example

```typescript
import {
  createDependencyAnalysisEngine,
  analyzeGitChanges,
  createAtomicCommits,
  type GitContext,
} from '@esteban-url/dependency-analysis'
import {
  createGitOperations,
  createGitStatusOperations,
  // ... other git operations
} from '@esteban-url/git'

// 1. Set up git context
const gitOps = createGitOperations()
const repoResult = await gitOps.open('.')
const repository = repoResult.value

const gitContext: GitContext = {
  repository,
  status: createGitStatusOperations(),
  commands: createGitCommandOperations(),
  log: createGitLogOperations(),
  stash: createGitStashOperations(),
  staging: createGitStagingOperations(),
}

// 2. Analyze current changes
const changes = await analyzeGitChanges(gitContext)

// 3. Create analysis engine and analyze dependencies
const engine = createDependencyAnalysisEngine()
const analysis = await engine.analyzeChanges(changes.value, {
  mode: 'auto', // or "simple" | "complex"
  excludeFiles: ['package-lock.json'],
})

// 4. Create atomic commits
const commits = await createAtomicCommits(gitContext, analysis.value.groups, { dryRun: true })
```

### Analysis Modes

The package supports two analysis modes:

#### Simple Mode (Automatic for <10 files)

- Fast grouping based on file types
- No dependency graph generation
- Groups: test files, core implementation, infrastructure

#### Complex Mode (Automatic for complex changes)

- Full dependency graph analysis
- API change detection
- Risk-based grouping with topological sorting
- Groups: deletions → core API → dependents → integration

### Commit Grouping Strategy

The intelligent grouping algorithm follows this priority:

1. **Deletions First**: Prevents import errors
2. **Core API Changes**: Grouped by dependency depth
3. **Dependent Files**: Grouped with their dependencies
4. **Tests**: Grouped with implementation or separately
5. **Configuration/Docs**: Final cleanup commits

### Options

```typescript
interface AnalysisOptions {
  mode?: 'auto' | 'simple' | 'complex'
  excludeFiles?: string[]
  complexityThreshold?: number
  preferSimpleGrouping?: boolean
  validationCommands?: string[]
  dryRun?: boolean
}

interface CommitCreationOptions {
  dryRun?: boolean
  stashChanges?: boolean
  validateEachCommit?: boolean
  conventionalCommitFormat?: boolean
}
```

## Example Output

```
📊 Analysis Results:
- Mode: complex
- Total files: 63
- Groups created: 4
- Estimated time: 2.3s

🎯 Proposed Atomic Commits:

1. refactor: remove installation system infrastructure
   Risk: low
   Files (25):
     - packages/web-ui/src/cli/commands/install/*
     - packages/web-ui/src/cli/installation/*

2. refactor: update core modules at depth 2
   Risk: high
   Files (8):
     - packages/web-ui/src/cli/validation/base.ts
     - packages/web-ui/src/cli/validation/errors.ts

3. fix: update cli module dependencies
   Risk: medium
   Files (15):
     - packages/web-ui/src/cli/commands/dev-refresh.ts
     - packages/web-ui/src/cli/commands/transforms.ts

4. chore: final integration fixes
   Risk: low
   Files (12):
     - packages/web-ui/src/cli/transforms/*
```

## Performance Targets

- Simple changes (<10 files): <1 second total
- Complex changes (100+ files): <10 seconds analysis
- Validation per commit: 30-45 seconds
- Total time for complex refactor: <5 minutes

## Debugging and Performance

### Debug Logging

Enable debug logging to troubleshoot issues:

```bash
# Enable all debug logging
export DEPENDENCY_ANALYSIS_DEBUG=true

# Set minimum log level (debug, info, warn, error)
export DEPENDENCY_ANALYSIS_LOG_LEVEL=debug

# Run with debugging enabled
DEPENDENCY_ANALYSIS_DEBUG=true tsx your-script.ts
```

### Performance Profiling

The package includes built-in performance profiling:

```typescript
import { globalProfiler } from '@esteban-url/dependency-analysis/core'

// Your analysis code here...

// Display performance summary
console.log(globalProfiler.summary())
```

Example output:

```
Performance Summary (12 operations, 2341.23ms total)
────────────────────────────────────────────────────────────────
dependency-cruiser:analyze        1 calls    1523.45ms avg    1523.45ms total (65.1%)
simple-grouping:detect           3 calls      12.34ms avg       37.02ms total (1.6%)
git:create-atomic-commits        1 calls     780.76ms avg      780.76ms total (33.3%)
```

### Validation Command Execution

The package now supports actual validation command execution during commit creation:

```typescript
const commits = await createAtomicCommits(gitContext, groups, {
  validateEachCommit: true, // Run validation commands after each commit
  dryRun: false,
})
```

## Dependencies

- **dependency-cruiser**: Dependency graph generation
- **tree-sitter**: AST parsing for TypeScript/JavaScript
- **@esteban-url/core**: Result types and error handling
- **@esteban-url/git**: Git operations
- **@esteban-url/fs**: File system operations

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Run tests
pnpm test

# Run example
tsx examples/gcwm-auto-demo.ts
```

## License

MIT
