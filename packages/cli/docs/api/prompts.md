# Prompts Module API

The prompts module provides interactive user input functionality through a re-export of [@inquirer/prompts](https://github.com/SBoudrias/Inquirer.js/tree/master/packages/prompts).

## Import

```typescript
import { prompt, select, confirm, multiselect } from "@trailhead/cli/prompts";
```

## Core Functions

### prompt (alias for input)

Get text input from the user.

```typescript
const name = await prompt({
  message: "What is your name?",
  default: "Anonymous",
  validate: (value) => {
    if (value.length < 2) {
      return "Name must be at least 2 characters";
    }
    return true;
  },
});
```

#### Options

- `message` (string, required) - The question to ask
- `default` (string) - Default value if user presses enter
- `validate` (function) - Validation function, returns true or error message
- `transformer` (function) - Transform display value
- `theme` (object) - Custom theme configuration

### select

Choose from a list of options.

```typescript
const color = await select({
  message: "Pick your favorite color",
  choices: [
    { value: "red", name: "Red" },
    { value: "blue", name: "Blue" },
    { value: "green", name: "Green", disabled: true },
  ],
  default: "blue",
});
```

#### Options

- `message` (string, required) - The question to ask
- `choices` (array, required) - Array of choices
- `default` (any) - Default selected value
- `pageSize` (number) - Number of choices to show at once
- `loop` (boolean) - Enable list loop (default: true)

### confirm

Ask a yes/no question.

```typescript
const shouldContinue = await confirm({
  message: "Do you want to continue?",
  default: true,
});

if (shouldContinue) {
  // User confirmed
}
```

#### Options

- `message` (string, required) - The question to ask
- `default` (boolean) - Default value (true/false)
- `transformer` (function) - Transform display value

### multiselect (alias for checkbox)

Select multiple options from a list.

```typescript
const features = await multiselect({
  message: "Select features to enable",
  choices: [
    { value: "ts", name: "TypeScript", checked: true },
    { value: "eslint", name: "ESLint" },
    { value: "prettier", name: "Prettier" },
    { value: "testing", name: "Testing", disabled: "Coming soon" },
  ],
  required: true,
  validate: (answer) => {
    if (answer.length < 1) {
      return "You must choose at least one feature.";
    }
    return true;
  },
});
```

#### Options

- `message` (string, required) - The question to ask
- `choices` (array, required) - Array of choices with optional `checked` property
- `required` (boolean) - At least one selection required
- `validate` (function) - Custom validation
- `pageSize` (number) - Number of choices to show
- `loop` (boolean) - Enable list loop

### password

Secure password input (masked).

```typescript
const secret = await password({
  message: "Enter your password",
  mask: "*",
  validate: (value) => {
    if (value.length < 8) {
      return "Password must be at least 8 characters";
    }
    return true;
  },
});
```

#### Options

- `message` (string, required) - The question to ask
- `mask` (string/boolean) - Character to mask input with
- `validate` (function) - Validation function

### editor

Open text editor for multi-line input.

```typescript
const description = await editor({
  message: "Write a description",
  default: "# Project Description\n\nDescribe your project here...",
  waitForUseInput: false,
});
```

#### Options

- `message` (string, required) - The question to ask
- `default` (string) - Default content in editor
- `postfix` (string) - File extension for syntax highlighting (default: '.txt')
- `waitForUseInput` (boolean) - Wait for user to save and close

### expand

Expand prompt with shortcuts.

```typescript
const action = await expand({
  message: "Conflict on file.js",
  default: "h",
  choices: [
    { key: "y", name: "Overwrite", value: "overwrite" },
    { key: "a", name: "Overwrite all", value: "overwrite_all" },
    { key: "d", name: "Show diff", value: "diff" },
    { key: "h", name: "Help", value: "help" },
  ],
});
```

#### Options

- `message` (string, required) - The question to ask
- `choices` (array, required) - Array with `key` property for shortcuts
- `default` (string) - Default key selection

### rawlist

Numbered list selection.

```typescript
const priority = await rawlist({
  message: "Task priority?",
  choices: [
    { value: "high", name: "High" },
    { value: "medium", name: "Medium" },
    { value: "low", name: "Low" },
  ],
});
```

#### Options

- `message` (string, required) - The question to ask
- `choices` (array, required) - Array of choices
- `default` (number) - Default selection index

### search

Search through a list of options.

```typescript
const country = await search({
  message: "Select a country",
  source: async (input) => {
    if (!input) return [];

    // Fetch or filter countries based on input
    const countries = await fetchCountries();
    return countries
      .filter((c) => c.toLowerCase().includes(input.toLowerCase()))
      .map((c) => ({ value: c, name: c }));
  },
});
```

#### Options

- `message` (string, required) - The question to ask
- `source` (async function, required) - Function that returns choices based on input
- `pageSize` (number) - Number of results to show
- `validate` (function) - Validate the selection

## Types

### PromptChoice\<T\>

```typescript
type PromptChoice<T = string> = {
  name?: string; // Display name
  value: T; // Actual value
  short?: string; // Short display after selection
  disabled?: boolean | string; // Disable with optional reason
};
```

### PromptOptions

```typescript
type PromptOptions = {
  message: string;
  default?: any;
  validate?: (input: any) => boolean | string | Promise<boolean | string>;
  filter?: (input: any) => any;
  transformer?: (input: any, answers: any, flags: any) => any;
  when?: boolean | ((answers: any) => boolean | Promise<boolean>);
};
```

## Usage Patterns

### With Result Types

```typescript
import { prompt } from "@trailhead/cli/prompts";
import { ok, err } from "@trailhead/cli/core";

async function getUsername(context: CommandContext): Promise<Result<string>> {
  try {
    const username = await prompt({
      message: "Enter username",
      validate: (value) => {
        if (!value) return "Username is required";
        if (value.length < 3) return "Username must be at least 3 characters";
        return true;
      },
    });
    return ok(username);
  } catch (error) {
    // User cancelled (Ctrl+C)
    return err(new Error("User cancelled input"));
  }
}
```

### Conditional Prompts

```typescript
const answers = {
  type: await select({
    message: "Project type?",
    choices: ["web", "cli", "library"],
  }),
};

if (answers.type === "web") {
  answers.framework = await select({
    message: "Web framework?",
    choices: ["react", "vue", "angular"],
  });
}

if (answers.type === "cli") {
  answers.useTypescript = await confirm({
    message: "Use TypeScript?",
    default: true,
  });
}
```

### Complex Validation

```typescript
const email = await prompt({
  message: "Enter your email",
  validate: async (input) => {
    // Basic format check
    if (!input.includes("@")) {
      return "Please enter a valid email";
    }

    // Async validation (e.g., check if exists)
    const exists = await checkEmailExists(input);
    if (exists) {
      return "Email already registered";
    }

    return true;
  },
});
```

### Dynamic Choices

```typescript
const project = await select({
  message: "Select project",
  choices: async () => {
    const projects = await loadProjects();
    return projects.map((p) => ({
      value: p.id,
      name: `${p.name} (${p.version})`,
    }));
  },
});
```

### Multi-Step Forms

```typescript
async function collectProjectInfo() {
  const info: ProjectInfo = {};

  // Step 1: Basic info
  info.name = await prompt({
    message: "Project name",
    validate: validateProjectName,
  });

  info.description = await prompt({
    message: "Project description",
    default: `${info.name} project`,
  });

  // Step 2: Configuration
  info.features = await multiselect({
    message: "Select features",
    choices: getFeatureChoices(info.type),
  });

  // Step 3: Confirmation
  const confirmed = await confirm({
    message: `Create project "${info.name}"?`,
    default: true,
  });

  if (!confirmed) {
    throw new Error("User cancelled");
  }

  return info;
}
```

### Custom Themes

```typescript
import { createPrompt, useKeypress, useState } from "@inquirer/core";

// Create custom prompt
const customPrompt = createPrompt<string>((config, done) => {
  const [value, setValue] = useState("");

  useKeypress((key) => {
    // Handle keypresses
    if (key.name === "return") {
      done(value);
    }
  });

  // Return prompt UI
  return `${config.message} ${value}`;
});
```

## Error Handling

### User Cancellation

```typescript
try {
  const answer = await prompt({ message: "Name?" });
} catch (error) {
  if (error.message === "User force closed the prompt") {
    // Handle Ctrl+C
    console.log("\\nOperation cancelled");
    process.exit(0);
  }
  throw error;
}
```

### Validation Errors

```typescript
const age = await prompt({
  message: "Enter your age",
  validate: (value) => {
    const num = parseInt(value, 10);
    if (isNaN(num)) {
      return "Please enter a number";
    }
    if (num < 0 || num > 150) {
      return "Please enter a valid age";
    }
    return true;
  },
  filter: (value) => parseInt(value, 10),
});
```

## Best Practices

### 1. Always Handle Cancellation

```typescript
async function interactiveCommand(options, context) {
  try {
    const answer = await prompt({ message: "Continue?" });
    // Process answer
  } catch (error) {
    context.logger.warning("Operation cancelled");
    return err(new Error("User cancelled"));
  }
}
```

### 2. Provide Clear Validation Messages

```typescript
validate: (input) => {
  if (!input) return "This field is required";
  if (input.length < 3) return "Minimum 3 characters required";
  if (input.length > 50) return "Maximum 50 characters allowed";
  if (!/^[a-zA-Z0-9-]+$/.test(input)) {
    return "Only letters, numbers, and hyphens allowed";
  }
  return true;
};
```

### 3. Use Default Values

```typescript
const config = await prompt({
  message: "Config file path",
  default: "./config.json",
  validate: validatePath,
});
```

### 4. Group Related Prompts

```typescript
async function collectDatabaseConfig() {
  const config = {
    host: await prompt({
      message: "Database host",
      default: "localhost",
    }),
    port: await prompt({
      message: "Database port",
      default: "5432",
      filter: Number,
    }),
    username: await prompt({
      message: "Database username",
      default: "admin",
    }),
    password: await password({
      message: "Database password",
      mask: "*",
    }),
  };

  return config;
}
```

## Integration with Commands

```typescript
const initCommand = createCommand({
  name: "init",
  description: "Initialize a new project",
  options: [
    { name: "name", type: "string" },
    { name: "interactive", alias: "i", type: "boolean", default: true },
  ],
  action: async (options, context) => {
    let projectName = options.name;

    if (!projectName && options.interactive) {
      projectName = await prompt({
        message: "Project name",
        validate: validateProjectName,
      });
    }

    if (!projectName) {
      return err(new Error("Project name is required"));
    }

    // Continue with initialization
    return initializeProject(projectName, context);
  },
});
```

## Summary

The prompts module provides:

- Rich interactive prompts for CLI applications
- Multiple prompt types for different use cases
- Built-in validation and transformation
- Async support for dynamic content
- Full TypeScript support
- Integration with the Result pattern

Use prompts to create engaging, user-friendly CLI experiences.
