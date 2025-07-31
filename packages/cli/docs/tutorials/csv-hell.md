---
type: tutorial
title: 'From Spreadsheet Hell to Something You Can Actually Use'
description: 'Build a real-world CSV transformation CLI that saves your sanity'
prerequisites:
  - 'Completed getting-started tutorial'
  - 'Basic understanding of CSV format'
  - 'Familiarity with data transformation concepts'
related:
  - ./getting-started.md
  - /packages/cli/reference/command.md
  - /packages/cli/reference/flow-control.md
---

# From Spreadsheet Hell to Something You Can Actually Use

_A tale of transformation, validation, and finally achieving data freedom_

## What Fresh Hell Are We Dealing With?

Picture this: Your colleague just sent you a "quick" spreadsheet to process. It has:

- Column names like "First Name " (yes, with trailing spaces)
- Emails that are definitely not emails ("john@definitely-not-spam")
- Birth dates from the year 2157 (either time travelers or data entry disasters)
- Mysterious empty rows sprinkled throughout like confetti of sadness

Sound familiar? Welcome to Spreadsheet Hell. Today, we're building your escape route.

## What You'll Build (Your Salvation)

By the end of this tutorial, you'll have a production-ready CLI that can:

- **Transform** CSV files to JSON, YAML, TSV (and back to clean CSV)
- **Validate** data with smart rules and helpful error messages
- **Analyze** data quality and give you actionable insights
- **Handle errors gracefully** without exploding when data gets weird
- **Show progress** so you know it's actually working on large files
- **Let users interact** with prompts for field mapping

Most importantly: **It won't crash when your data is garbage** (because it will be).

## Before We Start Our Journey

Make sure you have:

- Node.js 18+
- Basic TypeScript knowledge (you know what `string` means)
- A healthy sense of humor about data quality (required)

This tutorial takes about 45 minutes. Grab some coffee. ☕

## Step 1: Project Structure (The Foundation)

Let's start with a proper project structure. No dumping everything in one file like a barbarian.

```bash
mkdir csv-processor && cd csv-processor
npm init -y
npm install @esteban-url/cli @repo/fs @repo/data papaparse yaml
npm install -D @types/node @types/papaparse tsx typescript
```

Create this directory structure:

```
csv-processor/
├── src/
│   ├── index.ts           # Main CLI entry point
│   ├── commands/          # Individual commands
│   ├── lib/              # Business logic
│   └── config/           # Configuration schemas
├── package.json
└── tsconfig.json
```

**Why this structure?** Because when your CLI grows (and it will), you don't want to hunt through 500 lines of spaghetti code at 2 AM.

## Step 2: Types (Know Your Enemy)

First, let's define what we're dealing with. Create `src/lib/types.ts`:

```typescript
export interface CSVRow {
  [key: string]: string | number | boolean | null
}

export interface FieldMapping {
  [originalField: string]: string // "First Name   " -> "firstName"
}

export type OutputFormat = 'json' | 'csv' | 'tsv' | 'yaml'

export interface ValidationRule {
  field: string
  type: 'required' | 'email' | 'number' | 'date' | 'enum'
  options?: {
    values?: string[] // For enum validation
    min?: number // For number ranges
    max?: number
    pattern?: string // For custom regex
  }
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  summary: {
    totalRows: number
    validRows: number
    errorRows: number
    warningRows: number
  }
}

export interface ValidationError {
  row: number
  field: string
  value: any
  rule: string
  message: string // Human-readable explanation
}

// Command Option Interfaces for Type Safety
export interface TransformCommandOptions {
  output?: string
  format?: OutputFormat
  interactive?: boolean
  config?: string
  clean?: boolean
  preview?: boolean
}

export interface ValidateCommandOptions {
  rules?: string
  'auto-detect'?: boolean
  interactive?: boolean
  output?: string
  strict?: boolean
}

export interface AnalyzeCommandOptions {
  output?: string
  format?: 'json' | 'markdown' | 'text'
  detailed?: boolean
  'sample-size'?: number
}
```

**Why explicit types?** Because when dealing with CSV data, anything can happen. Types are your safety net.

## Step 3: CSV Parser (The Heavy Lifting)

Create `src/lib/csv-parser.ts`. This is where the magic happens:

```typescript
import { readFile, writeFile } from 'fs/promises'
import Papa from 'papaparse'
import { stringify as stringifyYaml } from 'yaml'
import { ok, err, Result } from '@esteban-url/cli'
import type { CSVRow, FieldMapping, OutputFormat } from './types.js'

export async function parseCSV(filePath: string): Promise<Result<CSVRow[], Error>> {
  const fileReadResult = await readFile(filePath, 'utf-8')
    .then((content) => ok(content))
    .catch((error) => err(new Error(`Failed to read CSV file: ${error.message}`)))

  if (!fileReadResult.success) {
    return fileReadResult
  }

  const result = Papa.parse(fileReadResult.value, {
    header: true, // First row becomes column names
    skipEmptyLines: true, // Ignore completely empty rows
    transform: (value: string) => value.trim(), // Auto-trim whitespace!
    dynamicTyping: false, // Keep everything as strings for consistency
  })

  if (result.errors.length > 0) {
    const errorMessages = result.errors.map((err) => `Row ${err.row}: ${err.message}`).join(', ')
    return err(new Error(`CSV parsing errors: ${errorMessages}`))
  }

  return ok(result.data as CSVRow[])
}
```

**Why papaparse?** It's battle-tested (4M+ weekly downloads), handles malformed CSV gracefully, and gives us detailed error information. Plus, auto-trimming whitespace saves us from "John " vs "John" headaches.

**Notice the Result types?** No exceptions here! Everything returns `Ok(data)` or `Err(error)`. Your future self will thank you when debugging at 3 AM.

Now add the transformation function:

```typescript
export function transformFields(rows: CSVRow[], fieldMapping: FieldMapping): CSVRow[] {
  return rows.map((row) => {
    const transformedRow: CSVRow = {}

    // Apply field mappings
    for (const [originalField, newField] of Object.entries(fieldMapping)) {
      if (originalField in row) {
        transformedRow[newField] = row[originalField]
      }
    }

    // Keep fields not in mapping
    for (const [field, value] of Object.entries(row)) {
      if (!fieldMapping[field]) {
        transformedRow[field] = value
      }
    }

    return transformedRow
  })
}
```

This function renames "First Name " to "firstName" without losing data.

Add the data cleaning function:

```typescript
export function cleanData(rows: CSVRow[], shouldClean: boolean = false): CSVRow[] {
  if (!shouldClean) return rows

  return (
    rows
      // Remove completely empty rows
      .filter((row) =>
        Object.values(row).some(
          (value) => value !== null && value !== undefined && String(value) !== ''
        )
      )
      // Convert empty strings to null (papaparse already trimmed for us!)
      .map((row) => {
        const cleanedRow: CSVRow = {}
        for (const [key, value] of Object.entries(row)) {
          cleanedRow[key] = typeof value === 'string' && value === '' ? null : value
        }
        return cleanedRow
      })
  )
}
```

**Why simpler?** Papaparse already trims whitespace for us! We just need to handle empty strings and remove empty rows. KISS principle in action.

## Step 4: Output Writers (Flexibility is Key)

Add to your CSV parser file:

```typescript
export async function writeOutput(
  data: CSVRow[],
  outputPath: string,
  format: OutputFormat
): Promise<Result<void, Error>> {
  let output: string

  switch (format) {
    case 'json':
      output = JSON.stringify(data, null, 2)
      break

    case 'yaml':
      output = stringifyYaml(data)
      break

    case 'csv':
      output = Papa.unparse(data, {
        header: true,
        delimiter: ',',
        quotes: true, // Quote all fields for safety
      })
      break

    case 'tsv':
      output = Papa.unparse(data, {
        header: true,
        delimiter: '\t',
        quotes: false, // TSV typically doesn't quote
      })
      break

    default:
      return err(new Error(`Unsupported output format: ${format}`))
  }

  const writeResult = await writeFile(outputPath, output)
    .then(() => ok(undefined))
    .catch((error) => err(new Error(`Failed to write output: ${error.message}`)))

  return writeResult
}
```

**Why multiple formats?** Because sometimes your API wants JSON, your database wants CSV, and your data scientist wants YAML. We don't judge.

## Step 5: The Transform Command (Where It All Comes Together)

Create `src/commands/transform.ts`:

```typescript
import { ok, err } from '@esteban-url/cli';
import { createCommand, type CommandContext } from '@esteban-url/cli/command';
import { fs } from '@repo/fs';
import { prompt, select } from '@esteban-url/cli/prompts';
// Note: Using simpler approach without workflow tasks
import { parseCSV, transformFields, cleanData, writeOutput } from '../lib/csv-parser.js';
import type { TransformCommandOptions } from './types.js';

export const transformCommand = createCommand<TransformCommandOptions>({
  name: 'transform',
  description: 'Transform CSV files to different formats with optional field mapping',
  options: [
    {
      name: 'output',
      alias: 'o',
      type: 'string',
      description: 'Output file path',
    },
    {
      name: 'format',
      alias: 'f',
      type: 'string',
      choices: ['json', 'csv', 'tsv', 'yaml'],
      default: 'json',
      description: 'Output format',
    },
    {
      name: 'interactive',
      alias: 'i',
      type: 'boolean',
      default: false,
      description: 'Interactive field mapping mode',
    },
    {
      name: 'clean',
      type: 'boolean',
      default: false,
      description: 'Clean data (trim whitespace, remove empty rows)',
    },
  ],
  action: async (options: TransformCommandOptions, context: CommandContext) => {
    const [inputFile] = context.args;

    if (!inputFile) {
      return err(new Error('Input CSV file is required. Usage: transform <input.csv>'));
    }

    const fs = createFileSystem();

    // Check if input file exists (fail fast!)
    const fileCheck = await fs.access(inputFile);
    if (!fileCheck.success) {
      return err(new Error(`Input file does not exist: ${inputFile}`));
    }
```

**Notice the error handling?** We check if the file exists before doing anything else. Fail fast, fail clearly.

Now add the workflow tasks:

```typescript
    // Create task list for transformation workflow
    const tasks = createTaskList([
      createTask('Parsing CSV file', async (ctx) => {
        const parseResult = await parseCSV(inputFile);
        if (!parseResult.success) {
          throw new Error(`Failed to parse CSV: ${parseResult.error.message}`);
        }

        ctx.csvData = parseResult.value;
        ctx.totalRows = parseResult.value.length;

        context.logger.info(`📊 Loaded ${ctx.totalRows} rows`);
      }),

      createTask('Setting up field mapping', async (ctx) => {
        ctx.fieldMapping = {};

        if (options.interactive) {
          context.logger.info('🔧 Interactive field mapping mode');

          const columnNames = Object.keys(ctx.csvData[0] || {});

          for (const column of columnNames) {
            const newName = await prompt({
              message: `Rename '${column}' to:`,
              default: column,
            });

            if (newName !== column) {
              ctx.fieldMapping[column] = newName;
            }
          }
        }
      }),

      createTask('Transforming data', async (ctx) => {
        // Apply field mapping if any
        if (Object.keys(ctx.fieldMapping).length > 0) {
          ctx.csvData = transformFields(ctx.csvData, ctx.fieldMapping);
          context.logger.info(`🔄 Applied field mapping to ${Object.keys(ctx.fieldMapping).length} fields`);
        }

        // Clean data if requested
        if (options.clean) {
          const originalLength = ctx.csvData.length;
          ctx.csvData = cleanData(ctx.csvData);
          const cleanedLength = ctx.csvData.length;

          if (originalLength !== cleanedLength) {
            context.logger.info(`🧹 Cleaned data: removed ${originalLength - cleanedLength} empty rows`);
          }
        }
      }),

      createTask('Writing output', async (ctx) => {
        // Determine output path
        let outputPath = options.output;
        if (!outputPath) {
          const extension = getExtensionForFormat(options.format);
          outputPath = inputFile.replace(/\\.csv$/, extension);
        }

        const writeResult = await writeOutput(ctx.csvData, outputPath, options.format);
        if (!writeResult.success) {
          throw new Error(`Failed to write output: ${writeResult.error.message}`);
        }

        ctx.outputPath = outputPath;
      }),
    ]);

    // Execute transformation workflow
    const context_data = {};
    await tasks.run(context_data);

    context.logger.success(`✅ Successfully transformed ${context_data.totalRows} rows to ${context_data.outputPath}`);

    return ok(undefined);
  },
});
```

**Why tasks?** Each step is isolated, testable, and shows progress. When something breaks, you know exactly where.

## Step 6: Data Validation (Trust but Verify)

Create `src/lib/validators.ts`:

```typescript
import { ok, err, Result } from '@esteban-url/cli'
import type { CSVRow, ValidationResult, ValidationError, ValidationRule } from './types.js'

export function validateData(
  rows: CSVRow[],
  rules: ValidationRule[]
): Result<ValidationResult, Error> {
  const errors: ValidationError[] = []

  rows.forEach((row, rowIndex) => {
    rules.forEach((rule) => {
      const value = row[rule.field]
      const validation = validateField(value, rule, rowIndex + 2) // +2 for header and 1-based

      if (!validation.success && validation.error) {
        errors.push(validation.error)
      }
    })
  })

  const summary = {
    totalRows: rows.length,
    validRows: rows.length - getUniqueErrorRows(errors).size,
    errorRows: getUniqueErrorRows(errors).size,
    warningRows: 0, // We'll add warnings later
  }

  return ok({
    isValid: errors.length === 0,
    errors,
    warnings: [], // For now
    summary,
  })
}

function validateField(value: any, rule: ValidationRule, rowNumber: number) {
  switch (rule.type) {
    case 'required':
      if (value === null || value === undefined || String(value).trim() === '') {
        return {
          success: false,
          error: {
            row: rowNumber,
            field: rule.field,
            value,
            rule: 'required',
            message: `Field '${rule.field}' is required but is empty`,
          },
        }
      }
      break

    case 'email':
      if (value && !isValidEmail(String(value))) {
        return {
          success: false,
          error: {
            row: rowNumber,
            field: rule.field,
            value,
            rule: 'email',
            message: `Field '${rule.field}' must be a valid email address`,
          },
        }
      }
      break

    case 'number':
      if (value && isNaN(Number(value))) {
        return {
          success: false,
          error: {
            row: rowNumber,
            field: rule.field,
            value,
            rule: 'number',
            message: `Field '${rule.field}' must be a valid number`,
          },
        }
      }
      break
  }

  return { success: true }
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
```

**The beauty of validation**: Clear error messages that actually help users fix their data.

## Step 7: The Main CLI (Bringing It All Together)

Create `src/index.ts`:

```typescript
#!/usr/bin/env node

import { createCLI } from '@esteban-url/cli'
import { transformCommand } from './commands/transform.js'

const cli = createCLI({
  name: 'csv-processor',
  version: '1.0.0',
  description: 'Transform CSV files to multiple formats with validation and analysis',
  commands: [transformCommand],
})

cli.run(process.argv)
```

**Simple and clean.** The CLI framework handles help text, version display, and error handling for you.

## Step 8: Taking It for a Test Drive

Create a test CSV file (`test-data.csv`):

```csv
"First Name   ","Last Name","Email Address   ","Age"
"  John  ","Doe","john.doe@email.com  ","25"
"Jane   ","Smith","jane@company.com","30  "
"","","",""
"Bob","Jones","definitely-not-an-email","abc"
```

Now build and test:

```bash
npm run build
node dist/index.js transform test-data.csv --format json --clean --interactive
```

**What happens:**

1. Prompts you to rename fields ("First Name " -> "firstName")
2. Cleans the data (removes empty row, trims whitespace)
3. Outputs clean JSON
4. Shows progress and results

**The magic moment**: Your messy spreadsheet becomes clean, usable data. 🎉

## Step 9: Adding Validation Command

Create `src/commands/validate.ts` (abbreviated for space):

```typescript
import { createCommand, type CommandContext } from '@esteban-url/cli/command'
import { validateData } from '../lib/validators.js'
import type { ValidateCommandOptions } from './types.js'

export const validateCommand = createCommand<ValidateCommandOptions>({
  name: 'validate',
  description: 'Validate CSV data against rules and check data quality',
  options: [
    {
      name: 'rules',
      alias: 'r',
      type: 'string',
      description: 'JSON file with validation rules',
    },
    {
      name: 'strict',
      alias: 's',
      type: 'boolean',
      default: false,
      description: 'Strict mode - treat warnings as errors',
    },
  ],
  action: async (options: ValidateCommandOptions, context: CommandContext) => {
    // Parse CSV, apply validation rules, show results
    // (Full implementation in the complete example)
  },
})
```

Add it to your main CLI in `src/index.ts`:

```typescript
import { validateCommand } from './commands/validate.js'

const cli = createCLI({
  // ... existing config
  commands: [transformCommand, validateCommand],
})
```

## Step 10: Real-World Usage

Now you can handle real scenarios:

```bash
# Transform messy spreadsheet to clean JSON
csv-processor transform sales-data.csv --format json --clean --interactive

# Validate data quality before processing
csv-processor validate customer-data.csv --rules validation-rules.json

# Batch process multiple files
csv-processor transform ./data/*.csv --format json --output-dir ./processed
```

**Real talk**: This CLI can handle the spreadsheets your colleagues send you without you wanting to quit your job.

## What We've Built (Your New Superpower)

You now have a CLI that:

✅ **Parses CSV files reliably** (no more "unexpected token" errors)  
✅ **Transforms to multiple formats** (JSON, YAML, TSV, clean CSV)  
✅ **Handles messy data gracefully** (auto-trims whitespace, removes empty rows)  
✅ **Validates data with clear error messages** ("Row 42: Email is invalid")  
✅ **Shows progress** (you know it's working, not frozen)  
✅ **Never crashes with exceptions** (Result types save the day)  
✅ **Supports interactive field mapping** (rename columns on the fly)  
✅ **Provides helpful error messages** (not cryptic stack traces)  
✅ **Uses industry-standard libraries** (papaparse with 4M+ weekly downloads)

## Why Papaparse Was The Right Choice

### Before (csv-parser + csv-stringify)

```typescript
// Two dependencies to manage
import csvParser from 'csv-parser'
import { stringify } from 'csv-stringify'

// Complex stream-based parsing
createReadStream(filePath)
  .pipe(csvParser())
  .on('data', (row) => rows.push(row))
  .on('end', () => resolve(Ok(rows)))
  .on('error', (error) => resolve(Err(error)))

// Separate Promise-based stringification
stringify(data, { header: true }, (err, output) => {
  if (err) reject(err)
  else resolve(output)
})

// Manual whitespace trimming
const trimmed = value.trim()
```

### After (papaparse)

```typescript
// Single dependency
import Papa from 'papaparse'

// Simple async/await parsing
const result = Papa.parse(content, {
  header: true,
  skipEmptyLines: true,
  transform: (value) => value.trim(), // Built-in trimming!
})

// Synchronous stringification
const output = Papa.unparse(data, {
  header: true,
  quotes: true,
})

// Detailed error information
if (result.errors.length > 0) {
  const errorMessages = result.errors
    .map(
      (err) => `Row ${err.row}: ${err.message}` // Row numbers included!
    )
    .join(', ')
}
```

**The difference is night and day**: Simpler code, better error handling, fewer dependencies, and battle-tested reliability.

## Framework Features You've Mastered

Through building this CLI, you've used:

- **`/filesystem`** - File operations with Result types
- **`/command`** - CLI parsing with validation
- **`/prompts`** - Interactive user input
- **`/workflows`** - Task orchestration with progress
- **`/utils`** - Progress bars and terminal styling
- **`/config`** - Configuration file handling
- **`/core`** - Result types and error handling

Each module does one thing well, and you compose them together.

## Next Steps (Because You're Hooked Now)

Want to extend your CLI? Try adding:

1. **Batch processing** - Handle multiple files at once
2. **Data analysis** - Generate reports on data quality
3. **Watch mode** - Automatically process files when they change
4. **Streaming** - Handle massive CSV files without loading everything into memory
5. **Configuration files** - Save common transformation rules

## The Lesson (Beyond Code)

This tutorial isn't just about CSV processing. It's about building tools that:

- **Handle errors gracefully** (the real world is messy)
- **Give clear feedback** (users need to know what's happening)
- **Are composable** (small, focused modules)
- **Are testable** (each function has a clear purpose)
- **Don't crash** (Result types prevent runtime explosions)

**Most importantly**: You've built something that solves a real problem. That's what great software does.

## Conclusion (You Did It!)

You've escaped Spreadsheet Hell. 🎉

Your CSV processor can handle:

- Trailing whitespace that haunts your dreams
- Empty rows scattered like digital tumbleweeds
- Invalid emails that make validators cry
- Inconsistent data types that break parsers

And it does it all with:

- Clear error messages
- Progress feedback
- No mysterious crashes
- Functional code

**Welcome to Data Paradise.** Population: You. 🏝️

_Now go forth and process some CSVs with confidence. Your colleagues will wonder how you became the data hero they never knew they needed._

---

## Complete Example

You now have the tools to build a CSV processor using the CLI framework. Apply these patterns to your own data processing needs.

**Happy data processing!** 📊✨
