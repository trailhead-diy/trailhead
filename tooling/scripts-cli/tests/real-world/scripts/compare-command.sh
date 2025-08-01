#!/bin/bash
# Compare shell script vs TypeScript CLI command execution
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REAL_WORLD_DIR="$(dirname "$SCRIPT_DIR")"
CLI_DIR="$(dirname "$(dirname "$REAL_WORLD_DIR")")"
PROJECT_ROOT="$(cd "$CLI_DIR/../.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to run command and capture everything
run_command() {
    local test_name="$1"
    local command_type="$2"  # "shell" or "typescript"
    local command="$3"
    local args="$4"
    local workspace="$5"
    
    echo -e "${BLUE}🏃 Running $command_type command: $command $args${NC}"
    
    # Create temporary files for output
    local stdout_file="$REAL_WORLD_DIR/outputs/${test_name}-${command_type}-stdout.txt"
    local stderr_file="$REAL_WORLD_DIR/outputs/${test_name}-${command_type}-stderr.txt"
    
    # Capture state before
    "$SCRIPT_DIR/state-capture.sh" capture "${test_name}-${command_type}-before" "$workspace"
    
    # Run command and capture output
    local start_time=$(date +%s.%N)
    local exit_code=0
    
    cd "$workspace"
    if [[ "$command_type" == "shell" ]]; then
        bash -c "$command $args" > "$stdout_file" 2> "$stderr_file" || exit_code=$?
    else
        # TypeScript CLI
        cd "$CLI_DIR"
        pnpm scripts-cli $command $args > "$stdout_file" 2> "$stderr_file" || exit_code=$?
        cd "$workspace"
    fi
    
    local end_time=$(date +%s.%N)
    local duration=$(echo "$end_time - $start_time" | bc -l 2>/dev/null || echo "0")
    
    # Capture state after
    "$SCRIPT_DIR/state-capture.sh" capture "${test_name}-${command_type}-after" "$workspace"
    
    # Save command output metadata
    "$SCRIPT_DIR/state-capture.sh" output "$test_name" "$command_type" "$exit_code" "$stdout_file" "$stderr_file"
    
    echo -e "${GREEN}✅ Command completed (exit: $exit_code, duration: ${duration}s)${NC}"
    
    return $exit_code
}

# Function to compare two command runs
compare_runs() {
    local test_name="$1"
    
    echo -e "${BLUE}🔍 Comparing shell vs TypeScript results for: $test_name${NC}"
    
    local shell_output="$REAL_WORLD_DIR/outputs/${test_name}-shell.json"
    local ts_output="$REAL_WORLD_DIR/outputs/${test_name}-typescript.json"
    local report_file="$REAL_WORLD_DIR/results/${test_name}-comparison.md"
    
    # Create comparison report
    {
        echo "# Command Comparison Report: $test_name"
        echo
        echo "Generated: $(date)"
        echo
        
        # Compare exit codes
        if [[ -f "$shell_output" ]] && [[ -f "$ts_output" ]]; then
            local shell_exit=$(grep '"exit_code"' "$shell_output" | cut -d: -f2 | tr -d ' ,')
            local ts_exit=$(grep '"exit_code"' "$ts_output" | cut -d: -f2 | tr -d ' ,')
            
            echo "## Exit Codes"
            echo "- Shell script: $shell_exit"
            echo "- TypeScript CLI: $ts_exit"
            if [[ "$shell_exit" == "$ts_exit" ]]; then
                echo "- ✅ **Match**"
            else
                echo "- ❌ **Different**"
            fi
            echo
        fi
        
        # Compare state changes
        echo "## File System Changes"
        echo
        echo "### Shell Script Changes"
        "$SCRIPT_DIR/state-capture.sh" compare "${test_name}-shell-before" "${test_name}-shell-after"
        echo
        echo "### TypeScript CLI Changes"
        "$SCRIPT_DIR/state-capture.sh" compare "${test_name}-typescript-before" "${test_name}-typescript-after"
        echo
        
        # Compare outputs
        echo "## Output Comparison"
        echo
        if [[ -f "$REAL_WORLD_DIR/outputs/${test_name}-shell-stdout.txt" ]] && [[ -f "$REAL_WORLD_DIR/outputs/${test_name}-typescript-stdout.txt" ]]; then
            echo "### Standard Output Diff"
            echo '```diff'
            diff "$REAL_WORLD_DIR/outputs/${test_name}-shell-stdout.txt" "$REAL_WORLD_DIR/outputs/${test_name}-typescript-stdout.txt" || true
            echo '```'
            echo
        fi
        
        if [[ -f "$REAL_WORLD_DIR/outputs/${test_name}-shell-stderr.txt" ]] && [[ -f "$REAL_WORLD_DIR/outputs/${test_name}-typescript-stderr.txt" ]]; then
            echo "### Standard Error Diff"
            echo '```diff'
            diff "$REAL_WORLD_DIR/outputs/${test_name}-shell-stderr.txt" "$REAL_WORLD_DIR/outputs/${test_name}-typescript-stderr.txt" || true
            echo '```'
        fi
        
    } > "$report_file"
    
    echo -e "${GREEN}📊 Comparison report saved: $report_file${NC}"
}

# Command definitions
run_npm_auth_test() {
    local workspace="$REAL_WORLD_DIR/workspace/npm-test"
    
    echo -e "${YELLOW}🧪 Testing npm-auth command${NC}"
    
    # Setup test environment
    export GITHUB_TOKEN="ghp_test123456789"
    
    # Run shell script
    run_command "npm-auth" "shell" "$PROJECT_ROOT/scripts/setup-npm-auth.sh" "" "$workspace"
    
    # Reset environment for fair comparison
    rm -f "$workspace/.npmrc"
    echo "registry=https://registry.npmjs.org/" > "$workspace/.npmrc"
    
    # Run TypeScript CLI
    run_command "npm-auth" "typescript" "npm-auth" "" "$workspace"
    
    # Compare results
    compare_runs "npm-auth"
    
    unset GITHUB_TOKEN
}

run_fix_imports_test() {
    local workspace="$REAL_WORLD_DIR/workspace/sample-monorepo"
    
    echo -e "${YELLOW}🧪 Testing fix-imports command${NC}"
    
    # Create backup of test file
    cp "$workspace/packages/utils/src/index.ts" "$workspace/packages/utils/src/index.ts.backup"
    
    # Run shell script
    run_command "fix-imports" "shell" "$PROJECT_ROOT/scripts/fix-duplicate-imports.sh" "$workspace/packages/utils/src/index.ts" "$workspace"
    
    # Restore backup for fair comparison
    cp "$workspace/packages/utils/src/index.ts.backup" "$workspace/packages/utils/src/index.ts"
    
    # Run TypeScript CLI
    run_command "fix-imports" "typescript" "fix-imports" "--pattern $workspace/packages/utils/src/index.ts" "$workspace"
    
    # Compare results
    compare_runs "fix-imports"
    
    # Restore original file
    cp "$workspace/packages/utils/src/index.ts.backup" "$workspace/packages/utils/src/index.ts"
    rm "$workspace/packages/utils/src/index.ts.backup"
}

run_validate_deps_test() {
    local workspace="$REAL_WORLD_DIR/workspace/sample-monorepo"
    
    echo -e "${YELLOW}🧪 Testing validate-deps command${NC}"
    
    # Run shell script
    run_command "validate-deps" "shell" "$PROJECT_ROOT/scripts/validate-monorepo-deps.sh" "" "$workspace"
    
    # Run TypeScript CLI
    run_command "validate-deps" "typescript" "validate-deps" "" "$workspace"
    
    # Compare results
    compare_runs "validate-deps"
}

run_test_runner_test() {
    local workspace="$REAL_WORLD_DIR/workspace/sample-monorepo"
    
    echo -e "${YELLOW}🧪 Testing test-runner command${NC}"
    
    # Run shell script (with timeout to prevent hanging)
    timeout 30s bash -c "$(run_command "test-runner" "shell" "$PROJECT_ROOT/scripts/smart-test-runner.sh" "" "$workspace")" || true
    
    # Run TypeScript CLI (with timeout)
    timeout 30s bash -c "$(run_command "test-runner" "typescript" "test-runner" "" "$workspace")" || true
    
    # Compare results
    compare_runs "test-runner"
}

# Main execution
command="${1:-help}"

case "$command" in
    "npm-auth")
        run_npm_auth_test
        ;;
    "fix-imports")
        run_fix_imports_test
        ;;
    "validate-deps")
        run_validate_deps_test
        ;;
    "test-runner")
        run_test_runner_test
        ;;
    "all")
        echo -e "${BLUE}🧪 Running all command comparisons${NC}"
        run_npm_auth_test
        run_fix_imports_test
        run_validate_deps_test
        run_test_runner_test
        echo -e "${GREEN}🎉 All comparisons complete! Check results/ directory${NC}"
        ;;
    "help"|*)
        echo "Usage: $0 {npm-auth|fix-imports|validate-deps|test-runner|all|help}"
        echo
        echo "Commands:"
        echo "  npm-auth      - Compare npm authentication setup"
        echo "  fix-imports   - Compare duplicate import fixing"
        echo "  validate-deps - Compare dependency validation"
        echo "  test-runner   - Compare intelligent test running"
        echo "  all           - Run all comparisons"
        echo "  help          - Show this help"
        echo
        echo "⚠️  Make sure to run setup-test-environment.sh first!"
        ;;
esac