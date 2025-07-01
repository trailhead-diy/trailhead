# Validation Module API Reference

The validation module provides a powerful, composable validation pipeline system for input validation with detailed error reporting.

## Import

```typescript
import {
  createValidationPipeline,
  createRule,
  createAsyncRule,
} from "@trailhead/cli/core/validation";
import type {
  ValidationPipeline,
  ValidationRule,
  ValidationResult,
} from "@trailhead/cli/core/validation";
```

## Core Types

### ValidationRule

A single validation rule that checks a value and returns a result.

```typescript
interface ValidationRule<T> {
  name: string;
  validate: (value: T) => boolean | string;
  isAsync?: false;
}

interface AsyncValidationRule<T> {
  name: string;
  validate: (value: T) => Promise<boolean | string>;
  isAsync: true;
}
```

### ValidationResult

The result of running a validation pipeline.

```typescript
interface ValidationResult {
  success: boolean;
  errors: Array<{
    rule: string;
    message: string;
  }>;
  summary: ValidationSummary;
}

interface ValidationSummary {
  total: number; // Total rules executed
  passed: number; // Rules that passed
  failed: number; // Rules that failed
  skipped: number; // Rules that were skipped
}
```

## Creating Validation Rules

### Synchronous Rules

Use `createRule` for synchronous validation:

```typescript
const minLength = createRule(
  "minLength",
  (value: string) => value.length >= 3 || "Must be at least 3 characters long",
);

const maxLength = createRule(
  "maxLength",
  (value: string) => value.length <= 50 || "Must be at most 50 characters long",
);

const alphanumeric = createRule(
  "alphanumeric",
  (value: string) =>
    /^[a-zA-Z0-9]+$/.test(value) || "Must contain only letters and numbers",
);

const email = createRule(
  "email",
  (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || "Must be a valid email address",
);
```

### Asynchronous Rules

Use `createAsyncRule` for validation that requires I/O:

```typescript
const uniqueUsername = createAsyncRule("unique", async (username: string) => {
  const exists = await checkUsernameInDatabase(username);
  return !exists || "Username is already taken";
});

const dnsValid = createAsyncRule("dnsValid", async (domain: string) => {
  try {
    await dns.promises.resolve4(domain);
    return true;
  } catch {
    return "Domain does not have valid DNS records";
  }
});

const reachable = createAsyncRule("reachable", async (url: string) => {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok || `URL returned status ${response.status}`;
  } catch {
    return "URL is not reachable";
  }
});
```

## Creating Validation Pipelines

### Basic Pipeline

Combine multiple rules into a pipeline:

```typescript
const validateUsername = createValidationPipeline([
  createRule(
    "required",
    (value: string) => value.length > 0 || "Username is required",
  ),
  createRule(
    "minLength",
    (value: string) =>
      value.length >= 3 || "Username must be at least 3 characters",
  ),
  createRule(
    "maxLength",
    (value: string) =>
      value.length <= 20 || "Username must be at most 20 characters",
  ),
  createRule(
    "format",
    (value: string) =>
      /^[a-zA-Z0-9_]+$/.test(value) ||
      "Username can only contain letters, numbers, and underscores",
  ),
  createAsyncRule(
    "unique",
    async (value: string) =>
      !(await userExists(value)) || "Username already exists",
  ),
]);
```

### Running Validation

```typescript
const result = await validateUsername.validate("john_doe");

if (result.success) {
  console.log("Username is valid!");
} else {
  console.log("Validation failed:");
  result.errors.forEach((error) => {
    console.log(`- ${error.rule}: ${error.message}`);
  });
}
```

## Advanced Validation Patterns

### Conditional Validation

Create rules that only apply under certain conditions:

```typescript
function createConditionalRule<T>(
  condition: (value: T) => boolean,
  rule: ValidationRule<T> | AsyncValidationRule<T>,
): ValidationRule<T> | AsyncValidationRule<T> {
  if (rule.isAsync) {
    return createAsyncRule(`conditional_${rule.name}`, async (value: T) => {
      if (!condition(value)) return true;
      return rule.validate(value);
    });
  }

  return createRule(`conditional_${rule.name}`, (value: T) => {
    if (!condition(value)) return true;
    return rule.validate(value);
  });
}

// Example: Only validate URL if protocol is HTTP/HTTPS
const validateWebUrl = createConditionalRule(
  (url: string) => url.startsWith("http://") || url.startsWith("https://"),
  createAsyncRule("reachable", async (url: string) => {
    const response = await fetch(url);
    return response.ok || "URL is not reachable";
  }),
);
```

### Dependent Validation

Validate based on other values:

```typescript
interface PasswordForm {
  password: string;
  confirmPassword: string;
}

const validatePasswordForm = createValidationPipeline<PasswordForm>([
  createRule(
    "passwordRequired",
    (form) => form.password.length > 0 || "Password is required",
  ),
  createRule(
    "passwordStrength",
    (form) =>
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(form.password) ||
      "Password must be at least 8 characters with uppercase, lowercase, and numbers",
  ),
  createRule(
    "passwordsMatch",
    (form) =>
      form.password === form.confirmPassword || "Passwords do not match",
  ),
]);
```

### Nested Object Validation

Validate complex nested structures:

```typescript
interface UserProfile {
  personal: {
    firstName: string;
    lastName: string;
    email: string;
  };
  address: {
    street: string;
    city: string;
    zipCode: string;
    country: string;
  };
  preferences: {
    newsletter: boolean;
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
  };
}

// Create validators for each section
const validatePersonal = createValidationPipeline([
  createRule(
    "firstName",
    (p: UserProfile["personal"]) =>
      p.firstName.length > 0 || "First name is required",
  ),
  createRule(
    "lastName",
    (p: UserProfile["personal"]) =>
      p.lastName.length > 0 || "Last name is required",
  ),
  createRule(
    "email",
    (p: UserProfile["personal"]) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email) || "Invalid email address",
  ),
]);

const validateAddress = createValidationPipeline([
  createRule(
    "street",
    (a: UserProfile["address"]) =>
      a.street.length > 0 || "Street address is required",
  ),
  createRule(
    "zipCode",
    (a: UserProfile["address"]) =>
      /^\d{5}(-\d{4})?$/.test(a.zipCode) || "Invalid ZIP code",
  ),
  createRule(
    "country",
    (a: UserProfile["address"]) =>
      ["US", "CA", "UK"].includes(a.country) || "Country not supported",
  ),
]);

// Combine into main validator
const validateUserProfile = createValidationPipeline<UserProfile>([
  createAsyncRule("personal", async (profile) => {
    const result = await validatePersonal.validate(profile.personal);
    return result.success || `Personal info: ${result.errors[0].message}`;
  }),
  createAsyncRule("address", async (profile) => {
    const result = await validateAddress.validate(profile.address);
    return result.success || `Address: ${result.errors[0].message}`;
  }),
  createRule("notifications", (profile) => {
    const { email, sms, push } = profile.preferences.notifications;
    return (
      email || sms || push || "At least one notification method must be enabled"
    );
  }),
]);
```

### Array Validation

Validate arrays with specific rules:

```typescript
function createArrayValidator<T>(
  itemValidator: ValidationPipeline<T>,
  arrayRules?: ValidationRule<T[]>[],
): ValidationPipeline<T[]> {
  return createValidationPipeline([
    ...(arrayRules || []),
    createAsyncRule("items", async (items: T[]) => {
      const errors: string[] = [];

      for (let i = 0; i < items.length; i++) {
        const result = await itemValidator.validate(items[i]);
        if (!result.success) {
          errors.push(`Item ${i + 1}: ${result.errors[0].message}`);
        }
      }

      return errors.length === 0 || errors.join("; ");
    }),
  ]);
}

// Example: Validate array of email addresses
const validateEmail = createValidationPipeline([
  createRule(
    "format",
    (email: string) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || "Invalid email format",
  ),
]);

const validateEmailList = createArrayValidator(validateEmail, [
  createRule(
    "minItems",
    (emails: string[]) =>
      emails.length >= 1 || "At least one email is required",
  ),
  createRule(
    "maxItems",
    (emails: string[]) => emails.length <= 10 || "Maximum 10 emails allowed",
  ),
  createRule(
    "unique",
    (emails: string[]) =>
      new Set(emails).size === emails.length || "Duplicate emails not allowed",
  ),
]);
```

## Domain-Specific Validators

### URL Validation

```typescript
const validateUrl = createValidationPipeline([
  createRule("required", (url: string) => url.length > 0 || "URL is required"),
  createRule("format", (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return "Invalid URL format";
    }
  }),
  createRule("protocol", (url: string) => {
    const parsed = new URL(url);
    return (
      ["http:", "https:"].includes(parsed.protocol) ||
      "Only HTTP and HTTPS protocols are allowed"
    );
  }),
  createAsyncRule("reachable", async (url: string) => {
    try {
      const response = await fetch(url, {
        method: "HEAD",
        signal: AbortSignal.timeout(5000),
      });
      return response.ok || `URL returned status ${response.status}`;
    } catch (error) {
      return "URL is not reachable";
    }
  }),
]);
```

### File Path Validation

```typescript
const validateFilePath = createValidationPipeline([
  createRule(
    "required",
    (path: string) => path.length > 0 || "File path is required",
  ),
  createRule(
    "noTraversal",
    (path: string) => !path.includes("..") || "Path traversal not allowed",
  ),
  createRule(
    "validChars",
    (path: string) =>
      /^[a-zA-Z0-9._\-\/]+$/.test(path) || "Path contains invalid characters",
  ),
  createAsyncRule("exists", async (path: string) => {
    const result = await fs.exists(path);
    return (result.success && result.value) || "File does not exist";
  }),
  createAsyncRule("readable", async (path: string) => {
    const result = await fs.access(path, fs.constants.R_OK);
    return result.success || "File is not readable";
  }),
]);
```

### Port Number Validation

```typescript
const validatePort = createValidationPipeline([
  createRule(
    "type",
    (value: any) => typeof value === "number" || "Port must be a number",
  ),
  createRule(
    "integer",
    (value: number) => Number.isInteger(value) || "Port must be an integer",
  ),
  createRule(
    "range",
    (value: number) =>
      (value >= 1 && value <= 65535) || "Port must be between 1 and 65535",
  ),
  createRule(
    "notReserved",
    (value: number) =>
      value >= 1024 || "Ports below 1024 require root privileges",
  ),
  createAsyncRule("available", async (port: number) => {
    const isAvailable = await checkPortAvailable(port);
    return isAvailable || `Port ${port} is already in use`;
  }),
]);
```

## Custom Validation Builders

### Creating a Validation DSL

```typescript
class ValidationBuilder<T> {
  private rules: Array<ValidationRule<T> | AsyncValidationRule<T>> = [];

  required(message = "Value is required"): this {
    this.rules.push(
      createRule(
        "required",
        (value: any) =>
          (value !== null && value !== undefined && value !== "") || message,
      ),
    );
    return this;
  }

  min(minValue: number, message?: string): this {
    this.rules.push(
      createRule(
        "min",
        (value: any) =>
          value >= minValue || message || `Must be at least ${minValue}`,
      ),
    );
    return this;
  }

  max(maxValue: number, message?: string): this {
    this.rules.push(
      createRule(
        "max",
        (value: any) =>
          value <= maxValue || message || `Must be at most ${maxValue}`,
      ),
    );
    return this;
  }

  pattern(regex: RegExp, message?: string): this {
    this.rules.push(
      createRule(
        "pattern",
        (value: string) => regex.test(value) || message || "Invalid format",
      ),
    );
    return this;
  }

  custom(
    name: string,
    validator: (value: T) => boolean | string | Promise<boolean | string>,
  ): this {
    if (validator.constructor.name === "AsyncFunction") {
      this.rules.push(createAsyncRule(name, validator as any));
    } else {
      this.rules.push(createRule(name, validator as any));
    }
    return this;
  }

  build(): ValidationPipeline<T> {
    return createValidationPipeline(this.rules);
  }
}

// Usage
const validateAge = new ValidationBuilder<number>()
  .required()
  .min(0, "Age cannot be negative")
  .max(150, "Invalid age")
  .custom("reasonable", (age) => age <= 120 || "Please verify this age")
  .build();
```

## Integration with Commands

### Command Option Validation

```typescript
const deployCommand = createCommand({
  name: "deploy",
  description: "Deploy application",
  options: [
    {
      name: "environment",
      type: "string",
      required: true,
    },
    {
      name: "version",
      type: "string",
      required: true,
    },
  ],
  validate: async (options) => {
    // Validate environment
    const envValidator = createValidationPipeline([
      createRule(
        "validEnv",
        (env: string) =>
          ["dev", "staging", "prod"].includes(env) ||
          "Environment must be dev, staging, or prod",
      ),
    ]);

    const envResult = await envValidator.validate(options.environment);
    if (!envResult.success) {
      return err(
        createValidationError({
          field: "environment",
          message: envResult.errors[0].message,
        }),
      );
    }

    // Validate version
    const versionValidator = createValidationPipeline([
      createRule(
        "semver",
        (version: string) =>
          /^\d+\.\d+\.\d+$/.test(version) ||
          "Version must be in semver format (x.y.z)",
      ),
    ]);

    const versionResult = await versionValidator.validate(options.version);
    if (!versionResult.success) {
      return err(
        createValidationError({
          field: "version",
          message: versionResult.errors[0].message,
        }),
      );
    }

    return ok(options);
  },
  action: async (options, context) => {
    // Deploy logic
    return ok(undefined);
  },
});
```

### Form Validation

```typescript
interface RegistrationForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  age: number;
  agreeToTerms: boolean;
}

const validateRegistration = createValidationPipeline<RegistrationForm>([
  // Username validation
  createRule("username", (form) => {
    const username = form.username;
    if (username.length < 3) return "Username must be at least 3 characters";
    if (username.length > 20) return "Username must be at most 20 characters";
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return "Username can only contain letters, numbers, and underscores";
    }
    return true;
  }),

  // Email validation
  createRule(
    "email",
    (form) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) || "Invalid email address",
  ),

  // Password validation
  createRule("password", (form) => {
    const password = form.password;
    if (password.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(password))
      return "Password must contain an uppercase letter";
    if (!/[a-z]/.test(password))
      return "Password must contain a lowercase letter";
    if (!/[0-9]/.test(password)) return "Password must contain a number";
    return true;
  }),

  // Password confirmation
  createRule(
    "confirmPassword",
    (form) =>
      form.password === form.confirmPassword || "Passwords do not match",
  ),

  // Age validation
  createRule(
    "age",
    (form) => form.age >= 13 || "Must be at least 13 years old",
  ),

  // Terms agreement
  createRule(
    "terms",
    (form) => form.agreeToTerms || "You must agree to the terms",
  ),

  // Async username uniqueness check
  createAsyncRule("usernameUnique", async (form) => {
    const exists = await checkUsernameExists(form.username);
    return !exists || "Username is already taken";
  }),
]);
```

## Testing Validation

```typescript
import { describe, it, expect } from "vitest";

describe("Email Validation", () => {
  const validateEmail = createValidationPipeline([
    createRule(
      "format",
      (email: string) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || "Invalid email format",
    ),
  ]);

  it("should accept valid emails", async () => {
    const validEmails = [
      "user@example.com",
      "john.doe+tag@company.co.uk",
      "test_123@sub.domain.com",
    ];

    for (const email of validEmails) {
      const result = await validateEmail.validate(email);
      expect(result.success).toBe(true);
    }
  });

  it("should reject invalid emails", async () => {
    const invalidEmails = [
      "invalid",
      "@example.com",
      "user@",
      "user @example.com",
      "user@example",
    ];

    for (const email of invalidEmails) {
      const result = await validateEmail.validate(email);
      expect(result.success).toBe(false);
      expect(result.errors[0].message).toBe("Invalid email format");
    }
  });
});

describe("Async Validation", () => {
  it("should validate uniqueness", async () => {
    const existingUsers = ["alice", "bob", "charlie"];

    const validateUsername = createValidationPipeline([
      createAsyncRule("unique", async (username: string) => {
        // Simulate database check
        await new Promise((resolve) => setTimeout(resolve, 10));
        return !existingUsers.includes(username) || "Username already exists";
      }),
    ]);

    const newUserResult = await validateUsername.validate("david");
    expect(newUserResult.success).toBe(true);

    const existingUserResult = await validateUsername.validate("alice");
    expect(existingUserResult.success).toBe(false);
    expect(existingUserResult.errors[0].message).toBe(
      "Username already exists",
    );
  });
});
```

## Performance Considerations

### Short-Circuit Evaluation

Stop validation on first error:

```typescript
class ShortCircuitPipeline<T> implements ValidationPipeline<T> {
  constructor(
    private rules: Array<ValidationRule<T> | AsyncValidationRule<T>>,
  ) {}

  async validate(value: T): Promise<ValidationResult> {
    const errors: Array<{ rule: string; message: string }> = [];

    for (const rule of this.rules) {
      const result = rule.isAsync
        ? await rule.validate(value)
        : rule.validate(value);

      if (result !== true) {
        errors.push({ rule: rule.name, message: result });
        // Stop on first error
        return {
          success: false,
          errors,
          summary: {
            total: this.rules.length,
            passed: this.rules.indexOf(rule),
            failed: 1,
            skipped: this.rules.length - this.rules.indexOf(rule) - 1,
          },
        };
      }
    }

    return {
      success: true,
      errors: [],
      summary: {
        total: this.rules.length,
        passed: this.rules.length,
        failed: 0,
        skipped: 0,
      },
    };
  }
}
```

### Parallel Async Validation

Run independent async validations in parallel:

```typescript
async function validateParallel<T>(
  value: T,
  rules: Array<AsyncValidationRule<T>>,
): Promise<ValidationResult> {
  const results = await Promise.all(
    rules.map(async (rule) => ({
      rule: rule.name,
      result: await rule.validate(value),
    })),
  );

  const errors = results
    .filter((r) => r.result !== true)
    .map((r) => ({ rule: r.rule, message: r.result as string }));

  return {
    success: errors.length === 0,
    errors,
    summary: {
      total: rules.length,
      passed: rules.length - errors.length,
      failed: errors.length,
      skipped: 0,
    },
  };
}
```

## Summary

The validation module provides:

- **Composable Rules** - Build complex validators from simple rules
- **Async Support** - Handle I/O-based validation seamlessly
- **Detailed Errors** - Rich error information for user feedback
- **Type Safety** - Full TypeScript support and inference
- **Flexibility** - Works with any data type and structure
- **Testing** - Easy to test validation logic in isolation
