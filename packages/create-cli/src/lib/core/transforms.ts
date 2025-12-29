/**
 * Transform helpers for post-processing generated files
 *
 * @module core/transforms
 */
import { format } from 'prettier'
import { extname } from 'node:path'

/**
 * Format generated code using Prettier based on file extension.
 *
 * Detects the appropriate Prettier parser from the file extension and applies
 * consistent formatting. Falls back to returning original content for unknown
 * file types or on formatting errors.
 *
 * @param content - Raw content string to format
 * @param filePath - File path used to determine parser (e.g., .ts, .json, .md)
 * @returns Formatted content string, or original content if formatting fails
 *
 * @remarks
 * Supported extensions: .ts, .tsx, .js, .jsx, .mjs, .cjs, .json, .md, .yml, .yaml
 * On error, logs a warning and returns original content (non-throwing).
 */
export async function formatGeneratedCode(content: string, filePath: string): Promise<string> {
  try {
    // Determine parser based on file extension
    const ext = extname(filePath)
    let parser: string | undefined

    switch (ext) {
      case '.ts':
      case '.tsx':
        parser = 'typescript'
        break
      case '.js':
      case '.jsx':
      case '.mjs':
      case '.cjs':
        parser = 'babel'
        break
      case '.json':
        parser = 'json'
        break
      case '.md':
        parser = 'markdown'
        break
      case '.yml':
      case '.yaml':
        parser = 'yaml'
        break
      default:
        // Don't format unknown file types
        return content
    }

    // Format with project's prettier config
    const formatted = await format(content, {
      parser,
      semi: false,
      singleQuote: true,
      printWidth: 100,
      tabWidth: 2,
      trailingComma: 'es5',
      bracketSpacing: true,
      arrowParens: 'always',
    })

    return formatted
  } catch (error) {
    // If formatting fails, return original content
    console.warn(`Warning: Could not format ${filePath}:`, error)
    return content
  }
}
