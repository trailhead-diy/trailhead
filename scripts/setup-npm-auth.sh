#!/bin/bash
# Setup npm authentication for GitHub Packages
# This script configures npm/pnpm to use GitHub Packages when GITHUB_TOKEN is available

set -e

# Only configure if GITHUB_TOKEN is set
if [ -n "$GITHUB_TOKEN" ]; then
  echo "🔧 Configuring npm authentication for GitHub Packages..."
  
  # Create a temporary .npmrc with GitHub token
  cat >> .npmrc << EOF

# GitHub Packages Authentication (added by setup script)
@trailhead:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
EOF
  
  echo "✅ GitHub Packages authentication configured"
else
  echo "ℹ️  GITHUB_TOKEN not set, skipping GitHub Packages configuration"
  echo "   This is normal for public CI builds and local development"
fi