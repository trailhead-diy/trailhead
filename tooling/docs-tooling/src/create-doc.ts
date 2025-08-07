#!/usr/bin/env node
/**
 * Interactive documentation creator for Trailhead monorepo
 *
 * Guides users through creating properly formatted Diátaxis documentation
 * using templates and ensuring compliance with documentation standards.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, relative } from 'path'
import { input, select, confirm } from '@inquirer/prompts'
import { consola } from 'consola'
import { colors } from 'consola/utils'

interface DocMetadata {
  type: 'tutorial' | 'how-to' | 'reference' | 'explanation'
  title: string
  description: string
  prerequisites?: string[]
  related?: string[]
  filename: string
  directory: string
}

const DOCS_ROOT = join(process.cwd(), 'docs')
const TEMPLATES_DIR = join(DOCS_ROOT, 'templates')

const DOC_TYPES = [
  {
    name: 'Tutorial - Learning-oriented (e.g., "Build Your First CLI App")',
    value: 'tutorial' as const,
    description: 'Step-by-step learning experience that builds something concrete',
  },
  {
    name: 'How-To Guide - Task-oriented (e.g., "How to Add Custom Validation")',
    value: 'how-to' as const,
    description: 'Solve specific problems for users with existing knowledge',
  },
  {
    name: 'Reference - Information-oriented (e.g., "API Reference")',
    value: 'reference' as const,
    description: 'Comprehensive technical specifications and lookup information',
  },
  {
    name: 'Explanation - Understanding-oriented (e.g., "Why We Use Result Types")',
    value: 'explanation' as const,
    description: 'Conceptual understanding and design rationale',
  },
]

const COMMON_DIRECTORIES = {
  tutorial: ['tutorials', 'tutorials/getting-started', 'tutorials/advanced'],
  'how-to': ['how-to', 'how-to/cli', 'how-to/ui', 'how-to/deployment'],
  reference: ['reference', 'reference/api', 'reference/config'],
  explanation: ['explanation', 'explanation/architecture', 'explanation/concepts'],
}

function showWelcome(): void {
  consola.box('📝 Trailhead Documentation Creator')
  consola.info('This tool helps you create documentation that follows Diátaxis principles.')
  consola.info('Each document must be ONE type: Tutorial, How-To, Reference, or Explanation.\n')
}

function showTypeGuidance(type: string): void {
  const guidance = {
    tutorial: `
${colors.bold(colors.green('📚 Tutorial Guidelines:'))}
- Help users learn by building something concrete
- Step-by-step instructions with expected outcomes
- One clear path (no options or alternatives)
- Encourage and support learners
- End with a working result`,

    'how-to': `
${colors.bold(colors.yellow('🛠️ How-To Guide Guidelines:'))}
- Solve specific user problems
- Assume existing knowledge
- Get to the solution quickly
- Show multiple approaches when relevant
- Include troubleshooting`,

    reference: `
${colors.bold(colors.blue('📖 Reference Guidelines:'))}
- Comprehensive technical information
- Consistent, predictable structure
- No step-by-step instructions
- Complete parameter/option lists
- Brief examples for clarity`,

    explanation: `
${colors.bold(colors.magenta('💡 Explanation Guidelines:'))}
- Help users understand concepts
- Discuss background and motivation
- Explain design decisions and trade-offs
- Connect ideas and provide context
- No task instructions`,
  }

  console.log(guidance[type as keyof typeof guidance])
}

async function getDocumentType(): Promise<DocMetadata['type']> {
  return await select({
    message: 'What type of documentation are you creating?',
    choices: DOC_TYPES,
    pageSize: 4,
  })
}

async function getBasicInfo(
  _type: DocMetadata['type']
): Promise<Pick<DocMetadata, 'title' | 'description'>> {
  const title = await input({
    message: 'Document title:',
    validate: (value) => {
      if (!value.trim()) return 'Title is required'
      if (value.length < 5) return 'Title should be at least 5 characters'
      if (value.length > 80) return 'Title should be under 80 characters'
      return true
    },
  })

  const description = await input({
    message: 'One-line description:',
    validate: (value) => {
      if (!value.trim()) return 'Description is required'
      if (value.length < 10) return 'Description should be at least 10 characters'
      if (value.length > 120) return 'Description should be under 120 characters'
      return true
    },
  })

  return { title, description }
}

async function getPrerequisites(type: DocMetadata['type']): Promise<string[]> {
  if (type === 'reference' || type === 'explanation') {
    return [] // These types typically don't have prerequisites
  }

  const hasPrereqs = await confirm({
    message: 'Does this documentation have prerequisites?',
    default: type === 'tutorial', // Tutorials almost always have prerequisites
  })

  if (!hasPrereqs) return []

  const prerequisites: string[] = []
  let addMore = true

  while (addMore) {
    const prereq = await input({
      message: `Prerequisite ${prerequisites.length + 1}:`,
      validate: (value) => (value.trim() ? true : 'Prerequisite cannot be empty'),
    })

    prerequisites.push(prereq.trim())

    addMore = await confirm({
      message: 'Add another prerequisite?',
      default: false,
    })
  }

  return prerequisites
}

async function getRelatedDocs(): Promise<string[]> {
  const hasRelated = await confirm({
    message: 'Are there related documents to link to?',
    default: false,
  })

  if (!hasRelated) return []

  const related: string[] = []
  let addMore = true

  while (addMore) {
    const doc = await input({
      message: `Related document path ${related.length + 1} (e.g., /docs/how-to/setup):`,
      validate: (value) => {
        if (!value.trim()) return 'Path cannot be empty'
        if (!value.startsWith('/docs/')) return 'Path should start with /docs/'
        return true
      },
    })

    related.push(doc.trim())

    addMore = await confirm({
      message: 'Add another related document?',
      default: false,
    })
  }

  return related
}

async function getLocation(
  type: DocMetadata['type']
): Promise<{ directory: string; filename: string }> {
  const commonDirs = COMMON_DIRECTORIES[type]
  const choices = [
    ...commonDirs.map((dir) => ({
      name: `${dir}/ (${type} directory)`,
      value: dir,
    })),
    {
      name: 'Custom directory',
      value: 'custom',
    },
  ]

  let directory = await select({
    message: 'Where should this documentation be saved?',
    choices,
  })

  if (directory === 'custom') {
    directory = await input({
      message: 'Custom directory path (relative to docs/):',
      validate: (value) => {
        if (!value.trim()) return 'Directory is required'
        if (value.startsWith('/')) return 'Use relative path (no leading slash)'
        return true
      },
    })
  }

  const filename = await input({
    message: 'Filename (without .md extension):',
    validate: (value) => {
      if (!value.trim()) return 'Filename is required'
      if (!/^[a-z0-9-]+$/.test(value)) return 'Use lowercase letters, numbers, and hyphens only'
      if (value.length < 3) return 'Filename should be at least 3 characters'
      return true
    },
  })

  return { directory, filename: `${filename}.md` }
}

function generateFrontmatter(metadata: DocMetadata): string {
  const frontmatter = [
    '---',
    `type: ${metadata.type}`,
    `title: "${metadata.title}"`,
    `description: "${metadata.description}"`,
  ]

  if (metadata.prerequisites && metadata.prerequisites.length > 0) {
    frontmatter.push('prerequisites:')
    metadata.prerequisites.forEach((prereq) => {
      frontmatter.push(`  - ${prereq}`)
    })
  }

  if (metadata.related && metadata.related.length > 0) {
    frontmatter.push('related:')
    metadata.related.forEach((doc) => {
      frontmatter.push(`  - ${doc}`)
    })
  }

  frontmatter.push('---')
  return frontmatter.join('\n')
}

function loadTemplate(type: DocMetadata['type']): string {
  const templatePath = join(TEMPLATES_DIR, `${type}-template.md`)

  if (!existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`)
  }

  return readFileSync(templatePath, 'utf-8')
}

function processTemplate(template: string, metadata: DocMetadata): string {
  // Replace template frontmatter with actual metadata
  const frontmatter = generateFrontmatter(metadata)

  // Find the end of template frontmatter
  const frontmatterEnd = template.indexOf('---', 3) + 3
  const templateContent = template.substring(frontmatterEnd).trim()

  return `${frontmatter}\n\n${templateContent}`
}

async function createDocument(metadata: DocMetadata): Promise<void> {
  const fullDir = join(DOCS_ROOT, metadata.directory)
  const fullPath = join(fullDir, metadata.filename)

  // Check if file already exists
  if (existsSync(fullPath)) {
    const overwrite = await confirm({
      message: `File ${relative(process.cwd(), fullPath)} already exists. Overwrite?`,
      default: false,
    })

    if (!overwrite) {
      consola.warn('Operation cancelled.')
      return
    }
  }

  // Create directory if it doesn't exist
  if (!existsSync(fullDir)) {
    mkdirSync(fullDir, { recursive: true })
    consola.success(`Created directory: ${relative(process.cwd(), fullDir)}`)
  }

  // Load and process template
  const template = loadTemplate(metadata.type)
  const content = processTemplate(template, metadata)

  // Write file
  writeFileSync(fullPath, content, 'utf-8')

  consola.success(`\n✅ Created: ${relative(process.cwd(), fullPath)}`)
  consola.info(`\n📝 Next steps:`)
  console.log(`1. Edit the file to add your content`)
  console.log(`2. Run: pnpm docs:validate`)
  console.log(`3. Run: pnpm docs:lint`)

  const openEditor = await confirm({
    message: 'Would you like guidance on what to write?',
    default: true,
  })

  if (openEditor) {
    showTypeGuidance(metadata.type)
  }
}

async function main(): Promise<void> {
  try {
    showWelcome()

    const type = await getDocumentType()
    showTypeGuidance(type)

    const { title, description } = await getBasicInfo(type)
    const prerequisites = await getPrerequisites(type)
    const related = await getRelatedDocs()
    const { directory, filename } = await getLocation(type)

    const metadata: DocMetadata = {
      type,
      title,
      description,
      prerequisites,
      related,
      directory,
      filename,
    }

    consola.log('\n📋 Summary:')
    consola.log(`Type: ${metadata.type}`)
    consola.log(`Title: ${metadata.title}`)
    consola.log(`Description: ${metadata.description}`)
    consola.log(`Location: docs/${metadata.directory}/${metadata.filename}`)
    if (metadata.prerequisites?.length) {
      consola.log(`Prerequisites: ${metadata.prerequisites.join(', ')}`)
    }
    if (metadata.related?.length) {
      consola.log(`Related: ${metadata.related.join(', ')}`)
    }

    const confirm_create = await confirm({
      message: 'Create this documentation?',
      default: true,
    })

    if (confirm_create) {
      await createDocument(metadata)
    } else {
      consola.warn('Operation cancelled.')
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('User force closed')) {
      consola.warn('\nOperation cancelled by user.')
      process.exit(0)
    }
    consola.error('Error creating documentation:', error)
    process.exit(1)
  }
}

// Only run main if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
