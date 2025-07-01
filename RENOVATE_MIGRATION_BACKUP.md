# Renovate Migration Backup Documentation

## Current Dependabot Configuration Backup

This file documents the current Dependabot setup for rollback purposes.

### Original .github/dependabot.yml Configuration

```yaml
version: 2
updates:
  # npm dependencies
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "03:00"
    open-pull-requests-limit: 10
    groups:
      # Group all non-major updates together
      dependencies:
        patterns:
          - "*"
        update-types:
          - "minor"
          - "patch"
    labels:
      - "dependencies"
      - "npm"
    assignees:
      - "esteban-url"
    commit-message:
      prefix: "chore"
      prefix-development: "chore"
      include: "scope"
    ignore:
      # Major versions we want to update manually
      - dependency-name: "react"
        update-types: ["version-update:semver-major"]
      - dependency-name: "react-dom"
        update-types: ["version-update:semver-major"]
      - dependency-name: "typescript"
        update-types: ["version-update:semver-major"]
      - dependency-name: "tailwindcss"
        update-types: ["version-update:semver-major"]

  # GitHub Actions
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "03:00"
    labels:
      - "dependencies"
      - "github-actions"
    assignees:
      - "esteban-url"
    commit-message:
      prefix: "ci"
```

### Current pnpm Configuration Files

#### Root .npmrc

```
# pnpm configuration for optimal performance

# Use hard links when possible to save disk space
# This can significantly reduce node_modules size
prefer-workspace-packages=true

# Store all packages in a global store and hard link them
# This saves disk space and speeds up installations
store-dir=~/.pnpm-store

# Fail if peer dependencies are not installed
# This helps catch missing dependencies early
strict-peer-dependencies=true

# Don't hoist packages to the root node_modules
# This ensures better isolation and fewer conflicts
hoist=false

# Use the highest version of a package when there are duplicates
# This reduces bundle size
resolution-mode=highest

# Automatically install peer dependencies
# This prevents "unmet peer dependency" warnings
auto-install-peers=true

# Deduplicate packages after installation
# This reduces node_modules size
dedupe-peer-dependents=true

# Use symlinks for workspace packages
# This ensures changes are immediately reflected
link-workspace-packages=true

# Save exact versions in package.json
# This ensures reproducible builds
save-exact=false

# Enable strict SSL (security best practice)
strict-ssl=true

# Set concurrent network requests
# Adjust based on your network speed
network-concurrency=16

# Disable scripts for security when installing
# Enable only for trusted packages
ignore-scripts=false

# Enable package provenance when publishing
publish-branch=main
```

#### Next.js Demo .npmrc

```
# Configure this Next.js demo to work independently from parent workspace
# This makes npm/pnpm install work normally without flags

# Automatically ignore workspace - this is the key setting!
ignore-workspace=true

# Prevents husky and other parent scripts from running
enable-pre-post-scripts=false

# Peer dependency handling
auto-install-peers=true
strict-peer-dependencies=false

# Disable workspace hoisting to avoid conflicts
hoist=false
hoist-pattern=
shamefully-hoist=false

# Don't link to workspace packages
link-workspace-packages=false
```

### Current Lockfile Structure

Multiple pnpm-lock.yaml files exist:

- `./pnpm-lock.yaml` (root workspace)
- `./packages/web-ui/pnpm-lock.yaml` (redundant)
- `./apps/demos/next/pnpm-lock.yaml` (needed for ignore-workspace)
- `./apps/demos/rwsdk/pnpm-lock.yaml` (needed for ignore-workspace)

### Issues Identified

1. **Dependabot Error**: "Missing or invalid configuration while installing peer dependencies"
2. **Root Cause**: Dependabot has limited pnpm workspace support
3. **Conflicting Settings**: Root has `strict-peer-dependencies=true`, demos have `strict-peer-dependencies=false`
4. **Multiple Lockfiles**: Non-standard for pnpm workspaces (except demo apps with ignore-workspace)

### Rollback Process

If Renovate migration fails:

1. `git checkout main`
2. `git branch -D renovate-migration`
3. Restore `.github/dependabot.yml` from this backup
4. Remove `renovate.json` if created
5. Disable Renovate GitHub App
6. Re-enable Dependabot in repository settings

### Migration Date

**Started**: 2025-07-01
**Branch**: renovate-migration
**Status**: In Progress
