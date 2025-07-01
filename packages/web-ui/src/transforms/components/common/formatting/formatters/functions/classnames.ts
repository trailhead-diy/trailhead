/**
 * ClassName-related formatting functions
 */

/**
 * Fix className parameter ordering - move className to the end
 * Ensures proper tailwind-merge behavior by placing custom classes last
 */
export const reorderClassNameArgs = (code: string): string => {
  return code.replace(/className={cn\(\s*className,\s*([^}]+)\)}/g, 'className={cn($1, className)}')
}

/**
 * Restore cn() calls around single class strings to match traditional
 * Only restore for semantic token classes and complex patterns
 */
export const restoreCnCallsForSemanticTokens = (code: string): string => {
  return code.replace(
    /className="([^"]*(?:foreground|background|border|ring|primary|secondary|muted|accent|destructive)[^"]*)"/g,
    "className={cn('$1')}"
  )
}

/**
 * Preserve multiline cn() calls for long strings (80+ chars)
 * Maintains readability for complex className expressions
 */
export const preserveMultilineCnCalls = (code: string): string => {
  return code.replace(/className={cn\('([^']{80,}[^']*)'([^}]*)\)}/g, (match, longString, rest) => {
    // Split long strings into multiline format
    return `className={cn(\n        '${longString}'${rest}\n      )}`
  })
}
