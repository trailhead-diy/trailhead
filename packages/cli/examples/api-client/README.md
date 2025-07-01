# API Client CLI Example

A comprehensive example of building an HTTP client CLI with @trailhead/cli featuring retry logic, authentication, and proper error handling.

## Features

- GET, POST, PUT, and DELETE requests
- Authentication with API keys  
- Retry logic with exponential backoff
- JSON response formatting
- Request/response logging
- Result-based error handling

## Installation

```bash
npm install
npm run build
```

## Usage

```bash
# Basic GET request
npm run dev get https://api.github.com/users/octocat

# With authentication
npm run dev get https://api.example.com/data --auth-key "your-api-key"

# With retry logic
npm run dev get https://api.example.com/data --retry 3

# Different output formats
npm run dev get https://httpbin.org/json --output-format headers
```

## Tutorial

For a complete step-by-step tutorial on building this CLI, see:
[docs/tutorials/getting-started.md](../../docs/tutorials/getting-started.md)

## Architecture

- `src/http/` - HTTP client utilities with retry logic
- `src/commands/` - CLI command implementations
- `src/index.ts` - Main CLI entry point

This example demonstrates functional programming patterns, Result types for error handling, and modular command architecture.