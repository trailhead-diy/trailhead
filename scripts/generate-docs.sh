#!/usr/bin/env bash
set -e

# Generate API documentation using TypeDoc
# Installs TypeDoc locally to avoid version conflicts with monorepo dependencies
#
# Usage:
#   ./generate-docs.sh        # Generate once
#   ./generate-docs.sh watch  # Watch mode

WATCH_MODE=false
if [ "$1" = "watch" ]; then
  WATCH_MODE=true
  echo "📚 Starting API documentation watch mode..."
else
  echo "📚 Generating API documentation..."
fi

# Install TypeDoc and plugin in isolated directory
NPM_CONFIG_USERCONFIG=/dev/null npm install --no-save --prefix .typedoc \
  typedoc typedoc-plugin-markdown 2>/dev/null

# Run TypeDoc with isolated installation
if [ "$WATCH_MODE" = true ]; then
  PATH=.typedoc/node_modules/.bin:$PATH typedoc --watch
else
  PATH=.typedoc/node_modules/.bin:$PATH typedoc

  # Format generated docs
  pnpm prettier --write "docs/**/*.md" --log-level=error > /dev/null 2>&1

  echo "✅ Documentation generated successfully"
fi
