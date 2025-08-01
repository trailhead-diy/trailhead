#!/usr/bin/env node

// This file exists to provide a stable entry point for the CLI binary
// It imports the built CLI module from dist and runs it
import('../dist/cli.js').then(module => {
  const cli = module.default
  cli.run().catch(error => {
    console.error('CLI Error:', error)
    process.exit(1)
  })
})