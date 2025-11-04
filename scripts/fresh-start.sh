#!/bin/bash
set -e

echo "🧹 Starting fresh start..."
echo ""

# Stash any uncommitted changes
if [[ -n $(git status -s) ]]; then
  echo "📦 Stashing uncommitted changes..."
  git stash push -m "fresh-start: $(date +%Y-%m-%d-%H-%M-%S)"
  STASHED=1
else
  echo "✓ No uncommitted changes to stash"
  STASHED=0
fi

echo ""
echo "🗑️  Cleaning build artifacts and dependencies..."
rm -rf node_modules .turbo
find packages -type d -name "dist" -exec rm -rf {} + 2>/dev/null || true
find tooling -type d -name "dist" -exec rm -rf {} + 2>/dev/null || true

echo ""
echo "📥 Installing dependencies..."
pnpm install

echo ""
echo "🔨 Building all packages..."
pnpm build

echo ""
if [[ $STASHED -eq 1 ]]; then
  echo "📤 Restoring stashed changes..."
  git stash pop
fi

echo ""
echo "✅ Fresh start complete!"
