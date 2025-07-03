// Streamlined lint-staged configuration
export default {
  // 1. Format all code and docs
  '**/*.{ts,tsx,js,jsx,json,md}': [
    'prettier --write --ignore-path .gitignore',
  ],
  
  // 2. Validate only changed documentation files
  'docs/**/*.md': (filenames) => 
    filenames.map(filename => `pnpm docs:validate ${filename}`),
  
  'packages/**/docs/**/*.md': (filenames) => 
    filenames.map(filename => `pnpm docs:validate ${filename}`),
  
  // 3. Lint TypeScript/JavaScript files
  'packages/**/*.{ts,tsx,js,jsx}': [
    'pnpm lint:fix --filter=...[HEAD^1]',
  ],
}