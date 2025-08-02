/**
 * Template utilities for getting available templates and template information
 */

/**
 * Information about an available template
 */
export interface TemplateInfo {
  /** Template identifier/name */
  name: string
  /** Human-readable description */
  description: string
  /** List of features provided by this template */
  features: string[]
  /** Template type */
  type: 'basic' | 'advanced' | 'custom'
  /** Whether this is a built-in template */
  builtin: boolean
}

/**
 * Available built-in templates with their metadata
 */
const BUILTIN_TEMPLATES: TemplateInfo[] = [
  {
    name: 'basic',
    description: 'Basic CLI application with essential features',
    features: ['Core CLI framework', 'Command handling', 'Error handling', 'TypeScript support'],
    type: 'basic',
    builtin: true,
  },
  {
    name: 'advanced',
    description: 'Full-featured CLI application with all capabilities',
    features: [
      'Core CLI framework',
      'Command handling',
      'Configuration management',
      'Data validation',
      'Testing utilities',
      'Documentation generation',
      'CI/CD setup',
      'TypeScript support',
    ],
    type: 'advanced',
    builtin: true,
  },
  {
    name: 'library',
    description: 'Reusable library package with TypeScript',
    features: [
      'Library structure',
      'TypeScript support',
      'Testing framework',
      'Documentation',
      'Build system',
      'Publishing setup',
    ],
    type: 'basic',
    builtin: true,
  },
  {
    name: 'monorepo-package',
    description: 'Package designed for monorepo environments',
    features: [
      'Monorepo-optimized structure',
      'Workspace integration',
      'Shared configurations',
      'TypeScript support',
      'Testing framework',
    ],
    type: 'basic',
    builtin: true,
  },
]

/**
 * Get information about all available project templates
 * 
 * Returns metadata about built-in templates that can be used for project generation.
 * This includes template names, descriptions, and feature lists.
 * 
 * @returns Array of template information objects
 * 
 * @example
 * ```typescript
 * import { getAvailableTemplates } from '@esteban-url/create-cli'
 * 
 * const templates = getAvailableTemplates()
 * templates.forEach((template) => {
 *   console.log(`${template.name}: ${template.description}`)
 *   console.log(`  Features: ${template.features.join(', ')}`)
 * })
 * ```
 */
export function getAvailableTemplates(): TemplateInfo[] {
  // For now, return built-in templates
  // In the future, this could be extended to scan for custom templates
  return [...BUILTIN_TEMPLATES]
}

/**
 * Get information about a specific template by name
 * 
 * @param templateName - Name of the template to get information for
 * @returns Template information if found, undefined otherwise
 */
export function getTemplateInfo(templateName: string): TemplateInfo | undefined {
  return BUILTIN_TEMPLATES.find((template) => template.name === templateName)
}

/**
 * Check if a template name is valid/available
 * 
 * @param templateName - Name of the template to check
 * @returns True if template is available, false otherwise
 */
export function isValidTemplate(templateName: string): boolean {
  return BUILTIN_TEMPLATES.some((template) => template.name === templateName)
}