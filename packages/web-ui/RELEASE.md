# Trailhead UI - Installation & Usage Guide

Welcome to Trailhead UI! This guide will help you get started with the component library after downloading the release package.

> **Note**: This documentation is part of the [Trailhead monorepo](../../README.md).

## 📦 What's in the Package

Your downloaded package contains:

- `th/` - Complete Trailhead UI component library source code
- `demo/` - Working demo application showcasing all components
- `README.md` - Main project documentation

## 🚀 Quick Start

### Option 1: Copy Components to Your Project

1. **Extract the downloaded ZIP file**

   ```bash
   unzip trailhead-ui-{version}.zip
   cd trailhead-ui-{version}
   ```

2. **Copy the component library to your project**

   ```bash
   # Copy the entire th/ directory to your project
   cp -r th/ /path/to/your/project/src/components/trailhead-ui/

   # Or copy individual components as needed
   cp th/Button.tsx /path/to/your/project/src/components/
   ```

3. **Install required dependencies**

   ```bash
   pnpm add @headlessui/react clsx tailwind-merge

   # If using TypeScript (recommended)
   pnpm add -D @types/react @types/react-dom
   ```

### Option 2: Run the Demo Application

1. **Navigate to the demo directory**

   ```bash
   cd demo/
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Start the development server**

   ```bash
   pnpm dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000` to see all components in action.

## 📋 Prerequisites

- **Node.js** 18.0 or higher
- **React** 18.0 or higher
- **TypeScript** 4.9 or higher (recommended)
- **Tailwind CSS** 3.0 or higher

## 🔧 Installation Steps

### 1. Install Peer Dependencies

Trailhead UI requires these peer dependencies:

```bash
# Core dependencies
pnpm add @headlessui/react clsx tailwind-merge

# For TypeScript projects
pnpm add -D @types/react @types/react-dom typescript

# For Tailwind CSS (if not already installed)
pnpm add -D tailwindcss postcss autoprefixer
```

### 2. Configure Tailwind CSS

Add the component paths to your `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    // Add the path where you copied the components
    './src/components/trailhead-ui/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### 3. Set Up the Utility Function

Create or update your utility function file:

```typescript
// src/utils.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### 4. Import and Use Components

```typescript
// Example usage in your React component
import { Button } from './components/trailhead-ui/Button'
import { Input } from './components/trailhead-ui/Input'
import { Alert } from './components/trailhead-ui/Alert'

export default function MyPage() {
  return (
    <div className="p-6">
      <Alert>
        Welcome to Trailhead UI!
      </Alert>

      <div className="mt-4 space-y-4">
        <Input placeholder="Enter your name" />
        <Button>Get Started</Button>
      </div>
    </div>
  )
}
```

## 📚 Available Components

### Form Components

- **Button** - Primary, secondary, and outline button variants
- **Input** - Text input with validation states
- **Field** - Form field wrapper with label and validation
- **Label** - Accessible form labels
- **Description** - Form field descriptions
- **ErrorMessage** - Form validation error messages
- **Select** - Dropdown selection component
- **Textarea** - Multi-line text input
- **Checkbox** - Single and grouped checkboxes
- **Switch** - Toggle switch component
- **Radio** - Radio button groups
- **Fieldset** - Form section grouping

### Display Components

- **Alert** - Status and notification messages
- **Avatar** - User profile images and placeholders
- **Badge** - Status indicators and tags
- **Dialog** - Modal dialogs and overlays
- **Divider** - Section separators
- **Heading** - Consistent typography hierarchy
- **Table** - Data tables with sorting and styling
- **Text** - Styled text components

### Navigation Components

- **Dropdown** - Dropdown menus and actions
- **Link** - Navigation links with styling
- **Listbox** - Selectable lists
- **Pagination** - Page navigation controls
- **Sidebar** - Navigation sidebar layout
- **SidebarLayout** - Complete sidebar page layout
- **Navbar** - Top navigation bars

## 🎨 Styling & Customization

### Default Styling

All components come with built-in Catalyst UI styling that provides:

- Consistent design language
- Dark mode support
- Responsive behavior
- Accessibility features

### Custom Styling

You can customize components by passing className props:

```typescript
<Button className="bg-purple-600 hover:bg-purple-700">
  Custom Button
</Button>

<Input className="border-blue-500 focus:ring-blue-500" />
```

### Theme Customization

Extend your Tailwind config for global theming:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          500: '#3b82f6',
          600: '#2563eb',
          // ... your custom colors
        },
      },
    },
  },
}
```

## 🧪 Testing Your Installation

Create a simple test component to verify everything works:

```typescript
// TestComponent.tsx
import { Button } from './components/trailhead-ui/Button'
import { Alert } from './components/trailhead-ui/Alert'

export default function TestComponent() {
  return (
    <div className="p-4 space-y-4">
      <Alert>
        Trailhead UI is working correctly! 🎉
      </Alert>
      <Button onClick={() => alert('Button clicked!')}>
        Test Button
      </Button>
    </div>
  )
}
```

## 📖 Next Steps

1. **Explore the Demo**: Run the included demo application to see all components
2. **Read Documentation**: Check the main README.md for detailed API documentation
3. **Browse Components**: Look through the `th/` directory to understand component structure
4. **Check Types**: All components include TypeScript definitions for better development experience

## 🔧 Troubleshooting

### Common Issues

#### **1. "Cannot resolve module" errors**

- Ensure you've copied components to the correct path
- Verify import paths match your project structure
- Check that TypeScript configuration includes the component directory

#### **2. Styling not applied**

- Verify Tailwind CSS is properly configured
- Ensure component paths are included in Tailwind content configuration
- Check that the `cn` utility function is available

#### **3. TypeScript errors**

- Install required type dependencies: `@types/react @types/react-dom`
- Ensure TypeScript version is 4.9 or higher
- Verify `tsconfig.json` includes component directory

#### **4. Missing peer dependencies**

- Run: `pnpm add @headlessui/react clsx tailwind-merge`
- Check package.json for conflicting versions

### Getting Help

If you encounter issues:

1. Check the demo application works correctly
2. Verify all dependencies are installed
3. Ensure Tailwind CSS is properly configured
4. Review the component source code in the `th/` directory

## 📄 License

This project is released under the MIT License. See the main README.md for full license details.

---

**Happy coding with Trailhead UI!** 🚀

For more information, examples, and updates, visit the main project repository.
