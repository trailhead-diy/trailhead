#!/bin/bash
set -e

# Function to fix duplicate imports in a file
fix_file() {
  local file=$1
  echo "Fixing: $file"
  
  # Use sed to fix common patterns
  # Pattern 1: Merge @esteban-url/core imports
  sed -i.bak -E '
    # Match first import from @esteban-url/core
    /^import .* from .@esteban-url\/core./{
      h
      :loop
      n
      # If next line is also import from same module, append to hold space
      /^import .* from .@esteban-url\/core./{
        H
        b loop
      }
      # Otherwise, process accumulated imports
      x
      # Extract all imports and merge them
      s/import \{([^}]*)\} from .@esteban-url\/core.;?\n?/\1, /g
      s/import type \{([^}]*)\} from .@esteban-url\/core.;?\n?/type \1, /g
      s/, $//
      s/^/import { /
      s/$/ } from '\''@esteban-url\/core'\''/
      # Print merged import
      p
      # Get the non-import line back and continue
      g
    }
  ' "$file"
  
  # Clean up backup
  rm -f "${file}.bak"
}

# Common files with duplicate imports
files=(
  "packages/config/src/validation/formatters.ts"
  "packages/create-cli/src/lib/cli/prompts.ts"
  "packages/create-cli/src/lib/cli/args.ts"
  "packages/config/src/core/zod-schema.ts"
  "packages/fs/src/types.ts"
  "packages/data/src/json/core.ts"
  "packages/config/src/validation/errors.ts"
  "packages/config/src/validators/operations.ts"
  "packages/create-cli/src/lib/config/presets.ts"
  "packages/create-cli/src/lib/config/manager.ts"
  "packages/config/src/core/operations.ts"
  "packages/cli/src/progress/enhanced-tracker.test.ts"
  "packages/create-cli/src/lib/config/validation.ts"
  "packages/create-cli/src/lib/core/generator.ts"
  "packages/create-cli/src/lib/core/errors.ts"
  "packages/create-cli/src/lib/config/schema.ts"
  "packages/cli/tests/command-registration.test.ts"
  "packages/data/src/operations.ts"
  "packages/data/src/errors.ts"
  "packages/config/src/testing/index.ts"
  "packages/data/src/excel/core.ts"
  "packages/data/src/formats-errors.ts"
  "packages/validation/src/testing/index.ts"
  "packages/validation/src/types.ts"
  "packages/create-cli/src/lib/git/operations.ts"
  "packages/create-cli/src/lib/templates/modules.ts"
  "packages/create-cli/src/lib/templates/loader.ts"
  "packages/create-cli/src/lib/git/errors.ts"
  "packages/create-cli/src/lib/templates/compiler.ts"
  "packages/create-cli/src/lib/templates/context.ts"
  "packages/core/src/testing/utils.ts"
  "packages/create-cli/src/lib/git/config.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    fix_file "$file"
  fi
done

echo "Done fixing duplicate imports"