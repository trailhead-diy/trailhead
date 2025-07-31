# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in the Trailhead monorepo.

## General Project Guidelines

### Communication Style

- Skip pleasantries and affirmations ("Great question!", "You're right!", etc.)
- No apologizing unless actually wrong about something technical
- Get straight to the answer
- Skip transitional phrases ("Let me...", "I'll help you...")
- Be direct like a CLI response

### Core Principles

1. **Functional programming** - Pure functions, immutable data, composition over inheritance
2. **High-ROI testing** - Test user interactions, business logic, integration; avoid low-ROI rendering tests
3. **YAGNI + DRY + KISS** - Avoid over-engineering, eliminate duplication, keep it simple
4. **One responsibility** - Every feature, function, and file does one thing well
5. **Prefer libraries** - Use established solutions over custom implementations

### Development Discipline - MANDATORY WORKFLOW

**CRITICAL**: All development work MUST follow this issue-driven workflow:

#### 1. GitHub Issue First (NO EXCEPTIONS)

- **Every feature** requires a GitHub issue describing specific user problem
- **No work begins** without documented issue outlining problem and success criteria
- **Single responsibility**: Each issue must address ONE clearly scoped problem
- **User-focused**: Issues must describe user problems, not technical solutions

#### 2. Branch Discipline (STRICT ENFORCEMENT)

- **Never work on main branch** - all work happens on feature branches
- **Feature branches from main only** - never create branches from other branches
- **Branch-on-branch is a RED FLAG** - indicates scope creep and over-engineering
- **Immediate cleanup** - delete feature branches after merge

#### 3. Mandatory Workflow Steps

```bash
# 1. Create GitHub issue first (manual)
# 2. Create feature branch from main
git checkout main && git pull origin main
git checkout -b feature/issue-123-specific-problem

# 3. Work only on that single issue scope
# 4. PR back to main when complete
# 5. Delete feature branch immediately after merge
```

#### 4. Over-Engineering Prevention - REALITY CHECK FRAMEWORK

**STOP AND ASK** before adding any feature, system, or abstraction:

1. **Who requested this specifically?** If answer is "no one", don't build it
2. **What user problem does this solve today?** If answer is vague, don't build it
3. **Can this be solved with existing tools/libraries?** If yes, use those instead
4. **Will this be used by >80% of users?** If no, don't include it
5. **Can users add this themselves later?** If yes, leave it out

**ANTI-PATTERNS TO AVOID**:

- Future-proofing without specific requirements
- Enterprise features for individual developers
- Over-abstraction and unnecessary complexity
- Branch-on-branch (scope creep indicator)

### Testing Philosophy - High-ROI Tests

Focus on high-ROI (Return on Investment) tests:

**High-ROI Tests (Keep These):**

- **User Interaction Tests**: Click handlers, form submissions, keyboard navigation
- **Business Logic Tests**: Theme transformations, data conversions, calculations
- **Integration Tests**: Components working together, end-to-end workflows
- **Accessibility Tests**: Screen reader compatibility, keyboard navigation, ARIA
- **Error Handling**: Edge cases that affect users, error boundaries
- **Critical Path Tests**: Authentication, payment flows, data persistence

**Low-ROI Tests (Remove These):**

- **Basic Rendering Tests**: "renders without crashing", "should render"
- **Props Forwarding Tests**: "passes className", "spreads props", "accepts ref"
- **Framework Behavior Tests**: Testing React/library internals
- **Implementation Details**: data-testid checks, internal state structure
- **Type Checking at Runtime**: Testing TypeScript types
- **Snapshot Tests**: Brittle tests that break with any UI changes
- **Style/CSS Tests**: Testing exact class names or inline styles

### Working with Claude Code

- Ask Claude to create a todo list when working on complex tasks to track progress
- Use the TodoWrite tool for task management across the monorepo
- Consider impact across packages when making changes
- Test related packages when making cross-cutting changes

### Dependencies & Documentation

**Dependencies**: Automated updates via Renovate. Keep `pnpm-lock.yaml` synced with `package.json`.

**Documentation**: Follow [Diátaxis framework](docs/README.md). See [documentation standards](docs/reference/documentation-standards.md) for complete guidelines.

## Monorepo Overview

Trailhead is a modern Turborepo monorepo containing UI libraries, CLI frameworks, and development tooling. The repository follows best practices for scalable monorepo architecture with shared configurations and optimized build caching.

### Project Structure

```
trailhead/                            # Root monorepo
├── packages/                         # Public packages
│   ├── cli/                         # @esteban-url/cli - CLI framework
│   └── create-cli/                  # @esteban-url/create-cli - CLI generator
├── apps/                            # Applications
│   └── demos/                       # Demo applications
│       ├── next/                    # Next.js demo
│       └── rwsdk/                   # RedwoodJS SDK demo
├── tooling/                         # Internal tooling packages
│   ├── typescript-config/          # @repo/typescript-config - TS configs
│   ├── prettier-config/            # @repo/prettier-config - Code formatting
│   └── vitest-config/              # @repo/vitest-config - Test configuration
├── docs/                           # Monorepo documentation
└── scripts/                        # Monorepo-wide scripts
```

### Monorepo Commands (from root)

```bash
# Build all packages
pnpm build

# Run tests across all packages
pnpm test

# Lint all packages
pnpm lint

# Type check all packages
pnpm types

# Development mode
pnpm dev

# Format all code
pnpm format

# Clean all build outputs
pnpm clean
```

### Package-Specific Commands

```bash
# Work on specific package
pnpm build --filter=@esteban-url/cli
pnpm test --filter=@esteban-url/create-cli
pnpm lint --filter=@esteban-url/cli

# Work on multiple packages
pnpm build --filter=./packages/*
```

### Monorepo Architecture

- **Turborepo**: Optimized build system with intelligent caching
- **PNPM Workspaces**: Efficient package management and dependency resolution
- **Shared Tooling**: Common configurations in `tooling/` directory
- **@repo/\* Convention**: Internal packages use @repo/ namespace
- **Build Dependencies**: Proper dependency graph with `^build` dependencies

### Monorepo Workflow

1. **Work from root**: Use `pnpm` commands with `--filter` for package-specific work
2. **Parallel development**: Turborepo enables efficient parallel builds and tests
3. **Shared dependencies**: Use `workspace:*` protocol for internal dependencies
4. **Configuration sharing**: Extend from `@repo/*` packages for consistent tooling

### Adding New Packages

1. Create package directory in appropriate location (`packages/`, `apps/`, or `tooling/`)
2. Add proper package.json with correct namespace (@esteban-url/_\_or @repo/_\_)
3. Update dependencies to use `workspace:*` for internal packages
4. Add to PNPM workspace configuration if needed

### Key Considerations

- **Monorepo First**: Always consider impact across packages
- **Turborepo Caching**: Structure builds for optimal caching
- **Shared Configurations**: Use @repo/\* packages for consistency
- **Package Boundaries**: Respect package boundaries and dependencies
- **Build Dependencies**: Ensure proper dependency order in turbo.json

## Package: @esteban-url/cli

A functional CLI framework for building robust, testable command-line applications with TypeScript.

### Overview

@esteban-url/cli provides a modern foundation for CLI applications using functional programming patterns, explicit error handling with Result types, and comprehensive testing utilities.

### Features

- 🎯 **Result-based error handling** - No exceptions, explicit error propagation
- 🔧 **Functional programming** - Pure functions, immutability, composition
- 🧩 **Modular architecture** - Tree-shakeable subpath exports
- 📦 **Built-in abstractions** - FileSystem, Configuration, Validation
- 🧪 **Testing utilities** - Mocks, test contexts, runners
- 🎨 **Beautiful output** - Chalk styling, Ora spinners, progress tracking
- 🔍 **Full type safety** - Strict TypeScript with comprehensive types

### Development Commands

```bash
# From monorepo root
pnpm test --filter=@esteban-url/cli
pnpm build --filter=@esteban-url/cli
pnpm lint --filter=@esteban-url/cli

# From package directory (packages/cli/)
pnpm test                    # Run all tests
pnpm test:watch             # Watch mode
pnpm build                  # Compile TypeScript
pnpm types                  # Type checking
pnpm lint                   # Linting
```

### Architecture Notes

- Functional programming approach (no classes in public API)
- Immutable data structures and pure functions
- Composition over inheritance
- Explicit error handling with Result types
- Modular exports via subpath exports

### Module Exports

- **Core** (`@esteban-url/core`) - Result types and error handling
- **Command** (`@esteban-url/cli/command`) - Command creation and execution
- **FileSystem** (`@esteban-url/fs`) - Abstract filesystem operations
- **Configuration** (`@esteban-url/config`) - Type-safe configuration
- **Prompts** (`@esteban-url/cli/prompts`) - Interactive user prompts
- **Testing** (`@esteban-url/cli/testing`) - Test utilities and mocks

## App: demos/next

Next.js demo application.

### Overview

This demo app demonstrates Next.js App Router patterns and best practices.

### Development Commands

```bash
# From monorepo root
pnpm dev --filter=next
pnpm build --filter=next

# From app directory (apps/demos/next/)
pnpm dev                    # Start dev server
pnpm build                  # Production build
pnpm start                  # Start production server
```

### Key Files

- `app/layout.tsx` - Root layout
- `src/` - Application source code

## App: demos/rwsdk

RedwoodJS SDK demo application.

### Overview

This demo app demonstrates RedwoodJS SDK patterns with server-side rendering and edge deployment.

### Development Commands

```bash
# From monorepo root
pnpm dev --filter=rwsdk
pnpm build --filter=rwsdk

# From app directory (apps/demos/rwsdk/)
pnpm dev                    # Start dev server
pnpm build                  # Production build
```

### Key Files

- `src/app/Document.tsx` - Document wrapper
- `src/app/` - Application source code
- `vite.config.mts` - Vite configuration
- `wrangler.jsonc` - Cloudflare Workers config

## Shortcuts Reference

### Essential Shortcuts

- `uc7` = Use Context7 for up-to-date documentation, best practices and research.
- `askq` = Ask clarifying questions about requirements, constraints, edge cases, and technical constraints.
- `qc` = Quality check: 1) Missing requirements? 2) Improvements possible? 3) Follows principles (DRY, YAGNI, KISS, functional patterns, type safety)?
- `qcu` = Ultra-deep quality check: Requirements audit, security review, architecture impact, future-proofing, code excellence, hidden complexities, testing gaps.
- `fixlint` = Fix all TypeScript errors and lint warnings. Remove unused imports, prefix unused variables with underscore.
- `write-tests` = Write high-ROI tests following project principles (no low-ROI rendering/prop tests).
  `gcwm` = Git commit with meaningful message. Think like a senior engineer: analyze all changes
  and determine if they should be split into multiple atomic commits. Each commit should be
  independently revertible and represent a single logical change.

  Steps:
  1. Analyze all staged/unstaged changes to understand the full scope
  2. Group related changes that form logical units of work
  3. Identify if changes should be split (e.g., refactoring separate from feature, config updates
     separate from code changes)
  4. For each logical group:
     - Stage only the files for that specific change
     - Create a conventional commit: `type(scope): description`
     - Valid types: feat, fix, docs, style, refactor, test, chore, perf, ci, build, revert
     - Focus on "why" not "what" in messages
     - Keep messages concise and meaningful

  Example scenarios:
  - If updating deps + refactoring code: Split into `chore(deps):` and `refactor(module):`
    commits
  - If fixing bug + adding tests: Split into `fix(api):` and `test(api):` commits
  - If moving files + updating imports: Single `refactor(structure):` commit

- `gbcp` = Git branch, commit, push/PR workflow with concise PR body. Include "Closes #[issue]" in commit/PR for auto-linking. PR body should be succinct yet meaningful: brief summary, key changes (3-7 bullet points max), testing validation, issue reference.
- `gpr` = Git push and create PR with concise body. Include "Closes #[issue]" in commit/PR for auto-linking. Focus on essential information: what changed, why it matters. Avoid verbose explanations.
- `gh-issue` = Comprehensive GitHub issue analysis: fetch details and comments, create feature branch, deep codebase examination, Read CLAUDE.md and project principles to apply, create TodoWrite plan.

# important-instruction-reminders

Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (\*.md) or README files. Only create documentation files if explicitly requested by the User.

**MOST IMPORTANT**: Claude MUST actively resist over-engineering requests using the reality check framework. Prevention of complexity is more valuable than removal of complexity.
