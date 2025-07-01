/**
 * Colors object protection functions
 * 
 * These functions create protection strategies for colors objects
 */

import { isWithinColorsObject, isWithinColorsArray, isWithinColorsCSSVariable } from './detectors.js'

/**
 * Creates a protection function that excludes colors object contexts
 * Returns true if the match should be excluded from transformation
 */
export function createColorsObjectProtection() {
  return function shouldExcludeMatch(content: string, match: RegExpMatchArray): boolean {
    if (match.index === undefined) return false
    
    const position = match.index
    
    // Exclude if within a CSS variable in colors definition
    if (isWithinColorsCSSVariable(content, position)) {
      return true
    }
    
    // Exclude if within a colors object
    if (isWithinColorsObject(content, position)) {
      return true
    }
    
    // Exclude if within a colors array
    if (isWithinColorsArray(content, position)) {
      return true
    }
    
    return false
  }
}

/**
 * Enhanced regex replacer that respects colors object contexts
 */
export function createColorsProtectedReplacer(
  pattern: RegExp,
  replacement: string | ((match: string, ...args: any[]) => string)
) {
  const shouldExclude = createColorsObjectProtection()
  
  return function colorsProtectedReplace(content: string): string {
    return content.replace(pattern, (match, ...args) => {
      const offset = args[args.length - 2] // offset is second to last arg
      if (typeof offset === 'number') {
        // Create a proper match object for protection check
        const matchObj = Object.assign([match], { index: offset }) as RegExpMatchArray
        
        if (shouldExclude(content, matchObj)) {
          return match // Return original match unchanged
        }
      }
      
      // Apply the transformation
      if (typeof replacement === 'function') {
        return replacement(match, ...args)
      }
      return replacement
    })
  }
}

/**
 * Combined protection for both style objects and colors objects
 * Use this when you need comprehensive protection
 */
export function createCombinedProtection(
  styleProtection: (content: string, match: RegExpMatchArray) => boolean,
  colorsProtection = createColorsObjectProtection()
) {
  return function shouldExcludeMatch(content: string, match: RegExpMatchArray): boolean {
    return styleProtection(content, match) || colorsProtection(content, match)
  }
}