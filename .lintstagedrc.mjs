// Modern ESM configuration for lint-staged with optimized test running
import { relative } from 'node:path'

export default {
  // Format all supported files
  '**/*.{ts,tsx,js,jsx,json,md}': 'prettier --write --ignore-path .gitignore',
  
  // Validate documentation files for Diátaxis compliance
  'docs/**/*.md': 'pnpm docs:validate',
  'packages/**/docs/**/*.md': 'pnpm docs:validate',
  
  // Run tests only for changed source files (not test files themselves)
  'packages/**/*.{ts,tsx,js,jsx}': async (filenames) => {
    // Skip if only test/config files changed
    const sourceFiles = filenames.filter(file => 
      !file.match(/\.(test|spec|config)\.[jt]sx?$/) &&
      !file.includes('__tests__/') &&
      !file.includes('tests/') &&
      !file.match(/vitest\.|vite\.|jest\.|webpack\./)
    )
    
    if (sourceFiles.length === 0) {
      return []
    }
    
    const commands = []
    
    // Determine affected packages
    const hasCliChanges = sourceFiles.some(f => f.includes('packages/cli/'))
    const hasWebUIChanges = sourceFiles.some(f => f.includes('packages/web-ui/'))
    const hasToolingChanges = sourceFiles.some(f => f.includes('tooling/'))
    
    // For tooling changes, test all packages
    if (hasToolingChanges) {
      commands.push('pnpm test --filter=@trailhead/cli -- --changed HEAD --passWithNoTests')
      commands.push('pnpm test --filter=@trailhead/web-ui -- --changed HEAD --passWithNoTests')
    } else {
      // Test only affected packages
      if (hasCliChanges) {
        commands.push('pnpm test --filter=@trailhead/cli -- --changed HEAD --passWithNoTests')
      }
      if (hasWebUIChanges) {
        commands.push('pnpm test --filter=@trailhead/web-ui -- --changed HEAD --passWithNoTests')
      }
    }
    
    // Always run type checking for TypeScript files
    const tsFiles = filenames.filter(f => f.match(/\.tsx?$/))
    if (tsFiles.length > 0) {
      commands.push('pnpm types')
    }
    
    // Always run linting
    commands.push('pnpm lint')
    
    return commands
  }
}