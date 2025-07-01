import type {
  Result,
  ValidationError,
  ValidationRule,
  ValidationResult,
  ValidationSummary,
  Validator,
} from './types.js'


export interface ValidationContext {
  readonly [key: string]: unknown
}

export interface ValidationPipeline<T, C extends ValidationContext = ValidationContext> {
  readonly rules: readonly ValidationRule<T, C>[]
  add(rule: ValidationRule<T, C>): ValidationPipeline<T, C>
  validate(value: T, context?: C): Promise<ValidationSummary>
  validateSync(value: T, context?: C): ValidationSummary
}


class ValidationPipelineImpl<T, C extends ValidationContext = ValidationContext>
  implements ValidationPipeline<T, C>
{
  constructor(public readonly rules: readonly ValidationRule<T, C>[]) {}

  add(rule: ValidationRule<T, C>): ValidationPipeline<T, C> {
    return new ValidationPipelineImpl([...this.rules, rule])
  }

  async validate(value: T, context?: C): Promise<ValidationSummary> {
    const results: ValidationResult[] = []

    for (const rule of this.rules) {
      try {
        const result = await Promise.resolve(rule.validate(value, context))

        if (result.success) {
          results.push({
            rule: rule.name,
            passed: true,
            message: `${rule.description}: Passed`,
            value: result.value,
          })
        } else {
          results.push({
            rule: rule.name,
            passed: false,
            message: `${rule.description}: ${result.error.message}`,
            suggestion: this.getSuggestion(rule, result.error),
          })
        }
      } catch (error) {
        results.push({
          rule: rule.name,
          passed: false,
          message: `${rule.description}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          suggestion: 'Check the validation rule implementation',
        })
      }
    }

    return this.createSummary(results)
  }

  validateSync(value: T, context?: C): ValidationSummary {
    const results: ValidationResult[] = []

    for (const rule of this.rules) {
      try {
        const result = rule.validate(value, context)

        if (typeof result === 'object' && 'then' in result) {
          throw new Error(`Rule "${rule.name}" is async but validateSync was called`)
        }

        if (result.success) {
          results.push({
            rule: rule.name,
            passed: true,
            message: `${rule.description}: Passed`,
            value: result.value,
          })
        } else {
          results.push({
            rule: rule.name,
            passed: false,
            message: `${rule.description}: ${result.error.message}`,
            suggestion: this.getSuggestion(rule, result.error),
          })
        }
      } catch (error) {
        results.push({
          rule: rule.name,
          passed: false,
          message: `${rule.description}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          suggestion: 'Check the validation rule implementation',
        })
      }
    }

    return this.createSummary(results)
  }

  private getSuggestion(rule: ValidationRule<T, C>, error: ValidationError): string | undefined {
    // Default suggestions based on error type
    if (error.field) {
      return `Check the value of field: ${error.field}`
    }

    if (rule.required) {
      return 'This is a required validation. Ensure the value meets the requirements.'
    }

    return undefined
  }

  private createSummary(results: ValidationResult[]): ValidationSummary {
    const passed = results.filter((r) => r.passed)
    const failed = results.filter((r) => !r.passed)
    const requiredFailed = failed.filter((r) => {
      const rule = this.rules.find((rule) => rule.name === r.rule)
      return rule?.required ?? false
    })
    const warnings = failed.filter((r) => {
      const rule = this.rules.find((rule) => rule.name === r.rule)
      return !(rule?.required ?? false)
    })

    let overall: 'pass' | 'fail' | 'warning'
    if (requiredFailed.length > 0) {
      overall = 'fail'
    } else if (warnings.length > 0) {
      overall = 'warning'
    } else {
      overall = 'pass'
    }

    return {
      passed,
      failed: requiredFailed,
      warnings,
      overall,
    }
  }
}


export function createValidationPipeline<T, C extends ValidationContext = ValidationContext>(
  rules: ValidationRule<T, C>[] = []
): ValidationPipeline<T, C> {
  return new ValidationPipelineImpl(rules)
}

export function createRule<T, C extends ValidationContext = ValidationContext>(
  name: string,
  description: string,
  validator: Validator<T>,
  required: boolean = true
): ValidationRule<T, C> {
  return {
    name,
    description,
    required,
    validate: (value) => validator(value),
  }
}

export function createAsyncRule<T, C extends ValidationContext = ValidationContext>(
  name: string,
  description: string,
  validator: (value: T, context?: C) => Promise<Result<T, ValidationError>>,
  required: boolean = true
): ValidationRule<T, C> {
  return {
    name,
    description,
    required,
    validate: validator,
  }
}


export async function validateAll<T, C extends ValidationContext = ValidationContext>(
  pipelines: ValidationPipeline<T, C>[],
  value: T,
  context?: C
): Promise<ValidationSummary[]> {
  return Promise.all(pipelines.map((p) => p.validate(value, context)))
}

export function combinePipelines<T, C extends ValidationContext = ValidationContext>(
  ...pipelines: ValidationPipeline<T, C>[]
): ValidationPipeline<T, C> {
  const allRules = pipelines.flatMap((p) => p.rules)
  return createValidationPipeline(allRules as ValidationRule<T, C>[])
}

export function conditionalPipeline<T, C extends ValidationContext = ValidationContext>(
  condition: (value: T, context?: C) => boolean,
  truePipeline: ValidationPipeline<T, C>,
  falsePipeline?: ValidationPipeline<T, C>
): ValidationPipeline<T, C> {
  return {
    rules: [],
    add: () => {
      throw new Error('Cannot add rules to conditional pipeline')
    },
    async validate(value: T, context?: C) {
      if (condition(value, context)) {
        return truePipeline.validate(value, context)
      }

      if (falsePipeline) {
        return falsePipeline.validate(value, context)
      }

      return {
        passed: [],
        failed: [],
        warnings: [],
        overall: 'pass',
      }
    },
    validateSync(value: T, context?: C) {
      if (condition(value, context)) {
        return truePipeline.validateSync(value, context)
      }

      if (falsePipeline) {
        return falsePipeline.validateSync(value, context)
      }

      return {
        passed: [],
        failed: [],
        warnings: [],
        overall: 'pass',
      }
    },
  }
}


export function getFailedMessages(summary: ValidationSummary): string[] {
  return [...summary.failed, ...summary.warnings].map((r) => r.message)
}

export function isValidationPassed(summary: ValidationSummary): boolean {
  return summary.overall === 'pass'
}

export function hasWarnings(summary: ValidationSummary): boolean {
  return summary.warnings.length > 0
}

export function formatValidationSummary(summary: ValidationSummary): string[] {
  const lines: string[] = []

  if (summary.overall === 'pass') {
    lines.push('✅ All validations passed')
  } else if (summary.overall === 'warning') {
    lines.push('⚠️  Validation passed with warnings')
  } else {
    lines.push('❌ Validation failed')
  }

  if (summary.failed.length > 0) {
    lines.push('\nFailed:')
    summary.failed.forEach((r) => {
      lines.push(`  ❌ ${r.message}`)
      if (r.suggestion) {
        lines.push(`     💡 ${r.suggestion}`)
      }
    })
  }

  if (summary.warnings.length > 0) {
    lines.push('\nWarnings:')
    summary.warnings.forEach((r) => {
      lines.push(`  ⚠️  ${r.message}`)
      if (r.suggestion) {
        lines.push(`     💡 ${r.suggestion}`)
      }
    })
  }

  if (summary.passed.length > 0) {
    lines.push('\nPassed:')
    summary.passed.forEach((r) => {
      lines.push(`  ✅ ${r.message}`)
    })
  }

  return lines
}
