# GitHub Packages Private npm Registry Setup Guide

This guide provides comprehensive instructions for setting up a private npm package registry using GitHub Packages, ensuring only authorized users can access your packages.

## Overview

GitHub Packages is a private package registry that integrates with GitHub repositories, providing secure package distribution separate from the public npm registry. Packages are private by default and inherit repository permissions.

## Prerequisites

- GitHub repository (private recommended)
- GitHub Personal Access Token
- npm installed locally
- Organization or user namespace for scoped packages

## Step 1: Repository Setup

1. Create a private GitHub repository for your package:

   ```bash
   # Example: github.com/trailhead/your-package-name
   ```

2. Clone the repository locally:

   ```bash
   git clone https://github.com/trailhead/your-package-name.git
   cd your-package-name
   ```

## Step 2: Personal Access Token Creation

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with these scopes:
   - `read:packages` - Download packages
   - `write:packages` - Publish packages  
   - `repo` - Access private repositories
   - `delete:packages` - Delete packages (optional)

3. Save the token securely - you won't see it again

## Step 3: Package Configuration

### package.json Setup

```json
{
  "name": "@trailhead/your-package-name",
  "version": "1.0.0",
  "private": true,
  "description": "Your package description",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "publishConfig": {
    "registry": "https://npm.pkg.github.com",
    "@trailhead:registry": "https://npm.pkg.github.com"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/trailhead/your-package-name.git"
  }
}
```

**Key Requirements:**

- Package name MUST be scoped with `@namespace/package-name`
- Use lowercase letters only
- `private: true` ensures it won't accidentally publish to public npm
- `publishConfig` routes publishing to GitHub Packages

### .npmrc Configuration

Create `.npmrc` in your project root:

```
@trailhead:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
always-auth=true
```

**Security Note:** Use environment variable for token, never hardcode it.

## Step 4: Authentication Setup

### Local Development

Set environment variable:

```bash
# macOS/Linux
export GITHUB_TOKEN=your_personal_access_token

# Windows
set GITHUB_TOKEN=your_personal_access_token
```

### Global npm Configuration (Alternative)

Edit `~/.npmrc`:

```
@trailhead:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=your_personal_access_token
```

## Step 5: Publishing Your Package

1. Build your package (if applicable):

   ```bash
   npm run build
   ```

2. Publish to GitHub Packages:

   ```bash
   npm publish
   ```

3. Verify publication:
   - Check GitHub repository → Packages tab
   - Package should appear as private

## Step 6: Installing Private Packages

### For Package Consumers

1. **Authentication Required:** Users need:
   - Repository access (collaborator, organization member, or public if package is public)
   - Personal access token with `read:packages` scope

2. **Configure .npmrc** in consuming project:

   ```
   @trailhead:registry=https://npm.pkg.github.com
   //npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
   ```

3. **Install package:**

   ```bash
   npm install @trailhead/your-package-name
   ```

### For Multiple Organizations

If consuming packages from multiple GitHub organizations:

```
@trailhead:registry=https://npm.pkg.github.com
@company:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

## Step 7: CI/CD Integration

### GitHub Actions

```yaml
name: Publish Package

on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          registry-url: 'https://npm.pkg.github.com'
          scope: '@trailhead'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build package
        run: npm run build
      
      - name: Publish package
        run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Access Control and Security

### Repository-Level Access

By default, packages inherit repository permissions:

- **Private repo** → Private package
- **Repository collaborators** → Package access
- **Organization members** → Access based on org settings

### Fine-Grained Permissions

Override repository inheritance:

1. Go to repository → Packages
2. Select your package
3. Configure custom access permissions
4. Grant access to specific users/teams

### Package Visibility Options

- **Private:** Only authorized users
- **Internal:** All organization members (GitHub Enterprise)
- **Public:** Anyone (with authentication still required for private repos)

## Security Best Practices

### Token Management

- ✅ Use environment variables for tokens
- ✅ Rotate tokens regularly (recommended: 90 days)
- ✅ Use minimal required scopes
- ✅ Use `GITHUB_TOKEN` in CI/CD when possible
- ❌ Never commit tokens to repositories

### Access Control

- ✅ Link packages to private repositories
- ✅ Use organization teams for group access
- ✅ Review package access regularly
- ✅ Enable package audit logging (Enterprise)
- ❌ Don't share personal access tokens

### Package Security

- ✅ Scan packages for vulnerabilities
- ✅ Use semantic versioning
- ✅ Sign packages when possible
- ✅ Monitor package downloads
- ❌ Don't include secrets in package code

## Troubleshooting

### Common Issues

**Authentication Failed:**

```bash
npm ERR! 401 Unauthorized
```

- Verify token has correct scopes
- Check token expiration
- Ensure correct registry configuration

**Package Not Found:**

```bash
npm ERR! 404 Not Found
```

- Verify package name spelling
- Check if you have access to the repository
- Confirm registry configuration

**Publishing Failed:**

```bash
npm ERR! 403 Forbidden
```

- Verify `write:packages` scope
- Check if package name conflicts
- Ensure you're authenticated

### Debugging Commands

```bash
# Check npm configuration
npm config list

# Verify authentication
npm whoami --registry=https://npm.pkg.github.com

# Test package installation
npm view @trailhead/your-package-name --registry=https://npm.pkg.github.com
```

## Migration from Public npm

### Updating Existing Projects

1. **Update package.json:**
   - Add scope to package name
   - Add `publishConfig`
   - Update repository URL

2. **Create .npmrc:**
   - Configure GitHub Packages registry
   - Set up authentication

3. **Update CI/CD:**
   - Configure GitHub Actions with proper permissions
   - Update deployment scripts

4. **Notify consumers:**
   - Provide migration instructions
   - Share authentication setup guide

## Cost Considerations

### GitHub Packages Pricing

- **Free tier:** 500MB storage, 1GB bandwidth
- **Pro/Team:** Additional storage and bandwidth
- **Enterprise:** Unlimited private packages

### Storage Optimization

- Use `.npmignore` to exclude unnecessary files
- Optimize package size
- Clean up old versions periodically

## Additional Resources

- [GitHub Packages Documentation](https://docs.github.com/en/packages)
- [npm registry Documentation](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry)
- [Package Security Best Practices](https://docs.github.com/en/packages/learn-github-packages/about-permissions-for-github-packages)

## Support

For issues with GitHub Packages:

1. Check GitHub Status page
2. Review GitHub Community discussions
3. Contact GitHub Support (paid plans)
4. Check repository-specific issues
