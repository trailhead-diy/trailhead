/**
 * @trailhead/cli/testing - Simplified for v4.0.0
 *
 * With citty, commands are just async functions. Test them directly!
 *
 * @example
 * ```typescript
 * import { defineCommand } from '@trailhead/cli/command'
 * import { createMockContext } from '@trailhead/cli/testing'
 *
 * const greetCommand = defineCommand({
 *   meta: { name: 'greet' },
 *   args: { name: { type: 'positional', required: true } },
 *   run: async (args, context) => {
 *     context.logger.info(`Hello ${args.name}!`)
 *     return ok(undefined)
 *   }
 * })
 *
 * // Test by calling run() directly
 * it('greets user', async () => {
 *   const ctx = createMockContext()
 *   const result = await greetCommand.run({ _: ['World'], name: 'World' }, ctx)
 *   expect(result.isOk()).toBe(true)
 * })
 * ```
 */

export { createMockContext, createMockLogger, createMockFileSystem } from './context.js'
export type { MockLogger } from './context.js'
