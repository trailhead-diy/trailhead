#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 Validating monorepo dependencies...${NC}"

ERRORS=0
WARNINGS=0

# Check if all @repo packages are built before use
echo -e "\n${YELLOW}Checking @repo package imports...${NC}"
find packages apps tooling -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" 2>/dev/null | \
  grep -v node_modules | \
  grep -v dist | \
  grep -v build | \
  grep -v ".next" | \
  xargs grep -l "@repo/" 2>/dev/null | while read file; do
  
  # Extract all @repo packages imported in this file
  grep -o '@repo/[^"'\'']*' "$file" | sort -u | while read package; do
    # Skip checking the package itself
    if [[ "$file" == *"${package#@repo/}"* ]]; then
      continue
    fi
    
    # Extract base package name (handle subpath exports like @repo/tsup-config/shared)
    base_package="${package#@repo/}"
    base_package="${base_package%%/*}"  # Remove everything after first slash
    package_dir=""
    
    # Find the package directory
    if [ -d "tooling/$base_package" ]; then
      package_dir="tooling/$base_package"
    elif [ -d "packages/$base_package" ]; then
      package_dir="packages/$base_package"
    fi
    
    if [ -n "$package_dir" ]; then
      # Check if package.json exists and has a build script
      if [ -f "$package_dir/package.json" ]; then
        has_build=$(grep -c '"build":' "$package_dir/package.json" || true)
        if [ "$has_build" -eq 0 ]; then
          echo -e "  ${YELLOW}⚠️  $file imports $package but $base_package has no build script${NC}"
          ((WARNINGS++))
        fi
      fi
    else
      echo -e "  ${RED}❌ $file imports $package but $base_package not found${NC}"
      ((ERRORS++))
    fi
  done
done

# Check for circular dependencies
echo -e "\n${YELLOW}Checking for circular dependencies...${NC}"
# This is a simplified check - for production use, consider using a tool like madge
for package_dir in packages/* tooling/*; do
  if [ -d "$package_dir" ] && [ -f "$package_dir/package.json" ]; then
    package_name=$(basename "$package_dir")
    
    # Check if this package imports anything that imports it back
    find "$package_dir/src" -name "*.ts" -o -name "*.tsx" 2>/dev/null | \
      xargs grep -l "from.*@" 2>/dev/null | while read file; do
      
      grep -o "from.*@[^'\"]*" "$file" | grep -o "@[^'\"]*" | while read imported; do
        # Skip external packages
        if [[ "$imported" != @repo/* ]] && [[ "$imported" != @esteban-url/* ]]; then
          continue
        fi
        
        # Check if the imported package imports this one back
        imported_name="${imported#*/}"
        imported_dir=""
        
        if [ -d "packages/$imported_name" ]; then
          imported_dir="packages/$imported_name"
        elif [ -d "tooling/$imported_name" ]; then
          imported_dir="tooling/$imported_name"
        fi
        
        if [ -n "$imported_dir" ] && [ -d "$imported_dir/src" ]; then
          circular=$(find "$imported_dir/src" -name "*.ts" -o -name "*.tsx" 2>/dev/null | \
            xargs grep -l "@.*/$package_name" 2>/dev/null | head -1 || true)
          
          if [ -n "$circular" ]; then
            echo -e "  ${RED}❌ Circular dependency: $package_name ⇄ $imported_name${NC}"
            ((ERRORS++))
          fi
        fi
      done
    done
  fi
done

# Check turbo.json dependencies
echo -e "\n${YELLOW}Checking turbo.json task dependencies...${NC}"
if [ -f "turbo.json" ]; then
  # Check if test tasks depend on vitest-config build
  has_vitest_dep=$(grep -c "@repo/vitest-config#build" turbo.json || true)
  if [ "$has_vitest_dep" -eq 0 ]; then
    # Check if any package uses vitest
    uses_vitest=$(find packages -name "vitest.config.ts" 2>/dev/null | head -1 || true)
    if [ -n "$uses_vitest" ]; then
      echo -e "  ${YELLOW}⚠️  Test tasks should depend on @repo/vitest-config#build${NC}"
      ((WARNINGS++))
    fi
  else
    echo -e "  ${GREEN}✅ Test tasks correctly depend on @repo/vitest-config#build${NC}"
  fi
fi

# Summary
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
if [ "$ERRORS" -eq 0 ] && [ "$WARNINGS" -eq 0 ]; then
  echo -e "${GREEN}✅ All dependency checks passed!${NC}"
  exit 0
else
  echo -e "${YELLOW}⚠️  Found $WARNINGS warnings${NC}"
  echo -e "${RED}❌ Found $ERRORS errors${NC}"
  exit 1
fi