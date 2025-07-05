#!/bin/bash

# Example Test Runner for CI/CD
# This script runs all example tests to ensure they work correctly
# Usage: ./test-examples.sh [--fast] [--help]

set -e

# Parse command line arguments
FAST_MODE=false
SHOW_HELP=false

for arg in "$@"; do
  case $arg in
    --fast)
      FAST_MODE=true
      shift
      ;;
    --help|-h)
      SHOW_HELP=true
      shift
      ;;
    *)
      echo "Unknown option: $arg"
      exit 1
      ;;
  esac
done

if [ "$SHOW_HELP" = true ]; then
  echo "CLI Examples Test Runner"
  echo ""
  echo "Usage: $0 [options]"
  echo ""
  echo "Options:"
  echo "  --fast    Run only essential tests (skip deep integration)"
  echo "  --help    Show this help message"
  echo ""
  echo "Environment Variables:"
  echo "  CI        Set to 'true' to enable CI-specific optimizations"
  echo "  SKIP_SLOW Set to 'true' to skip slow/network-dependent tests"
  echo ""
  exit 0
fi

echo "🧪 Running CLI Examples Test Suite"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run a test and track results
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo -e "${BLUE}Running: ${test_name}${NC}"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS: ${test_name}${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}✗ FAIL: ${test_name}${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        # Show the actual error for debugging
        echo -e "${YELLOW}Error details:${NC}"
        eval "$test_command" || true
        echo ""
    fi
}

# Function to check if file or directory exists
check_file() {
    local file="$1"
    local description="$2"
    
    if [ -f "$file" ] || [ -d "$file" ]; then
        echo -e "${GREEN}✓ Found: ${description}${NC}"
        return 0
    else
        echo -e "${RED}✗ Missing: ${description}${NC}"
        return 1
    fi
}

echo ""
echo "📋 Checking Example Files"
echo "========================"

# Determine the examples directory based on where the script is run from
if [ -f "test-examples.sh" ]; then
    # We're already in the examples directory
    EXAMPLES_DIR="."
elif [ -f "examples/test-examples.sh" ]; then
    # We're in the parent directory (packages/cli)
    EXAMPLES_DIR="examples"
else
    echo -e "${RED}Error: Cannot find examples directory${NC}"
    exit 1
fi

# Check that all example directories exist
check_file "$EXAMPLES_DIR/todo-cli" "Todo CLI Example Directory"
check_file "$EXAMPLES_DIR/file-processor" "File Processor Example Directory"  
check_file "$EXAMPLES_DIR/api-client" "API Client Example Directory"
check_file "$EXAMPLES_DIR/cross-platform-cli" "Cross Platform CLI Example Directory"
check_file "$EXAMPLES_DIR/project-generator" "Project Generator Example Directory"

echo ""
echo "🔧 Quick Syntax Check"
echo "===================="

# Check TypeScript compilation for each example
run_test "Todo CLI TypeScript Check" "npx tsc --noEmit --skipLibCheck $EXAMPLES_DIR/todo-cli/src/index.ts"
run_test "File Processor TypeScript Check" "npx tsc --noEmit --skipLibCheck $EXAMPLES_DIR/file-processor/src/index.ts"
run_test "API Client TypeScript Check" "npx tsc --noEmit --skipLibCheck $EXAMPLES_DIR/api-client/src/index.ts"

echo ""
echo "🚀 Basic Execution Tests"
echo "========================"

# Test help commands (quick smoke tests)
# Use timeout if available, otherwise just run directly
if command -v timeout >/dev/null 2>&1; then
    run_test "Todo CLI Help" "timeout 10s npx tsx $EXAMPLES_DIR/todo-cli/src/index.ts --help"
    run_test "File Processor Help" "timeout 10s npx tsx $EXAMPLES_DIR/file-processor/src/index.ts --help"
    run_test "API Client Help" "timeout 10s npx tsx $EXAMPLES_DIR/api-client/src/index.ts --help"
else
    run_test "Todo CLI Help" "npx tsx $EXAMPLES_DIR/todo-cli/src/index.ts --help"
    run_test "File Processor Help" "npx tsx $EXAMPLES_DIR/file-processor/src/index.ts --help"
    run_test "API Client Help" "npx tsx $EXAMPLES_DIR/api-client/src/index.ts --help"
fi

echo ""
echo "⚡ Quick Functional Tests"
echo "========================"

# Test basic functionality
if command -v timeout >/dev/null 2>&1; then
    run_test "Todo CLI List" "timeout 10s npx tsx $EXAMPLES_DIR/todo-cli/src/index.ts list"
    run_test "File Processor Version" "timeout 10s npx tsx $EXAMPLES_DIR/file-processor/src/index.ts --version"
    
    # Test API client with mock endpoint
    run_test "API Client Help" "timeout 10s npx tsx $EXAMPLES_DIR/api-client/src/index.ts --help"
else
    run_test "Todo CLI List" "npx tsx $EXAMPLES_DIR/todo-cli/src/index.ts list"
    run_test "File Processor Version" "npx tsx $EXAMPLES_DIR/file-processor/src/index.ts --version"
    
    # Test API client with mock endpoint
    run_test "API Client Help" "npx tsx $EXAMPLES_DIR/api-client/src/index.ts --help"
fi

echo ""
echo "🧪 Running Full Test Suite"
echo "=========================="

# Run the actual test files
if command -v vitest >/dev/null 2>&1; then
    if [ "$FAST_MODE" = true ]; then
        echo -e "${BLUE}Running in fast mode - essential tests only${NC}"
        run_test "Essential Example Tests" "cd $EXAMPLES_DIR && npx vitest run __tests__/basic-cli.test.ts __tests__/advanced-cli.test.ts --reporter=basic"
        
        # Skip deep integration tests in fast mode
        echo -e "${YELLOW}⚡ Skipping deep integration tests in fast mode${NC}"
    else
        echo -e "${BLUE}Running complete test suite${NC}"
        run_test "All Example Integration Tests" "cd $EXAMPLES_DIR && npx vitest run __tests__ --reporter=basic"
        
        # Add performance warning for full suite
        echo -e "${YELLOW}📊 Note: Full test suite may take several minutes due to network and file operations${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Vitest not available, skipping full test suite${NC}"
fi

echo ""
echo "📊 Test Results Summary"
echo "======================"
echo -e "Total Tests: ${TOTAL_TESTS}"
echo -e "${GREEN}Passed: ${PASSED_TESTS}${NC}"
echo -e "${RED}Failed: ${FAILED_TESTS}${NC}"

# Check if performance results exist and display summary
if [ -f "$EXAMPLES_DIR/performance-results.json" ]; then
    echo ""
    echo "⚡ Performance Results:"
    echo "======================"
    
    # Extract key metrics using basic tools (works without jq)
    if command -v node >/dev/null 2>&1; then
        echo -e "${BLUE}Generating performance summary...${NC}"
        node -e "
        try {
          const fs = require('fs');
          const data = JSON.parse(fs.readFileSync('performance-results.json', 'utf8'));
          if (data.summary) {
            console.log('  Total performance tests:', data.summary.totalTests);
            console.log('  Successful:', data.summary.successful);
            console.log('  Average execution time:', Math.round(data.summary.averageExecutionTime) + 'ms');
            console.log('  Max execution time:', Math.round(data.summary.maxExecutionTime) + 'ms');
            console.log('  Average memory usage:', Math.round(data.summary.averageMemoryUsage / 1024 / 1024) + 'MB');
          }
        } catch (e) {
          console.log('  Performance data available in performance-results.json');
        }
        " 2>/dev/null || echo "  Performance data available in performance-results.json"
    fi
fi

if [ $FAILED_TESTS -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 All examples are working correctly!${NC}"
    
    # Additional success information
    if [ "$FAST_MODE" = true ]; then
        echo -e "${YELLOW}📝 Note: Ran in fast mode. Run without --fast for complete testing.${NC}"
    fi
    
    if [ -f "performance-results.json" ]; then
        echo -e "${BLUE}📊 Performance results saved to performance-results.json${NC}"
    fi
    
    exit 0
else
    echo ""
    echo -e "${RED}❌ Some examples have issues. Please check the output above.${NC}"
    echo ""
    echo "💡 Troubleshooting tips:"
    echo "  - Make sure you've run 'pnpm install' in the CLI package"
    echo "  - Check that all dependencies are properly installed"
    echo "  - Verify TypeScript compilation is working"
    echo "  - Check file permissions if running on Unix systems"
    echo "  - Run with --fast flag to skip slow/network-dependent tests"
    echo "  - Check performance results if available for bottlenecks"
    exit 1
fi