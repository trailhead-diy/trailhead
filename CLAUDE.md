# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in the Trailhead monorepo.

## General Project Guidelines

### Communication Style

- Skip pleasantries and affirmations ("Great question!", "You're right!", etc.)
- No apologizing unless actually wrong about something technical
- Get straight to the answer
- Skip transitional phrases ("Let me...", "I'll help you...")
- Be direct like a CLI response

### Core Development Principles

1. **Prefer libraries over custom implementations** - Use established libraries
2. **Write easy to read code** - Clarity over cleverness, explicit over implicit
3. **Always test new code** - Every feature/change must have HIGH-ROI tests
4. **Follow functional programming principles** - Pure functions, immutable data
5. **DRY** (Don't Repeat Yourself)
6. **KISS** (Keep It Simple, Stupid)
7. **YAGNI** (You Aren't Gonna Need It) - Avoid over-engineering
8. **No legacy code** - Keep codebase clean and modern until v2.0
9. **Do One Thing Well** - Every feature, function, and file should have a single, clearly defined purpose

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

**FORBIDDEN PATTERNS** (Immediate rejection):

- ❌ "Future-proofing" without specific future requirements
- ❌ Abstractions over abstractions (wrapper libraries)
- ❌ Enterprise features for individual developers
- ❌ Monitoring/observability for simple tools
- ❌ "Best practices" that add complexity without clear benefit
- ❌ Documentation frameworks for small projects
- ❌ CI/CD optimizations for <5 contributors
- ❌ Branches created from other branches (scope creep indicator)

**CLAUDE MUST ACTIVELY RESIST** these requests and suggest simpler alternatives.

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
- **Snapshot Tests**: Brittle tests that break with any UI change
- **Style/CSS Tests**: Testing exact class names or inline styles

### Working with Claude Code

- Ask Claude to create a todo list when working on complex tasks to track progress
- Use the TodoWrite tool for task management across the monorepo
- Consider impact across packages when making changes
- Test related packages when making cross-cutting changes
- **Web Search**: When searching for current information, always use the current year (2025) not previous years. Check the environment date if unsure. This applies to all searches, including when using shortcuts like `uc7` or any other context.
- **Context7 MCP**: Use Context7 for up-to-date documentation by adding "use context7" to queries. Essential for `uc7` shortcut to get latest docs and best practices.

### Context7 MCP Integration

**IMPORTANT**: Context7 provides access to up-to-date, version-specific documentation for eliminating outdated code examples and hallucinated APIs.

#### Configuration

Context7 MCP is configured for this project:

- Local server: `claude mcp list` shows `context7: npx -y @upstash/context7-mcp@latest`
- Project config: `.mcp.json` contains Context7 server definition

#### Usage Examples

**Basic Usage:**

```
How do I implement server components in Next.js 15? use context7
```

**With uc7 Shortcut:**

```
uc7 - Create a React component with Tailwind CSS using latest best practices
```

**Framework-Specific Queries:**

```
Show me the latest Vite configuration options for React. use context7
What are the new features in TypeScript 5.8? use context7
How to use Turborepo with Next.js app router? use context7
```

#### Best Practices

1. **Always include "use context7"** for technical documentation queries
2. **Be specific about versions** when asking about framework features
3. **Use with `uc7` shortcut** for comprehensive, up-to-date solutions
4. **Combine with current year** (2025) in searches for latest information

### Dependency Management

- **Renovate**: Automated dependency updates via GitHub App
- **Dependency Dashboard**: View all pending updates in GitHub Issues
- **Security Updates**: Automatically prioritized and labeled
- **Monorepo Grouping**: Dependencies grouped by package and ecosystem
- **Major Updates**: Require manual approval via Dependency Dashboard
- **Schedule**: Monday mornings (4am EST) to minimize disruption

### Lockfile Management

**IMPORTANT**: Always keep `pnpm-lock.yaml` in sync with `package.json` to avoid CI failures.

#### When to Update Lockfile

1. **After modifying package.json**: Any changes to dependencies, devDependencies, or scripts
2. **After merging PRs**: If conflicts occurred in package.json
3. **When CI fails**: With "ERR_PNPM_OUTDATED_LOCKFILE" error

#### How to Update Lockfile

```bash
# Update lockfile without installing packages
pnpm install --lockfile-only

# Verify and commit
git add pnpm-lock.yaml
git commit -m "fix: update pnpm-lock.yaml to match package.json"
```

#### Automated Safeguards

1. **Pre-push hook**: Validates lockfile before pushing (via Lefthook)
2. **CI validation**: All workflows use `--frozen-lockfile` to catch issues
3. **Dependency check**: `pnpm audit` runs in dependency-review workflow

#### Common Issues

- **Merge conflicts in lockfile**: Delete lockfile, run `pnpm install`, commit new lockfile
- **Renovate conflicts**: Let Renovate recreate its lockfile updates after merging
- **Version drift**: Ensure all environments use pnpm v10.12.1

### Documentation Standards - STRICTLY ENFORCED

**CRITICAL**: All documentation MUST follow Diátaxis framework. Non-compliance blocks PRs.

#### Diátaxis Framework (MANDATORY)

Every documentation file MUST be categorized as ONE of these types:

1. **TUTORIAL** (Learning-oriented): "Build Your First CLI App"
   - Step-by-step learning experience
   - Complete working project outcome
   - NO options or alternatives
   - For beginners learning concepts

2. **HOW-TO** (Task-oriented): "How to Add Custom Validation"
   - Solve specific user problems
   - Assumes existing knowledge
   - Multiple approaches OK
   - For users with goals

3. **REFERENCE** (Information-oriented): "API Reference"
   - Comprehensive technical specs
   - NO instructions or tutorials
   - Consistent structure
   - For lookup/verification

4. **EXPLANATION** (Understanding-oriented): "Why We Use Result Types"
   - Conceptual understanding
   - Design decisions and trade-offs
   - Background context
   - For deeper comprehension

#### Strict Requirements

**EVERY documentation file MUST:**

- Include correct frontmatter with `type` field
- Match content to declared type (mixed content = REJECTED)
- Follow templates in `docs/templates/`
- Pass automated validation (`pnpm docs:validate`)

**FORBIDDEN patterns:**

- ❌ Tutorials with multiple solution paths
- ❌ How-to guides explaining concepts
- ❌ Reference docs with instructions
- ❌ Explanations with step-by-step tasks
- ❌ Mixed content types in single file

#### Templates (REQUIRED)

Use these templates for new documentation:

- `docs/templates/tutorial-template.md`
- `docs/templates/howto-template.md`
- `docs/templates/reference-template.md`
- `docs/templates/explanation-template.md`

#### Quality Gates

Documentation changes are BLOCKED if:

- No frontmatter with correct `type`
- Content doesn't match declared type
- Fails Vale or markdownlint checks
- Missing from required categories
- Violates Diátaxis principles

#### Commands

```bash
pnpm docs:validate    # Check all documentation
pnpm docs:lint       # Style and format checks
pnpm docs:new        # Create from templates
```

**Resources:**

- [Full Standards](docs/DOCUMENTATION_STANDARDS.md)
- [Review Checklist](docs/DOCUMENTATION_REVIEW_CHECKLIST.md)
- [Quick Reference](docs/WRITING_DOCUMENTATION.md)

**No exceptions.** Documentation quality is non-negotiable.

## Monorepo Overview

Trailhead is a modern Turborepo monorepo containing UI libraries, CLI frameworks, and development tooling. The repository follows best practices for scalable monorepo architecture with shared configurations and optimized build caching.

### Project Structure

```
trailhead/                            # Root monorepo
├── packages/                         # Public packages
│   ├── cli/                         # @esteban-url/trailhead-cli - CLI framework
│   └── web-ui/                      # @esteban-url/trailhead-web-ui - UI component library
├── apps/                            # Applications
│   └── demos/                       # Demo applications
│       ├── next/                    # Next.js demo
│       └── rwsdk/                   # RedwoodJS SDK demo
├── tooling/                         # Internal tooling packages
│   ├── oxlint-config/              # @repo/oxlint-config - Shared linting
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
pnpm build --filter=@esteban-url/trailhead-web-ui
pnpm test --filter=@esteban-url/trailhead-cli
pnpm lint --filter=@esteban-url/trailhead-web-ui

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

## Package: @esteban-url/trailhead-cli

A functional CLI framework for building robust, testable command-line applications with TypeScript.

### Overview

@esteban-url/trailhead-cli provides a modern foundation for CLI applications using functional programming patterns, explicit error handling with Result types, and comprehensive testing utilities.

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
pnpm test --filter=@esteban-url/trailhead-cli
pnpm build --filter=@esteban-url/trailhead-cli
pnpm lint --filter=@esteban-url/trailhead-cli

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

- **Core** (`@esteban-url/trailhead-cli/core`) - Result types and error handling
- **Command** (`@esteban-url/trailhead-cli/command`) - Command creation and execution
- **FileSystem** (`@esteban-url/trailhead-cli/filesystem`) - Abstract filesystem operations
- **Configuration** (`@esteban-url/trailhead-cli/config`) - Type-safe configuration
- **Prompts** (`@esteban-url/trailhead-cli/prompts`) - Interactive user prompts
- **Testing** (`@esteban-url/trailhead-cli/testing`) - Test utilities and mocks

## Package: @esteban-url/trailhead-web-ui

Enhanced Catalyst UI with advanced theming system. Built on Tailwind's official React components.

### Overview

@esteban-url/trailhead-web-ui provides:

- **Comprehensive theming system** with shadcn/ui compatibility
- **21 predefined themes** using OKLCH color space for perceptual uniformity
- **Functional theme builder API** for creating custom themes programmatically
- **Runtime theme switching** with next-themes integration
- **SSR-safe theming** with no hydration issues
- **Enhanced TypeScript interfaces** with comprehensive type definitions
- **Semantic color tokens** for consistent theming across all components
- **Zero performance overhead** using CSS custom properties
- **Professional CLI** with smart framework detection and interactive setup

### CLI Commands

The Trailhead UI CLI provides commands for installing and managing UI components. It's built on top of @esteban-url/trailhead-cli framework.

```bash
# CLI installation and usage
pnpm add -g github:esteban-url/trailhead#packages/web-ui
trailhead-ui install              # Interactive installation wizard
trailhead-ui transforms           # Transform components to semantic tokens
trailhead-ui dev:refresh          # Copy fresh Catalyst components
trailhead-ui profile              # Profile transform performance
trailhead-ui --help               # Show all available commands

# Common install options
trailhead-ui install --framework nextjs      # Specify framework
trailhead-ui install --dry-run               # Preview changes
trailhead-ui install --force                 # Overwrite existing files
trailhead-ui install -d components/ui        # Custom destination
```

### Development Commands

```bash
# From monorepo root
pnpm test --filter=@esteban-url/trailhead-web-ui
pnpm build --filter=@esteban-url/trailhead-web-ui
pnpm lint --filter=@esteban-url/trailhead-web-ui

# From package directory (packages/web-ui/)
pnpm test                    # Run all tests
pnpm test:watch             # Run tests in watch mode
pnpm test:coverage          # Generate coverage report
pnpm test:changed           # Run only tests affected by changes

# Type checking and linting
pnpm types                  # Check TypeScript types
pnpm lint                   # Run oxlint
pnpm lint:fix               # Fix linting issues
pnpm format                 # Format code with prettier
```

### Architecture

- **26 Catalyst UI Components** with semantic color tokens
- **Component Architecture**: Wrapper pattern with implementations in `/lib/`
- **Theme System**: Functional composition, OKLCH colors, runtime switching
- **Transform System**: AST-based color-to-semantic-token transformations
- **Testing**: 87 test files with HIGH-ROI testing approach

### Key Features

#### Theme System

- 21 predefined themes (zinc, purple, green, orange, slate, etc.)
- Functional theme builder API
- Runtime theme switching with persistence
- SSR-safe with no hydration issues
- Full shadcn/ui compatibility

#### Transform System

- AST-based transformations for accurate conversions
- Component-specific color mappings
- Performance profiling tools
- Converts hardcoded colors to semantic tokens

#### Components

All 26 Catalyst UI components with enhanced TypeScript support:

- **Forms**: Button, Input, Textarea, Select, Checkbox, Radio, Switch
- **Layout**: Dialog, Dropdown, Sidebar, SidebarLayout, StackedLayout, AuthLayout
- **Data**: Table, Badge, Avatar, DescriptionList
- **Navigation**: Link, Navbar, Pagination
- **Typography**: Heading, Text
- **Utilities**: Alert, Divider, Fieldset, Listbox, Combobox

### Important Patterns

- **File Naming**: Use kebab-case for all component files
- **Semantic Tokens**: Never hardcode colors, always use semantic tokens
- **Component Exports**: Wrapper pattern with re-exports from `./lib/`
- **Theme Development**: Use functional composition with OKLCH colors

## App: demos/next

Next.js demo application showcasing all Trailhead UI components.

### Overview

This demo app demonstrates:

- All 26 UI components in action
- Theme switching capabilities
- SSR with Next.js App Router
- Component composition patterns

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

- `app/layout.tsx` - Root layout with theme provider
- `components/demo-layout.tsx` - Shared demo layout
- `components/th/` - All UI components installed via CLI

## App: demos/rwsdk

RedwoodJS SDK demo application showcasing Trailhead UI with RedwoodJS.

### Overview

This demo app demonstrates:

- Trailhead UI integration with RedwoodJS SDK
- Server-side rendering with Waku
- Edge deployment readiness

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

- `src/app/Document.tsx` - Document wrapper with theme
- `src/app/components/th/` - All UI components
- `vite.config.mts` - Vite configuration
- `wrangler.jsonc` - Cloudflare Workers config

## Shortcuts Reference

### General Shortcuts

- `uc7` = [use Context7] Apply these principles: Deep analysis, exhaustive coverage, functional patterns, type safety, DRY, YAGNI, KISS, files should be organized logically and "do one thing well" and high-ROI testing approach if explicitly asked to add testing. Research current best practices and provide comprehensive solution using **Context7 MCP for up-to-date documentation** (add "use context7" to queries). Do not commit unless explicitly stated.
- `askq` = Ask clarifying questions to understand requirements, constraints, and expected outcomes. Focus on ambiguous requirements, missing context, edge cases, and technical constraints that would impact the solution.
- `qc` = Quality check in 3 passes: 1) Did I miss anything from the requirements? 2) Can this solution be improved (performance, readability, maintainability)? 3) Does it follow all project principles (DRY, YAGNI, KISS, functional patterns, type safety)?
- `qcu` = Ultra-deep quality check: 1) Requirements audit - missed any stated/implied requirements, edge cases, error handling, accessibility, performance? 2) Security review - auth, validation, data exposure, OWASP top 10? 3) Architecture impact - system fit, scalability, tech debt, migration paths? 4) Future-proofing - assumptions, breakage points, extensibility? 5) Code excellence - elegant, self-documenting, follows all principles? 6) Hidden complexities - race conditions, memory leaks, performance cliffs, state issues? 7) Testing gaps - untested areas, integration points, failure/recovery scenarios?
- `explain` = Explain this code/error/concept in simple terms with concrete examples
- `refactor` = Suggest refactoring improvements focusing on readability, performance, and maintainability
- `edge-cases` = Identify edge cases, error scenarios, and potential bugs in this implementation
- `alt` = Provide alternative approaches with pros/cons for each
- `fix-this` = Debug this issue systematically: reproduce → isolate → fix → verify
- `todo-plan` = Create a detailed implementation plan with TodoWrite before starting
- `quick` = Give me the most direct solution without explanation (for simple tasks)
- `code-review` = Code review this as if you're a senior engineer: security, performance, best practices
- `write-tests` = Write high-ROI tests for this code following project principles
- `clean-code` = Deep clean codebase: 1) Remove ALL backwards compatibility code (this is v1.0, no legacy support needed), 2) Delete unused files, functions, variables, imports, exports, 3) Remove low-ROI tests (rendering, prop forwarding, snapshots), 4) Delete obsolete documentation, 5) Remove commented-out code, 6) Eliminate dead code paths and unreachable conditions, 7) Remove unnecessary dependencies, 8) Delete example/bothedemo files that aren't actively used. Be aggressive - if it's not actively used, it goes. Use git history if needed later.
- `fixlint` = Fix all TypeScript errors and lint warnings. Remove unused imports, prefix
  unused variables with underscore, fix type errors, and ensure code passes all static
  analysis checks.
- `gcwm` = Fix all lint and ts errors and warnings (fixlint). Git commit with meaningful message. Break changes into atomic commits: one logical change per commit. Each commit should be independently revertable. Use conventional commit format when applicable (feat:, fix:, refactor:, etc.). Focus on "why" not "what" in messages.
- `gpr` = GitHub pull request: 1) Ensure branch is up-to-date with main (git fetch origin && git rebase origin/main), 2) Create PR with title from commits, 3) Run validation checks, 4) Assign reviewers based on changed files, and auto-link issues. Detects affected packages in monorepo.
- `gbcp` = Git branch, commit, push/PR workflow: 1) Create new feature branch from current branch, 2) Stage all changes and commit with meaningful message (gcwm), 3) Push branch and create PR with auto-generated description (gpr).
- `sync-main` = Sync branch with main using rebase strategy: 1) git fetch origin, 2) git rebase origin/main, 3) resolve conflicts if needed.
- `check-sync` = Check if current branch is up-to-date with main without pulling. Uses @esteban-url/trailhead-cli/git utilities.
- `pub` = Publish packages with Changesets: 1) Check release status with `pnpm changeset:status`, 2) If no changeset exists, create one with `pnpm changeset:add`, 3) Push changes to trigger automated release via GitHub Action, 4) The automation handles version bumping, changelog generation, and publishing. For manual release: `pnpm version-packages` then `pnpm release`.
- `pubdr` = Publish dry-run: Check what would be published without actually releasing. Runs `pnpm release:dry-run` to preview package contents and verify everything looks correct before actual publish. Use before `pub` to ensure safety.
- `reality-check` = STOP. Is this actually needed? Ask: Who requested this? What specific problem does it solve? Can existing tools handle this? Will 80%+ of users need this? Be brutally honest about whether this adds value or just complexity.
- `yagni-audit` = Review current implementation for YAGNI violations. Identify features, abstractions, configurations, or optimizations that aren't used by real users. Recommend removal.
- `user-first` = Refocus on actual user needs. What do users actually want to accomplish? What's the simplest way to achieve that? Ignore "best practices" that don't serve real user goals.
- `scope-check` = Verify single responsibility. Does this issue/PR address exactly one problem? Are we trying to do too much? Should this be split into separate issues?
- `branch-audit` = Check branch structure. Are we working from main? Is this a branch-on-branch (red flag)? Does branch name match issue scope?
- `gh-issue` = Comprehensive GitHub issue analysis and implementation planning: 1) Fetch issue details with `gh issue view [number] --comments` to get full conversation history, 2) Analyze ALL comments for additional context, requirements changes, design decisions, and implementation hints, 3) Deep codebase examination using search tools to identify: existing partial implementations, related code patterns, similar features, affected dependencies, and architectural constraints, 4) Apply core principles analysis: functional patterns, type safety, DRY violations to avoid, YAGNI considerations, and high-ROI testing approach, 5) Cross-reference with related issues/PRs using `gh issue list` and `gh pr list` for context, 6) Identify monorepo impact across all packages and apps, 7) Create comprehensive TodoWrite plan with: problem analysis summary, codebase findings, implementation strategy aligned with principles, specific atomic tasks, testing approach, and affected package considerations, 8) Create feature branch from main with semantic naming (feat/fix/refactor-issue-number-brief-description).

### Documentation Shortcuts

- `write-docs` = Write comprehensive documentation with: clear overview, usage examples, API reference, edge cases, and common pitfalls
- `docstring` = Add inline documentation (JSDoc/docstrings) with parameters, return values, examples, and throws
- `readme` = Create/update README with: project overview, installation, usage, API, examples, contributing guidelines
- `api` = Document API endpoints/functions with: description, parameters, return types, error codes, examples
- `changelog` = Update CHANGELOG following Keep a Changelog format: Added, Changed, Deprecated, Removed, Fixed, Security
- `example` = Create practical, runnable examples demonstrating common use cases
- `migration` = Write migration guide with: breaking changes, upgrade steps, before/after code examples
- `troubleshoot` = Document common issues with: symptoms, causes, solutions, and prevention
- `architecture` = Document system architecture with: components, data flow, design decisions, trade-offs
- `comment` = Add helpful inline comments explaining "why" not "what" for complex logic
- `tutorial` = Create step-by-step tutorial with prerequisites, goals, and progressive complexity
- `faq` = Generate FAQ from common issues, gotchas, and best practices

### /compact Shortcuts

- `compact` = Maximum brevity. Answer in 1-3 lines. No explanations unless asked.
- `tldr` = Give me just the answer/solution, nothing else
- `cli` = Respond like a CLI tool - minimal output, no pleasantries
- `brief` = Short answer with only essential context (under 5 lines)
- `expand` = Give me the detailed explanation (opposite of compact)
- `yes/no` = Binary answer only, no elaboration
- `list` = Bullet points only, no prose
- `code-only` = Just show code, no explanation
- `one-line` = Compress answer to single line
- `verbose` = Full explanation with examples and context (when you need details)

## Assertive Response Templates for Over-Engineering

**When user requests over-engineered features, Claude MUST respond:**

### Template 1: Complexity Challenge

```
This appears to be over-engineering. Most users need [simple alternative].

The proposed solution adds [specific complexity] without clear user benefit.

Suggested approach: [simpler solution]

If you have specific requirements that justify this complexity, please explain the user problem this solves.
```

### Template 2: Reality Check Response

```
REALITY CHECK:
- Who specifically requested this feature?
- What user problem does this solve today?
- Can existing tools handle this?
- Will 80%+ of users need this?

Based on these questions, I recommend [simpler alternative] instead.
```

### Template 3: YAGNI Enforcement

```
This violates YAGNI (You Aren't Gonna Need It).

Current approach creates unnecessary complexity for hypothetical future needs.

Alternative: Start with [minimal solution]. Add complexity only when users specifically request it.
```

### Template 4: Branch Discipline Warning

```
Creating a branch from another branch is a RED FLAG indicating scope creep.

This suggests we're trying to do more than originally planned.

Recommended:
1. Finish current branch and merge to main
2. Create new branch from main for additional work
3. Or reconsider if the additional work is actually needed
```

# important-instruction-reminders

Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (\*.md) or README files. Only create documentation files if explicitly requested by the User.

**MOST IMPORTANT**: Claude MUST actively resist over-engineering requests using the reality check framework and assertive response templates above. Prevention of complexity is more valuable than removal of complexity.
