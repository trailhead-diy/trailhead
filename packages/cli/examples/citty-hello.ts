#!/usr/bin/env node
/**
 * Example CLI using citty with trailhead patterns
 *
 * Run with: tsx examples/citty-hello.ts greet World
 */
import { defineCommand, runMain } from '../src/command/index.js'
import { ok } from '@trailhead/core'

const greetCommand = defineCommand({
  meta: {
    name: 'greet',
    description: 'Greet someone',
  },
  args: {
    name: {
      type: 'positional',
      description: 'Name to greet',
      required: true,
    },
    loud: {
      type: 'boolean',
      description: 'Use loud greeting',
      alias: 'l',
    },
    times: {
      type: 'string',
      description: 'Number of times to greet',
      default: '1',
    },
  },
  run: async (args, context) => {
    const greeting = args.loud ? `HELLO ${args.name.toUpperCase()}!!!` : `Hello, ${args.name}!`

    const times = parseInt(args.times as string, 10) || 1

    for (let i = 0; i < times; i++) {
      context.logger.info(greeting)
    }

    if (context.verbose) {
      context.logger.debug(`Greeted ${args.name} ${times} time(s)`)
    }

    return ok(undefined)
  },
})

const cli = defineCommand({
  meta: {
    name: 'hello-cli',
    version: '1.0.0',
    description: 'Example CLI using citty with trailhead',
  },
  subCommands: {
    greet: greetCommand,
  },
})

runMain(cli)
