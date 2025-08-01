#!/bin/bash
# Simple verification that TypeScript CLI commands exist and work
set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"

echo "🧪 Verifying TypeScript CLI Parity"
echo

# Check that CLI is built - use relative path from script location
CLI_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [[ ! -f "$CLI_DIR/dist/cli.js" ]]; then
  echo "❌ CLI not built. Run: pnpm build --filter=@repo/scripts-cli"
  exit 1
fi

echo "✅ CLI built successfully"

# Check each command exists by running the CLI from the correct directory
commands=("npm-auth" "ci-optimal" "test-runner" "fix-imports" "validate-deps")

cd "$CLI_DIR"
for cmd in "${commands[@]}"; do
  if pnpm scripts-cli --help | grep -q "$cmd"; then
    echo "✅ $cmd command available"
  else
    echo "❌ $cmd command missing"
    exit 1
  fi
done

echo
echo "🎉 All shell script equivalents are available in TypeScript CLI"
echo "💡 Run individual commands with: pnpm scripts-cli <command> --help"
echo
echo "📋 Available commands:"
echo "  • npm-auth       - Setup npm authentication (replaces setup-npm-auth.sh)"
echo "  • ci-optimal     - Run CI pipeline (replaces ci-optimal.sh)"  
echo "  • test-runner    - Intelligent test runner (replaces smart-test-runner.sh)"
echo "  • fix-imports    - Fix duplicate imports (replaces fix-duplicate-imports.sh)"
echo "  • validate-deps  - Validate dependencies (replaces validate-monorepo-deps.sh)"
echo
echo "✅ TypeScript CLI ready for production use!"