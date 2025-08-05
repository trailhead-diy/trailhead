#!/bin/bash
# Cleanup test environment and restore original state
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REAL_WORLD_DIR="$(dirname "$SCRIPT_DIR")"
CLI_DIR="$(dirname "$(dirname "$REAL_WORLD_DIR")")"
PROJECT_ROOT="$(cd "$CLI_DIR/../.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🧹 Cleaning up test environment${NC}"

# Function to safely remove directory
safe_remove() {
    local dir="$1"
    if [[ -d "$dir" ]] && [[ "$dir" == *"real-world"* ]]; then
        echo "🗑️  Removing: $dir"
        rm -rf "$dir"
    else
        echo "⚠️  Skipping unsafe path: $dir"
    fi
}

# Clean up workspace
echo -e "${YELLOW}📁 Cleaning workspace...${NC}"
safe_remove "$REAL_WORLD_DIR/workspace"

# Optionally clean snapshots and outputs (ask user)
read -p "🗑️  Remove snapshots and outputs? [y/N]: " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️  Removing snapshots and outputs..."
    safe_remove "$REAL_WORLD_DIR/snapshots"
    safe_remove "$REAL_WORLD_DIR/outputs"
else
    echo "💾 Keeping snapshots and outputs for analysis"
fi

# Ask about results
read -p "🗑️  Remove results and reports? [y/N]: " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️  Removing results..."
    safe_remove "$REAL_WORLD_DIR/results"
else
    echo "📊 Keeping results for future reference"
fi

# Restore any git stashed changes
echo -e "${YELLOW}🔄 Checking for stashed changes...${NC}"
cd "$PROJECT_ROOT"
if git stash list | grep -q "real-world-test-backup"; then
    echo "📦 Found test backup stash"
    read -p "🔄 Restore stashed changes? [y/N]: " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git stash pop || echo "⚠️  Manual stash restoration may be needed"
        echo "✅ Stash restored"
    else
        echo "💾 Stash preserved (use 'git stash pop' to restore later)"
    fi
else
    echo "ℹ️  No test backup stash found"
fi

# Clean environment variables
echo -e "${YELLOW}🌍 Cleaning environment variables...${NC}"
unset GITHUB_TOKEN || true
unset NODE_ENV || true

# Check for any remaining test files
echo -e "${YELLOW}🔍 Checking for remaining test artifacts...${NC}"
if [[ -d "$REAL_WORLD_DIR/workspace" ]] || \
   [[ -d "$REAL_WORLD_DIR/snapshots" ]] || \
   [[ -d "$REAL_WORLD_DIR/outputs" ]]; then
    echo "⚠️  Some test artifacts remain:"
    ls -la "$REAL_WORLD_DIR/" | grep -E "(workspace|snapshots|outputs)" || true
else
    echo "✅ All test artifacts cleaned"
fi

# Restore original working directory
cd "$CLI_DIR"

echo
echo -e "${GREEN}🎉 Cleanup complete!${NC}"
echo
echo "📋 Summary:"
echo "- Test workspace: Removed"
echo "- Environment variables: Cleared"
echo "- Working directory: Restored to $CLI_DIR"
echo "- Git stash: $(git stash list | grep -c "real-world-test-backup" || echo "0") backup(s) available"
echo

if [[ -d "$REAL_WORLD_DIR/results" ]]; then
    echo "💡 Analysis results preserved in: $REAL_WORLD_DIR/results/"
    echo "📊 View comprehensive report: $REAL_WORLD_DIR/results/comprehensive-report.md"
fi

echo
echo "✅ Safe to continue normal development work!"