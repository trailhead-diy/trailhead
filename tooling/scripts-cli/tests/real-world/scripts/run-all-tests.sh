#!/bin/bash
# Master script to run all real-world tests with safety checks
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

echo -e "${BLUE}🧪 Real-World Testing Suite${NC}"
echo -e "${BLUE}================================${NC}"
echo

# Safety checks
echo -e "${YELLOW}🔒 Safety Checks${NC}"

# Check if we're in the right directory
if [[ ! -f "$CLI_DIR/package.json" ]] || [[ ! -d "$PROJECT_ROOT/scripts" ]]; then
    echo -e "${RED}❌ Not in correct directory structure${NC}"
    echo "Expected to find CLI package.json and scripts directory"
    echo "CLI_DIR: $CLI_DIR"
    echo "PROJECT_ROOT: $PROJECT_ROOT"
    exit 1
fi

# Check if CLI is built
if [[ ! -f "$CLI_DIR/dist/cli.js" ]]; then
    echo -e "${YELLOW}⚠️  TypeScript CLI not built${NC}"
    echo "Building CLI..."
    cd "$CLI_DIR"
    pnpm build
    cd "$SCRIPT_DIR"
fi

# Check git status
cd "$PROJECT_ROOT"
if ! git diff --quiet; then
    echo -e "${YELLOW}⚠️  Uncommitted changes detected${NC}"
    read -p "🔄 Create backup stash before testing? [Y/n]: " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        git stash push -m "real-world-test-backup-$(date +%Y%m%d_%H%M%S)"
        echo -e "${GREEN}✅ Backup stash created${NC}"
    fi
fi

echo -e "${GREEN}✅ Safety checks passed${NC}"
echo

# Setup test environment
echo -e "${YELLOW}🏗️  Setting up test environment...${NC}"
"$SCRIPT_DIR/setup-test-environment.sh"
echo

# Run individual command tests
echo -e "${BLUE}🧪 Running Command Comparisons${NC}"
echo

declare -a commands=("npm-auth" "fix-imports" "validate-deps" "test-runner")
declare -a results=()

for cmd in "${commands[@]}"; do
    echo -e "${BLUE}🔍 Testing: $cmd${NC}"
    
    if "$SCRIPT_DIR/compare-command.sh" "$cmd"; then
        results+=("✅ $cmd: PASSED")
        echo -e "${GREEN}✅ $cmd comparison completed${NC}"
    else
        results+=("❌ $cmd: FAILED")
        echo -e "${RED}❌ $cmd comparison failed${NC}"
    fi
    echo
done

# Generate comprehensive report
echo -e "${BLUE}📊 Generating comprehensive report...${NC}"
"$SCRIPT_DIR/generate-report.sh"
echo

# Display results summary
echo -e "${BLUE}📋 Test Results Summary${NC}"
echo -e "${BLUE}=====================${NC}"
echo

for result in "${results[@]}"; do
    if [[ "$result" == *"PASSED"* ]]; then
        echo -e "${GREEN}$result${NC}"
    else
        echo -e "${RED}$result${NC}"
    fi
done

echo
echo -e "${BLUE}📊 Detailed Analysis${NC}"
echo "- Comprehensive report: $REAL_WORLD_DIR/results/comprehensive-report.md"
echo "- Individual comparisons: $REAL_WORLD_DIR/results/*-comparison.md"
echo "- Raw snapshots: $REAL_WORLD_DIR/snapshots/"
echo "- Command outputs: $REAL_WORLD_DIR/outputs/"
echo

# Count results
passed_count=$(printf '%s\n' "${results[@]}" | grep -c "PASSED" || echo "0")
total_count=${#results[@]}

if [[ $passed_count -eq $total_count ]]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED ($passed_count/$total_count)${NC}"
    echo -e "${GREEN}✅ TypeScript CLI is ready for production use!${NC}"
    echo
    echo -e "${YELLOW}💡 Next Steps:${NC}"
    echo "1. Review the comprehensive report"
    echo "2. Update documentation to reference TypeScript CLI"
    echo "3. Archive shell scripts"
    echo "4. Update CI/CD pipelines"
elif [[ $passed_count -gt 0 ]]; then
    echo -e "${YELLOW}⚠️  PARTIAL SUCCESS ($passed_count/$total_count passed)${NC}"
    echo -e "${YELLOW}🔍 Review failed tests before proceeding${NC}"
    echo
    echo -e "${YELLOW}💡 Next Steps:${NC}"
    echo "1. Review individual comparison reports"
    echo "2. Fix identified discrepancies"
    echo "3. Re-run failed tests"
else
    echo -e "${RED}❌ ALL TESTS FAILED (0/$total_count passed)${NC}"
    echo -e "${RED}🚨 Significant issues found - do not migrate yet${NC}"
    echo
    echo -e "${RED}💡 Next Steps:${NC}"
    echo "1. Review all comparison reports"
    echo "2. Debug TypeScript CLI implementation"
    echo "3. Fix fundamental issues"
    echo "4. Re-run complete test suite"
fi

echo
read -p "🧹 Clean up test environment now? [Y/n]: " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    "$SCRIPT_DIR/cleanup-test-environment.sh"
else
    echo -e "${YELLOW}💾 Test environment preserved for analysis${NC}"
    echo "Run $SCRIPT_DIR/cleanup-test-environment.sh when ready"
fi

echo
echo -e "${GREEN}🏁 Real-world testing complete!${NC}"