---
type: reference
title: # Descriptive title (e.g., "FileSystem API Reference")
description: # One-line summary of what this reference covers
related:
  # Links to related reference docs
  # - /docs/reference/api/core
  # - /docs/reference/config/options
---

# Title

<!-- Brief description of what this reference documents -->

[Concise description of the API/component/configuration being documented]

## Overview

<!-- High-level summary and key information -->

| Property    | Value                           |
| ----------- | ------------------------------- |
| **Package** | `@trailhead/[package]`          |
| **Module**  | `@trailhead/[package]/[module]` |
| **Since**   | `v1.0.0`                        |

## Import

```typescript
import { [exports] } from '@trailhead/[package]/[module]';
```

## Functions

### `functionName()`

<!-- Each function/method gets its own section -->

```typescript
function functionName(param1: Type1, param2: Type2): ReturnType;
```

[Brief description of what the function does]

#### Parameters

| Parameter | Type    | Required | Description                      |
| --------- | ------- | -------- | -------------------------------- |
| `param1`  | `Type1` | Yes      | [Description]                    |
| `param2`  | `Type2` | No       | [Description] (default: `value`) |

#### Returns

| Type         | Description                   |
| ------------ | ----------------------------- |
| `ReturnType` | [Description of return value] |

#### Example

```typescript
const result = functionName("value1", "value2");
```

#### Throws

- **`ErrorType`**: [When this error occurs]

---

### `anotherFunction()`

[Continue with other functions...]

## Types

### `TypeName`

```typescript
interface TypeName {
  property1: string;
  property2?: number;
  property3: "option1" | "option2";
}
```

| Property    | Type                     | Required | Description   |
| ----------- | ------------------------ | -------- | ------------- |
| `property1` | `string`                 | Yes      | [Description] |
| `property2` | `number`                 | No       | [Description] |
| `property3` | `'option1' \| 'option2'` | Yes      | [Description] |

#### Example

```typescript
const example: TypeName = {
  property1: "value",
  property3: "option1",
};
```

## Constants

### `CONSTANT_NAME`

```typescript
const CONSTANT_NAME: Type = value;
```

[Description of the constant and its purpose]

## Configuration

<!-- For configuration references -->

### Options

| Option    | Type      | Default     | Description   |
| --------- | --------- | ----------- | ------------- |
| `option1` | `string`  | `'default'` | [Description] |
| `option2` | `boolean` | `false`     | [Description] |

### Example Configuration

```typescript
const config = {
  option1: "custom-value",
  option2: true,
};
```

## Error Codes

<!-- For error/status code references -->

| Code           | Description             | Resolution   |
| -------------- | ----------------------- | ------------ |
| `ERROR_CODE_1` | [What this error means] | [How to fix] |
| `ERROR_CODE_2` | [What this error means] | [How to fix] |

## Examples

### Basic Usage

```typescript
// Simple example
```

### Advanced Usage

```typescript
// More complex example
```

### With Error Handling

```typescript
// Example showing error handling
```

## Related

- **Types**: [Link to related type definitions]
- **Functions**: [Link to related functions]
- **Configuration**: [Link to configuration options]

## See Also

- [Link to how-to guides using this API]
- [Link to tutorials featuring this API]
- [Link to explanation of concepts]
