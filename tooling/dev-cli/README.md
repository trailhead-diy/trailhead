# @repo/dev-cli

Development operations CLI for the Trailhead monorepo. This tool provides commands for development workflows, dependency management, documentation operations, and CI/CD tasks.

## Installation

This CLI is part of the Trailhead monorepo and is installed automatically as a development dependency.

## Usage

```bash
# From the monorepo root
pnpm dev-cli <command> [options]

# Or run directly
./tooling/dev-cli/bin/dev-cli <command> [options]
```

## Commands

### Development Workflow

#### `fresh-start`

Complete development environment reset with stash/restore capability.

```bash
dev-cli fresh-start [options]
```

**Options:**

- `--pop, -p` - Restore stashed changes after reset
- `--verbose, -v` - Show detailed operation information

**What it does:**

1. Stashes uncommitted changes (if any)
2. Switches to main branch
3. Pulls latest changes from origin
4. Cleans all build artifacts and caches
5. Reinstalls all dependencies
6. Rebuilds all packages
7. Optionally restores stashed changes

#### `test-runner`

Intelligent test runner with package filtering and watch mode.

```bash
dev-cli test-runner [options]
```

**Options:**

- `--filter <pattern>` - Filter packages to test
- `--watch, -w` - Run tests in watch mode
- `--coverage, -c` - Generate coverage reports
- `--verbose, -v` - Show detailed test output

### Dependency Management

#### `fix-imports`

Automatically fix and optimize import statements across the monorepo.

```bash
dev-cli fix-imports [options]
```

**Options:**

- `--pattern <glob>` - File pattern to process
- `--dry-run` - Show what would be changed without making changes

#### `validate-deps`

Validate package dependencies and detect issues.

```bash
dev-cli validate-deps [options]
```

**Options:**

- `--fix` - Automatically fix detected issues
- `--strict` - Enable strict validation mode

#### `validate-interdeps`

Validate internal package dependencies in the monorepo.

```bash
dev-cli validate-interdeps [options]
```

### Documentation Operations

#### `generate-api`

Generate API documentation using TypeDoc.

```bash
dev-cli generate-api [options]
```

**Options:**

- `--packages <list>` - Comma-separated list of packages to document
- `--output <dir>` - Output directory for generated docs
- `--clean` - Clean output directory before generation
- `--watch` - Watch for changes and regenerate

#### `fix-links`

Fix Docusaurus-compatible links in markdown files.

```bash
dev-cli fix-links [options]
```

**Options:**

- `--pattern <glob>` - File pattern to process (default: `**/*.{md,mdx}`)

#### `fix-declarations`

Fix function declarations formatting in TypeScript files.

```bash
dev-cli fix-declarations [options]
```

**Options:**

- `--pattern <glob>` - File pattern to process (default: `src/**/*.{ts,tsx}`)
- `--dry-run` - Show what would be changed without making changes

#### `setup-integration`

Setup API documentation integration structure.

```bash
dev-cli setup-integration [options]
```

**Options:**

- `--force` - Force setup even if files exist

#### `check-syntax`

Validate TypeScript syntax in documentation examples.

```bash
dev-cli check-syntax [options]
```

**Options:**

- `--pattern <glob>` - File pattern to check (default: `docs/**/*.{md,mdx}`)
- `--fix` - Attempt to fix syntax issues automatically
- `--verbose, -v` - Show detailed validation information

#### `test-examples` ⭐ _New_

Test documentation examples with actual Trailhead API imports.

```bash
dev-cli test-examples [options]
```

**Options:**

- `--filter <pattern>` - Filter tests by pattern
- `--verbose, -v` - Show detailed test information

**Features:**

- Tests documentation examples against actual Trailhead packages
- Validates API compatibility and example accuracy
- Detects breaking changes in documentation
- Supports filtering tests by name patterns

#### `validate-docs` ⭐ _New_

Comprehensive documentation validation with TypeScript syntax checking.

```bash
dev-cli validate-docs [options]
```

**Options:**

- `--pattern <glob>` - File pattern to validate (default: `**/*.{md,mdx}`)
- `--fix` - Attempt to fix validation issues automatically
- `--strict` - Enable strict validation with API testing
- `--verbose, -v` - Show detailed validation information

**Features:**

- Extracts and validates TypeScript code blocks from markdown
- Comprehensive syntax checking with proper type declarations
- API compatibility testing in strict mode
- Detailed error reporting with file/line information
- Multi-phase validation workflow

### CI/CD Operations

#### `npm-auth`

Setup npm authentication for CI/CD environments.

```bash
dev-cli npm-auth
```

#### `ci`

Run complete CI pipeline including tests, builds, and validation.

```bash
dev-cli ci [options]
```

#### `coverage-check`

Validate test coverage meets minimum thresholds.

```bash
dev-cli coverage-check [options]
```

## New Validation Commands

The following commands have been migrated from `new-docs/validation/` and enhanced:

### `test-examples`

Replaces the `test-examples.ts` script with a full CLI command that:

- Tests actual Trailhead API imports in documentation
- Provides structured output with detailed error reporting
- Supports filtering and verbose modes
- Integrates with the dev-cli framework patterns

### `validate-docs`

Replaces the `validate-docs.sh` shell script with a TypeScript implementation that:

- Provides better error handling and reporting
- Supports multiple validation phases
- Includes comprehensive type checking with generated declarations
- Offers fix mode for automatic corrections
- Integrates strict mode with API testing

## Architecture

The dev-cli follows the Trailhead CLI framework patterns:

- **Functional Programming**: Pure functions and immutable data
- **Result-based Error Handling**: No exceptions, explicit error propagation
- **Modular Operations**: Centralized utilities in `/src/utils/`
- **Type Safety**: Full TypeScript with strict typing
- **Testing**: Comprehensive unit tests with mocking

## Development

```bash
# Run tests
pnpm test --filter=@repo/dev-cli

# Type checking
pnpm types --filter=@repo/dev-cli

# Build
pnpm build --filter=@repo/dev-cli
```

## Contributing

When adding new commands:

1. Follow the existing command structure in `/src/commands/`
2. Add operations to appropriate utility files in `/src/utils/`
3. Include comprehensive tests
4. Update this README with command documentation
5. Use the Result-based error handling pattern
6. Follow functional programming principles
