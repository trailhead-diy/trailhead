#!/bin/bash

echo "📊 CI Performance Analysis Report"
echo "================================="
echo

# Get latest CI runs
echo "🔍 Analyzing recent CI runs..."
echo

# Check if gh CLI is available
if ! command -v gh &> /dev/null; then
    echo "Error: GitHub CLI (gh) is required for this script"
    echo "Install from: https://cli.github.com/"
    exit 1
fi

# Get the last 10 CI runs
RUNS=$(gh run list --workflow=ci.yml --limit=10 --json databaseId,conclusion,startedAt,updatedAt,headBranch,event)

# Calculate average duration
echo "📈 CI Run Statistics (Last 10 runs):"
echo "-----------------------------------"

# Parse and display run data
echo "$RUNS" | jq -r '.[] | 
    . as $run | 
    ($run.updatedAt | fromdateiso8601) - ($run.startedAt | fromdateiso8601) | 
    . / 60 | floor | 
    "\($run.event) on \($run.headBranch): \(.) minutes (\($run.conclusion))"'

echo
echo "📊 Performance Metrics:"
echo "----------------------"

# Calculate average duration
AVG_DURATION=$(echo "$RUNS" | jq -r '.[] | 
    select(.conclusion == "success") | 
    ((.updatedAt | fromdateiso8601) - (.startedAt | fromdateiso8601)) / 60' | 
    awk '{sum+=$1; count++} END {if(count>0) printf "%.1f", sum/count; else print "N/A"}')

echo "Average successful run duration: ${AVG_DURATION} minutes"

# Count cache hits (if using new CI with notices)
echo
echo "🚀 Optimization Opportunities:"
echo "-----------------------------"

# Compare with optimized targets
if (( $(echo "$AVG_DURATION > 10" | bc -l) )); then
    echo "⚠️  Current average (${AVG_DURATION}min) exceeds target (5min)"
    echo "   Recommendations:"
    echo "   - Enable Turborepo remote caching"
    echo "   - Use PR-only test matrix"
    echo "   - Split quality checks into parallel jobs"
else
    echo "✅ CI performance is optimized (${AVG_DURATION}min average)"
fi

# Estimate cost savings
echo
echo "💰 Cost Analysis:"
echo "-----------------"

# Current usage
CURRENT_MINUTES=$(echo "$AVG_DURATION * 13" | bc -l) # 13 jobs per run
echo "Current: ~${CURRENT_MINUTES} minutes per run"

# Optimized usage
OPTIMIZED_MINUTES=$(echo "$AVG_DURATION * 6 * 0.3" | bc -l) # 6 jobs, 70% faster
echo "Optimized: ~${OPTIMIZED_MINUTES} minutes per run"

# Savings
SAVINGS=$(echo "scale=0; (($CURRENT_MINUTES - $OPTIMIZED_MINUTES) / $CURRENT_MINUTES) * 100" | bc -l)
echo "Potential savings: ${SAVINGS}%"

echo
echo "📋 Implementation Status:"
echo "------------------------"

# Check for optimization features
if [ -f ".github/actions/setup-node-pnpm/action.yml" ]; then
    echo "✅ Composite actions implemented"
else
    echo "❌ Composite actions not found"
fi

if grep -q "TURBO_TOKEN" .github/workflows/ci.yml 2>/dev/null; then
    echo "✅ Turborepo remote caching configured"
else
    echo "❌ Turborepo remote caching not configured"
fi

if grep -q "matrix.*github.event_name.*push" .github/workflows/ci.yml 2>/dev/null; then
    echo "✅ Smart matrix strategy implemented"
else
    echo "❌ Smart matrix strategy not implemented"
fi

echo
echo "📚 Next Steps:"
echo "--------------"
echo "1. Run: ./scripts/migrate-to-ultimate-ci.sh"
echo "2. Set up Turborepo account at https://turbo.build"
echo "3. Monitor performance improvements"
echo
echo "For detailed optimization guide, see: docs/ci-ultimate-guide.md"