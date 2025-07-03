---
title: Release Process
type: how-to
description: How to release packages in the Trailhead monorepo
---

# Release Process

This guide explains how to release packages in the Trailhead monorepo using Changesets.

## Overview

We use [Changesets](https://github.com/changesets/changesets) for:
- Automated version management
- Changelog generation
- GitHub Packages publishing
- Release coordination across linked packages

## Prerequisites

- Write access to the repository
- GitHub personal access token with `packages:write` scope

## Creating a Changeset

When you make changes that should be released:

```bash
# Add a changeset for your changes
pnpm changeset:add

# Or use the shorter alias
pnpm changeset
```

This will prompt you to:
1. Select which packages have changed
2. Choose the bump type (major/minor/patch)
3. Write a summary for the changelog

### Changeset Guidelines

- **patch**: Bug fixes, dependency updates, documentation
- **minor**: New features, non-breaking changes
- **major**: Breaking changes, major refactors

### Writing Good Changeset Summaries

```markdown
# Good examples:
- Fixed TypeScript errors in CLI command handlers
- Added support for dry-run mode in install command
- Improved error messages for file system operations
- **BREAKING**: Renamed @trailhead/* packages to @esteban-url/*

# Poor examples:
- Fixed stuff
- Updates
- Changes to code
```

## Checking Release Status

```bash
# See what will be released
pnpm changeset:status

# Check what would be published (dry run)
pnpm release:dry-run
```

## Release Workflow

### Automated Release (Recommended)

1. Merge PRs with changesets to `main`
2. The Release GitHub Action automatically:
   - Creates a "Version Packages" PR
   - Updates versions in package.json files
   - Generates CHANGELOG.md entries
   - Commits these changes
3. Review and merge the "Version Packages" PR
4. The action then:
   - Publishes packages to GitHub Packages
   - Creates GitHub releases with changelogs
   - Tags the release commit

### Manual Release

If needed, you can release manually:

```bash
# 1. Update versions and changelogs
pnpm version-packages

# 2. Commit the changes
git add .
git commit -m "chore: release packages"

# 3. Build and publish
pnpm release

# 4. Push changes and tags
git push --follow-tags
```

## Linked Packages

The CLI and Web UI packages are linked, meaning:
- They share version numbers
- They're always released together
- Internal dependencies are automatically updated

## Troubleshooting

### "No changesets found"

Create a changeset first:
```bash
pnpm changeset:add
```

### "Package not found" during publish

Ensure you're authenticated to GitHub Packages:
```bash
npm login --scope=@esteban-url --registry=https://npm.pkg.github.com
```

### Version conflicts

Check and resolve any uncommitted changes:
```bash
git status
pnpm changeset:status
```

## Best Practices

1. **One changeset per logical change** - Don't bundle unrelated changes
2. **Write for users** - Changelogs are user-facing documentation
3. **Include breaking changes** - Clearly mark with **BREAKING**
4. **Link to issues/PRs** - Use GitHub's auto-linking: `fixes #123`
5. **Review before releasing** - Check the Version Packages PR carefully

## Example Workflow

```bash
# 1. Make your changes
pnpm dev
# ... code changes ...

# 2. Test thoroughly
pnpm test
pnpm lint
pnpm types

# 3. Add a changeset
pnpm changeset:add
# Select packages, version bump, write summary

# 4. Commit everything
git add .
git commit -m "feat: add new feature with changeset"

# 5. Push and create PR
git push origin feature-branch
# Create PR on GitHub

# 6. After merge, the automation handles the rest!
```

## Emergency Procedures

### Reverting a Release

1. Revert the merge commit
2. Delete the git tag: `git push --delete origin @esteban-url/trailhead-cli@x.y.z`
3. Create a new changeset for the revert
4. Follow normal release process

### Manual Version Bump

If automation fails:
```bash
# Manually edit package.json versions
# Update CHANGELOG.md files
# Commit and tag manually
git tag @esteban-url/trailhead-cli@x.y.z
git tag @esteban-url/trailhead-web-ui@x.y.z
git push --tags
```