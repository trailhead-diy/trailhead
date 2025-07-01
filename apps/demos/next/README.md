# Next.js Demo - Trailhead UI

A Next.js application demonstrating @trailhead/web-ui components and theming system.

**Part of the [Trailhead Monorepo](../../../README.md)** - This demo showcases the UI library in action.

## 🚀 Features

- **Next.js 15.3.4** - Latest version with App Router
- **React 19** - Latest React with Server Components
- **TypeScript** - Full type safety with strict configuration
- **Tailwind CSS 4** - Modern utility-first CSS framework
- **@trailhead/web-ui** - All 26 components with theme system
- **21 Built-in Themes** - Professional themes with dark mode support
- **ESLint** - Code quality and consistency

## 🏗️ Architecture

This demo follows core development principles:

- **KISS (Keep It Simple, Stupid)** - Minimal, focused components
- **DRY (Don't Repeat Yourself)** - Reusable components and utilities
- **YAGNI (You Aren't Gonna Need It)** - Only essential features
- **Single Responsibility** - Each component does one thing well
- **Type Safety** - Comprehensive TypeScript coverage
- **Functional Patterns** - Pure functions and immutable data

## 📁 Project Structure

```
apps/demos/next/
├── app/
│   ├── globals.css           # Global styles with theme CSS
│   ├── layout.tsx            # Root layout with ThemeProvider
│   ├── page.tsx              # Component showcase page
│   └── [component]/          # Individual component demo pages
│       └── page.tsx          # Component-specific examples
├── components/
│   ├── demo-layout.tsx       # Shared demo layout
│   └── th/                   # Trailhead UI components
│       ├── *.tsx             # Component wrappers
│       ├── lib/              # Catalyst implementations
│       └── theme/            # Theme system
├── next.config.ts            # Next.js configuration
├── tsconfig.json             # TypeScript configuration
└── package.json              # Dependencies and scripts
```

## 🛠️ Development

### From Monorepo Root (Recommended)

```bash
# Install all dependencies
pnpm install

# Run the Next.js demo
pnpm dev --filter=next-demo

# Build the demo
pnpm build --filter=next-demo

# Lint the demo
pnpm lint --filter=next-demo
```

### From Demo Directory

```bash
# Navigate to demo
cd apps/demos/next

# Install dependencies (if not done from root)
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Lint code
pnpm lint
```

## 🎯 Development Server

The app will be available at [http://localhost:3000](http://localhost:3000) with:

- **Hot reload** - Instant updates during development
- **Turbopack** - Fast bundling for development
- **Type checking** - Real-time TypeScript validation
- **ESLint** - Code quality checks

## 🔧 Configuration

### TypeScript
- Strict type checking enabled
- Modern ES2022 target
- Path aliases configured (`@/*`)
- Enhanced type safety options

### Next.js
- React Strict Mode enabled
- Image optimization configured
- Type checking during build
- ESLint validation during build

### Tailwind CSS
- Modern utility classes
- Dark mode support
- Responsive design
- Optimized for production

## 🎨 Styling & Theming

The app uses @trailhead/web-ui's comprehensive theming system:

- **Semantic color tokens** - Consistent colors across all components
- **21 Built-in themes** - Professional themes using OKLCH color space
- **Dark mode support** - Automatic system preference detection
- **Runtime theme switching** - Change themes without page reload
- **Theme persistence** - Remembers user's theme choice
- **Responsive design** - Mobile-first approach
- **Accessibility** - WCAG compliant focus states and semantic HTML

## 📝 Code Quality

- **TypeScript strict mode** - Comprehensive type safety
- **ESLint** - Code consistency and best practices
- **Functional components** - Modern React patterns
- **Semantic HTML** - Proper heading hierarchy and structure
- **Accessibility** - WCAG compliant focus styles

## 🚢 Deployment

This app is ready for deployment on:

- [Vercel](https://vercel.com) (recommended)
- [Netlify](https://netlify.com)
- [Railway](https://railway.app)
- Any Node.js hosting platform

```bash
# Build and export
pnpm build
```

The build output will be optimized for production with automatic:
- Code splitting
- Image optimization
- CSS minification
- JavaScript bundling