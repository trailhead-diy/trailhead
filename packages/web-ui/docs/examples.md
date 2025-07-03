# Examples

Real-world examples and patterns for Trailhead UI.

## Table of Contents

- [SaaS Applications](#saas-applications)
- [E-commerce](#e-commerce)
- [Admin Dashboards](#admin-dashboards)
- [Forms & Validation](#forms--validation)
- [Theme Customization](#theme-customization)
- [Accessibility](#accessibility)
- [Performance Optimization](#performance-optimization)

## SaaS Applications

### Multi-Tenant Theming

Allow each customer to have their own branding:

```tsx
import { ThemeProvider, useTheme, createTheme } from '@esteban-url/trailhead-web-ui';
import { useEffect, useState } from 'react';

// Set up with CLI: trailhead-ui install
// This installs all 26 components with theme support

function MultiTenantApp({ tenantId }: { tenantId: string }) {
  const [themeReady, setThemeReady] = useState(false);
  const { registerTheme } = useTheme();

  useEffect(() => {
    // Load tenant configuration
    async function loadTenantTheme() {
      const config = await fetch(`/api/tenants/${tenantId}/branding`).then(r => r.json());

      // Build custom theme
      const theme = createTheme(`tenant-${tenantId}`)
        .withPrimaryColor(config.primaryColor)
        .withSecondaryColor(config.secondaryColor)
        .withRadius(config.borderRadius)
        .build();

      // Register theme
      registerTheme(`tenant-${tenantId}`, theme);
      setThemeReady(true);
    }

    loadTenantTheme();
  }, [tenantId, registerTheme]);

  if (!themeReady) return <LoadingScreen />;

  return (
    <ThemeProvider defaultTheme={`tenant-${tenantId}`}>
      <YourApplication />
    </ThemeProvider>
  );
}
```

### User Onboarding Flow

Multi-step form with progress tracking:

```tsx
import { Button, Input, Heading } from '@esteban-url/trailhead-web-ui';
import { useState } from 'react';

function OnboardingFlow() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    company: '',
    website: '',
    industry: '',
  });

  const steps = [
    { id: 1, title: 'Company Info', fields: ['company', 'website'] },
    { id: 2, title: 'Industry', fields: ['industry'] },
    { id: 3, title: 'Review', fields: [] },
  ];

  const currentStep = steps[step - 1];
  const progress = (step / steps.length) * 100;

  return (
    <div className="max-w-2xl mx-auto p-8 bg-card text-card-foreground border border-border rounded-lg">
      <div className="w-full bg-secondary rounded-full h-2 mb-8">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <Heading level={2} className="mb-6">
        {currentStep.title}
      </Heading>

      {step === 1 && (
        <div className="space-y-4">
          <Input
            label="Company Name"
            value={data.company}
            onChange={e => setData({ ...data, company: e.target.value })}
            required
          />
          <Input
            label="Website"
            type="url"
            value={data.website}
            onChange={e => setData({ ...data, website: e.target.value })}
          />
        </div>
      )}

      {step === 2 && (
        <Select
          label="Industry"
          value={data.industry}
          onChange={e => setData({ ...data, industry: e.target.value })}
        >
          <option value="">Select Industry</option>
          <option value="tech">Technology</option>
          <option value="finance">Finance</option>
          <option value="healthcare">Healthcare</option>
        </Select>
      )}

      {step === 3 && (
        <div className="space-y-2">
          <p>
            <strong>Company:</strong> {data.company}
          </p>
          <p>
            <strong>Website:</strong> {data.website}
          </p>
          <p>
            <strong>Industry:</strong> {data.industry}
          </p>
        </div>
      )}

      <div className="flex justify-between mt-8">
        <Button plain onClick={() => setStep(step - 1)} disabled={step === 1}>
          Back
        </Button>
        <Button onClick={() => (step < 3 ? setStep(step + 1) : handleSubmit())}>
          {step < 3 ? 'Next' : 'Complete'}
        </Button>
      </div>
    </div>
  );
}
```

## E-commerce

### Product Card

Reusable product display component:

```tsx
import { Badge, Button, Text, Heading } from '@esteban-url/trailhead-web-ui';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    inStock: boolean;
    discount?: number;
  };
}

function ProductCard({ product }: ProductCardProps) {
  const discountedPrice = product.discount
    ? product.price * (1 - product.discount / 100)
    : product.price;

  return (
    <div className="overflow-hidden bg-card text-card-foreground border border-border rounded-lg">
      <div className="aspect-square relative">
        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        {product.discount && (
          <Badge className="absolute top-2 right-2 bg-destructive text-destructive-foreground">
            -{product.discount}%
          </Badge>
        )}
      </div>

      <div className="p-4 space-y-2">
        <Heading level={3} className="line-clamp-2">
          {product.name}
        </Heading>

        <div className="flex items-center gap-2">
          {product.discount && (
            <Text className="line-through text-muted-foreground">${product.price}</Text>
          )}
          <Text className="text-lg font-semibold">${discountedPrice.toFixed(2)}</Text>
        </div>

        <Button className="w-full" disabled={!product.inStock}>
          {product.inStock ? 'Add to Cart' : 'Out of Stock'}
        </Button>
      </div>
    </div>
  );
}
```

### Shopping Cart

Cart with item management:

```tsx
import { Dialog, DialogTitle, Button, Text, Divider } from '@esteban-url/trailhead-web-ui';
import { useState } from 'react';

function ShoppingCart({ open, onClose, items, onUpdateQuantity, onRemove }) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  return (
    <Dialog open={open} onClose={onClose} size="lg">
      <DialogTitle>Shopping Cart ({items.length})</DialogTitle>

      <div className="divide-y divide-border">
        {items.map(item => (
          <div key={item.id} className="py-4 flex gap-4">
            <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded" />

            <div className="flex-1">
              <Text className="font-medium">{item.name}</Text>
              <Text className="text-muted-foreground">${item.price.toFixed(2)}</Text>
            </div>

            <div className="flex items-center gap-2">
              <Button plain size="sm" onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}>
                -
              </Button>
              <Text>{item.quantity}</Text>
              <Button plain size="sm" onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}>
                +
              </Button>
              <Button plain color="red" size="sm" onClick={() => onRemove(item.id)}>
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Divider />

      <div className="space-y-2 py-4">
        <div className="flex justify-between">
          <Text>Subtotal</Text>
          <Text>${subtotal.toFixed(2)}</Text>
        </div>
        <div className="flex justify-between">
          <Text>Tax</Text>
          <Text>${tax.toFixed(2)}</Text>
        </div>
        <div className="flex justify-between font-semibold">
          <Text>Total</Text>
          <Text>${total.toFixed(2)}</Text>
        </div>
      </div>

      <div className="flex gap-2">
        <Button plain onClick={onClose}>
          Continue Shopping
        </Button>
        <Button className="flex-1">Checkout</Button>
      </div>
    </Dialog>
  );
}
```

## Admin Dashboards

### Dashboard Layout

Full admin dashboard structure:

```tsx
import {
  SidebarLayout,
  Sidebar,
  SidebarSection,
  SidebarItem,
  Navbar,
  NavbarSection,
  Avatar,
  Dropdown,
  DropdownButton,
  DropdownMenu,
  DropdownItem,
} from '@esteban-url/trailhead-web-ui';

function AdminDashboard({ children }) {
  return (
    <SidebarLayout>
      <Sidebar>
        <SidebarSection>
          <SidebarItem href="/dashboard" current>
            Dashboard
          </SidebarItem>
          <SidebarItem href="/users">Users</SidebarItem>
          <SidebarItem href="/products">Products</SidebarItem>
          <SidebarItem href="/orders">Orders</SidebarItem>
        </SidebarSection>

        <SidebarSection className="mt-auto">
          <SidebarItem href="/settings">Settings</SidebarItem>
          <SidebarItem href="/logout">Logout</SidebarItem>
        </SidebarSection>
      </Sidebar>

      <div className="flex-1 flex flex-col">
        <Navbar>
          <NavbarSection className="ml-auto">
            <Dropdown>
              <DropdownButton plain>
                <Avatar src="/admin.jpg" />
              </DropdownButton>
              <DropdownMenu anchor="bottom end">
                <DropdownItem href="/profile">Profile</DropdownItem>
                <DropdownItem href="/settings">Settings</DropdownItem>
                <DropdownItem href="/logout">Logout</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </NavbarSection>
        </Navbar>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </SidebarLayout>
  );
}
```

### Data Table with Filters

Advanced table with search and filters:

```tsx
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
  Input,
  Select,
  Badge,
} from '@esteban-url/trailhead-web-ui';
import { useState, useMemo } from 'react';

function UserTable({ users }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  const filteredUsers = useMemo(() => {
    return users
      .filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      });
  }, [users, search, statusFilter, sortField, sortOrder]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Input
          placeholder="Search users..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
      </div>

      <Table>
        <TableHead>
          <TableRow>
            <TableHeader onClick={() => handleSort('name')} className="cursor-pointer">
              Name {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
            </TableHeader>
            <TableHeader>Email</TableHeader>
            <TableHeader>Status</TableHeader>
            <TableHeader>Actions</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredUsers.map(user => (
            <TableRow key={user.id}>
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Badge color={user.status === 'active' ? 'green' : 'gray'}>{user.status}</Badge>
              </TableCell>
              <TableCell>
                <Button size="sm" plain>
                  Edit
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

## Forms & Validation

### Complex Form with Validation

Form with field-level and form-level validation:

```tsx
import { Input, Textarea, Select, Checkbox, Button, Text } from '@esteban-url/trailhead-web-ui';
import { useState } from 'react';

interface FormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  message: string;
  subscribe: boolean;
}

interface FormErrors {
  [key: string]: string;
}

function ContactForm() {
  const [data, setData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: '',
    subscribe: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!data.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!data.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(data.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!data.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (data.message.length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setSubmitting(true);
    try {
      await submitForm(data);
      // Success handling
    } catch (error) {
      // Error handling
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (field: keyof FormData, value: any) => {
    setData({ ...data, [field]: value });
    // Clear error when user types
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-card text-card-foreground border border-border rounded-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            label="Name"
            value={data.name}
            onChange={e => updateField('name', e.target.value)}
            invalid={!!errors.name}
            required
          />
          {errors.name && (
            <Text color="red" size="sm" className="mt-1">
              {errors.name}
            </Text>
          )}
        </div>

        <div>
          <Input
            label="Email"
            type="email"
            value={data.email}
            onChange={e => updateField('email', e.target.value)}
            invalid={!!errors.email}
            required
          />
          {errors.email && (
            <Text color="red" size="sm" className="mt-1">
              {errors.email}
            </Text>
          )}
        </div>

        <Input
          label="Phone"
          type="tel"
          value={data.phone}
          onChange={e => updateField('phone', e.target.value)}
        />

        <Select
          label="Company Size"
          value={data.company}
          onChange={e => updateField('company', e.target.value)}
        >
          <option value="">Select size</option>
          <option value="1-10">1-10 employees</option>
          <option value="11-50">11-50 employees</option>
          <option value="51-200">51-200 employees</option>
          <option value="201+">201+ employees</option>
        </Select>

        <div>
          <Textarea
            label="Message"
            rows={4}
            value={data.message}
            onChange={e => updateField('message', e.target.value)}
            invalid={!!errors.message}
            required
          />
          {errors.message && (
            <Text color="red" size="sm" className="mt-1">
              {errors.message}
            </Text>
          )}
        </div>

        <Checkbox
          checked={data.subscribe}
          onChange={e => updateField('subscribe', e.target.checked)}
        >
          Subscribe to newsletter
        </Checkbox>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Sending...' : 'Send Message'}
        </Button>
      </form>
    </div>
  );
}
```

## Theme Customization

### Theme Builder UI

Interactive theme customization interface:

```tsx
import {
  Input,
  Select,
  Button,
  Heading,
  Text,
  useTheme,
  createTheme,
} from '@esteban-url/trailhead-web-ui';
import { useState } from 'react';

function ThemeBuilder() {
  const [themeName, setThemeName] = useState('');
  const [colors, setColors] = useState({
    primary: 'oklch(0.6 0.2 250)',
    secondary: 'oklch(0.95 0.02 250)',
    background: 'oklch(0.99 0 0)',
    foreground: 'oklch(0.15 0 0)',
  });
  const [radius, setRadius] = useState('0.5rem');
  const [preview, setPreview] = useState(false);
  const { registerTheme, setTheme } = useTheme();

  const updateColor = (name: string, value: string) => {
    setColors({ ...colors, [name]: value });
    if (preview) {
      applyPreview();
    }
  };

  const applyPreview = () => {
    const theme = createTheme('preview')
      .withPrimaryColor(colors.primary)
      .withSecondaryColor(colors.secondary)
      .withBackgroundColors(colors.background, colors.foreground)
      .withRadius(radius)
      .build();

    registerTheme('preview', theme);
    setTheme('preview');
  };

  const saveTheme = () => {
    if (!themeName) return;

    const theme = createTheme(themeName)
      .withPrimaryColor(colors.primary)
      .withSecondaryColor(colors.secondary)
      .withBackgroundColors(colors.background, colors.foreground)
      .withRadius(radius)
      .build();

    registerTheme(themeName, theme);

    // Save to local storage for sharing
    localStorage.setItem(`theme-${themeName}`, JSON.stringify(theme));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="p-6 bg-card text-card-foreground border border-border rounded-lg">
        <Heading level={2} className="mb-6">
          Theme Builder
        </Heading>

        <div className="space-y-4">
          <Input
            label="Theme Name"
            value={themeName}
            onChange={e => setThemeName(e.target.value)}
            placeholder="my-theme"
          />

          <div>
            <label className="text-sm font-medium">Primary Color</label>
            <input
              type="color"
              value={colors.primary}
              onChange={e => updateColor('primary', e.target.value)}
              className="w-full h-10 border border-border rounded"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Secondary Color</label>
            <input
              type="color"
              value={colors.secondary}
              onChange={e => updateColor('secondary', e.target.value)}
              className="w-full h-10 border border-border rounded"
            />
          </div>

          <Select label="Border Radius" value={radius} onChange={e => setRadius(e.target.value)}>
            <option value="0">None</option>
            <option value="0.25rem">Small</option>
            <option value="0.5rem">Medium</option>
            <option value="0.75rem">Large</option>
            <option value="1rem">Extra Large</option>
          </Select>

          <div className="flex gap-2">
            <Button onClick={() => setPreview(!preview)}>
              {preview ? 'Stop Preview' : 'Preview'}
            </Button>
            <Button onClick={saveTheme} disabled={!themeName}>
              Save Theme
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 bg-card text-card-foreground border border-border rounded-lg">
        <Heading level={3} className="mb-4">
          Preview
        </Heading>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button>Primary</Button>
            <Button color="secondary">Secondary</Button>
            <Button outline>Outline</Button>
          </div>

          <Input placeholder="Sample input" />

          <div className="flex gap-2">
            <Badge>Default</Badge>
            <Badge color="green">Success</Badge>
            <Badge color="red">Error</Badge>
          </div>

          <div className="p-4 bg-muted text-muted-foreground border border-border rounded-lg">
            <Text>This is how cards look with your theme.</Text>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## Accessibility

### Accessible Form

Form with proper ARIA labels and error handling:

```tsx
import { Input, Button, Text } from '@esteban-url/trailhead-web-ui';
import { useState, useId } from 'react';

function AccessibleForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const emailId = useId();
  const errorId = useId();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      // Focus error for screen readers
      document.getElementById(errorId)?.focus();
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="space-y-2">
        <label htmlFor={emailId} className="block text-sm font-medium">
          Email Address
          <span className="text-red-500 ml-1" aria-label="required">
            *
          </span>
        </label>

        <Input
          id={emailId}
          type="email"
          value={email}
          onChange={e => {
            setEmail(e.target.value);
            setError(''); // Clear error on change
          }}
          aria-describedby={error ? errorId : undefined}
          aria-invalid={!!error}
          aria-required="true"
        />

        {error && (
          <Text id={errorId} color="red" size="sm" role="alert" aria-live="polite" tabIndex={-1}>
            {error}
          </Text>
        )}
      </div>

      <Button type="submit" className="mt-4">
        Subscribe
      </Button>
    </form>
  );
}
```

### Skip Links

Navigation aids for keyboard users:

```tsx
function SkipLinks() {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded"
      >
        Skip to main content
      </a>
      <a
        href="#main-navigation"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded"
      >
        Skip to navigation
      </a>
    </>
  );
}
```

## Performance Optimization

### Lazy Loading Components

Load components only when needed:

```tsx
import { lazy, Suspense } from 'react';

// Lazy load heavy components
const DataTable = lazy(() => import('./DataTable'));
const ChartPanel = lazy(() => import('./ChartPanel'));

function Dashboard() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Suspense fallback={<div className="h-96 bg-muted animate-pulse rounded-lg" />}>
        <DataTable />
      </Suspense>

      <Suspense fallback={<div className="h-96 bg-muted animate-pulse rounded-lg" />}>
        <ChartPanel />
      </Suspense>
    </div>
  );
}
```

### Virtual Scrolling

Handle large lists efficiently:

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';
import { Text } from '@esteban-url/trailhead-web-ui';

function VirtualList({ items }: { items: Array<any> }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  });

  return (
    <div ref={parentRef} className="h-96 overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map(virtualItem => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
            className="p-2 bg-card text-card-foreground border border-border rounded-lg"
          >
            <Text>{items[virtualItem.index].name}</Text>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Next Steps

- [Getting Started](./getting-started.md) - Basic setup
- [Components](./components.md) - Component reference
- [Theme Registry](./theme-registry.md) - Advanced theming
- [API Reference](./api-reference.md) - Complete API documentation
