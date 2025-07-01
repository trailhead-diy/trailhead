/**
 * Shared types for the modular transform system
 */

export type SemanticColorToken = 
  | 'primary'
  | 'secondary' 
  | 'destructive'
  | 'muted'
  | 'accent'
  | 'card'
  | 'popover'
  | 'border'

export interface Change {
  type: string
  description: string
  line?: number
  before?: string
  after?: string
}

export interface TransformResult {
  name?: string
  type?: 'ast' | 'regex' | 'hybrid'
  phase?: string
  content: string
  changes: Change[]
  hasChanges: boolean
}

export interface TransformOptions {
  verbose?: boolean
  dryRun?: boolean
}

export interface Transform {
  name: string
  description: string
  type: 'ast' | 'regex' | 'hybrid'
  execute: (content: string, options?: TransformOptions) => TransformResult
}

export interface ComponentInfo {
  name: string
  type: 'function' | 'forwardRef'
  colorPropHandling: 'direct' | 'colors' | 'styles'
  defaultColor?: string
  semanticStyleFunction: string
}

export interface TransformPhase {
  path: string
  type: 'ast' | 'regex'
  parallel?: boolean
  optional?: boolean
}