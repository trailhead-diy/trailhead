# Package README Template

> Guidelines for writing consistent, high-quality README files for Trailhead packages

This template provides a standardized structure and best practices for creating README files for individual packages within the Trailhead monorepo.

## Template Structure

### 1. **Header Section**

```markdown
# @esteban-url/package-name

> One-line description focusing on user value proposition

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-blue.svg)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-18.0+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](../../LICENSE)

Brief paragraph (2-3 sentences) explaining what the package does, what problems it solves, and key differentiators.
```

**Guidelines:**

- Use package's actual namespace (`@esteban-url/`)
- Tagline should be benefit-focused, not feature-focused
- Include relevant technology badges (TypeScript, React, Node, etc.)
- Opening paragraph should answer "Why should I use this?"

### 2. **Why Choose This Package?**

```markdown
## Why Choose @esteban-url/package-name?

### 🎯 **Key Benefit 1**

Brief explanation of primary value proposition.

### 🧪 **Key Benefit 2**

Brief explanation of secondary value proposition.

### ⚡ **Key Benefit 3**

Brief explanation of third value proposition.

### 🔧 **Key Benefit 4**

Brief explanation of architectural advantage.
```

**Guidelines:**

- Use emoji icons for visual appeal and scannability
- Focus on user benefits, not technical features
- Keep explanations to 1-2 sentences maximum
- Highlight what makes this package unique vs alternatives

### 3. **Quick Start Section**

````markdown
## Quick Start

### Installation

```bash
# For monorepo development
pnpm add @esteban-url/package-name --workspace

# For external projects (GitHub Packages)
pnpm add @esteban-url/package-name
```
````

### Basic Example in 30 Seconds

```typescript
// Immediately runnable example
import { mainFunction } from '@esteban-url/package-name';

const result = await mainFunction({
  // Realistic configuration
});

// Show expected outcome
console.log(result); // Expected output
```

````

**Guidelines:**
- Provide both monorepo and external installation methods
- Example should be immediately runnable
- Use realistic, not toy examples
- Show expected output when helpful
- Keep to under 15 lines of code

### 4. **Core Concepts Section**
```markdown
## Core Concepts

### Primary Concept

```typescript
// Code example demonstrating the concept
````

Brief explanation of why this concept matters and how it benefits users.

### Secondary Concept

```typescript
// Code example demonstrating the concept
```

Brief explanation connecting to user value.

````

**Guidelines:**
- Focus on concepts that differentiate this package
- Use code examples to illustrate concepts
- Connect each concept back to user benefits
- Avoid implementation details - focus on "what" and "why"

### 5. **API Reference Section**
```markdown
## API Reference

### Primary Module

Brief description of what this module provides.

```typescript
import { function1, function2 } from '@esteban-url/package-name/module';

// Usage examples with brief explanations
````

### Secondary Module

Brief description and usage examples.

````

**Guidelines:**
- Organize by logical modules or subpath exports
- Show imports exactly as users would write them
- Include brief usage examples for each major function
- Link to detailed docs if they exist

### 6. **Advanced Features Section** (if applicable)
```markdown
## Advanced Features

### Feature Name

Description of advanced capability.

```typescript
// Practical example showing the feature
````

### Another Feature

Description and example.

````

**Guidelines:**
- Only include if package has genuinely advanced features
- Focus on practical use cases
- Show realistic examples, not toy demos

### 7. **Development Section**
```markdown
## Development

```bash
# Build the package
pnpm build

# Run tests
pnpm test

# Watch mode for development
pnpm test:watch

# Type checking
pnpm types

# Linting
pnpm lint

# Package-specific commands (if any)
pnpm command-name
````

````

**Guidelines:**
- Use exact commands from package.json
- Include all relevant development commands
- Group related commands together

### 8. **Examples Section** (if applicable)
```markdown
## Examples

Check out the [examples directory](./examples/) for complete applications:

- **[Example 1](./examples/example1/)** - Brief description
- **[Example 2](./examples/example2/)** - Brief description
````

**Guidelines:**

- Only include if examples directory exists
- Use descriptive names that indicate the use case
- Keep descriptions brief but informative

### 9. **Footer Section**

```markdown
## License

MIT - see [LICENSE](../../LICENSE) for details.
```

**Guidelines:**

- Always link to the root LICENSE file
- Keep footer minimal and consistent

## Writing Guidelines

### **Content Principles**

1. **User-First**: Start with problems solved, not technical features
2. **Progressive Disclosure**: Basic → intermediate → advanced information
3. **Scannable**: Use headers, bullets, and code blocks for easy skimming
4. **Action-Oriented**: Clear next steps at every section
5. **Accurate**: All code examples must be tested and working

### **Code Examples Standards**

1. **Immediately Runnable**: Examples should work without modification
2. **Realistic**: Use real-world scenarios, not toy examples
3. **Syntax Highlighted**: Use proper language tags (`typescript, `bash)
4. **Consistent Imports**: Show exact import paths users will need
5. **Expected Output**: Show results when helpful for understanding

### **Language Style**

1. **Concise**: 1-2 sentences per concept explanation
2. **Active Voice**: "This package provides..." not "This package can be used to provide..."
3. **Present Tense**: "The function returns..." not "The function will return..."
4. **Positive Framing**: Focus on capabilities, not limitations
5. **Technical Accuracy**: Use precise terminology

### **Visual Formatting**

1. **Consistent Headers**: Use ## for main sections, ### for subsections
2. **Code Blocks**: Always specify language for syntax highlighting
3. **Emphasis**: Use **bold** for important terms, _italics_ sparingly
4. **Lists**: Use bullet points for features, numbered lists for steps
5. **Badges**: Include relevant technology badges in header

### **Package-Specific Considerations**

#### **For CLI Packages**

- Include command examples with expected output
- Show both programmatic and CLI usage
- Highlight testing utilities and mocking capabilities
- Emphasize functional programming and Result types

#### **For UI Packages**

- Include visual examples when possible
- Show component composition patterns
- Highlight theming and customization options
- Include framework integration guides

#### **For Library Packages**

- Focus on integration patterns
- Show error handling approaches
- Include performance considerations
- Highlight functional programming benefits

#### **For Utility Packages**

- Show practical use cases
- Include comparison with alternatives
- Highlight performance benefits
- Show integration with other Trailhead packages

## Quality Checklist

Before publishing a package README, verify:

- [ ] **Value Proposition**: Clear within first 30 seconds of reading
- [ ] **Quick Start**: Example works without modification
- [ ] **Code Accuracy**: All examples tested and current
- [ ] **Installation**: Correct commands for both monorepo and external use
- [ ] **API Coverage**: All major functions and modules documented
- [ ] **Links**: All internal links work and point to correct locations
- [ ] **Consistency**: Follows monorepo conventions and style
- [ ] **Badges**: Accurate and up-to-date technology badges
- [ ] **Grammar**: Proofread for clarity and correctness
- [ ] **Scannability**: Easy to skim and find relevant information

## Examples of Quality READMEs

- **[@esteban-url/cli](./packages/cli/README.md)** - Functional CLI framework
- **[@esteban-url/web-ui](./packages/web-ui/README.md)** - Enhanced UI components

These examples demonstrate the template in action and can serve as reference implementations.
