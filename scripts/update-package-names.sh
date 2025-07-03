#!/bin/bash
# Update all references from @trailhead/* to @esteban-url/trailhead-*

set -e

echo "🔄 Updating package references from @trailhead/* to @esteban-url/trailhead-*"

# Update in all relevant files
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.json" -o -name "*.md" \) \
  -not -path "./node_modules/*" \
  -not -path "./.git/*" \
  -not -path "./dist/*" \
  -not -path "./.next/*" \
  -not -path "./coverage/*" \
  -exec sed -i '' 's/@trailhead\/cli/@esteban-url\/trailhead-cli/g' {} \;

find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.json" -o -name "*.md" \) \
  -not -path "./node_modules/*" \
  -not -path "./.git/*" \
  -not -path "./dist/*" \
  -not -path "./.next/*" \
  -not -path "./coverage/*" \
  -exec sed -i '' 's/@trailhead\/web-ui/@esteban-url\/trailhead-web-ui/g' {} \;

# Update workspace references
echo "📦 Updating pnpm workspace references..."
pnpm install

echo "✅ Package references updated successfully!"
echo "   @trailhead/cli → @esteban-url/trailhead-cli"
echo "   @trailhead/web-ui → @esteban-url/trailhead-web-ui"
echo ""
echo "📝 Don't forget to:"
echo "   1. Update installation instructions in documentation"
echo "   2. Commit these changes"
echo "   3. Update any GitHub Actions that reference the old names"