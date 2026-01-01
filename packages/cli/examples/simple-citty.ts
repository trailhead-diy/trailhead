#!/usr/bin/env node
/**
 * Simple single-command CLI example
 *
 * Run with: tsx examples/simple-citty.ts --name World
 */
import { defineCommand, runMain } from '../src/command/index.js'
import { ok } from '@trailhead/core'

const cli = defineCommand({
  meta: {
    name: 'greet',
    version: '1.0.0',
    description: 'Greet someone',
  },
  args: {
    name: {
      type: 'string',
      description: 'Name to greet',
      required: true,
    },
    loud: {
      type: 'boolean',
      description: 'Use loud greeting',
      alias: 'l',
    },
  },
  run: async (args, context) => {
    const greeting = args.loud ? `HELLO ${args.name.toUpperCase()}!!!` : `Hello, ${args.name}!`

    context.logger.info(greeting)

    if (context.verbose) {
      context.logger.debug(`Greeted ${args.name}`)
    }

    return ok(undefined)
  },
})

runMain(cli)
