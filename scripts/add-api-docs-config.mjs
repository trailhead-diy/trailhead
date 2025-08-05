#!/usr/bin/env node

/**
 * Add API Docs Configuration to Docusaurus
 * 
 * Generates the plugin configuration for API docs
 */

const PACKAGES = [
  'cli',
  'config',
  'data',
  'fs',
  'validation',
  'create-cli'
]

function generatePluginConfig(pkg) {
  return `    [
      '@docusaurus/plugin-content-docs',
      {
        id: '${pkg}-api',
        path: '../../docs/${pkg}/api',
        routeBasePath: 'packages/${pkg}/api',
        sidebarPath: './sidebars-${pkg}-api.ts',
        editUrl: 'https://github.com/esteban-url/trailhead/tree/main/',
        showLastUpdateTime: true,
        showLastUpdateAuthor: true,
      },
    ],`
}

console.log('Add these plugin configurations to docusaurus.config.ts after each package plugin:\n')

PACKAGES.forEach(pkg => {
  console.log(generatePluginConfig(pkg))
})

console.log('\nExample placement:')
console.log(`
    // Existing package plugin
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'cli',
        path: '../../packages/cli/docs',
        routeBasePath: 'packages/cli',
        ...
      },
    ],
    // Add the API plugin right after:
${generatePluginConfig('cli')}
`)