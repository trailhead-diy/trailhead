---
type: how-to
title: 'Configure Default Settings'
description: 'Set up personal or team defaults for consistent project generation'
prerequisites:
  - Installation of @esteban-url/create-cli
  - Understanding of configuration options
related:
  - /packages/cli/reference/config.md
  - /packages/cli/reference/core.md
  - ./custom-prompts.md
---

# Configure Default Settings

This guide shows you how to set up default configurations to streamline project generation for yourself or your team.

## Configuration Locations

The generator looks for configuration in these locations (in order):

1. Command line arguments (highest priority)
2. Current directory `.createclirc.json`
3. Home directory `~/.createclirc.json`
4. Built-in defaults (lowest priority)

## Personal Configuration

### Step 1: Create Configuration File

Create a configuration file in your home directory:

```bash
# Create config directory if needed
mkdir -p ~/.config/create-cli

# Create configuration file
touch ~/.createclirc.json
```

### Step 2: Add Your Defaults

Edit `~/.createclirc.json`:

```json
{
  "packageManager": "pnpm",
  "nodeVersion": "20",
  "ide": "vscode",
  "features": {
    "core": true,
    "config": true,
    "testing": true
  },
  "includeDocs": true
}
```

### Step 3: Verify Configuration

Check that your defaults are loaded:

```bash
npx @esteban-url/create-cli config list

# Output:
# Current configuration:
#   packageManager: pnpm
#   nodeVersion: 20
#   ide: vscode
#   features: core, config, testing
#   includeDocs: true
```

## Project-Specific Defaults

### For Teams

Create `.createclirc.json` in your team's root directory:

```json
{
  "projectType": "monorepo-package",
  "packageManager": "pnpm",
  "nodeVersion": "18",
  "features": {
    "core": true,
    "testing": true
  },
  "organization": "@mycompany"
}
```

### For Monorepos

Place configuration at monorepo root:

```
my-monorepo/
├── .createclirc.json    # Shared defaults
├── packages/
│   ├── cli-1/
│   └── cli-2/
└── pnpm-workspace.yaml
```

## Using Config Command

### List Current Configuration

```bash
# Show all configuration
npx @esteban-url/create-cli config list

# Show specific value
npx @esteban-url/create-cli config get packageManager
```

### Set Configuration Values

```bash
# Set single value
npx @esteban-url/create-cli config set packageManager pnpm

# Set nested value
npx @esteban-url/create-cli config set features.testing true

# Set multiple values
npx @esteban-url/create-cli config set \
  packageManager pnpm \
  nodeVersion 20 \
  ide vscode
```

### Reset Configuration

```bash
# Reset single value
npx @esteban-url/create-cli config unset packageManager

# Reset all to defaults
npx @esteban-url/create-cli config reset
```

## Environment Variables

### Basic Environment Variables

Set defaults using environment variables:

```bash
# Package manager
export CREATE_CLI_PACKAGE_MANAGER=pnpm

# Node version
export CREATE_CLI_NODE_VERSION=20

# IDE preference
export CREATE_CLI_IDE=vscode

# Features (comma-separated)
export CREATE_CLI_FEATURES=config,testing,docs
```

### Using in Scripts

```bash
#!/bin/bash
# setup-defaults.sh

# Set team defaults
export CREATE_CLI_PACKAGE_MANAGER=pnpm
export CREATE_CLI_NODE_VERSION=18
export CREATE_CLI_FEATURES=config,testing

# Run generator
npx @esteban-url/create-cli "$@"
```

## Configuration Schemas

### Complete Configuration File

Full example with all options:

```json
{
  "$schema": "https://raw.githubusercontent.com/esteban-url/trailhead/main/packages/create-cli/schema.json",
  "projectType": "standalone-cli",
  "packageManager": "pnpm",
  "nodeVersion": "20",
  "typescript": true,
  "ide": "vscode",
  "features": {
    "core": true,
    "config": true,
    "validation": true,
    "testing": true,
    "docs": true,
    "cicd": true
  },
  "includeDocs": true,
  "author": {
    "name": "Your Name",
    "email": "you@example.com"
  },
  "license": "MIT",
  "organization": "@myorg"
}
```

### Minimal Configuration

Just the essentials:

```json
{
  "packageManager": "pnpm",
  "features": {
    "core": true,
    "testing": true
  }
}
```

## Advanced Configuration

### Dynamic Configuration

Create a configuration generator script:

```javascript
#!/usr/bin/env node
// generate-config.js

const os = require('os')
const fs = require('fs')
const path = require('path')

const config = {
  packageManager: detectPackageManager(),
  nodeVersion: process.version.match(/^v(\d+)/)[1],
  ide: detectIDE(),
  author: {
    name: os.userInfo().username,
    email: `${os.userInfo().username}@company.com`,
  },
}

function detectPackageManager() {
  if (fs.existsSync('pnpm-lock.yaml')) return 'pnpm'
  if (fs.existsSync('package-lock.json')) return 'npm'
  return 'npm' // default
}

function detectIDE() {
  if (fs.existsSync('.vscode')) return 'vscode'
  return 'none'
}

// Write configuration
fs.writeFileSync(path.join(os.homedir(), '.createclirc.json'), JSON.stringify(config, null, 2))

console.log('Configuration generated:', config)
```

### Configuration Templates

Create templates for different scenarios:

```bash
# Development machine
cat > ~/.createclirc.dev.json << EOF
{
  "packageManager": "pnpm",
  "features": {
    "core": true,
    "config": true,
    "testing": true,
    "docs": true
  },
  "verbose": true
}
EOF

# CI environment
cat > ~/.createclirc.ci.json << EOF
{
  "packageManager": "npm",
  "features": {
    "core": true,
    "testing": true
  },
  "verbose": false,
  "skipInstall": true
}
EOF
```

## Preset Management

### Creating Custom Presets

Store presets for quick access:

```bash
# Create presets directory
mkdir -p ~/.config/create-cli/presets

# Save preset
cat > ~/.config/create-cli/presets/enterprise.json << EOF
{
  "projectType": "standalone-cli",
  "packageManager": "pnpm",
  "features": {
    "core": true,
    "config": true,
    "validation": true,
    "testing": true,
    "docs": true,
    "cicd": true
  },
  "includeDocs": true,
  "organization": "@enterprise"
}
EOF
```

### Using Presets

```bash
# Load preset
cp ~/.config/create-cli/presets/enterprise.json .createclirc.json

# Generate with preset
npx @esteban-url/create-cli my-cli
```

## Validation

### Validate Configuration File

```bash
# Check if configuration is valid
npx @esteban-url/create-cli config validate

# Validate specific file
npx @esteban-url/create-cli config validate ./my-config.json
```

### Schema Validation

Use JSON Schema for IDE support:

```json
{
  "$schema": "https://raw.githubusercontent.com/esteban-url/trailhead/main/packages/create-cli/schema.json",
  "packageManager": "pnpm"
  // IDE will provide autocomplete and validation
}
```

## Troubleshooting

### Configuration Not Loading

1. Check file location:

   ```bash
   ls -la ~/.createclirc.json
   ```

2. Validate JSON syntax:

   ```bash
   cat ~/.createclirc.json | jq .
   ```

3. Check precedence:
   ```bash
   # Shows where config is loaded from
   npx @esteban-url/create-cli config list --verbose
   ```

### Conflicting Settings

Command line arguments always win:

```bash
# Config file has packageManager: "npm"
# But CLI argument overrides it
npx @esteban-url/create-cli my-cli --package-manager pnpm
```

### Permission Issues

```bash
# Fix permissions
chmod 644 ~/.createclirc.json

# Fix ownership
chown $USER:$USER ~/.createclirc.json
```

## Best Practices

### 1. Version Control

Don't commit personal preferences:

```bash
# .gitignore
.createclirc.json
*.createclirc.json
```

### 2. Document Team Settings

Create a README for team configuration:

````markdown
# Team CLI Configuration

Copy `.createclirc.example.json` to `.createclirc.json`:

\```bash
cp .createclirc.example.json .createclirc.json
\```

This ensures consistent project generation across the team.
````

### 3. Environment-Specific

Use different configs for different environments:

```bash
# Development
alias create-cli-dev='CREATE_CLI_CONFIG=~/.createclirc.dev.json npx @esteban-url/create-cli'

# Production
alias create-cli-prod='CREATE_CLI_CONFIG=~/.createclirc.prod.json npx @esteban-url/create-cli'
```

### 4. Regular Updates

Keep configuration current:

```bash
# Add to shell profile
alias update-cli-config='curl -o ~/.createclirc.json https://company.com/cli-config.json'
```

## Integration Examples

### With npm Scripts

```json
{
  "scripts": {
    "create:cli": "create-cli",
    "create:lib": "create-cli --type library",
    "create:mono": "create-cli --type monorepo-package"
  }
}
```

### With Shell Aliases

```bash
# ~/.bashrc or ~/.zshrc
alias newcli='npx @esteban-url/create-cli'
alias newlib='npx @esteban-url/create-cli --type library'
alias newmono='npx @esteban-url/create-cli --type monorepo-package'
```

### With Makefiles

```makefile
.PHONY: new-cli
new-cli:
	@npx @esteban-url/create-cli $(name) \
		--package-manager pnpm \
		--features config,testing \
		--include-docs

.PHONY: new-package
new-package:
	@npx @esteban-url/create-cli packages/$(name) \
		--type monorepo-package \
		--skip-install
```

## Next Steps

- Explore [Custom Templates](/packages/create-cli/how-to/customize-templates)
- Learn about [Custom Prompts](/packages/create-cli/how-to/custom-prompts)
- Review [Configuration Schema](/packages/cli/reference/config)
