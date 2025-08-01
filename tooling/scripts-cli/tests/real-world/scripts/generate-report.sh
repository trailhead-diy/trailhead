#!/bin/bash
# Generate comprehensive comparison report from all test results
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REAL_WORLD_DIR="$(dirname "$SCRIPT_DIR")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

REPORT_FILE="$REAL_WORLD_DIR/results/comprehensive-report.md"

echo -e "${BLUE}📊 Generating comprehensive comparison report${NC}"

# Create comprehensive report
{
    echo "# Shell Scripts vs TypeScript CLI - Comprehensive Comparison Report"
    echo
    echo "**Generated:** $(date)"
    echo "**Test Environment:** $(uname -s) $(uname -r)"
    echo
    
    echo "## Executive Summary"
    echo
    
    # Count total tests and results
    local total_tests=0
    local passed_tests=0
    local failed_tests=0
    
    # Analyze results
    for result_file in "$REAL_WORLD_DIR/results"/*-comparison.md; do
        if [[ -f "$result_file" ]]; then
            total_tests=$((total_tests + 1))
            local command_name=$(basename "$result_file" -comparison.md)
            
            echo "### $command_name"
            echo
            
            # Extract key findings from individual reports
            if grep -q "✅.*Match" "$result_file"; then
                echo "- ✅ **Exit codes match**"
                passed_tests=$((passed_tests + 1))
            elif grep -q "❌.*Different" "$result_file"; then
                echo "- ❌ **Exit codes differ**"
                failed_tests=$((failed_tests + 1))
            else
                echo "- ⚠️ **Results inconclusive**"
            fi
            
            # Check for file changes
            if [[ -f "$REAL_WORLD_DIR/results/state-diff-${command_name}-shell-before-${command_name}-shell-after.json" ]]; then
                echo "- 📁 **File changes detected in shell version**"
            fi
            
            if [[ -f "$REAL_WORLD_DIR/results/state-diff-${command_name}-typescript-before-${command_name}-typescript-after.json" ]]; then
                echo "- 📁 **File changes detected in TypeScript version**"
            fi
            
            echo
        fi
    done
    
    echo "## Overall Results"
    echo
    echo "| Metric | Count |"
    echo "|--------|-------|"
    echo "| Total Commands Tested | $total_tests |"
    echo "| Commands with Matching Behavior | $passed_tests |"
    echo "| Commands with Different Behavior | $failed_tests |"
    echo "| Success Rate | $(( passed_tests * 100 / (total_tests > 0 ? total_tests : 1) ))% |"
    echo
    
    if [[ $passed_tests -eq $total_tests ]] && [[ $total_tests -gt 0 ]]; then
        echo "✅ **RECOMMENDATION: Safe to migrate to TypeScript CLI**"
    elif [[ $failed_tests -gt 0 ]]; then
        echo "⚠️ **RECOMMENDATION: Review differences before migration**"
    else
        echo "❓ **RECOMMENDATION: Run more comprehensive tests**"
    fi
    echo
    
    echo "## Detailed Analysis"
    echo
    
    # Include detailed findings from each command
    for result_file in "$REAL_WORLD_DIR/results"/*-comparison.md; do
        if [[ -f "$result_file" ]]; then
            echo "---"
            echo
            cat "$result_file"
            echo
        fi
    done
    
    echo "## Performance Analysis"
    echo
    
    # Extract timing data from output files
    echo "| Command | Shell Script Time | TypeScript CLI Time | Difference |"
    echo "|---------|------------------|-------------------|------------|"
    
    for output_file in "$REAL_WORLD_DIR/outputs"/*-shell.json; do
        if [[ -f "$output_file" ]]; then
            local command_name=$(basename "$output_file" -shell.json)
            local ts_file="$REAL_WORLD_DIR/outputs/${command_name}-typescript.json"
            
            if [[ -f "$ts_file" ]]; then
                echo "| $command_name | N/A* | N/A* | Timing data needs implementation |"
            fi
        fi
    done
    
    echo
    echo "*Timing data collection requires enhanced implementation"
    echo
    
    echo "## File System Impact Analysis"
    echo
    
    # Analyze what files were changed by each command
    for snapshot in "$REAL_WORLD_DIR/snapshots"/*-before.json; do
        if [[ -f "$snapshot" ]]; then
            local test_name=$(basename "$snapshot" -before.json)
            local after_snapshot="$REAL_WORLD_DIR/snapshots/${test_name}-after.json"
            
            if [[ -f "$after_snapshot" ]]; then
                echo "### $test_name"
                echo
                echo "- Before snapshot: $(date -r "$snapshot")"
                echo "- After snapshot: $(date -r "$after_snapshot")"
                echo "- State diff: Available in snapshots/ directory"
                echo
            fi
        fi
    done
    
    echo "## Testing Methodology"
    echo
    echo "### Test Environment"
    echo "- Isolated workspace with sample monorepo structure"
    echo "- Realistic test data including duplicate imports, circular dependencies"
    echo "- State capture before/after each command execution"
    echo "- Output capture (stdout, stderr, exit codes)"
    echo
    echo "### Safety Measures"
    echo "- All tests run in isolated directories"
    echo "- Filesystem state snapshots for rollback"
    echo "- No permanent changes to real project files"
    echo "- Timeout protection for long-running commands"
    echo
    echo "### Limitations"
    echo "- Some commands may require interactive input (not tested)"
    echo "- Network-dependent operations tested with mock data"
    echo "- Performance timing needs enhanced implementation"
    echo "- State restoration requires manual intervention"
    echo
    
    echo "## Next Steps"
    echo
    if [[ $failed_tests -eq 0 ]] && [[ $total_tests -gt 0 ]]; then
        echo "1. ✅ **Proceed with migration** - All tests passed"
        echo "2. 📚 Update documentation to reference TypeScript CLI"
        echo "3. 🗑️ Archive shell scripts after successful migration"
        echo "4. 🔄 Update CI/CD pipelines to use TypeScript commands"
    else
        echo "1. 🔍 **Review failed tests** - Investigate differences found"
        echo "2. 🔧 **Fix discrepancies** - Update TypeScript CLI to match shell behavior"
        echo "3. 🧪 **Re-run tests** - Verify fixes resolve issues"
        echo "4. 📋 **Expand test coverage** - Add edge cases and error scenarios"
    fi
    echo
    
    echo "## Appendix"
    echo
    echo "### Files Generated"
    echo "- Snapshots: $(ls -1 "$REAL_WORLD_DIR/snapshots" | wc -l) files"
    echo "- Outputs: $(ls -1 "$REAL_WORLD_DIR/outputs" | wc -l) files"
    echo "- Results: $(ls -1 "$REAL_WORLD_DIR/results" | wc -l) files"
    echo
    echo "### Raw Data Location"
    echo "- Snapshots: \`$REAL_WORLD_DIR/snapshots/\`"
    echo "- Command outputs: \`$REAL_WORLD_DIR/outputs/\`"
    echo "- Individual reports: \`$REAL_WORLD_DIR/results/\`"
    echo
    echo "---"
    echo "*Report generated by real-world testing framework*"
    
} > "$REPORT_FILE"

echo -e "${GREEN}📊 Comprehensive report generated: $REPORT_FILE${NC}"
echo
echo "📋 Summary:"
echo "- Total tests analyzed: $total_tests"
echo "- Individual reports processed: $(ls -1 "$REAL_WORLD_DIR/results"/*-comparison.md 2>/dev/null | wc -l)"
echo "- Snapshots captured: $(ls -1 "$REAL_WORLD_DIR/snapshots" 2>/dev/null | wc -l)"
echo
echo "💡 Open the report file to see detailed analysis and recommendations"