---
type: how-to
title: Package Registry Configuration
description: Configure npm/pnpm for GitHub Packages in the Trailhead monorepo
---

# Package Registry Configuration

This document explains how to configure npm/pnpm for GitHub Packages in the Trailhead monorepo.

## Overview

The Trailhead packages are published to GitHub Packages, which requires authentication. To avoid warnings in environments without `GITHUB_TOKEN`, we've separated the GitHub-specific configuration.

## Configuration Files

- **`.npmrc`** - Base pnpm configuration (no authentication required)
- **`.npmrc.github`** - GitHub Packages authentication (requires GITHUB_TOKEN)
- **`.npmrc.local`** - Local overrides (git ignored)

## For Contributors

When contributing to Trailhead, you don't need GitHub authentication unless you're:
- Publishing packages
- Installing private @trailhead packages

The base `.npmrc` configuration will work for all development tasks.

## For Package Publishing

1. **Set up GitHub Token**:
   ```bash
   export GITHUB_TOKEN=your_github_token
   ```

2. **Use the setup script** (recommended):
   ```bash
   ./scripts/setup-npm-auth.sh
   ```

3. **Or manually configure**:
   ```bash
   cat .npmrc.github >> .npmrc.local
   ```

## For CI/CD

The GitHub Actions workflows automatically handle authentication:
- Public workflows: Work without GITHUB_TOKEN (no warnings)
- Publishing workflows: Use GITHUB_TOKEN via secrets

## Troubleshooting

### "Failed to replace env in config: ${GITHUB_TOKEN}"

This warning is harmless and can be ignored. It occurs when:
- GITHUB_TOKEN is not set in your environment
- You're not publishing packages
- You're working on a fork

To suppress the warning locally:
```bash
# Option 1: Set a dummy token
export GITHUB_TOKEN=not-needed

# Option 2: Use base configuration only
mv .npmrc .npmrc.backup
grep -v "npm.pkg.github.com" .npmrc.backup > .npmrc
```

### Can't install @trailhead packages

If you need to install published @trailhead packages:
1. Create a GitHub personal access token with `read:packages` scope
2. Set `GITHUB_TOKEN` environment variable
3. Run `./scripts/setup-npm-auth.sh`