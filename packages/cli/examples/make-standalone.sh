#!/bin/bash
# Script to convert an example to a standalone project

if [ -z "$1" ]; then
  echo "Usage: ./make-standalone.sh <example-name> [destination]"
  echo "Available examples:"
  ls -d */ | grep -v __tests__ | sed 's|/||'
  exit 1
fi

EXAMPLE=$1
DEST=${2:-"/tmp/$EXAMPLE-standalone"}

if [ ! -d "$EXAMPLE" ]; then
  echo "Example '$EXAMPLE' not found"
  exit 1
fi

echo "Creating standalone version of $EXAMPLE at $DEST..."

# Copy the example
cp -r "$EXAMPLE" "$DEST"

# Update package.json to use GitHub reference
cd "$DEST"
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  sed -i '' 's/"@trailhead\/cli": "workspace:\*"/"@trailhead\/cli": "github:esteban-url\/trailhead#packages\/cli"/' package.json
else
  # Linux
  sed -i 's/"@trailhead\/cli": "workspace:\*"/"@trailhead\/cli": "github:esteban-url\/trailhead#packages\/cli"/' package.json
fi

# Create a standalone tsconfig.json if it exists
if [ -f "tsconfig.json" ]; then
  echo "Creating standalone tsconfig.json..."
  cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "allowJs": false,
    "noEmit": false,
    "incremental": true,
    "tsBuildInfoFile": "./dist/.tsbuildinfo",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "allowSyntheticDefaultImports": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF
fi

echo "Standalone project created at: $DEST"
echo ""
echo "To use it:"
echo "  cd $DEST"
echo "  npm install"
echo "  npm run dev <command>"