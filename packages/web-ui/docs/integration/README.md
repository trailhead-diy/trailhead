# Framework Integration Guides

This directory contains framework-specific integration guides for Trailhead UI.

## Available Guides

- [RedwoodSDK](./redwood-sdk.md) - Integration with RedwoodSDK projects
- [Next.js](./nextjs.md) - Integration with Next.js (App Router and Pages Router)
- [Vite](./vite.md) - Integration with Vite-based React projects
- [React](./react.md) - Generic React integration guide

## Quick Start

After installing Trailhead UI, follow these general steps:

1. **Add CSS custom properties** - Required theme variables for your framework
2. **Configure Tailwind CSS** - Map semantic tokens to CSS custom properties
3. **Add ThemeProvider** - Wrap your app with the theme context
4. **Start using components** - Import and use Trailhead UI components

## Installation

```bash
pnpm add github:esteban-url/trailhead#packages/web-ui
```

Then follow the guide for your specific framework above.

> **Note**: This documentation is part of the [Trailhead monorepo](../../../../README.md).

## Need Help?

- Check the [main documentation](../README.md)
- Review [component examples](../components.md)
- Learn about [theme configuration](../configuration.md)
