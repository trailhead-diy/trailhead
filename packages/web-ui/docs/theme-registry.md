# Dynamic Theme Management

The theme registry provides a singleton registry for theme management. It works alongside `next-themes` which handles persistence, SSR safety, and state management.

## Architecture

The theme system consists of:

- **Theme Registry** - Singleton registry for theme storage and retrieval
- **Theme Builder** - Functional API for creating themes with method chaining
- **next-themes** - Handles persistence, SSR safety, dark mode, and React state

## When to Use Dynamic Themes

The theme registry is designed specifically for scenarios where themes need to be created or loaded at runtime:

- **Database-driven themes** - Loading user/organization themes from a database
- **Theme marketplace** - Installing themes from external sources
- **User-created themes** - Interactive theme builders
- **Multi-tenant applications** - Different themes per client
- **A/B testing** - Testing theme variations dynamically
- **API-driven theming** - Loading themes from external APIs

For static themes that ship with your application, simply use the built-in themes without the registry.

## Theme Registry API

The theme registry provides methods for managing themes:

```typescript
import { themeRegistry } from '@esteban-url/trailhead-web-ui'

// Register a new theme
themeRegistry.register('my-theme', themeConfig)

// Get a theme configuration
const theme = themeRegistry.get('my-theme')

// List all available themes
const themes = themeRegistry.list()

// Remove a theme
themeRegistry.remove('my-theme')

// Clear all custom themes (keeps built-in themes)
themeRegistry.clear()

// Apply a theme to the document
themeRegistry.apply('my-theme', 'light')
```

The registry is automatically integrated with the `useTheme` hook, so registered themes are immediately available for selection.

## Real-World Examples

### 1. Loading Themes from Database

Perfect for SaaS applications with per-organization branding:

```tsx
import { useTheme, createTheme, themeRegistry } from '@esteban-url/trailhead-web-ui'
import { useEffect } from 'react'

function OrganizationApp({ orgId }: { orgId: string }) {
  const { setTheme } = useTheme()

  useEffect(() => {
    loadOrgTheme(orgId)
  }, [orgId])

  async function loadOrgTheme(orgId: string) {
    // Fetch theme from your database
    const themeData = await fetch(`/api/orgs/${orgId}/theme`).then((r) => r.json())

    // Build theme using the builder API
    const theme = createTheme(`org-${orgId}`)
      .withPrimaryColor(themeData.primaryColor)
      .withSecondaryColor(themeData.secondaryColor)
      .withBackgroundColors(themeData.background, themeData.foreground)
      .build()

    // Register the theme
    themeRegistry.register(`org-${orgId}`, theme)

    // Apply theme
    setTheme(`org-${orgId}`)
  }
}
```

### 2. Theme Marketplace Integration

Allow users to install themes from a marketplace:

```tsx
import { useTheme, themeRegistry } from '@esteban-url/trailhead-web-ui'
import { useState } from 'react'

function ThemeMarketplace() {
  const { setTheme, themes } = useTheme()
  const [marketplaceThemes, setMarketplaceThemes] = useState([])

  async function installTheme(themeId: string) {
    // Fetch theme from marketplace API
    const response = await fetch(`/api/marketplace/themes/${themeId}`)
    const { name, config } = await response.json()

    // Register theme if not already installed
    if (!themes.includes(name)) {
      themeRegistry.register(name, config)

      // Apply the theme
      setTheme(name)
    }
  }

  return (
    <div className="grid gap-4">
      {marketplaceThemes.map((theme) => (
        <ThemeCard
          key={theme.id}
          theme={theme}
          onInstall={() => installTheme(theme.id)}
          installed={themes.includes(theme.name)}
        />
      ))}
    </div>
  )
}
```

### 3. Interactive Theme Builder

Let users create custom themes:

```tsx
import { useState } from 'react'
import { useTheme, createTheme, themeRegistry } from '@esteban-url/trailhead-web-ui'

function ThemeBuilder() {
  const [colors, setColors] = useState({
    primary: 'oklch(0.6 0.2 250)',
    secondary: 'oklch(0.7 0.1 200)',
    background: 'oklch(1 0 0)',
    foreground: 'oklch(0.1 0 0)',
  })
  const { setTheme } = useTheme()

  const saveTheme = (name: string) => {
    const customTheme = createTheme(name)
      .withPrimaryColor(colors.primary)
      .withSecondaryColor(colors.secondary)
      .withBackgroundColors(colors.background, colors.foreground)
      .build()

    // Register the theme
    themeRegistry.register(name, customTheme)

    // Apply theme
    setTheme(name)

    // Could also save to database here
    saveThemeToDatabase(name, customTheme)
  }

  return (
    <div className="space-y-4">
      <ColorPicker
        label="Primary Color"
        value={colors.primary}
        onChange={(color) => setColors({ ...colors, primary: color })}
      />
      {/* More color pickers... */}
      <Button onClick={() => saveTheme('my-custom-theme')}>Save Theme</Button>
    </div>
  )
}
```

### 4. User Preference API Integration

Sync themes with user preferences stored in your backend:

```tsx
import { useTheme, themeRegistry } from '@esteban-url/trailhead-web-ui'
import { useUser } from '@/hooks/use-user'
import { useEffect } from 'react'

function UserThemeSync() {
  const { user } = useUser()
  const { theme, setTheme } = useTheme()

  // Load user's saved theme preference
  useEffect(() => {
    if (user?.themePreference) {
      if (user.themePreference.custom) {
        // User has a custom theme
        themeRegistry.register('user-custom', user.themePreference.config)
        setTheme('user-custom')
      } else {
        // User selected a built-in theme
        setTheme(user.themePreference.name)
      }
    }
  }, [user])

  // Save theme preference when it changes
  useEffect(() => {
    if (theme && user) {
      updateUserThemePreference(user.id, theme)
    }
  }, [theme, user])

  return null
}
```

## API Reference

### useTheme Hook

The primary API for theme management (provided by next-themes):

```tsx
const {
  theme, // Current theme name ('zinc', 'purple', etc.)
  setTheme, // Switch to a theme
  resolvedTheme, // Resolved theme accounting for system preference
  themes, // Array of available theme names
  systemTheme, // System color scheme preference
} = useTheme()
```

### Theme Registry Methods

The theme registry provides these methods:

```typescript
import { themeRegistry } from '@esteban-url/trailhead-web-ui'

// Register a new theme
themeRegistry.register(name: string, config: TrailheadThemeConfig): void

// Get a specific theme
themeRegistry.get(name: string): TrailheadThemeConfig | undefined

// List all available theme names
themeRegistry.list(): string[]

// Remove a theme
themeRegistry.remove(name: string): void

// Clear all custom themes (keeps built-in themes)
themeRegistry.clear(): void

// Apply a theme to the document
themeRegistry.apply(name: string, mode?: 'light' | 'dark'): void
```

### Theme Builder API

Create themes using the fluent builder:

```tsx
import { createTheme, themeRegistry } from '@esteban-url/trailhead-web-ui'

const theme = createTheme('My Theme')
  .withPrimaryColor('oklch(0.6 0.2 250)')
  .withSecondaryColor('oklch(0.7 0.1 200)')
  .withBackgroundColors(
    'oklch(1 0 0)', // light background
    'oklch(0.1 0 0)', // light foreground
    'oklch(0.1 0 0)', // dark background (optional)
    'oklch(0.98 0 0)' // dark foreground (optional)
  )
  .withDestructiveColor('oklch(0.6 0.25 27)')
  .withBorderColors('oklch(0.9 0 0)', 'oklch(0.2 0 0 / 0.1)')
  .withRadius('0.5rem')
  .build()

// Register the theme
themeRegistry.register('my-theme', theme)
```

### Theme Configuration Type

```tsx
interface TrailheadThemeConfig {
  name: string
  light: ThemeConfig // Light mode colors
  dark: ThemeConfig // Dark mode colors
  radius?: string // Border radius
}

interface ThemeConfig {
  colors: ColorConfig
  radius?: string
}

interface ColorConfig {
  background: string
  foreground: string
  primary: string
  'primary-foreground': string
  // ... other color tokens
  [key: string]: string | undefined // Component overrides
}
```

## Theme Storage Patterns

### Database Schema Example

```sql
-- PostgreSQL example
CREATE TABLE organization_themes (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES organizations(id),
  name VARCHAR(100),
  config JSONB,  -- Store TrailheadThemeConfig
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### API Endpoint Example

```tsx
// pages/api/themes/[themeId].ts
export async function GET(req: Request, { params }) {
  const theme = await db.theme.findUnique({
    where: { id: params.themeId },
  })

  return Response.json({
    name: theme.name,
    config: theme.config, // TrailheadThemeConfig object
  })
}
```

## Best Practices

### 1. Theme Registration

Only register themes when needed:

```tsx
function App({ organization }) {
  const { setTheme, themes } = useTheme()

  useEffect(() => {
    // Only register if not already available
    if (organization.customTheme && !themes.includes(organization.id)) {
      themeRegistry.register(organization.id, organization.themeConfig)
      setTheme(organization.id)
    }
  }, [organization])
}
```

### 2. Theme Caching

```tsx
// Cache themes in your API layer
const themeCache = new Map()

export async function getOrgTheme(orgId: string) {
  if (themeCache.has(orgId)) {
    return themeCache.get(orgId)
  }

  const theme = await db.theme.findUnique({ where: { orgId } })
  themeCache.set(orgId, theme)
  return theme
}
```

### 3. Theme Validation

Always validate themes before storing:

```tsx
import { validateTheme } from '@esteban-url/trailhead-web-ui'

export async function saveTheme(name: string, config: unknown) {
  const validation = validateTheme(config as TrailheadThemeConfig)

  if (!validation.isValid) {
    throw new Error(`Invalid theme: ${validation.errors.join(', ')}`)
  }

  await db.theme.create({ name, config })
}
```

## Theme Builder Patterns

The theme builder uses method chaining for a fluent API:

```tsx
// Create a theme from brand colors
const createBrandTheme = (brand: Brand) =>
  createTheme(brand.name)
    .withPrimaryColor(brand.primaryColor)
    .withSecondaryColor(brand.secondaryColor)
    .withBackgroundColors(brand.bgColor, brand.fgColor)
    .build()

// Register multiple themes
function registerBrandThemes(brands: Brand[]) {
  brands.forEach((brand) => {
    const theme = createBrandTheme(brand)
    themeRegistry.register(brand.name, theme)
  })
}
```

## Migration from Static Themes

If you're currently using only built-in themes, no changes are needed. Dynamic themes are an addition, not a replacement:

```tsx
// Static themes work as before
;<ThemeSwitcher /> // Shows all built-in themes

// Add dynamic themes when needed
function App() {
  useEffect(() => {
    // Register custom theme
    themeRegistry.register('custom', customThemeConfig)
  }, [])

  return <ThemeSwitcher /> // Now includes custom theme
}
```

## TypeScript Support

```tsx
import type { TrailheadThemeConfig, ThemeConfig, ColorConfig } from '@esteban-url/trailhead-web-ui'

// Type-safe theme creation
function createOrgTheme(colors: OrgColors): TrailheadThemeConfig {
  return createTheme('org').withPrimaryColor(colors.primary).build()
}

// Type-safe theme storage
interface ThemeRecord {
  id: string
  name: string
  config: TrailheadThemeConfig
}
```

## Next Steps

- [Examples](./examples.md) - More theme registry examples
- [API Reference](./api-reference.md) - Complete API documentation
- [Configuration](./configuration.md) - Theme configuration options
