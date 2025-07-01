// Core Result type utilities - the foundation of error handling
export { Ok, Err, isOk, isErr } from './core/errors/index.js';
export type { Result } from './core/errors/index.js';

// Primary CLI creation API
export { createCLI } from './cli.js';
export type { CLI, CLIConfig } from './cli.js';