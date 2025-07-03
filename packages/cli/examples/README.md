# CLI Examples

Working code examples demonstrating various patterns and use cases with @esteban-url/trailhead-cli.

## Available Examples

### [api-client](./api-client/)
HTTP client with retry logic, authentication, and error handling.

### [cross-platform-cli](./cross-platform-cli/)
Cross-platform CLI demonstrating OS-specific functionality.

### [file-processor](./file-processor/)
Advanced file processing with streaming and batch operations.

### [project-generator](./project-generator/)
Project scaffolding and template generation.

### [todo-cli](./todo-cli/)
Complete CRUD application with persistent storage.

## Running Examples

The examples are designed to work both within the monorepo (for development) and as standalone projects (for users).

### Within the Monorepo

Examples use `workspace:*` protocol for development:

```bash
# From monorepo root or packages/cli
pnpm build  # Build the CLI package first

# Then run any example
cd packages/cli/examples/<example-name>
pnpm run dev <command> [options]
```

### As Standalone Projects

To convert an example to a standalone project:

```bash
# Use the provided script
cd packages/cli/examples
./make-standalone.sh api-client /path/to/destination

# Or manually:
# 1. Copy the example
cp -r api-client /path/to/my-project
cd /path/to/my-project

# 2. Update package.json dependency from:
#    "@esteban-url/trailhead-cli": "workspace:*"
# To:
#    "@esteban-url/trailhead-cli": "github:esteban-url/trailhead#packages/cli"

# 3. Update tsconfig.json to remove the extends
#    and use a standalone configuration

# 4. Install and run
npm install
npm run dev <command> [options]
```

### Why This Approach?

- **Development**: Uses pnpm workspace for fast iteration
- **Distribution**: Examples can be copied and used independently
- **Testing**: Examples are tested within the monorepo context
- **Templates**: Users can use examples as project templates

### Using Examples as Templates

To use an example as a template for your own project:

1. Copy the example directory to your location
2. Update the `package.json` dependency:
   ```json
   // Change from:
   "@esteban-url/trailhead-cli": "file:../.."
   
   // To one of:
   "@esteban-url/trailhead-cli": "github:esteban-url/trailhead#packages/cli"  // GitHub
   "@esteban-url/trailhead-cli": "^0.1.0"  // NPM (when published)
   ```
3. Install and use normally:
   ```bash
   npm install
   npm run dev <command> [options]
   ```

### Building Examples

To compile TypeScript:
```bash
npm run build
node dist/index.js <command> [options]
```

## Learning Path

1. Start with **api-client** for basic CLI structure
2. Try **cross-platform-cli** for OS integration  
3. Explore **file-processor** for filesystem operations
4. Build **project-generator** for scaffolding patterns
5. Complete **todo-cli** for full application development

## Documentation

For step-by-step tutorials, see [docs/tutorials/getting-started.md](../docs/tutorials/getting-started.md).