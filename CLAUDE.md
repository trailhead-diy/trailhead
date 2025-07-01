# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in the Trailhead monorepo.

## General Project Guidelines

### Communication Style

- Skip pleasantries and affirmations ("Great question!", "You're right!", etc.)
- No apologizing unless actually wrong about something technical
- Get straight to the answer
- Skip transitional phrases ("Let me...", "I'll help you...")
- Be direct like a CLI response

### Development Principles

1. **Prefer libraries over custom implementations** - Use established libraries
2. **Write easy to read code** - Clarity over cleverness, explicit over implicit
3. **Always test new code** - Every feature/change must have tests
4. **Follow functional programming principles** - Pure functions, immutable data
5. **DRY** (Don't Repeat Yourself)
6. **KISS** (Keep It Simple, Stupid)
7. **YAGNI** (You Aren't Gonna Need It) - Avoid over-engineering
8. **Use semantic tokens** - Never hardcode colors, always use semantic tokens
9. **No legacy code** - Keep codebase clean and modern until v2.0

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

### Dependency Management

- **Renovate**: Automated dependency updates via GitHub App
- **Dependency Dashboard**: View all pending updates in GitHub Issues
- **Security Updates**: Automatically prioritized and labeled
- **Monorepo Grouping**: Dependencies grouped by package and ecosystem
- **Major Updates**: Require manual approval via Dependency Dashboard
- **Schedule**: Monday mornings (4am EST) to minimize disruption

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
│   ├── cli/                         # @trailhead/cli - CLI framework
│   └── web-ui/                      # @trailhead/web-ui - UI component library
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
pnpm build --filter=@trailhead/web-ui
pnpm test --filter=@trailhead/cli
pnpm lint --filter=@trailhead/web-ui

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
2. Add proper package.json with correct namespace (@trailhead/_ or @repo/_)
3. Update dependencies to use `workspace:*` for internal packages
4. Add to PNPM workspace configuration if needed

### Key Considerations

- **Monorepo First**: Always consider impact across packages
- **Turborepo Caching**: Structure builds for optimal caching
- **Shared Configurations**: Use @repo/\* packages for consistency
- **Package Boundaries**: Respect package boundaries and dependencies
- **Build Dependencies**: Ensure proper dependency order in turbo.json

## Package: @trailhead/cli

A functional CLI framework for building robust, testable command-line applications with TypeScript.

### Overview

@trailhead/cli provides a modern foundation for CLI applications using functional programming patterns, explicit error handling with Result types, and comprehensive testing utilities.

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
pnpm test --filter=@trailhead/cli
pnpm build --filter=@trailhead/cli
pnpm lint --filter=@trailhead/cli

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

- **Core** (`@trailhead/cli/core`) - Result types and error handling
- **Command** (`@trailhead/cli/command`) - Command creation and execution
- **FileSystem** (`@trailhead/cli/filesystem`) - Abstract filesystem operations
- **Configuration** (`@trailhead/cli/config`) - Type-safe configuration
- **Prompts** (`@trailhead/cli/prompts`) - Interactive user prompts
- **Testing** (`@trailhead/cli/testing`) - Test utilities and mocks

## Package: @trailhead/web-ui

Enhanced Catalyst UI with advanced theming system. Built on Tailwind's official React components.

### Overview

@trailhead/web-ui provides:

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

The Trailhead UI CLI provides commands for installing and managing UI components. It's built on top of @trailhead/cli framework.

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
pnpm test --filter=@trailhead/web-ui
pnpm build --filter=@trailhead/web-ui
pnpm lint --filter=@trailhead/web-ui

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

- `uc7` = [Use Core Principles] Apply these principles: Deep analysis, exhaustive coverage, functional patterns, type safety, DRY, YAGNI, KISS, files should be organized logically and "do one thing well" and high-ROI testing approach if explicitly asked to add testing. Research current best practices and provide comprehensive solution. Do not commit unless explicitly stated. Ensure code passes all linting and type checking for the project's language.
- `gcwm` = Git commit with meaningful message. Break changes into atomic commits: one logical change per commit. Each commit should be independently revertable. Use conventional commit format when applicable (feat:, fix:, refactor:, etc.). Focus on "why" not "what" in messages.
- `qc` = Quality check in 3 passes: 1) Did I miss anything from the requirements? 2) Can this solution be improved (performance, readability, maintainability)? 3) Does it follow all project principles (DRY, YAGNI, KISS, functional patterns, type safety)?
- `explain` = Explain this code/error/concept in simple terms with concrete examples
- `refactor` = Suggest refactoring improvements focusing on readability, performance, and maintainability
- `edge` = Identify edge cases, error scenarios, and potential bugs in this implementation
- `alt` = Provide alternative approaches with pros/cons for each
- `fix` = Debug this issue systematically: reproduce → isolate → fix → verify
- `plan` = Create a detailed implementation plan with TodoWrite before starting
- `quick` = Give me the most direct solution without explanation (for simple tasks)
- `review` = Code review this as if you're a senior engineer: security, performance, best practices
- `test` = Write high-ROI tests for this code following project principles

### Documentation Shortcuts

- `docs` = Write comprehensive documentation with: clear overview, usage examples, API reference, edge cases, and common pitfalls
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

# important-instruction-reminders

Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (\*.md) or README files. Only create documentation files if explicitly requested by the User.
