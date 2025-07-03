# Installation

This guide covers installing Trailhead UI in your project.

## Prerequisites

- Node.js 18+
- React 18+ or 19+
- Tailwind CSS 3.4+ or 4.0+
- GitHub access (for private repository installation)

## Package Installation

@esteban-url/trailhead-web-ui is distributed as a private package via GitHub. Install directly from the monorepo:

```bash
# Install from GitHub repository (monorepo)
pnpm add github:esteban-url/trailhead#packages/web-ui

# With specific version/branch
pnpm add github:esteban-url/trailhead#main#packages/web-ui
pnpm add github:esteban-url/trailhead#v1.0.0#packages/web-ui

# Install peer dependencies
pnpm add next-themes react react-dom
```

## CLI Installation (Recommended)

The CLI provides the best installation experience with automatic framework detection, interactive prompts, and comprehensive setup.

### CLI Binary Names

The CLI is available under three different binary names for your convenience:

- `trailhead-ui` - Primary command name
- `trailhead-web-ui` - Alternative full name
- `thui` - Short alias for quick typing

All three commands work identically. Use whichever you prefer:

```bash
# Option 1: Install CLI globally for frequent use
pnpm add -g github:esteban-url/trailhead#packages/web-ui
trailhead-ui install

# Option 2: Install locally and use directly
pnpm add github:esteban-url/trailhead#packages/web-ui
pnpm trailhead-ui install

# Quick installation for specific framework
trailhead-ui install --framework nextjs

# Dry run to see what would be installed
trailhead-ui install --dry-run

# Custom destination directory
trailhead-ui install --destination-dir components/th

# Force overwrite existing files
trailhead-ui install --force

# Skip configuration file generation
trailhead-ui install --no-config

# Always overwrite config files without prompting
trailhead-ui install --overwrite

# Interactive mode (default if no options provided)
trailhead-ui install --interactive

# Verbose output for debugging
trailhead-ui install --verbose

# Install components without wrapper files (simpler structure)
trailhead-ui install --no-wrappers

# Show all available options
trailhead-ui install --help

# Using the short alias 'thui' for convenience
thui install                     # Same as trailhead-ui install
thui install --framework nextjs  # Quick framework-specific install
thui install --dry-run          # Preview changes with short command
```

### CLI Command Reference

| Option                         | Description                                                      | Default         |
| ------------------------------ | ---------------------------------------------------------------- | --------------- |
| `-f, --framework <type>`       | Framework type: `nextjs`, `vite`, `redwood-sdk`, `generic-react` | Auto-detected   |
| `-d, --destination-dir <path>` | Destination directory for components                             | `components/th` |
| `--catalyst-dir <path>`        | Path to catalyst-ui-kit directory (if custom location)           | Auto-detected   |
| `--force`                      | Overwrite existing component files                               | `false`         |
| `--dry-run`                    | Show what would be done without making changes                   | `false`         |
| `--no-config`                  | Skip generating configuration files                              | `false`         |
| `--overwrite`                  | Always overwrite config files without prompting                  | `false`         |
| `-i, --interactive`            | Run in interactive mode                                          | `true`          |
| `-v, --verbose`                | Show detailed output                                             | `false`         |
| `--no-wrappers`                | Install components without wrapper files                         | `false`         |
| `-h, --help`                   | Show help message                                                | -               |

### What the CLI Does

The `trailhead-ui install` command will:

1. **Detect your framework** - Automatically identifies Next.js, Vite, RedwoodJS, or generic React
2. **Install components** - Copy all 27 Catalyst UI components with semantic color tokens
3. **Set up theme system** - Install theme builder, registry, and 8 predefined themes
4. **Configure your project** - Update Tailwind config and create necessary files
5. **Handle dependencies** - Verify and install required peer dependencies
6. **Apply semantic tokens** - Components use semantic colors for consistent theming

All components and theme files are copied directly into your project, giving you full control and customization ability.

### Component Structure Options

The CLI offers two ways to install components:

#### With Wrappers (Default)

```
components/th/
├── button.tsx          (wrapper component)
├── alert.tsx           (wrapper component)
├── lib/
│   ├── catalyst-button.tsx    (Catalyst implementation)
│   ├── catalyst-alert.tsx     (Catalyst implementation)
│   └── ...
└── ...
```

- **Benefits**: Easier customization, clear separation between your code and library code
- **Use when**: You want to customize components or add your own logic

#### Without Wrappers (`--no-wrappers`)

```
components/th/
├── button.tsx          (transformed component)
├── alert.tsx           (transformed component)
└── ... (no lib directory)
```

- **Benefits**: Simpler structure, fewer files, less indirection
- **Use when**: You want a minimal setup and don't need extensive customization

Both options provide the same component API (`Button`, `Alert`, etc.), so you can switch between them without changing your imports.

## Global Installation (Optional)

For frequent use across multiple projects, install the CLI globally:

```bash
# Install globally from GitHub
pnpm add -g github:esteban-url/trailhead#packages/web-ui

# Verify installation
trailhead-ui --version

# Then use the command directly in any project
trailhead-ui install
trailhead-ui install --framework nextjs --dry-run
```

## Troubleshooting

### Common Issues

**Command not found: `trailhead-ui`**

```bash
# Ensure the package is installed correctly
pnpm list @esteban-url/trailhead-web-ui

# Try using pnpm exec instead
pnpm exec trailhead-ui install

# For global installation, check PATH
npm config get prefix
```

**Permission errors during installation**

```bash
# Use pnpm with sudo (not recommended)
sudo pnpm add -g github:esteban-url/trailhead#packages/web-ui

# Better: Use nvm or configure pnpm properly
pnpm config set prefix ~/.pnpm-global
export PATH=~/.pnpm-global/bin:$PATH
```

**GitHub authentication issues**

```bash
# Check if you have access to the repository
git clone https://github.com/esteban-url/trailhead.git

# Ensure proper GitHub authentication (see Authentication section above)
```

**CLI installation fails**

```bash
# Use verbose mode to see detailed error information
pnpm trailhead-ui install --verbose

# Try dry run first to identify issues
pnpm trailhead-ui install --dry-run
```

## Authentication Requirements

Since Trailhead UI is distributed as a private GitHub repository, you need proper GitHub authentication:

### GitHub Token Setup

1. Create a GitHub Personal Access Token with `repo` access
2. Configure npm to use the token:

```bash
# Set up pnpm authentication for GitHub packages
pnpm config set @esteban-url:registry https://npm.pkg.github.com
pnpm config set //npm.pkg.github.com/:_authToken YOUR_GITHUB_TOKEN
```

### SSH Key Setup (Alternative)

If you have SSH access to the repository:

```bash
# Configure git to use SSH for GitHub
git config --global url."ssh://git@github.com/".insteadOf "https://github.com/"
```

## Peer Dependencies

The CLI will automatically detect and install required peer dependencies, but you can install them manually if needed:

```bash
pnpm add next-themes @headlessui/react clsx tailwind-merge
```

## Tailwind Configuration

### Tailwind v3

The CLI automatically updates your `tailwind.config.js`:

```js
module.exports = {
  content: [
    './components/**/*.{js,ts,jsx,tsx}',
    // your other content paths
  ],
  theme: {
    extend: {
      // Theme tokens are applied via CSS custom properties
    },
  },
}
```

### Tailwind v4

For Tailwind v4 projects, add the component paths to your CSS:

```css
@import 'tailwindcss';
@import './components/th/styles.css';
```

## TypeScript Setup

Trailhead UI includes TypeScript definitions. For the best experience:

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true
  }
}
```

## Next.js Setup

For Next.js projects, add to your root layout:

```tsx
// app/layout.tsx
import { ThemeProvider } from '@esteban-url/trailhead-web-ui'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
```

## Verification

Test your installation:

```tsx
import { Button } from '@esteban-url/trailhead-web-ui'

export function App() {
  return <Button>Hello Trailhead UI!</Button>
}
```

## Next Steps

- [Getting Started](./getting-started.md) - Basic usage and examples
- [Configuration](./configuration.md) - Theme customization
- [Components](./components.md) - Component reference
