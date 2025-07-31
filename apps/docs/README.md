# Trailhead Documentation Site

This is the unified documentation site for the Trailhead monorepo, built with Docusaurus v3.

## Overview

The documentation site aggregates and exposes all documentation from the monorepo packages while maintaining the Diátaxis framework standards. Each package has its own documentation section with independent routing and navigation.

## Structure

- **Main Documentation** (`/docs/*`) - Monorepo-level documentation from `/docs` folder
- **Package Documentation** (`/packages/*`) - Individual package documentation
  - `/packages/cli` - CLI Framework documentation
  - `/packages/create-cli` - Create CLI documentation
  - `/packages/core` - Core utilities documentation
  - `/packages/config` - Configuration management documentation
  - `/packages/data` - Data processing documentation
  - `/packages/fs` - File system operations documentation
  - `/packages/validation` - Validation utilities documentation

## Development

From the monorepo root:

```bash
# Start development server
pnpm docs:dev

# Build documentation site
pnpm docs:build

# Serve built site locally
pnpm docs:serve
```

From this directory:

```bash
# Install dependencies (if not done from root)
pnpm install

# Start development server
pnpm dev

# Build site
pnpm build

# Serve built site
pnpm serve
```

## Configuration

### Search

The site is configured to use Algolia DocSearch. To enable search:

1. Apply for [Algolia DocSearch](https://docsearch.algolia.com/)
2. Update the credentials in `docusaurus.config.ts`:

```typescript
algolia: {
  appId: 'YOUR_APP_ID',
  apiKey: 'YOUR_SEARCH_API_KEY',
  indexName: 'trailhead',
  contextualSearch: true,
  searchPagePath: 'search',
},
```

### Adding New Package Documentation

1. Add a new plugin instance in `docusaurus.config.ts`:

```typescript
[
  '@docusaurus/plugin-content-docs',
  {
    id: 'package-name',
    path: '../../packages/package-name/docs',
    routeBasePath: 'packages/package-name',
    sidebarPath: './sidebars-package-name.ts',
    editUrl: 'https://github.com/esteban-url/trailhead/tree/main/',
    showLastUpdateTime: true,
    showLastUpdateAuthor: true,
  },
],
```

2. Create a sidebar configuration file `sidebars-package-name.ts`

3. Add navigation links to the navbar in `docusaurus.config.ts`

## Deployment

The site can be deployed to various platforms:

### GitHub Pages

```bash
# Build and deploy to GitHub Pages
GIT_USER=<GITHUB_USERNAME> pnpm deploy
```

### Vercel/Netlify

1. Connect your repository
2. Set build command: `pnpm docs:build`
3. Set output directory: `apps/docs/build`

## Documentation Standards

All documentation must follow the Diátaxis framework:

- **Tutorials** - Learning-oriented, step-by-step guides
- **How-To Guides** - Task-oriented, problem-solving guides
- **Reference** - Information-oriented, technical descriptions
- **Explanations** - Understanding-oriented, conceptual discussions

See the [documentation standards](../../docs/reference/documentation-standards.md) for detailed guidelines.

## Troubleshooting

### Build Errors

If you encounter build errors related to missing documentation files:

1. Ensure all referenced files in sidebar configurations exist
2. Check that frontmatter is properly formatted in all Markdown files
3. Verify that all internal links are valid

### Search Not Working

If search is not functioning:

1. Verify Algolia credentials are correct
2. Ensure the site has been indexed by Algolia
3. Check browser console for errors

### Broken Links

The build process will fail on broken links by default. To fix:

1. Run `pnpm docs:validate-links` from the monorepo root
2. Fix any reported broken links
3. Use `pnpm docs:fix-links` to automatically fix common issues
