// Legacy type definitions for backwards compatibility
// Note: Main implementations are in zod-generator.ts

export interface JsonSchemaOutput {
  readonly $schema: string
  readonly type: string
  readonly title?: string
  readonly description?: string
  readonly properties: Record<string, JsonSchemaProperty>
  readonly required?: readonly string[]
  readonly additionalProperties?: boolean
}

export interface JsonSchemaProperty {
  readonly type: string
  readonly description?: string
  readonly default?: unknown
}
