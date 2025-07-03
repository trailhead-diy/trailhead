# Trailhead UI CLI Configuration

The Trailhead UI CLI supports configuration files to customize its behavior without needing to pass command-line flags every time. This configuration is specific to the UI component installation and transformation commands.

> **Note**: For general CLI framework documentation (Result types, validation, filesystem abstractions, etc.), see [@esteban-url/trailhead-cli documentation](../../cli/README.md).

The configuration system uses [cosmiconfig](https://github.com/cosmiconfig/cosmiconfig) for flexible configuration file discovery.

## Configuration File Formats

Trailhead UI will look for configuration in the following places (in order of priority):

1. `.trailheadrc` (JSON or YAML)
2. `.trailheadrc.json`
3. `.trailheadrc.js`
4. `.trailheadrc.ts`
5. `.trailheadrc.mjs`
6. `.trailheadrc.cjs`
7. `.trailheadrc.yaml`
8. `.trailheadrc.yml`
9. `trailhead.config.js`
10. `trailhead.config.ts`
11. `trailhead.config.mjs`
12. `trailhead.config.cjs`
13. `trailhead.config.json`
14. `package.json` (in a `"trailhead"` field)

## Configuration Schema

### Complete Configuration Example

```json
{
  "$schema": "https://unpkg.com/trailhead-ui/schema/config.json",
  "install": {
    "destDir": "src/components/ui",
    "wrappers": true,
    "framework": "nextjs"
  },
  "transforms": {
    "enabled": true,
    "srcDir": "src/components/lib",
    "enabledTransforms": ["button", "badge", "alert"],
    "disabledTransforms": ["dialog"]
  },
  "devRefresh": {
    "srcDir": "catalyst-ui-kit/typescript",
    "destDir": "src/components/lib",
    "clean": true
  },
  "verbose": false,
  "dryRun": false
}
```

### Configuration Options

These options are specific to the Trailhead UI CLI commands:

#### Global Options

- `verbose` (boolean): Enable verbose output for all commands
- `dryRun` (boolean): Run commands in dry-run mode by default

#### Install Command Options

The `install` command installs Trailhead UI components into your project:

- `install.destDir` (string): Default destination directory for component installation
- `install.wrappers` (boolean): Whether to install wrapper files (default: true)
- `install.framework` (string): Default framework ("nextjs", "vite", "redwood-sdk", "generic-react")

#### Transforms Command Options

The `transforms` command converts hardcoded colors to semantic tokens in your components:

- `transforms.enabled` (boolean): Whether transforms are enabled globally
- `transforms.srcDir` (string): Source directory containing components to transform
- `transforms.enabledTransforms` (string[]): List of transforms to enable (overrides defaults)
- `transforms.disabledTransforms` (string[]): List of transforms to disable

#### Dev Refresh Command Options

The `dev:refresh` command copies fresh Catalyst components for development:

- `devRefresh.srcDir` (string): Source directory containing Catalyst components
- `devRefresh.destDir` (string): Destination directory for refreshed components
- `devRefresh.clean` (boolean): Whether to clean destination before copying

## Configuration File Examples

### Basic `.trailheadrc.json`

```json
{
  "install": {
    "destDir": "components/ui"
  },
  "transforms": {
    "srcDir": "components/ui/lib"
  }
}
```

### TypeScript Configuration

Create a `trailhead.config.ts` file:

```typescript
import { defineConfig } from '@esteban-url/trailhead-web-ui'

export default defineConfig({
  install: {
    destDir: 'src/components/ui',
    framework: 'nextjs',
  },
  transforms: {
    enabled: true,
    srcDir: 'src/components/ui/lib',
    // Only enable specific transforms
    enabledTransforms: ['button', 'badge', 'alert', 'dialog'],
  },
  verbose: true,
})
```

### JavaScript Configuration

Create a `trailhead.config.js` file:

```javascript
/** @type {import('trailhead-ui').TrailheadConfig} */
module.exports = {
  install: {
    destDir: './components/ui',
    wrappers: true,
  },
  transforms: {
    // Disable specific transforms
    disabledTransforms: ['table', 'combobox'],
  },
}
```

### Package.json Configuration

Add a `"trailhead"` field to your `package.json`:

```json
{
  "name": "my-app",
  "version": "1.0.0",
  "trailhead": {
    "install": {
      "destDir": "src/ui"
    },
    "transforms": {
      "srcDir": "src/ui/lib"
    }
  }
}
```

## Transform Control

The transforms system allows fine-grained control over which color-to-semantic-token transformations are applied:

### Enable Only Specific Transforms

```json
{
  "transforms": {
    "enabledTransforms": ["button", "badge", "alert"]
  }
}
```

This will ONLY run transforms for button, badge, and alert components.

### Disable Specific Transforms

```json
{
  "transforms": {
    "disabledTransforms": ["table", "dialog"]
  }
}
```

This will run all transforms EXCEPT for table and dialog components.

### Available Transform Names

The transform names correspond to component names:

- `alert`
- `avatar`
- `badge`
- `button`
- `checkbox`
- `combobox`
- `description-list`
- `dialog`
- `divider`
- `dropdown`
- `fieldset`
- `heading`
- `input`
- `link`
- `listbox`
- `navbar`
- `pagination`
- `radio`
- `select`
- `sidebar`
- `switch`
- `table`
- `text`
- `textarea`

## Configuration Priority

Configuration is resolved in the following priority order (highest to lowest):

1. Command-line flags
2. Configuration files
3. Default values

For example, if you have `destDir: "components/ui"` in your config file but run `trailhead-ui install --dest src/ui`, the command-line value (`src/ui`) will be used.

**Note**: While configuration files use `srcDir` and `destDir` for clarity, command-line flags remain as `--src` and `--dest` for brevity.

## Debugging Configuration

To see which configuration file is being used and what values are loaded, run any command with the `--verbose` flag:

```bash
trailhead-ui install --verbose
```

This will show:

- Which configuration file was found (if any)
- The loaded configuration values
- How options are being resolved

## Best Practices

1. **Project-wide configuration**: Use `.trailheadrc.json` at your project root for settings that apply to all developers

2. **Type safety**: Use TypeScript configuration files (`trailhead.config.ts`) with the `defineConfig` helper for better IDE support

3. **Version control**: Commit your configuration file to ensure consistent behavior across your team

4. **Transform control**: Use `enabledTransforms` when you only want specific transforms, use `disabledTransforms` when you want most transforms but need to exclude a few

5. **Framework-specific**: Set your framework in the config file to avoid having to specify it during installation:
   ```json
   {
     "install": {
       "framework": "nextjs"
     }
   }
   ```

## Example: Development Workflow Configuration

For a typical development workflow with Trailhead UI:

```json
{
  "install": {
    "destDir": "src/components/ui",
    "framework": "nextjs",
    "wrappers": true
  },
  "transforms": {
    "srcDir": "src/components/ui/lib",
    "enabled": true
  },
  "devRefresh": {
    "srcDir": "catalyst-ui-kit/typescript",
    "destDir": "src/components/lib",
    "clean": true
  },
  "verbose": false
}
```

This configuration:

- Sets up components in `src/components/ui` for Next.js
- Enables all transforms by default
- Configures dev:refresh to work with the catalyst-ui-kit
- Keeps output concise unless --verbose is used
