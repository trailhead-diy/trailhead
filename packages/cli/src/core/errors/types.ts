
export interface CLIError {
  readonly code: string
  readonly message: string
  readonly details?: string
  readonly cause?: unknown
  readonly suggestion?: string
  readonly recoverable: boolean
}

export type ErrorCategory =
  | 'validation'
  | 'filesystem'
  | 'network'
  | 'configuration'
  | 'execution'
  | 'user-input'
  | 'dependency'
  | 'unknown'

export interface CategorizedError extends CLIError {
  readonly category: ErrorCategory
}


export interface ValidationError extends CategorizedError {
  readonly category: 'validation'
  readonly field?: string
  readonly value?: unknown
  readonly constraints?: Record<string, unknown>
}

export interface FileSystemError extends CategorizedError {
  readonly category: 'filesystem'
  readonly path: string
  readonly operation: 'read' | 'write' | 'delete' | 'create' | 'copy' | 'move' | 'stat'
  readonly errno?: number
}

export interface NetworkError extends CategorizedError {
  readonly category: 'network'
  readonly url?: string
  readonly statusCode?: number
  readonly timeout?: boolean
}

export interface ConfigurationError extends CategorizedError {
  readonly category: 'configuration'
  readonly configFile?: string
  readonly missingFields?: string[]
  readonly invalidFields?: string[]
}

export interface ExecutionError extends CategorizedError {
  readonly category: 'execution'
  readonly command?: string
  readonly exitCode?: number
  readonly stdout?: string
  readonly stderr?: string
}

export interface UserInputError extends CategorizedError {
  readonly category: 'user-input'
  readonly input?: string
  readonly expectedFormat?: string
}

export interface DependencyError extends CategorizedError {
  readonly category: 'dependency'
  readonly packageName?: string
  readonly requiredVersion?: string
  readonly installedVersion?: string
}


export type Result<T, E = CLIError> =
  | { readonly success: true; readonly value: T }
  | { readonly success: false; readonly error: E }

export type AsyncResult<T, E = CLIError> = Promise<Result<T, E>>


export interface ErrorChain {
  readonly error: CLIError
  readonly chain: readonly CLIError[]
}


export interface ErrorContext {
  readonly operation: string
  readonly component: string
  readonly timestamp: Date
  readonly environment?: Record<string, string>
  readonly metadata?: Record<string, unknown>
}


export type ErrorSeverity = 'fatal' | 'error' | 'warning' | 'info'

export interface SeverityError extends CLIError {
  readonly severity: ErrorSeverity
}
