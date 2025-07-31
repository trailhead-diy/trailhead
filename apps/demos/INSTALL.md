# Demo Installation Guide

This directory contains demonstration projects that work independently from the parent workspace.

> **Note**: This documentation is part of the [Trailhead monorepo](/README.md).

## 🔧 Fixed pnpm Issues

Both demos are now configured to work properly with pnpm without triggering parent workspace conflicts.

## 📁 Available Demos

### 1. Next.js Demo (`demos/next/`)

A simple, clean Next.js 15.3.4 application with React 19 and Tailwind CSS 4.

```bash
cd demos/next
pnpm install    # Uses pnpm
pnpm dev        # Start development server
```

### 2. RedwoodSDK Demo (`demos/rwsdk/`)

A minimal RedwoodSDK starter for Cloudflare Workers.

```bash
cd demos/rwsdk
pnpm install    # Works perfectly now!
pnpm dev        # Start development server
```

## 🛠️ Configuration Details

### What Was Fixed

1. **Local Workspace Files** - Each demo has its own `pnpm-workspace.yaml` to override parent
2. **Demo .npmrc Files** - Each demo has independent npm/pnpm configuration
3. **Script Prevention** - Parent scripts no longer run in demos
4. **Local Dependencies** - Each demo uses its own `node_modules`
5. **No Flags Needed** - `pnpm install` works normally without `--ignore-workspace`

### .npmrc Configuration

Each demo includes:

```ini
# Prevents parent scripts from running
enable-pre-post-scripts=false

# Independent from parent workspace
link-workspace-packages=false
hoist=false

# Better dependency handling
auto-install-peers=true
strict-peer-dependencies=false
```

## 🆘 Troubleshooting

### If pnpm still shows workspace issues:

1. **Clean and reinstall (should work normally now):**

   ```bash
   rm -rf node_modules pnpm-lock.yaml
   pnpm install    # No flags needed!
   ```

2. **Reinstall if needed:**

   ```bash
   pnpm install
   pnpm dev
   ```

3. **Force ignore workspace (last resort):**
   ```bash
   pnpm install --ignore-workspace
   ```

### If parent scripts still run:

The `.npmrc` files should prevent this, but if it persists:

- Check you're in the correct demo directory
- Verify the `.npmrc` file exists and has the correct content
- Use npm instead of pnpm as a fallback

## ✅ Quick Test

Both demos should now work without issues:

```bash
# Test Next.js demo
cd demos/next && pnpm install && pnpm build

# Test RedwoodSDK demo (works perfectly now!)
cd demos/rwsdk && pnpm install && pnpm check
```
