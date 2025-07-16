// Re-export all Inquirer.js prompts with enhanced TypeScript support
export * from '@inquirer/prompts'

// Simple prompt helpers that leverage Inquirer's built-in capabilities
export function createConfirmationPrompt(
  message: string,
  details?: string[],
  defaultValue: boolean = true
) {
  return async () => {
    if (details && details.length > 0) {
      console.log('\nThis will:')
      details.forEach((detail) => console.log(`  • ${detail}`))
      console.log('')
    }

    const { confirm } = await import('@inquirer/prompts')
    return confirm({
      message,
      default: defaultValue,
    })
  }
}

export function createDirectoryPrompt(message: string, defaultPath?: string) {
  return async () => {
    const { input } = await import('@inquirer/prompts')
    return input({
      message,
      default: defaultPath,
      validate: (answer) => {
        if (!answer || typeof answer !== 'string') {
          return 'Please enter a valid directory path'
        }
        if (answer.includes('..') || answer.startsWith('/')) {
          return 'Please enter a relative path without ".." segments'
        }
        return true
      },
      transformer: (answer) => {
        return String(answer).trim().replace(/\\/g, '/')
      },
    })
  }
}
