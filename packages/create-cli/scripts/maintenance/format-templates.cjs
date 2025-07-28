#!/usr/bin/env node
/**
 * Format .hbs template files that contain TypeScript/JavaScript code with Handlebars placeholders
 * 
 * This script:
 * 1. Temporarily replaces Handlebars placeholders with valid TypeScript
 * 2. Formats the code using Prettier
 * 3. Restores the Handlebars placeholders
 */

const fs = require('fs').promises
const path = require('path')
const prettier = require('prettier')

// Placeholder mappings to convert Handlebars to valid TS temporarily
const PLACEHOLDER_PREFIX = '__HBS_PLACEHOLDER_'
const placeholderMap = new Map()
let placeholderCounter = 0

function createPlaceholder(original) {
  const placeholder = `${PLACEHOLDER_PREFIX}${placeholderCounter++}`
  placeholderMap.set(placeholder, original)
  return placeholder
}

function preProcessContent(content) {
  // First, add line breaks at obvious statement boundaries
  let result = content
  
  // Add line breaks after import statements
  result = result.replace(/(\bimport\s+[^;]+(?:from\s+['"][^'"]+['"]))\s*(?!;)/g, '$1\n')
  
  // Add line breaks after export statements
  result = result.replace(/(\bexport\s+(?:const|let|var|function|class|interface|type)\s+\w+[^{]*{)/g, '$1\n')
  
  // Add line breaks before common statement starts
  result = result.replace(/(\s)(import\s|export\s|const\s|let\s|var\s|function\s|class\s|interface\s|type\s)/g, '$1\n$2')
  
  return result
}

function replaceHandlebarsWithPlaceholders(content) {
  // Replace Handlebars expressions with valid TypeScript placeholders
  let result = content
  
  // Replace {{variable}} with placeholder strings
  result = result.replace(/\{\{([^}]+)\}\}/g, (match) => {
    return `"${createPlaceholder(match)}"`
  })
  
  // Replace CLI argument placeholders like <dir>, <string>, etc.
  result = result.replace(/<([a-zA-Z]+(?:=[a-zA-Z]+)?)>/g, (match) => {
    return createPlaceholder(match)
  })
  
  // Handle special cases in type definitions like <T = any>
  result = result.replace(/(<[A-Z]\s*=\s*[^>]+>)/g, (match) => {
    return createPlaceholder(match)
  })
  
  return result
}

function restorePlaceholders(content) {
  let result = content
  
  // Restore all placeholders
  for (const [placeholder, original] of placeholderMap.entries()) {
    // Remove quotes that were added around Handlebars placeholders
    result = result.replace(`"${placeholder}"`, original)
    result = result.replace(placeholder, original)
  }
  
  return result
}

async function formatTemplate(filePath) {
  try {
    // Reset placeholder map for each file
    placeholderMap.clear()
    placeholderCounter = 0
    
    const content = await fs.readFile(filePath, 'utf-8')
    
    // Check if file needs formatting (collapsed into few lines or obviously needs formatting)
    const lines = content.split('\n')
    const lineCount = lines.length
    const actualNewlines = (content.match(/\n/g) || []).length
    const avgCharsPerLine = content.length / Math.max(1, actualNewlines + 1)
    const needsFormatting = avgCharsPerLine > 100 || actualNewlines === 0 // More than 100 chars per line or no newlines at all
    
    if (needsFormatting) {
      console.log(`Needs formatting: ${path.relative(process.cwd(), filePath)} (${lineCount} lines, ${content.length} chars)`)
      
      // Preprocess to add line breaks
      const preprocessed = preProcessContent(content)
      
      // Replace Handlebars with placeholders
      const withPlaceholders = replaceHandlebarsWithPlaceholders(preprocessed)
      
      // Determine parser based on file extension
      const ext = path.extname(filePath).replace('.hbs', '')
      let parser = 'typescript'
      if (ext === '.js' || ext === '.mjs' || ext === '.cjs') parser = 'babel'
      if (ext === '.json') parser = 'json'
      if (ext === '.md') parser = 'markdown'
      if (ext === '.yml' || ext === '.yaml') parser = 'yaml'
      
      // Format with Prettier
      const formatted = await prettier.format(withPlaceholders, {
        parser,
        semi: false,
        singleQuote: true,
        printWidth: 100,
        tabWidth: 2,
        trailingComma: 'es5',
        bracketSpacing: true,
        arrowParens: 'always',
      })
      
      // Restore Handlebars placeholders
      const final = restorePlaceholders(formatted)
      
      // Write back
      await fs.writeFile(filePath, final)
      console.log(`✓ Formatted ${path.relative(process.cwd(), filePath)}`)
    }
  } catch (error) {
    console.error(`Error formatting ${filePath}:`, error)
  }
}

async function* walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      yield* walk(fullPath)
    } else if (entry.name.endsWith('.hbs')) {
      yield fullPath
    }
  }
}

async function main() {
  const templateDir = path.join(process.cwd(), 'templates')
  
  console.log(`Scanning templates directory: ${templateDir}`)
  
  let count = 0
  for await (const file of walk(templateDir)) {
    await formatTemplate(file)
    count++
  }
  
  console.log(`Processed ${count} template files.`)
}

main().catch(console.error)