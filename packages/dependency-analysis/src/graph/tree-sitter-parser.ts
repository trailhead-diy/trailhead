let Parser: any
let TypeScript: any

try {
  Parser = (await import('tree-sitter')).default
  TypeScript = await import('tree-sitter-typescript')
} catch {
  // Tree-sitter not available (e.g., in tests)
  Parser = null
  TypeScript = null
}
import { fs } from '@esteban-url/fs'
import { err, ok, type Result } from '@esteban-url/core'
import type { DependencyError, ImportInfo, ExportInfo } from '../types.js'

const parser = Parser ? new Parser() : null
if (parser && TypeScript?.typescript) {
  parser.setLanguage(TypeScript.typescript as any)
}

const tsxParser = Parser ? new Parser() : null
if (tsxParser && TypeScript?.tsx) {
  tsxParser.setLanguage(TypeScript.tsx as any)
}

export interface ParsedModule {
  readonly imports: readonly ImportInfo[]
  readonly exports: readonly ExportInfo[]
  readonly hasApiChanges: boolean
}

function extractImports(tree: any, sourceCode: string): ImportInfo[] {
  const imports: ImportInfo[] = []
  if (!parser) return imports
  const importQuery = (parser.getLanguage() as any).query(`
    (import_statement
      source: (string (string_fragment) @source)
    ) @import
    
    (import_statement
      (import_clause
        (named_imports
          (import_specifier
            name: (identifier) @specifier
          )
        )
      )
    )
    
    (import_statement
      (import_clause
        (namespace_import
          (identifier) @namespace
        )
      )
    )
  `)

  const captures = importQuery.captures(tree.rootNode)
  const importNodes = new Map<number, any>()

  for (const capture of captures) {
    const { node, name } = capture
    if (name === 'import') {
      importNodes.set(node.id, {
        node,
        source: '',
        specifiers: [],
        line: node.startPosition.row + 1,
      })
    }
  }

  for (const capture of captures) {
    const { node, name } = capture
    const parent = node.parent

    if (name === 'source' && parent) {
      const importNode = importNodes.get(parent.id)
      if (importNode) {
        importNode.source = node.text
      }
    }

    if ((name === 'specifier' || name === 'namespace') && parent) {
      let current = parent
      while (current && current.type !== 'import_statement') {
        current = current.parent
      }
      if (current) {
        const importNode = importNodes.get(current.id)
        if (importNode) {
          importNode.specifiers.push(node.text)
        }
      }
    }
  }

  for (const importData of importNodes.values()) {
    const isTypeOnly = sourceCode
      .substring(importData.node.startIndex, importData.node.endIndex)
      .includes('type')

    imports.push({
      source: importData.source,
      specifiers: importData.specifiers,
      isTypeOnly,
      isApiSurface: !importData.source.startsWith('.'),
      line: importData.line,
    })
  }

  return imports
}

function extractExports(tree: Parser.Tree, sourceCode: string): ExportInfo[] {
  const exports: ExportInfo[] = []
  if (!parser) return exports
  const exportQuery = (parser.getLanguage() as any).query(`
    (export_statement
      declaration: (variable_declaration
        (variable_declarator
          name: (identifier) @name
        )
      )
    ) @export
    
    (export_statement
      declaration: (function_declaration
        name: (identifier) @function_name
      )
    )
    
    (export_statement
      declaration: (class_declaration
        name: (type_identifier) @class_name
      )
    )
    
    (export_statement
      (export_clause
        (export_specifier
          name: (identifier) @export_name
        )
      )
    )
  `)

  const captures = exportQuery.captures(tree.rootNode)

  for (const capture of captures) {
    const { node, name } = capture

    if (
      name === 'name' ||
      name === 'function_name' ||
      name === 'class_name' ||
      name === 'export_name'
    ) {
      let exportStatement = node.parent
      while (exportStatement && exportStatement.type !== 'export_statement') {
        exportStatement = exportStatement.parent
      }

      if (exportStatement) {
        const isTypeOnly = sourceCode
          .substring(exportStatement.startIndex, exportStatement.endIndex)
          .includes('type')
        const isDefault = sourceCode
          .substring(exportStatement.startIndex, exportStatement.endIndex)
          .includes('default')

        exports.push({
          name: node.text,
          isTypeOnly,
          isDefault,
          line: node.startPosition.row + 1,
        })
      }
    }
  }

  return exports
}

function detectApiChanges(imports: ImportInfo[], exports: ExportInfo[]): boolean {
  const hasPublicExports = exports.some((e) => !e.isTypeOnly)
  const hasExternalImports = imports.some((i) => i.isApiSurface && !i.isTypeOnly)

  return hasPublicExports || hasExternalImports
}

export async function parseTypeScriptModule(
  filePath: string
): Promise<Result<ParsedModule, DependencyError>> {
  // If tree-sitter is not available, return empty result
  if (!parser || !tsxParser) {
    return ok({
      imports: [],
      exports: [],
      hasApiChanges: false,
    })
  }

  const fileResult = await fs.readFile(filePath)

  if (!fileResult.isOk()) {
    return err({
      type: 'parse-error',
      message: `Failed to read file: ${fileResult.error.message}`,
      file: filePath,
    })
  }

  try {
    const sourceCode = fileResult.value
    const isTsx = filePath.endsWith('.tsx')
    const tree = isTsx ? tsxParser.parse(sourceCode) : parser.parse(sourceCode)

    const imports = extractImports(tree, sourceCode)
    const exports = extractExports(tree, sourceCode)
    const hasApiChanges = detectApiChanges(imports, exports)

    return ok({
      imports,
      exports,
      hasApiChanges,
    })
  } catch (error) {
    return err({
      type: 'parse-error',
      message: error instanceof Error ? error.message : 'Unknown parse error',
      file: filePath,
    })
  }
}
