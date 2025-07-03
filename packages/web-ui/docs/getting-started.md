# Getting Started

Learn how to use Trailhead UI components and theming in your application.

## Prerequisites

Before you begin, install @esteban-url/trailhead-web-ui in your project:

```bash
# Option 1: Install CLI globally
pnpm add -g github:esteban-url/trailhead#packages/web-ui
trailhead-ui install

# Option 2: Install locally from GitHub
pnpm add github:esteban-url/trailhead#packages/web-ui
pnpm trailhead-ui install
```

For detailed installation instructions, see the [Installation Guide](./installation.md).

## CLI Workflow (Recommended)

The CLI provides the fastest way to get started:

```bash
# Interactive installation - CLI will guide you through setup
trailhead-ui install  # if installed globally
# or
pnpm trailhead-ui install  # if installed locally

# Or specify your framework directly
trailhead-ui install --framework nextjs

# Preview what will be installed
trailhead-ui install --dry-run
```

The CLI will:

- 🔍 **Detect your framework** automatically (Next.js, Vite, etc.)
- 📦 **Install all 27 components** with semantic color tokens
- 🎨 **Set up theme system** with 8 predefined themes
- ⚙️ **Generate configuration** files for your framework
- 🔗 **Install dependencies** automatically
- 🌈 **Transform colors** to semantic tokens for theming

After CLI installation, you can immediately start using components!

## Basic Setup

### 1. Wrap Your App (CLI does this automatically)

If you used the CLI, this is already set up. For manual setup:

```tsx
import { ThemeProvider } from '@esteban-url/trailhead-web-ui'

function App() {
  return (
    <ThemeProvider defaultTheme="zinc" enableSystem>
      <YourApplication />
    </ThemeProvider>
  )
}
```

### 2. Use Components (Available after CLI installation)

```tsx
import { Button, Input, Badge } from '@esteban-url/trailhead-web-ui'

function Example() {
  return (
    <div className="p-6 bg-card text-card-foreground border border-border rounded-lg">
      <h2 className="text-lg font-semibold mb-4">Welcome</h2>
      <Input placeholder="Enter your name" className="mb-4" />
      <div className="flex gap-2">
        <Button>Submit</Button>
        <Badge color="primary">New</Badge>
      </div>
    </div>
  )
}
```

## CLI vs Manual Setup Comparison

| Feature                    | CLI Installation           | Manual Setup                    |
| -------------------------- | -------------------------- | ------------------------------- |
| **Framework Detection**    | ✅ Automatic               | ❌ Manual configuration         |
| **Theme Setup**            | ✅ Complete with 8 themes  | ❌ Manual theme configuration   |
| **Component Installation** | ✅ All 27 components       | ❌ Manual component copying     |
| **Configuration Files**    | ✅ Generated automatically | ❌ Manual creation              |
| **Dependencies**           | ✅ Installed automatically | ❌ Manual installation          |
| **Color Transformation**   | ✅ Semantic tokens applied | ❌ Manual transformation needed |
| **Setup Time**             | ⚡ ~2 minutes              | 🐌 ~30 minutes                  |

## Theme Switching

### Simple Theme Switcher

```tsx
import { useTheme } from '@esteban-url/trailhead-web-ui'

function ThemeToggle() {
  const { currentTheme, setTheme, themes } = useTheme()

  return (
    <select
      value={currentTheme || 'zinc'}
      onChange={(e) => setTheme(e.target.value)}
      className="rounded-md border border-input"
    >
      {themes.map((theme) => (
        <option key={theme} value={theme}>
          {theme}
        </option>
      ))}
    </select>
  )
}
```

### Dark Mode Toggle

```tsx
import { useTheme, Button } from '@esteban-url/trailhead-web-ui'

function DarkModeToggle() {
  const { isDark, toggleDarkMode } = useTheme()

  return (
    <Button onClick={toggleDarkMode} outline>
      {isDark ? '☀️ Light' : '🌙 Dark'}
    </Button>
  )
}
```

## Using Semantic Colors

All components use semantic color tokens that adapt to themes:

```tsx
// These colors automatically change with the theme
<div className="bg-background text-foreground">
  <div className="border border-border rounded-lg p-4">
    <h3 className="text-primary">Primary Heading</h3>
    <p className="text-muted-foreground">Secondary text</p>
    <Button className="bg-primary text-primary-foreground">Action</Button>
  </div>
</div>
```

## Available Themes

Trailhead UI includes multiple built-in themes:

### Color Themes

- `red` - Vibrant red theme
- `rose` - Soft rose theme
- `orange` - Warm orange theme
- `yellow` - Bright yellow theme
- `green` - Fresh green theme
- `blue` - Cool blue theme
- `violet` - Rich violet theme

### Special Themes

- `catalyst` - Original Catalyst UI theme (default)

## Common Patterns

### Form with Validation

```tsx
import { Input, Button, cn } from '@esteban-url/trailhead-web-ui'
import { useState } from 'react'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.includes('@')) {
      setError('Invalid email')
      return
    }
    // Handle submission
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className={cn(error && 'border-destructive')}
        />
        {error && <p className="text-sm text-destructive mt-1">{error}</p>}
      </div>
      <Button type="submit">Sign In</Button>
    </form>
  )
}
```

### Loading States

```tsx
import { Button } from '@esteban-url/trailhead-web-ui'
import { useState } from 'react'

function LoadingExample() {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    await doSomething()
    setLoading(false)
  }

  return (
    <Button onClick={handleClick} disabled={loading}>
      {loading ? 'Loading...' : 'Click Me'}
    </Button>
  )
}
```

## Server-Side Rendering

Trailhead UI works with SSR frameworks like Next.js:

```tsx
// app/page.tsx (Next.js App Router)
import { Button, Card } from '@esteban-url/trailhead-web-ui'

export default function Page() {
  return (
    <Card>
      <h1>Server Rendered</h1>
      <Button>Interactive on Client</Button>
    </Card>
  )
}
```

## Next Steps

- [Configuration](./configuration.md) - Customize themes and settings
- [Components](./components.md) - Explore all components
- [Examples](./examples.md) - More code examples
- [Theme Registry](./theme-registry.md) - Advanced theme management
