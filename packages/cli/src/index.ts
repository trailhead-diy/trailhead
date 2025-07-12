// Foundation CLI orchestrator for the Trailhead System
// Uses domain packages for all functionality - acts as a focused CLI framework

// Core Result types from foundation package
export { ok, err } from '@trailhead/core';
export type { Result, CoreError } from '@trailhead/core';

// Primary CLI creation API - the core of this package
export { createCLI } from './cli.js';
export type { CLI, CLIConfig } from './cli.js';
