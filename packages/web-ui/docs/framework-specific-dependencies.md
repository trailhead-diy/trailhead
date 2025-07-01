# Framework-Specific Dependencies

Trailhead UI now supports framework-specific dependency installation. This means that only the dependencies required for your specific framework will be installed, reducing bundle size and avoiding unnecessary packages.

## How It Works

The installation system detects your framework and installs only the required dependencies:

### Core Dependencies (All Frameworks)
These dependencies are installed for all frameworks:
- `@headlessui/react` - UI components
- `@heroicons/react` - Icon library
- `framer-motion` - Animation library
- `clsx` - Class name utility
- `culori` - Color manipulation
- `tailwind-merge` - Tailwind class merging
- `next-themes` - Theme management
- `tailwindcss` - CSS framework

### Framework-Specific Dependencies

#### Vite & RedwoodSDK
- `@tailwindcss/vite` - Tailwind CSS Vite plugin for optimal performance

#### Next.js
- No additional dependencies (uses Next.js built-in CSS support)

#### Generic React
- No additional dependencies

## Installation Examples

The CLI automatically detects your framework and installs the appropriate dependencies:

```bash
# Next.js project (won't install @tailwindcss/vite)
trailhead-ui install

# Vite project (will install @tailwindcss/vite)
trailhead-ui install

# Force a specific framework
trailhead-ui install --framework vite
```

## Dry Run to Preview Dependencies

You can use the `--dry-run` flag to see which dependencies would be installed:

```bash
trailhead-ui install --dry-run
```

This will show you:
- Which dependencies would be added
- Which files would be installed
- No actual changes will be made

## Manual Framework Selection

If the automatic detection doesn't work correctly, you can manually specify your framework:

```bash
# For Next.js
trailhead-ui install --framework nextjs

# For Vite
trailhead-ui install --framework vite

# For RedwoodSDK
trailhead-ui install --framework redwood-sdk

# For generic React apps
trailhead-ui install --framework generic-react
```

## Benefits

1. **Smaller Bundle Size**: Only install what you need
2. **Faster Installation**: Fewer dependencies to download
3. **Framework Optimization**: Each framework gets its optimal setup
4. **Compatibility**: Avoid conflicts with framework-specific tools

## Technical Details

The dependency system uses a modular approach:

1. **Core Dependencies**: Required by all frameworks for the component library
2. **Framework Dependencies**: Additional packages specific to each framework
3. **Legacy Mode**: When no framework is specified, all dependencies are installed for backward compatibility

This ensures that existing installations continue to work while new installations benefit from the optimized dependency set.