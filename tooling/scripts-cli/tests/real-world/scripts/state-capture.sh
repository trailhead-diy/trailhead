#!/bin/bash
# State capture system for filesystem snapshots and environment tracking
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REAL_WORLD_DIR="$(dirname "$SCRIPT_DIR")"

# Function to capture complete filesystem state
capture_state() {
    local name="$1"
    local directory="$2"
    local output_file="$REAL_WORLD_DIR/snapshots/${name}.json"
    
    echo "📸 Capturing state: $name"
    
    # Create JSON structure with file contents, permissions, and metadata
    {
        echo "{"
        echo "  \"timestamp\": \"$(date -Iso8601)\","
        echo "  \"directory\": \"$directory\","
        echo "  \"files\": {"
        
        local first_file=true
        
        # Find all files and capture their state
        if [[ -d "$directory" ]]; then
            find "$directory" -type f -print0 | while IFS= read -r -d '' file; do
                local rel_path="${file#$directory/}"
                
                if [[ "$first_file" == true ]]; then
                    first_file=false
                else
                    echo ","
                fi
                
                echo -n "    \"$rel_path\": {"
                echo -n "\"content\": \"$(base64 -w 0 "$file" 2>/dev/null || echo "")\","
                echo -n "\"permissions\": \"$(stat -c %a "$file" 2>/dev/null || stat -f %A "$file" 2>/dev/null || echo "644")\","
                echo -n "\"size\": $(stat -c %s "$file" 2>/dev/null || stat -f %z "$file" 2>/dev/null || echo "0"),"
                echo -n "\"modified\": \"$(stat -c %Y "$file" 2>/dev/null || stat -f %m "$file" 2>/dev/null || echo "0")\""
                echo -n "}"
            done
        fi
        
        echo
        echo "  },"
        echo "  \"environment\": {"
        echo "    \"PWD\": \"$(pwd)\","
        echo "    \"HOME\": \"$HOME\","
        echo "    \"GITHUB_TOKEN\": \"${GITHUB_TOKEN:-""}\","
        echo "    \"NODE_ENV\": \"${NODE_ENV:-""}\""
        echo "  },"
        echo "  \"git_status\": {"
        echo "    \"branch\": \"$(git branch --show-current 2>/dev/null || echo "unknown")\","
        echo "    \"dirty\": $(git diff --quiet 2>/dev/null && echo "false" || echo "true")"
        echo "  }"
        echo "}"
    } > "$output_file"
    
    echo "✅ State captured to: $output_file"
}

# Function to restore state from snapshot
restore_state() {
    local name="$1"
    local snapshot_file="$REAL_WORLD_DIR/snapshots/${name}.json"
    
    if [[ ! -f "$snapshot_file" ]]; then
        echo "❌ Snapshot not found: $snapshot_file"
        return 1
    fi
    
    echo "🔄 Restoring state: $name"
    
    # Parse JSON and restore files (simplified - would need jq for full implementation)
    echo "⚠️  State restoration requires manual implementation with jq"
    echo "📄 Snapshot available at: $snapshot_file"
}

# Function to compare two snapshots
compare_states() {
    local before="$1"
    local after="$2"
    local output_file="$REAL_WORLD_DIR/results/state-diff-${before}-${after}.json"
    
    local before_file="$REAL_WORLD_DIR/snapshots/${before}.json"
    local after_file="$REAL_WORLD_DIR/snapshots/${after}.json"
    
    if [[ ! -f "$before_file" ]] || [[ ! -f "$after_file" ]]; then
        echo "❌ Missing snapshot files for comparison"
        return 1
    fi
    
    echo "🔍 Comparing states: $before → $after"
    
    # Create comparison report
    {
        echo "{"
        echo "  \"comparison\": \"$before vs $after\","
        echo "  \"timestamp\": \"$(date -Iso8601)\","
        echo "  \"before_snapshot\": \"$before_file\","
        echo "  \"after_snapshot\": \"$after_file\","
        echo "  \"file_changes\": {"
        echo "    \"added\": [],"
        echo "    \"modified\": [],"
        echo "    \"deleted\": []"
        echo "  },"
        echo "  \"summary\": \"Manual diff required - use: diff $before_file $after_file\""
        echo "}"
    } > "$output_file"
    
    echo "📊 Comparison saved to: $output_file"
    echo "💡 For detailed diff, run: diff $before_file $after_file"
}

# Function to capture command output
capture_output() {
    local command_name="$1"
    local test_type="$2"  # "shell" or "typescript"
    local exit_code="$3"
    local stdout_file="$4"
    local stderr_file="$5"
    
    local output_file="$REAL_WORLD_DIR/outputs/${command_name}-${test_type}.json"
    
    {
        echo "{"
        echo "  \"command\": \"$command_name\","
        echo "  \"type\": \"$test_type\","
        echo "  \"timestamp\": \"$(date -Iso8601)\","
        echo "  \"exit_code\": $exit_code,"
        echo "  \"stdout\": \"$(base64 -w 0 "$stdout_file" 2>/dev/null || echo "")\","
        echo "  \"stderr\": \"$(base64 -w 0 "$stderr_file" 2>/dev/null || echo "")\","
        echo "  \"stdout_lines\": $(wc -l < "$stdout_file" 2>/dev/null || echo "0"),"
        echo "  \"stderr_lines\": $(wc -l < "$stderr_file" 2>/dev/null || echo "0")"
        echo "}"
    } > "$output_file"
    
    echo "📝 Output captured: $output_file"
}

# Command line interface
case "${1:-help}" in
    "capture")
        capture_state "$2" "$3"
        ;;
    "restore")
        restore_state "$2"
        ;;
    "compare")
        compare_states "$2" "$3"
        ;;
    "output")
        capture_output "$2" "$3" "$4" "$5" "$6"
        ;;
    "help"|*)
        echo "Usage: $0 {capture|restore|compare|output|help}"
        echo
        echo "Commands:"
        echo "  capture <name> <directory>           - Capture filesystem state"
        echo "  restore <name>                       - Restore from snapshot"
        echo "  compare <before> <after>             - Compare two snapshots"
        echo "  output <cmd> <type> <exit> <out> <err> - Capture command output"
        echo "  help                                 - Show this help"
        echo
        echo "Examples:"
        echo "  $0 capture before-test /path/to/workspace"
        echo "  $0 compare before-test after-test"
        ;;
esac