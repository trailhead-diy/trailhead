/**
 * @esteban-url/create-cli/testing
 *
 * CLI scaffolding testing utilities for project generation, template testing, and scaffolding validation.
 * Provides domain-focused utilities for testing CLI project creation and template systems.
 *
 * @example
 * ```typescript
 * import {
 *   createMockScaffolder,
 *   templateFixtures,
 *   assertProjectGeneration,
 *   testTemplateRendering,
 * } from '@esteban-url/create-cli/testing'
 * 
 * // Create mock scaffolder
 * const scaffolder = createMockScaffolder()
 * 
 * // Test project generation
 * const result = await scaffolder.generateProject('my-cli', 'basic')
 * assertProjectGeneration(result, 'my-cli')
 * 
 * // Test template rendering
 * const rendered = await testTemplateRendering(
 *   templateFixtures.packageJson,
 *   { name: 'my-cli', version: '1.0.0' }
 * )
 * ```
 */

import { ok, err, type Result } from '@esteban-url/core'
import type { CoreError } from '@esteban-url/core'

// ========================================
// Scaffolding Types and Interfaces
// ========================================

export interface ProjectTemplate {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly files: Record<string, string>
  readonly variables: TemplateVariable[]
  readonly postGenerationSteps?: string[]
}

export interface TemplateVariable {
  readonly name: string
  readonly type: 'string' | 'boolean' | 'number' | 'choice'
  readonly description: string
  readonly default?: any
  readonly required?: boolean
  readonly choices?: string[]
  readonly validation?: (value: any) => boolean
}

export interface ProjectGenerationContext {
  readonly projectName: string
  readonly template: ProjectTemplate
  readonly variables: Record<string, any>
  readonly outputPath: string
  readonly timestamp: number
}

export interface GeneratedProject {
  readonly name: string
  readonly path: string
  readonly template: string
  readonly files: string[]
  readonly context: ProjectGenerationContext
}

export interface MockScaffolder {
  readonly availableTemplates: Map<string, ProjectTemplate>
  addTemplate(template: ProjectTemplate): void
  generateProject(projectName: string, templateId: string, variables?: Record<string, any>, outputPath?: string): Promise<Result<GeneratedProject, CoreError>>
  renderTemplate(templateContent: string, variables: Record<string, any>): Result<string, CoreError>
  validateProjectName(name: string): Result<void, CoreError>
  validateVariables(template: ProjectTemplate, variables: Record<string, any>): Result<void, CoreError>
  getGenerationHistory(): ProjectGenerationContext[]
  clearHistory(): void
}

// ========================================
// Mock Scaffolder Creation
// ========================================

/**
 * Creates a mock scaffolder for testing
 */
export function createMockScaffolder(): MockScaffolder {
  const templates = new Map<string, ProjectTemplate>()
  const generationHistory: ProjectGenerationContext[] = []
  
  // Add default templates
  templates.set('basic', {
    id: 'basic',
    name: 'Basic CLI',
    description: 'A basic CLI application template',
    files: {
      'package.json': JSON.stringify({
        name: '{{projectName}}',
        version: '{{version}}',
        description: '{{description}}',
        main: 'dist/index.js',
        bin: { '{{projectName}}': 'dist/index.js' },
        scripts: {
          build: 'tsc',
          dev: 'tsx src/index.ts',
          test: 'vitest',
        },
      }, null, 2),
      'src/index.ts': `#!/usr/bin/env node
import { program } from 'commander'

program
  .name('{{projectName}}')
  .description('{{description}}')
  .version('{{version}}')

program
  .command('hello')
  .description('Say hello')
  .argument('<name>', 'name to greet')
  .action((name) => {
    console.log(\`Hello, \${name}!\`)
  })

program.parse()
`,
      'tsconfig.json': JSON.stringify({
        extends: '@repo/typescript-config/base.json',
        compilerOptions: {
          outDir: 'dist',
          rootDir: 'src',
        },
        include: ['src/**/*'],
      }, null, 2),
      'README.md': `# {{projectName}}

{{description}}

## Installation

\`\`\`bash
npm install -g {{projectName}}
\`\`\`

## Usage

\`\`\`bash
{{projectName}} hello world
\`\`\`
`,
    },
    variables: [
      { name: 'projectName', type: 'string', description: 'Project name', required: true },
      { name: 'description', type: 'string', description: 'Project description', default: 'A CLI application' },
      { name: 'version', type: 'string', description: 'Initial version', default: '1.0.0' },
      { name: 'author', type: 'string', description: 'Author name', default: 'Anonymous' },
    ],
  })
  
  templates.set('advanced', {
    id: 'advanced',
    name: 'Advanced CLI',
    description: 'An advanced CLI application with commands and configuration',
    files: {
      'package.json': JSON.stringify({
        name: '{{projectName}}',
        version: '{{version}}',
        description: '{{description}}',
        dependencies: {
          '@esteban-url/cli': '^1.0.0',
          '@esteban-url/core': '^1.0.0',
        },
      }, null, 2),
      'src/index.ts': `import { createCLI } from '@esteban-url/cli'
import { helloCommand } from './commands/hello.js'

const cli = createCLI({
  name: '{{projectName}}',
  description: '{{description}}',
  version: '{{version}}',
  commands: [helloCommand],
})

export default cli
`,
      'src/commands/hello.ts': `import { createCommand } from '@esteban-url/cli'

export const helloCommand = createCommand({
  name: 'hello',
  description: 'Say hello',
  arguments: [{ name: 'name', description: 'Name to greet' }],
  handler: async ({ args, logger }) => {
    logger.info(\`Hello, \${args.name}!\`)
    return { success: true }
  },
})
`,
    },
    variables: [
      { name: 'projectName', type: 'string', description: 'Project name', required: true },
      { name: 'description', type: 'string', description: 'Project description', default: 'An advanced CLI application' },
      { name: 'version', type: 'string', description: 'Initial version', default: '1.0.0' },
      { name: 'useTypeScript', type: 'boolean', description: 'Use TypeScript', default: true },
    ],
  })
  
  return {
    availableTemplates: templates,
    
    addTemplate(template: ProjectTemplate): void {
      templates.set(template.id, template)
    },
    
    async generateProject(
      projectName: string,
      templateId: string,
      variables: Record<string, any> = {},
      outputPath: string = `/tmp/${projectName}`
    ): Promise<Result<GeneratedProject, CoreError>> {
      // Validate project name
      const nameValidation = this.validateProjectName(projectName)
      if (nameValidation.isErr()) {
        return err(nameValidation.error)
      }
      
      // Get template
      const template = templates.get(templateId)
      if (!template) {
        return err({
          domain: 'create-cli',
          code: 'TEMPLATE_NOT_FOUND',
          message: `Template '${templateId}' not found`,
          type: 'create-cli-error' as const,
          recoverable: true,
          component: 'MockScaffolder',
          operation: 'generateProject',
          severity: 'high' as const,
          timestamp: new Date(),
        } as CoreError)
      }
      
      // Merge variables with defaults
      const allVariables: Record<string, any> = { projectName, ...variables }
      for (const variable of template.variables) {
        if (!(variable.name in allVariables) && variable.default !== undefined) {
          allVariables[variable.name] = variable.default
        }
      }
      
      // Validate variables
      const variableValidation = this.validateVariables(template, allVariables)
      if (variableValidation.isErr()) {
        return err(variableValidation.error)
      }
      
      // Create generation context
      const context: ProjectGenerationContext = {
        projectName,
        template,
        variables: allVariables,
        outputPath,
        timestamp: Date.now(),
      }
      
      generationHistory.push(context)
      
      // Generate files (mock implementation)
      const generatedFiles: string[] = []
      for (const [fileName, templateContent] of Object.entries(template.files)) {
        const renderResult = this.renderTemplate(templateContent, allVariables)
        if (renderResult.isErr()) {
          return err(renderResult.error)
        }
        
        generatedFiles.push(fileName)
        // In real implementation, would write file to filesystem
      }
      
      return ok({
        name: projectName,
        path: outputPath,
        template: templateId,
        files: generatedFiles,
        context,
      })
    },
    
    renderTemplate(templateContent: string, variables: Record<string, any>): Result<string, CoreError> {
      try {
        // Simple template rendering (mock implementation)
        let rendered = templateContent
        
        for (const [key, value] of Object.entries(variables)) {
          const pattern = new RegExp(`{{${key}}}`, 'g')
          rendered = rendered.replace(pattern, String(value))
        }
        
        // Check for unresolved variables
        const unresolvedPattern = /{{(\w+)}}/g
        const unresolvedMatches = rendered.match(unresolvedPattern)
        if (unresolvedMatches) {
          return err({
            domain: 'create-cli',
            code: 'UNRESOLVED_VARIABLES',
            message: `Unresolved template variables: ${unresolvedMatches.join(', ')}`,
            type: 'create-cli-error' as const,
            recoverable: true,
            component: 'MockScaffolder',
            operation: 'renderTemplate',
            severity: 'high' as const,
            timestamp: new Date(),
          } as CoreError)
        }
        
        return ok(rendered)
      } catch (error) {
        return err({
          domain: 'create-cli',
          code: 'TEMPLATE_RENDER_FAILED',
          message: `Template rendering failed: ${error}`,
          type: 'create-cli-error' as const,
          recoverable: true,
          component: 'MockScaffolder',
          operation: 'renderTemplate',
          severity: 'high' as const,
          timestamp: new Date(),
        } as CoreError)
      }
    },
    
    validateProjectName(name: string): Result<void, CoreError> {
      if (!name || name.trim().length === 0) {
        return err({
          domain: 'create-cli',
          code: 'INVALID_PROJECT_NAME',
          message: 'Project name cannot be empty',
          type: 'create-cli-error' as const,
          recoverable: true,
          component: 'MockScaffolder',
          operation: 'validateProjectName',
          severity: 'high' as const,
          timestamp: new Date(),
        } as CoreError)
      }
      
      if (!/^[a-z0-9-_]+$/.test(name)) {
        return err({
          domain: 'create-cli',
          code: 'INVALID_PROJECT_NAME',
          message: 'Project name can only contain lowercase letters, numbers, hyphens, and underscores',
          type: 'create-cli-error' as const,
          recoverable: true,
          component: 'MockScaffolder',
          operation: 'validateProjectName',
          severity: 'high' as const,
          timestamp: new Date(),
        } as CoreError)
      }
      
      return ok(undefined)
    },
    
    validateVariables(template: ProjectTemplate, variables: Record<string, any>): Result<void, CoreError> {
      for (const variable of template.variables) {
        const value = variables[variable.name]
        
        // Check required variables
        if (variable.required && (value === undefined || value === null || value === '')) {
          return err({
            domain: 'create-cli',
            code: 'MISSING_REQUIRED_VARIABLE',
            message: `Required variable '${variable.name}' is missing`,
            type: 'create-cli-error' as const,
            recoverable: true,
            component: 'MockScaffolder',
            operation: 'validateVariables',
            severity: 'high' as const,
            timestamp: new Date(),
          } as CoreError)
        }
        
        // Check type validation
        if (value !== undefined && variable.type === 'boolean' && typeof value !== 'boolean') {
          return err({
            domain: 'create-cli',
            code: 'INVALID_VARIABLE_TYPE',
            message: `Variable '${variable.name}' must be a boolean`,
            type: 'create-cli-error' as const,
            recoverable: true,
            component: 'MockScaffolder',
            operation: 'validateVariables',
            severity: 'high' as const,
            timestamp: new Date(),
          } as CoreError)
        }
        
        // Check choices
        if (value !== undefined && variable.choices && !variable.choices.includes(value)) {
          return err({
            domain: 'create-cli',
            code: 'INVALID_VARIABLE_CHOICE',
            message: `Variable '${variable.name}' must be one of: ${variable.choices.join(', ')}`,
            type: 'create-cli-error' as const,
            recoverable: true,
            component: 'MockScaffolder',
            operation: 'validateVariables',
            severity: 'high' as const,
            timestamp: new Date(),
          } as CoreError)
        }
        
        // Check custom validation
        if (value !== undefined && variable.validation && !variable.validation(value)) {
          return err({
            domain: 'create-cli',
            code: 'VARIABLE_VALIDATION_FAILED',
            message: `Variable '${variable.name}' failed validation`,
            type: 'create-cli-error' as const,
            recoverable: true,
            component: 'MockScaffolder',
            operation: 'validateVariables',
            severity: 'high' as const,
            timestamp: new Date(),
          } as CoreError)
        }
      }
      
      return ok(undefined)
    },
    
    getGenerationHistory(): ProjectGenerationContext[] {
      return [...generationHistory]
    },
    
    clearHistory(): void {
      generationHistory.length = 0
    },
  }
}

// ========================================
// Template Test Fixtures
// ========================================

export const templateFixtures = {
  /**
   * Simple template files
   */
  packageJson: {
    template: JSON.stringify({
      name: '{{projectName}}',
      version: '{{version}}',
      description: '{{description}}',
      main: 'dist/index.js',
    }, null, 2),
    variables: {
      projectName: 'my-cli',
      version: '1.0.0',
      description: 'A test CLI application',
    },
    expected: JSON.stringify({
      name: 'my-cli',
      version: '1.0.0',
      description: 'A test CLI application',
      main: 'dist/index.js',
    }, null, 2),
  },
  
  readmeTemplate: {
    template: `# {{projectName}}

{{description}}

## Installation

\`\`\`bash
npm install -g {{projectName}}
\`\`\`

## Author

Created by {{author}}.
`,
    variables: {
      projectName: 'awesome-cli',
      description: 'An awesome CLI tool',
      author: 'Jane Developer',
    },
    expected: `# awesome-cli

An awesome CLI tool

## Installation

\`\`\`bash
npm install -g awesome-cli
\`\`\`

## Author

Created by Jane Developer.
`,
  },
  
  /**
   * Template variables for testing
   */
  variables: {
    basic: {
      projectName: 'test-cli',
      description: 'A test CLI application',
      version: '1.0.0',
      author: 'Test Author',
    },
    
    advanced: {
      projectName: 'advanced-cli',
      description: 'An advanced CLI application',
      version: '2.0.0',
      useTypeScript: true,
      framework: 'commander',
    },
    
    invalid: {
      projectName: '', // Invalid: empty name
      version: '1.0.0',
    },
  },
  
  /**
   * Expected project structures
   */
  projectStructures: {
    basic: [
      'package.json',
      'src/index.ts',
      'tsconfig.json',
      'README.md',
    ],
    
    advanced: [
      'package.json',
      'src/index.ts',
      'src/commands/hello.ts',
      'tsconfig.json',
      'README.md',
      'vitest.config.ts',
    ],
  },
}

// ========================================
// Scaffolding Testing Assertions
// ========================================

/**
 * Asserts that project generation succeeded
 */
export function assertProjectGeneration(
  result: Result<GeneratedProject, CoreError>,
  expectedProjectName: string,
  expectedFileCount?: number
): void {
  if (result.isErr()) {
    throw new Error(`Expected project generation to succeed, but got error: ${result.error.message}`)
  }
  
  const project = result.value
  if (project.name !== expectedProjectName) {
    throw new Error(`Expected project name '${expectedProjectName}', but got '${project.name}'`)
  }
  
  if (expectedFileCount !== undefined && project.files.length !== expectedFileCount) {
    throw new Error(
      `Expected ${expectedFileCount} files, but got ${project.files.length}: ${project.files.join(', ')}`
    )
  }
}

/**
 * Asserts that template rendering succeeded
 */
export function assertTemplateRendering(
  result: Result<string, CoreError>,
  expectedContent?: string
): void {
  if (result.isErr()) {
    throw new Error(`Expected template rendering to succeed, but got error: ${result.error.message}`)
  }
  
  if (expectedContent && result.value !== expectedContent) {
    throw new Error(`Rendered content does not match expected content`)
  }
}

/**
 * Asserts that project validation failed with expected error
 */
export function assertValidationFailure(
  result: Result<void, CoreError>,
  expectedErrorCode: string
): void {
  if (result.isOk()) {
    throw new Error(`Expected validation to fail, but it succeeded`)
  }
  
  if (result.error.code !== expectedErrorCode) {
    throw new Error(
      `Expected error code '${expectedErrorCode}', but got '${result.error.code}'`
    )
  }
}

/**
 * Asserts that generated project contains expected files
 */
export function assertProjectFiles(
  project: GeneratedProject,
  expectedFiles: string[]
): void {
  for (const expectedFile of expectedFiles) {
    if (!project.files.includes(expectedFile)) {
      throw new Error(
        `Expected file '${expectedFile}' not found in generated project. Generated: ${project.files.join(', ')}`
      )
    }
  }
}

// ========================================
// Template Testing Utilities
// ========================================

/**
 * Tests template rendering with variables
 */
export async function testTemplateRendering(
  templateContent: string,
  variables: Record<string, any>
): Promise<Result<string, CoreError>> {
  const scaffolder = createMockScaffolder()
  return scaffolder.renderTemplate(templateContent, variables)
}

/**
 * Tests complete project generation workflow
 */
export async function testProjectGeneration(
  projectName: string,
  templateId: string,
  variables?: Record<string, any>
): Promise<Result<GeneratedProject, CoreError>> {
  const scaffolder = createMockScaffolder()
  return scaffolder.generateProject(projectName, templateId, variables)
}

/**
 * Creates a test scenario for scaffolding operations
 */
export function createScaffoldingTestScenario(options: {
  templates?: ProjectTemplate[]
  projectName?: string
  variables?: Record<string, any>
} = {}): {
  scaffolder: MockScaffolder
  runGeneration: (templateId: string) => Promise<Result<GeneratedProject, CoreError>>
  testTemplate: (content: string, vars: Record<string, any>) => Result<string, CoreError>
  cleanup: () => void
} {
  const scaffolder = createMockScaffolder()
  
  // Add custom templates if provided
  if (options.templates) {
    for (const template of options.templates) {
      scaffolder.addTemplate(template)
    }
  }
  
  return {
    scaffolder,
    
    async runGeneration(templateId: string): Promise<Result<GeneratedProject, CoreError>> {
      return scaffolder.generateProject(
        options.projectName || 'test-project',
        templateId,
        options.variables
      )
    },
    
    testTemplate(content: string, vars: Record<string, any>): Result<string, CoreError> {
      return scaffolder.renderTemplate(content, vars)
    },
    
    cleanup(): void {
      scaffolder.clearHistory()
    },
  }
}

// ========================================
// Export Collections
// ========================================

/**
 * Create-CLI testing utilities grouped by functionality
 */
export const createCliTesting = {
  // Scaffolder creation
  createMockScaffolder,
  createScaffoldingTestScenario,
  
  // Template testing
  testTemplateRendering,
  testProjectGeneration,
  
  // Fixtures and test data
  fixtures: templateFixtures,
  
  // Assertions
  assertProjectGeneration,
  assertTemplateRendering,
  assertValidationFailure,
  assertProjectFiles,
}