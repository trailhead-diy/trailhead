# Contributing to Trailhead UI

Thank you for your interest in contributing to Trailhead UI!

> **Note**: This documentation is part of the [Trailhead monorepo](../../../../README.md).

## Development Setup

1. **Fork and Clone**

   ```bash
   git clone https://github.com/YOUR_USERNAME/trailhead.git
   cd trailhead/packages/web-ui
   ```

2. **Install Dependencies**

   ```bash
   pnpm install  # We use pnpm for faster installs and better disk usage
   ```

3. **Check Environment Setup**

   ```bash
   pnpm doctor  # Checks Node version, dependencies, and environment
   ```

4. **Run Tests**

   ```bash
   pnpm test           # Run all tests
   pnpm test:watch     # Run in watch mode
   pnpm test:coverage  # Generate coverage report
   pnpm test:changed   # Run only tests affected by changes
   ```

5. **Build the Project**

   ```bash
   pnpm build
   ```

## Development Workflow

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes:
   - Components: `/src/components/` or `/src/components/lib/`
   - Theme system: `/src/components/theme/`
   - CLI: `/src/cli/`
   - Transform system: `/src/transforms/`
3. Add/update tests in `/tests/` (maintain 87+ test coverage)
4. Run tests: `npm test`
5. Format code: `pnpm format`
6. Fix linting: `pnpm lint:fix`
7. Test CLI functionality if applicable
8. Commit with descriptive message
9. Push and create a Pull Request

## Guidelines

### Code Style

- Use TypeScript with strict mode
- Follow functional programming patterns
- Keep components pure and side-effect free
- Use semantic color tokens

### Testing

- Write high-ROI tests (user interactions, business logic)
- Avoid testing implementation details
- Target 97%+ coverage for new code

### Documentation

- Update docs for API changes
- Add examples for new features
- Keep it brief but comprehensive

## Pull Request Process

1. Update documentation if needed
2. Ensure all tests pass
3. Update CHANGELOG.md
4. Request review from maintainers

## Questions?

Open an issue for discussion before making large changes.

## Useful Commands

```bash
# Development
pnpm doctor         # Check your environment setup
pnpm dev            # Run development server
pnpm build          # Build the library
pnpm clean          # Clean build artifacts
pnpm clean:all      # Clean everything (node_modules, etc.)

# Testing
pnpm test           # Run all tests
pnpm test:changed   # Run only affected tests
pnpm test:watch     # Watch mode
pnpm test:coverage  # Coverage report

# Code Quality
pnpm lint           # Check for linting issues
pnpm lint:fix       # Fix linting issues
pnpm format         # Format code with Prettier
pnpm fix:all        # Format and fix linting

# Dependencies
pnpm deps:check     # Check for outdated dependencies
pnpm deps:update    # Interactive dependency updates

# Utilities
pnpm size           # Check package size
```

Thank you for contributing! 🎉
