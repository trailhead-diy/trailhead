#!/bin/bash
# Setup isolated test environment for real-world command comparison
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REAL_WORLD_DIR="$(dirname "$SCRIPT_DIR")"
CLI_DIR="$(dirname "$(dirname "$REAL_WORLD_DIR")")"
PROJECT_ROOT="$(cd "$CLI_DIR/../.." && pwd)"

echo "🏗️  Setting up real-world test environment"
echo

# Create directory structure
echo "📁 Creating directory structure..."
mkdir -p "$REAL_WORLD_DIR/workspace/sample-monorepo"
mkdir -p "$REAL_WORLD_DIR/workspace/temp"
mkdir -p "$REAL_WORLD_DIR/snapshots"
mkdir -p "$REAL_WORLD_DIR/outputs"
mkdir -p "$REAL_WORLD_DIR/results"

# Create sample monorepo structure for testing
echo "📦 Creating sample monorepo structure..."
SAMPLE_ROOT="$REAL_WORLD_DIR/workspace/sample-monorepo"

# Root package.json
cat > "$SAMPLE_ROOT/package.json" << 'EOF'
{
  "name": "test-monorepo",
  "private": true,
  "workspaces": [
    "packages/*",
    "apps/*"
  ],
  "scripts": {
    "build": "turbo build",
    "test": "turbo test",
    "lint": "turbo lint"
  },
  "devDependencies": {
    "turbo": "^1.10.0"
  }
}
EOF

# turbo.json
cat > "$SAMPLE_ROOT/turbo.json" << 'EOF'
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["build"]
    },
    "lint": {}
  }
}
EOF

# Create sample packages
mkdir -p "$SAMPLE_ROOT/packages/utils"
cat > "$SAMPLE_ROOT/packages/utils/package.json" << 'EOF'
{
  "name": "@test/utils",
  "version": "1.0.0",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "test": "vitest"
  },
  "dependencies": {
    "lodash": "^4.17.21"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "vitest": "^1.0.0"
  }
}
EOF

# Sample file with duplicate imports (for fix-imports testing)
cat > "$SAMPLE_ROOT/packages/utils/src/index.ts" << 'EOF'
import { debounce } from 'lodash';
import { throttle } from 'lodash';
import { debounce } from 'lodash'; // Duplicate import
import { map } from 'lodash';
import { debounce } from 'lodash'; // Another duplicate

export { debounce, throttle, map };
EOF

mkdir -p "$SAMPLE_ROOT/packages/core"
cat > "$SAMPLE_ROOT/packages/core/package.json" << 'EOF'
{
  "name": "@test/core",
  "version": "1.0.0",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "test": "vitest"
  },
  "dependencies": {
    "@test/utils": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "vitest": "^1.0.0"
  }
}
EOF

# Create circular dependency scenario (for validate-deps testing)
cat > "$SAMPLE_ROOT/packages/core/src/index.ts" << 'EOF'
import { helper } from '@test/utils';
export const coreFunction = () => helper();
EOF

# Update utils to depend on core (creating circular dependency)
cat > "$SAMPLE_ROOT/packages/utils/src/helper.ts" << 'EOF'
import { coreFunction } from '@test/core'; // This creates circular dependency
export const helper = () => coreFunction();
EOF

# Create app
mkdir -p "$SAMPLE_ROOT/apps/web"
cat > "$SAMPLE_ROOT/apps/web/package.json" << 'EOF'
{
  "name": "@test/web",
  "version": "1.0.0",
  "scripts": {
    "build": "next build",
    "test": "vitest"
  },
  "dependencies": {
    "@test/core": "workspace:*",
    "@test/utils": "workspace:*",
    "next": "^14.0.0"
  },
  "devDependencies": {
    "vitest": "^1.0.0"
  }
}
EOF

# Create test files with high-risk patterns (for test-runner testing)
mkdir -p "$SAMPLE_ROOT/packages/utils/tests"
cat > "$SAMPLE_ROOT/packages/utils/tests/slow-test.test.ts" << 'EOF'
import { describe, it, expect } from 'vitest';

describe('Slow tests', () => {
  it('should handle database operations', async () => {
    // Simulate database operation
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(true).toBe(true);
  });

  it('should handle API calls', async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(true).toBe(true);
  });
});
EOF

cat > "$SAMPLE_ROOT/packages/core/tests/integration.test.ts" << 'EOF'
import { describe, it, expect } from 'vitest';

describe('Integration tests', () => {
  it('should test component interaction', () => {
    // Integration test logic
    expect(true).toBe(true);
  });

  it('should handle user workflows', () => {
    // User workflow test
    expect(true).toBe(true);
  });
});
EOF

# Create npm auth test environment
mkdir -p "$REAL_WORLD_DIR/workspace/npm-test"
echo "registry=https://registry.npmjs.org/" > "$REAL_WORLD_DIR/workspace/npm-test/.npmrc"

echo "✅ Test environment setup complete!"
echo
echo "📁 Sample monorepo created at: $SAMPLE_ROOT"
echo "🔧 Test utilities available in: $SCRIPT_DIR"
echo
echo "⚠️  Ready for testing - remember to run cleanup when done!"
echo "💡 Next: Run specific command comparisons with ./compare-command.sh"