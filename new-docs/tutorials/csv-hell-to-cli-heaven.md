# From CSV Hell to CLI Heaven

Build a production-ready CSV processing CLI tool using the Trailhead framework.

**Time to complete**: 
- ⏱️ Basic Path (Phases 0-3): 30 minutes → Working CSV processor
- ⏱️ Full Path (Phases 0-5): 60 minutes → Production-ready tool

**What you'll build**: A command-line tool that transforms messy CSV data into clean, validated output with multiple format support.

---

## Phase 0: The Problem - Messy CSV Data (5 minutes)

Picture this: Your team lead just sent you a CSV export from the legacy system. It's a mess:

```csv
"First Name   ","Last Name","Email   ","Age","Join Date","Status"
"  John  ","Doe","john@email.com  ","25","2023-01-15","active"
"Jane","Smith","invalid-email","thirty","01/20/2023","pending"
"","","","","",""
"Bob","Jones","bob@company.org","","2023/02/01","unknown_status"
"Alice   ","Wilson    ","alice@test.com","35","Feb 5, 2023","active  "
```

### Common Issues in This Data:
- **Whitespace chaos**: Leading/trailing spaces everywhere
- **Invalid data types**: "thirty" instead of 30
- **Empty rows**: Completely blank lines
- **Missing values**: Critical fields left empty
- **Date format inconsistency**: MM/DD/YYYY, YYYY-MM-DD, and text formats
- **Invalid values**: "unknown_status" not in allowed list

Cleaning this manually? That's hours of tedious work. Let's build a CLI tool to handle it automatically.

> 📥 **Want more data?** [Download the full messy dataset](https://gist.github.com/example/messy-data-full.csv) with 500+ rows of realistic chaos.

---

## Phase 1: Generate Your CLI Foundation (10 minutes)

Let's use the Trailhead CLI generator to scaffold our project:

```bash
# Create a new CLI project
pnpm create @esteban-url/cli csv-processor --preset basic-cli

# Navigate to your new project
cd csv-processor

# Install dependencies (automatic with pnpm)
# The generator already ran this for you!
```

### What Just Happened?

The `create-cli` tool generated a complete TypeScript CLI project with:
- ✅ TypeScript configuration for type safety
- ✅ Testing setup with Vitest
- ✅ Build tooling with tsup
- ✅ Basic commands (help, version)
- ✅ Functional programming patterns

### Test Your New CLI

```bash
# Make sure everything works
pnpm test

# Try the generated CLI
./bin/cli.js --help
```

You should see:
```
csv-processor v1.0.0

Commands:
  help     Show help information
  version  Show version information

Options:
  --help     Show help
  --version  Show version
```

### Understanding the Structure

```
csv-processor/
├── src/
│   ├── index.ts           # CLI entry point
│   ├── commands/          # Command implementations
│   │   ├── help.ts
│   │   └── version.ts
│   └── lib/              # Shared utilities
├── bin/
│   └── cli.js            # Executable script
├── tests/                # Test files
└── package.json          # Project configuration
```

> 💡 **Key Concept**: The `@esteban-url/cli` framework uses **functional programming** and **Result types** instead of exceptions. This means errors are values you handle explicitly, making your CLI more predictable and easier to test.

---

## Phase 2: Explore What Was Generated (5 minutes)

Let's understand the key patterns in your new CLI before we start building.

### The Entry Point (`src/index.ts`)

```typescript
#!/usr/bin/env node
import { createCLI } from '@esteban-url/cli'
import { createCommand } from '@esteban-url/cli/command'
import { ok } from '@esteban-url/core'

// Create version command
const versionCommand = createCommand({
  name: 'version',
  description: 'Show version information',
  action: async (options, context) => {
    context.logger.info('csv-processor v1.0.0')
    return ok(undefined)
  }
})

// Create help command
const helpCommand = createCommand({
  name: 'help',
  description: 'Show help information',
  action: async (options, context) => {
    context.logger.info(`
csv-processor - Transform messy CSV data

Commands:
  help     Show this help message
  version  Show version information

Run 'csv-processor <command> --help' for command details
`)
    return ok(undefined)
  }
})

// Create and configure CLI
const cli = createCLI({
  name: 'csv-processor',
  version: '1.0.0',
  description: 'Transform messy CSV data into clean output'
})

// Register commands with Commander
cli.command('version')
  .description(versionCommand.description)
  .action(async () => {
    const result = await versionCommand.execute({}, { logger: console, args: [] })
    if (result.isErr()) process.exit(1)
  })

cli.command('help')
  .description(helpCommand.description)
  .action(async () => {
    const result = await helpCommand.execute({}, { logger: console, args: [] })
    if (result.isErr()) process.exit(1)
  })

// Parse command line arguments
cli.parse()
```

### Understanding Result Types

Look at a typical command (`src/commands/version.ts`):

```typescript
import { createCommand } from '@esteban-url/cli/command'
import { ok } from '@esteban-url/core'

export const versionCommand = createCommand({
  name: 'version',
  description: 'Show version information',
  action: async (options, context) => {
    const { logger } = context
    logger.info('csv-processor v1.0.0')
    return ok(undefined)
  }
})
```

> 💡 **Key Pattern**: Notice the `ok(undefined)` return? This is a **Result type**. Instead of throwing errors, Trailhead commands return either `ok(value)` for success or `err(error)` for failures. This makes error handling explicit and testable.

### Why Result Types?

Traditional approach (with exceptions):
```typescript
// Unpredictable - might throw anywhere
function readFile(path: string): string {
  if (!exists(path)) throw new Error('File not found')
  return fs.readFileSync(path, 'utf-8')
}
```

Trailhead approach (with Results):
```typescript
// Explicit - errors are values
function readFile(path: string): Result<string, Error> {
  if (!exists(path)) return err(new Error('File not found'))
  return ok(fs.readFileSync(path, 'utf-8'))
}
```

This pattern makes your CLI more reliable because:
- Errors can't be accidentally ignored
- The type system forces you to handle failures
- Testing is simpler (no try/catch needed)

---

## Phase 3: Add CSV Parsing Capability (10 minutes)

Now let's build the core functionality - reading and parsing CSV files.

### Step 1: Install Dependencies

We need a CSV parser. Let's use PapaParse, a robust library with 4M+ weekly downloads:

```bash
pnpm add papaparse
pnpm add -D @types/papaparse
```

> 📦 **Why PapaParse?** It handles edge cases like quoted fields, different delimiters, and large files efficiently. Perfect for our "messy data" scenario.

### Step 2: Create the CSV Parser Module

Create a new file `src/lib/csv-parser.ts`:

```typescript
import Papa from 'papaparse'
import { ok, err, Result } from '@esteban-url/core'
import { readFile } from '@esteban-url/fs'

export interface CSVRow {
  [key: string]: string
}

export interface ParseOptions {
  skipEmptyLines?: boolean
  trimHeaders?: boolean
  trimValues?: boolean
}

export async function parseCSVFile(
  filePath: string,
  options: ParseOptions = {}
): Promise<Result<CSVRow[], Error>> {
  // Read the file using Trailhead's file system utilities
  const fileResult = await readFile(filePath, 'utf-8')
  
  if (fileResult.isError()) {
    return err(new Error(`Failed to read file: ${fileResult.error.message}`))
  }

  return parseCSVContent(fileResult.value, options)
}

export function parseCSVContent(
  content: string,
  options: ParseOptions = {}
): Result<CSVRow[], Error> {
  const parseResult = Papa.parse<CSVRow>(content, {
    header: true,
    skipEmptyLines: options.skipEmptyLines ?? true,
    transformHeader: (header) => 
      options.trimHeaders ? header.trim() : header,
    transform: (value) => 
      options.trimValues ? value.trim() : value,
  })

  if (parseResult.errors.length > 0) {
    const errorMessages = parseResult.errors
      .map(e => `Row ${e.row}: ${e.message}`)
      .join(', ')
    return err(new Error(`CSV parsing failed: ${errorMessages}`))
  }

  return ok(parseResult.data)
}
```

> 📘 **Package Spotlight**: `@esteban-url/fs` provides file system operations that return Result types instead of throwing errors. It wraps Node's fs module with proper error handling. [Learn more →](../reference/api/file-operations.md)

### Step 3: Create the Parse Command

Create `src/commands/parse.ts`:

```typescript
import { createCommand } from '@esteban-url/cli/command'
import { ok, err } from '@esteban-url/core'
import type { CommandOptions } from '@esteban-url/cli/command'
import { parseCSVFile } from '../lib/csv-parser.js'

interface ParseOptions extends CommandOptions {
  json?: boolean
  limit?: number
}

export const parseCommand = createCommand<ParseOptions>({
  name: 'parse',
  description: 'Parse and display CSV file contents',
  arguments: '<file>',  // Required positional argument
  
  options: [
    {
      flags: '-j, --json',
      description: 'Output as JSON',
      type: 'boolean'
    },
    {
      flags: '-l, --limit <number>',
      description: 'Limit number of rows to display',
      type: 'number'
    }
  ],

  action: async (options, context) => {
    const { logger, args } = context
    const [filePath] = args
    const { json = false, limit } = options

    if (!filePath) {
      return err(new Error('Please provide a CSV file path'))
    }

    logger.info(`Parsing CSV file: ${filePath}`)

    const result = await parseCSVFile(filePath, {
      skipEmptyLines: true,
      trimHeaders: true,
      trimValues: true,
    })

    if (result.isError()) {
      logger.error(`Failed to parse CSV: ${result.error.message}`)
      return result
    }

    const rows = limit ? result.value.slice(0, limit) : result.value
    
    if (json) {
      logger.info(JSON.stringify(rows, null, 2))
    } else {
      logger.info(`Found ${result.value.length} rows`)
      rows.forEach((row, index) => {
        logger.info(`Row ${index + 1}: ${JSON.stringify(row)}`)
      })
    }

    return ok({ rowCount: result.value.length })
  }
})
```

### Step 4: Register the Command

Update `src/index.ts`:

```diff
#!/usr/bin/env node
import { createCLI } from '@esteban-url/cli'
import { createCommand } from '@esteban-url/cli/command'
import { ok } from '@esteban-url/core'
+ import { parseCommand } from './commands/parse.js'

// ... existing commands ...

// Register commands with Commander
cli.command('version')
  .description(versionCommand.description)
  .action(async () => {
    const result = await versionCommand.execute({}, { logger: console, args: [] })
    if (result.isErr()) process.exit(1)
  })

cli.command('help')
  .description(helpCommand.description)
  .action(async () => {
    const result = await helpCommand.execute({}, { logger: console, args: [] })
    if (result.isErr()) process.exit(1)
  })

+ // Register parse command
+ cli.command('parse')
+   .description(parseCommand.description)
+   .arguments(parseCommand.arguments || '')
+   .option('-j, --json', 'Output as JSON')
+   .option('-l, --limit <number>', 'Limit number of rows', parseInt)
+   .action(async (file, options) => {
+     const result = await parseCommand.execute(options, { 
+       logger: console, 
+       args: [file] 
+     })
+     if (result.isErr()) {
+       console.error(result.error.message)
+       process.exit(1)
+     }
+   })

// Parse command line arguments
cli.parse()
```

### Step 5: Test Your CSV Parser

Create a test file `test-data.csv`:

```csv
"First Name   ","Last Name","Email   ","Age"
"  John  ","Doe","john@email.com  ","25"
"Jane","Smith","jane@email.com","30"
```

Run your new command:

```bash
# Parse and display the CSV
./bin/cli.js parse test-data.csv

# Output as JSON
./bin/cli.js parse test-data.csv --json

# Limit output
./bin/cli.js parse test-data.csv --limit 5
```

Expected output:
```
Parsing CSV file: test-data.csv
Found 2 rows
Row 1: {"First Name":"John","Last Name":"Doe","Email":"john@email.com","Age":"25"}
Row 2: {"First Name":"Jane","Last Name":"Smith","Email":"jane@email.com","Age":"30"}
```

### What We've Accomplished

✅ **Working CSV parser** that handles messy data  
✅ **Command-line interface** with proper argument parsing  
✅ **Error handling** using Result types  
✅ **Flexible output** options (JSON, limited rows)

---

## 🎉 Basic Path Complete!

Congratulations! You now have a functional CSV processing CLI that can:
- Read CSV files from the command line
- Parse them with proper error handling
- Display contents in multiple formats
- Handle common data quality issues

**Your CLI is ready to use!** You can stop here with a working tool, or continue to the advanced path for production-ready features.

### What You've Learned

1. **CLI Architecture**: How Trailhead structures CLI applications
2. **Result Types**: Explicit error handling without exceptions
3. **Command Pattern**: Creating modular, testable commands
4. **Package Integration**: Using external libraries within the framework

### Try It Out

Test with the messy data from Phase 0:
```bash
# Save the messy data as messy.csv, then:
./bin/cli.js parse messy.csv --json
```

Notice how it handles the whitespace and empty rows automatically!

---

## 🚀 Advanced Path: Production-Ready Features

Ready to make your CLI production-ready? Let's add data transformation, validation, and interactive features.

### What's Next?

- **Phase 4**: Transform and clean data with field mapping
- **Phase 5**: Add validation rules and quality reports

Continue when you're ready to level up your CLI!

---

## Phase 4: Transform and Clean Data (15 minutes)

Let's add the ability to transform messy data into clean, standardized output.

### Step 1: Create a Transform Command

First, let's add interactive prompts for field mapping. Install the required package:

```bash
pnpm add yaml
```

> 📦 **Why YAML?** In addition to JSON, YAML is a human-readable format perfect for configuration files and clean data output.

Create `src/commands/transform.ts`:

```typescript
import { createCommand } from '@esteban-url/cli/command'
import { ok, err, Result } from '@esteban-url/core'
import type { CommandOptions } from '@esteban-url/cli/command'
import { parseCSVFile } from '../lib/csv-parser.js'
import { writeFile } from '@esteban-url/fs'
import * as yaml from 'yaml'
import { input } from '@esteban-url/cli/prompts'

interface TransformOptions extends CommandOptions {
  output?: string
  format?: 'json' | 'csv' | 'yaml'
  interactive?: boolean
  clean?: boolean
}

interface TransformRule {
  from: string
  to: string
  transform?: (value: string) => string
}

// Helper to safely wrap prompts in Result types
async function safePrompt<T>(promptFn: () => Promise<T>): Promise<Result<T, Error>> {
  try {
    const value = await promptFn()
    return ok(value)
  } catch (error) {
    return err(error as Error)
  }
}

export const transformCommand = createCommand<TransformOptions>({
  name: 'transform',
  description: 'Transform CSV data with field mapping and cleaning',
  arguments: '<input>',  // Required positional argument
  
  options: [
    {
      flags: '-o, --output <path>',
      description: 'Output file path',
      type: 'string'
    },
    {
      flags: '-f, --format <format>',
      description: 'Output format (json, csv, yaml)',
      type: 'string'
    },
    {
      flags: '-i, --interactive',
      description: 'Interactive field mapping',
      type: 'boolean'
    },
    {
      flags: '--no-clean',
      description: 'Disable whitespace cleaning',
      type: 'boolean'
    }
  ],

  action: async (options, context) => {
    const { logger, args } = context
    const [inputPath] = args
    const { 
      output, 
      format = 'json', 
      interactive = false, 
      clean = true 
    } = options

    if (!inputPath) {
      return err(new Error('Please provide an input CSV file path'))
    }

    // Parse the input CSV
    const parseResult = await parseCSVFile(inputPath, {
      skipEmptyLines: true,
      trimHeaders: clean,
      trimValues: clean,
    })

    if (parseResult.isError()) {
      return parseResult
    }

    const data = parseResult.value
    if (data.length === 0) {
      return err(new Error('No data found in CSV file'))
    }

    // Get field mapping
    let rules: TransformRule[] = []
    
    if (interactive) {
      logger.info('Let\'s map your CSV fields to clean names:')
      const headers = Object.keys(data[0])
      
      for (const header of headers) {
        const result = await safePrompt(() =>
          input({
            message: `Rename "${header}" to:`,
            default: header.trim().toLowerCase().replace(/\s+/g, '_'),
          })
        )
        
        if (result.isError()) {
          return result
        }
        
        rules.push({
          from: header,
          to: result.value,
        })
      }
    } else {
      // Default transformation: lowercase and underscore
      rules = Object.keys(data[0]).map(header => ({
        from: header,
        to: header.trim().toLowerCase().replace(/\s+/g, '_'),
      }))
    }

    // Transform the data
    const transformed = data.map(row => {
      const newRow: Record<string, any> = {}
      
      for (const rule of rules) {
        let value = row[rule.from]
        
        if (clean && value) {
          // Clean common data issues
          value = value.trim()
          
          // Normalize status values
          if (rule.to === 'status') {
            value = value.toLowerCase()
            if (value === 'unknown_status') value = 'unknown'
          }
          
          // Parse age to number if possible
          if (rule.to === 'age' && value) {
            const num = parseInt(value, 10)
            if (!isNaN(num)) {
              value = num.toString()
            }
          }
        }
        
        newRow[rule.to] = value
      }
      
      return newRow
    })

    // Output the transformed data
    let outputContent: string
    
    switch (format) {
      case 'json':
        outputContent = JSON.stringify(transformed, null, 2)
        break
      case 'yaml':
        outputContent = yaml.stringify(transformed)
        break
      case 'csv':
        outputContent = await generateCSV(transformed)
        break
      default:
        return err(new Error(`Unknown format: ${format}`))
    }

    if (output) {
      const writeResult = await writeFile(output, outputContent)
      if (writeResult.isError()) {
        return writeResult
      }
      logger.info(`✨ Transformed data written to ${output}`)
    } else {
      logger.info(outputContent)
    }

    return ok({
      rowsTransformed: transformed.length,
      outputPath: output,
    })
  }
})

async function generateCSV(data: any[]): Promise<string> {
  if (data.length === 0) return ''
  
  const headers = Object.keys(data[0])
  const lines = [
    headers.join(','),
    ...data.map(row => 
      headers.map(h => JSON.stringify(row[h] || '')).join(',')
    )
  ]
  
  return lines.join('\n')
}
```

> 📘 **Package Spotlight**: `@esteban-url/cli/prompts` provides interactive prompts with Result-based error handling. It wraps the popular `enquirer` library to fit the framework's patterns. [Learn more →](../reference/api/cli-building.md#prompts)

### Step 2: Add Transform to Your CLI

Update `src/index.ts`:

```diff
#!/usr/bin/env node
import { createCLI } from '@esteban-url/cli'
import { createCommand } from '@esteban-url/cli/command'
import { ok } from '@esteban-url/core'
import { parseCommand } from './commands/parse.js'
+ import { transformCommand } from './commands/transform.js'

// ... existing commands ...

// Register parse command
cli.command('parse')
  .description(parseCommand.description)
  .arguments(parseCommand.arguments || '')
  .option('-j, --json', 'Output as JSON')
  .option('-l, --limit <number>', 'Limit number of rows', parseInt)
  .action(async (file, options) => {
    const result = await parseCommand.execute(options, { 
      logger: console, 
      args: [file] 
    })
    if (result.isErr()) {
      console.error(result.error.message)
      process.exit(1)
    }
  })

+ // Register transform command
+ cli.command('transform')
+   .description(transformCommand.description)
+   .arguments(transformCommand.arguments || '')
+   .option('-o, --output <path>', 'Output file path')
+   .option('-f, --format <format>', 'Output format (json, csv, yaml)', 'json')
+   .option('-i, --interactive', 'Interactive field mapping')
+   .option('--no-clean', 'Disable whitespace cleaning')
+   .action(async (input, options) => {
+     const result = await transformCommand.execute(options, { 
+       logger: console, 
+       args: [input] 
+     })
+     if (result.isErr()) {
+       console.error(result.error.message)
+       process.exit(1)
+     }
+   })

// Parse command line arguments
cli.parse()
```

### Step 3: Test Data Transformation

Try the interactive transformation:

```bash
# Interactive field mapping
./bin/cli.js transform messy.csv --interactive --output clean.json

# Automatic transformation
./bin/cli.js transform messy.csv --format yaml

# Output as cleaned CSV
./bin/cli.js transform messy.csv --format csv --output clean.csv
```

Example interaction:

```text
Let's map your CSV fields to clean names:
✔ Rename "First Name   " to: › first_name
✔ Rename "Last Name" to: › last_name
✔ Rename "Email   " to: › email
✔ Rename "Age" to: › age
✔ Rename "Join Date" to: › join_date
✔ Rename "Status" to: › status

✨ Transformed data written to clean.json
```

### What We've Added

✅ **Interactive field mapping** for custom transformations  
✅ **Multiple output formats** (JSON, YAML, CSV)  
✅ **Automatic data cleaning** (whitespace, normalization)  
✅ **File output support** with proper error handling

---

## Phase 5: Add Validation and Quality Analysis (15 minutes)

Let's make our CLI production-ready by adding data validation and quality reporting.

### Step 1: Install Validation Library

```bash
pnpm add zod
```

> 📦 **Why Zod?** It's a TypeScript-first schema validation library that works perfectly with Result types. Define your data shape and validate at runtime. [Learn more →](https://zod.dev)

### Step 2: Create Validation Rules

Create `src/lib/validation-rules.ts`:

```typescript
import { z } from 'zod'

// Define common validation schemas
export const emailSchema = z.string().email('Invalid email format')

export const ageSchema = z.coerce.number()
  .int('Age must be a whole number')
  .min(0, 'Age cannot be negative')
  .max(150, 'Age seems unrealistic')

export const statusSchema = z.enum(['active', 'pending', 'inactive', 'unknown'], {
  errorMap: () => ({ message: 'Status must be active, pending, inactive, or unknown' })
})

export const dateSchema = z.string().refine((val) => {
  // Accept multiple date formats
  const formats = [
    /^\d{4}-\d{2}-\d{2}$/,
    /^\d{2}\/\d{2}\/\d{4}$/,
    /^\w+ \d{1,2}, \d{4}$/,
  ]
  return formats.some(format => format.test(val))
}, 'Invalid date format')

// Complete row schema
export const csvRowSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: emailSchema,
  age: ageSchema,
  join_date: dateSchema,
  status: statusSchema,
})

export type ValidatedRow = z.infer<typeof csvRowSchema>
```

### Step 3: Create Validation Command

Create `src/commands/validate.ts`:

```typescript
import { createCommand } from '@esteban-url/cli/command'
import { ok, err, Result } from '@esteban-url/core'
import type { CommandOptions } from '@esteban-url/cli/command'
import { parseCSVFile } from '../lib/csv-parser.js'
import { csvRowSchema } from '../lib/validation-rules.js'
import { writeFile } from '@esteban-url/fs'
import { z } from 'zod'

interface ValidateOptions extends CommandOptions {
  report?: string
  stopOnError?: boolean
  verbose?: boolean
}

interface ValidationReport {
  totalRows: number
  validRows: number
  invalidRows: number
  errors: Array<{
    row: number
    field: string
    value: any
    error: string
  }>
  summary: {
    [field: string]: {
      missing: number
      invalid: number
    }
  }
}

// Helper to safely validate data with Zod
function validateRow(data: any): Result<any, z.ZodError> {
  const result = csvRowSchema.safeParse(data)
  if (result.success) {
    return ok(result.data)
  } else {
    return err(result.error)
  }
}

export const validateCommand = createCommand<ValidateOptions>({
  name: 'validate',
  description: 'Validate CSV data and generate quality report',
  arguments: '<file>',  // Required positional argument
  
  options: [
    {
      flags: '-r, --report <path>',
      description: 'Save validation report to file',
      type: 'string'
    },
    {
      flags: '-s, --stop-on-error',
      description: 'Stop validation on first error',
      type: 'boolean'
    },
    {
      flags: '-v, --verbose',
      description: 'Show detailed error information',
      type: 'boolean'
    }
  ],

  action: async (options, context) => {
    const { logger, args } = context
    const [filePath] = args
    const { 
      report: reportPath, 
      stopOnError = false, 
      verbose = false 
    } = options

    if (!filePath) {
      return err(new Error('Please provide a CSV file path to validate'))
    }

    // Parse CSV first
    const parseResult = await parseCSVFile(filePath, {
      skipEmptyLines: true,
      trimHeaders: true,
      trimValues: true,
    })

    if (parseResult.isError()) {
      return parseResult
    }

    const data = parseResult.value
    logger.info(`Validating ${data.length} rows...`)

    // Initialize report
    const validationReport: ValidationReport = {
      totalRows: data.length,
      validRows: 0,
      invalidRows: 0,
      errors: [],
      summary: {},
    }

    // Validate each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      const rowNumber = i + 1
      
      // Transform to expected format first
      const transformed = {
        first_name: row['First Name'] || row.first_name || '',
        last_name: row['Last Name'] || row.last_name || '',
        email: row['Email'] || row.email || '',
        age: row['Age'] || row.age || '',
        join_date: row['Join Date'] || row.join_date || '',
        status: row['Status'] || row.status || '',
      }

      // Validate with schema using our Result-based helper
      const validationResult = validateRow(transformed)
      
      if (validationResult.isOk()) {
        validationReport.validRows++
      } else {
        validationReport.invalidRows++
        const zodError = validationResult.error
        
        for (const issue of zodError.issues) {
          const field = issue.path.join('.')
          
          // Track error
          validationReport.errors.push({
            row: rowNumber,
            field,
            value: row[field],
            error: issue.message,
          })

          // Update summary
          if (!validationReport.summary[field]) {
            validationReport.summary[field] = { missing: 0, invalid: 0 }
          }
          
          if (!row[field]) {
            validationReport.summary[field].missing++
          } else {
            validationReport.summary[field].invalid++
          }
        }

        if (stopOnError) {
          logger.error(`Validation failed at row ${rowNumber}`)
          break
        }
      }
    }

    // Display results
    const successRate = (validationReport.validRows / validationReport.totalRows * 100).toFixed(1)
    
    logger.info('\n📊 Validation Report')
    logger.info('─'.repeat(40))
    logger.info(`Total rows: ${validationReport.totalRows}`)
    logger.info(`Valid rows: ${validationReport.validRows} (${successRate}%)`)
    logger.info(`Invalid rows: ${validationReport.invalidRows}`)
    
    if (validationReport.errors.length > 0) {
      logger.info('\n❌ Issues by Field:')
      for (const [field, stats] of Object.entries(validationReport.summary)) {
        logger.info(`  ${field}: ${stats.missing} missing, ${stats.invalid} invalid`)
      }
      
      if (verbose) {
        logger.info('\n❌ Detailed Errors:')
        const errorSample = validationReport.errors.slice(0, 10)
        for (const error of errorSample) {
          logger.info(`  Row ${error.row}, ${error.field}: ${error.error}`)
        }
        
        if (validationReport.errors.length > 10) {
          logger.info(`  ... and ${validationReport.errors.length - 10} more errors`)
        }
      }
    }

    // Save report if requested
    if (reportPath) {
      const reportJson = JSON.stringify(validationReport, null, 2)
      const writeResult = await writeFile(reportPath, reportJson)
      
      if (writeResult.isError()) {
        logger.error(`Failed to save report: ${writeResult.error.message}`)
      } else {
        logger.info(`\n📄 Full report saved to ${reportPath}`)
      }
    }

    // Return success if any rows are valid
    if (validationReport.validRows > 0) {
      return ok(validationReport)
    } else {
      return err(new Error('No valid rows found in CSV'))
    }
  }
})
```

### Step 4: Register Validation Command

Update `src/index.ts`:

```diff
import { parseCommand } from './commands/parse.js'
import { transformCommand } from './commands/transform.js'
+ import { validateCommand } from './commands/validate.js'

// ... existing command registrations ...

+ // Register validate command
+ cli.command('validate')
+   .description(validateCommand.description)
+   .arguments(validateCommand.arguments || '')
+   .option('-r, --report <path>', 'Save validation report to file')
+   .option('-s, --stop-on-error', 'Stop validation on first error')
+   .option('-v, --verbose', 'Show detailed error information')
+   .action(async (file, options) => {
+     const result = await validateCommand.execute(options, { 
+       logger: console, 
+       args: [file] 
+     })
+     if (result.isErr()) {
+       console.error(result.error.message)
+       process.exit(1)
+     }
+   })

// Parse command line arguments
cli.parse()
```

### Step 5: Test Validation

Run validation on your messy data:

```bash
# Basic validation
./bin/cli.js validate messy.csv

# Detailed validation with report
./bin/cli.js validate messy.csv --verbose --report validation-report.json

# Stop on first error
./bin/cli.js validate messy.csv --stop-on-error
```

Example output:

```text
Validating 5 rows...

📊 Validation Report
────────────────────────────────────────
Total rows: 5
Valid rows: 2 (40.0%)
Invalid rows: 3

❌ Issues by Field:
  email: 0 missing, 1 invalid
  age: 1 missing, 1 invalid
  status: 0 missing, 1 invalid

✅ Full report saved to validation-report.json
```

---

## 🎉 Advanced Path Complete

Congratulations! You've built a production-ready CSV processing CLI with:

### Core Features

✅ **CSV parsing** with automatic cleanup  
✅ **Data transformation** with interactive field mapping  
✅ **Multiple output formats** (JSON, YAML, CSV)  
✅ **Data validation** with detailed error reporting  
✅ **Quality analysis** with field-level statistics  

### Framework Features Mastered

✅ **Result types** for explicit error handling  
✅ **Command pattern** for modular CLI design  
✅ **Interactive prompts** for user-friendly interfaces  
✅ **Schema validation** with Zod integration  
✅ **File operations** with proper error handling  

### Your Complete CLI Workflow

```bash
# 1. Check your messy data
./bin/cli.js parse messy.csv --limit 5

# 2. Transform it interactively
./bin/cli.js transform messy.csv --interactive --output clean.json

# 3. Validate the quality
./bin/cli.js validate clean.json --verbose --report quality.json

# 4. Export in any format
./bin/cli.js transform clean.json --format yaml --output final.yaml
```

---

## Next Steps

### Enhance Your CLI

- Add progress bars for large files using `@esteban-url/cli/progress`
- Support more formats (Excel, XML) with additional parsers
- Add data aggregation and analysis commands
- Create a config file for transform rules

### Learn More

- [Common Workflows →](../how-to/common-workflows.md)
- [API Reference →](../reference/api/)
- [Architecture Guide →](../explanation/architecture.md)

### Share Your CLI

Ready to share your CSV processor with the world?

```bash
# Publish to npm
npm publish

# Or create a standalone executable
pnpm build
pkg . # Using pkg or similar tool
```

You've successfully transformed "CSV Hell" into "CLI Heaven" using the Trailhead framework. Well done! 🚀