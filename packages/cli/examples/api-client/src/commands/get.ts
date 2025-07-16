import { Ok, Err } from '@esteban-url/trailhead-cli'
import { createCommand } from '@esteban-url/trailhead-cli/command'
import type { CommandContext } from '@esteban-url/trailhead-cli/command'
import { HttpClient } from '../http/client.js'

interface GetOptions {
  'auth-key'?: string
  retry?: number
  timeout?: number
  'output-format'?: string
}

export const getCommand = createCommand({
  name: 'get',
  description: 'Make a GET request to the specified URL',
  options: [
    {
      name: 'auth-key',
      type: 'string',
      description: 'API key for authentication',
    },
    {
      name: 'retry',
      alias: 'r',
      type: 'number',
      default: 1,
      description: 'Number of retry attempts',
    },
    {
      name: 'timeout',
      alias: 't',
      type: 'number',
      default: 10000,
      description: 'Request timeout in milliseconds',
    },
    {
      name: 'output-format',
      alias: 'f',
      type: 'string',
      choices: ['json', 'raw', 'headers'],
      default: 'json',
      description: 'Output format',
    },
  ],
  action: async (options: GetOptions, context: CommandContext) => {
    const [url] = context.args

    if (!url) {
      return Err(new Error('URL is required. Usage: api-client get <url>'))
    }

    // Validate URL
    try {
      const _validatedUrl = new URL(url)
    } catch {
      return Err(new Error('Invalid URL provided'))
    }

    const client = new HttpClient()
    const headers: Record<string, string> = {}

    if (options['auth-key']) {
      headers['Authorization'] = `Bearer ${options['auth-key']}`
    }

    context.logger.info(`Making GET request to ${url}...`)

    const result = await client.request(
      {
        method: 'GET',
        url,
        headers,
        timeout: options.timeout,
      },
      options.retry && options.retry > 1
        ? {
            attempts: options.retry,
            delay: 1000,
            backoff: 2,
          }
        : undefined
    )

    if (!result.success) {
      context.logger.error(`Request failed: ${result.error.message}`)
      return result
    }

    const response = result.value

    switch (options['output-format']) {
      case 'headers':
        console.log(JSON.stringify(response.headers, null, 2))
        break
      case 'raw':
        console.log(response.data)
        break
      default:
        if (typeof response.data === 'object') {
          console.log(JSON.stringify(response.data, null, 2))
        } else {
          console.log(response.data)
        }
    }

    if (response.status >= 400) {
      context.logger.warn(`HTTP ${response.status}: ${response.statusText}`)
    } else {
      context.logger.success(`Request completed successfully (${response.status})`)
    }

    return Ok(undefined)
  },
})
