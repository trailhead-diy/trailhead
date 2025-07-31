---
type: reference
title: 'Documentation Standards - Diátaxis Framework'
description: 'Complete specification of documentation standards and Diátaxis framework implementation for Trailhead'
related:
  - /docs/reference/templates/
  - /docs/reference/review-checklist.md
  - /docs/README.md
---

# Documentation Standards - Diátaxis Framework

This guide establishes documentation standards for the Trailhead monorepo using the [Diátaxis framework](https://diataxis.fr/). All documentation must follow these principles to ensure clarity, discoverability, and usefulness.

## Overview

Diátaxis organizes documentation into four distinct quadrants based on user needs:

```
       LEARNING                           WORKING
         ↑                                  ↑
         |                                  |
    TUTORIALS ←――――――――――――――――――→ HOW-TO GUIDES
         |                                  |
         |        practical                 |
         |                                  |
         |        theoretical               |
         |                                  |
   EXPLANATION ←――――――――――――――――→ REFERENCE
         |                                  |
         ↓                                  ↓
    UNDERSTANDING                      INFORMATION
```

## The Four Quadrants

### 1. Tutorials (Learning-Oriented)

**Purpose**: Help newcomers learn by doing.

**Characteristics**:

- Complete, end-to-end projects
- Step-by-step instructions
- Expected outcomes at each step
- No options or alternatives (one clear path)
- Concrete, not abstract

**Good Tutorial Title Examples**:

- ✅ "Build Your First CLI Application"
- ✅ "Create a Theme Switcher Component"
- ❌ "Understanding CLI Architecture" (this is explanation)
- ❌ "CLI Command Reference" (this is reference)

**Key Rules**:

- Start with minimal prerequisites
- Provide working code at each step
- Focus on doing, not explaining why
- Ensure reproducible results
- End with a working product

### 2. How-To Guides (Task-Oriented)

**Purpose**: Help users accomplish specific tasks.

**Characteristics**:

- Assume basic knowledge
- Focus on the goal, not the journey
- Provide multiple approaches when relevant
- Address common variations
- Practical, not theoretical

**Good How-To Title Examples**:

- ✅ "How to Add Custom Validation Rules"
- ✅ "How to Integrate with GitHub Actions"
- ❌ "Validation System Overview" (this is explanation)
- ❌ "Getting Started with Validation" (this is tutorial)

**Key Rules**:

- State prerequisites clearly
- Focus on results, not understanding
- Include common edge cases
- Link to relevant reference docs
- Keep explanations minimal

### 3. Reference (Information-Oriented)

**Purpose**: Provide technical descriptions and specifications.

**Characteristics**:

- Comprehensive and accurate
- Consistent structure
- No instructions or tutorials
- Dry, factual tone
- Machine-readable when possible

**Good Reference Title Examples**:

- ✅ "API Reference - FileSystem Module"
- ✅ "Component Props Reference"
- ❌ "Working with the FileSystem" (this is how-to)
- ❌ "Understanding FileSystem Design" (this is explanation)

**Key Rules**:

- Use consistent formatting
- Include all parameters/options
- Provide type information
- Show function signatures
- Include brief examples

### 4. Explanation (Understanding-Oriented)

**Purpose**: Illuminate and discuss topics for deeper understanding.

**Characteristics**:

- Conceptual and theoretical
- Provides context and background
- Discusses design decisions
- Explores alternatives
- Can be discursive

**Good Explanation Title Examples**:

- ✅ "Architecture Overview"
- ✅ "Why We Use Result Types"
- ❌ "How to Handle Errors" (this is how-to)
- ❌ "Error Handling Tutorial" (this is tutorial)

**Key Rules**:

- Focus on concepts, not tasks
- Provide historical context
- Discuss trade-offs
- Link to related topics
- Use diagrams and examples

## Content Categorization Decision Tree

When creating new documentation, ask these questions in order:

1. **Is the user learning something for the first time?**
   - YES → Tutorial
   - NO → Continue to 2

2. **Is the user trying to solve a specific problem?**
   - YES → How-To Guide
   - NO → Continue to 3

3. **Is the user looking up specific information?**
   - YES → Reference
   - NO → Explanation

## Common Pitfalls and How to Avoid Them

### 1. Mixed Content Types

❌ **Bad**: A "Getting Started" page that includes tutorials, reference material, and explanations.

✅ **Good**: Separate pages:

- Tutorial: "Build Your First App"
- Reference: "Configuration Options"
- Explanation: "Architecture Overview"

### 2. Explanations in How-To Guides

❌ **Bad**: "To understand why we use Result types, let's explore functional error handling..."

✅ **Good**: "Use Result types for error handling. [Learn why we use Result types →]"

### 3. Instructions in Reference

❌ **Bad**: "To use this function, first install the package..."

✅ **Good**: "**Installation**: See [Installation Guide]. **Function Signature**: `function(args): Result`"

### 4. Options in Tutorials

❌ **Bad**: "You can use either TypeScript or JavaScript for this tutorial..."

✅ **Good**: Pick one approach and stick to it. Create separate tutorials if needed.

## Frontmatter Requirements

All documentation files must include frontmatter:

```yaml
---
type: tutorial | how-to | reference | explanation
title: Clear, Descriptive Title
description: One-line summary for search and navigation
prerequisites:
  - Basic TypeScript knowledge # Optional, mainly for tutorials/how-tos
  - Node.js 18+ installed
related:
  - /docs/reference/api/core # Links to related documentation
  - /docs/how-to/error-handling
---
```

## File Organization

```
docs/
├── tutorials/
│   ├── getting-started/
│   │   ├── first-cli-app.md
│   │   └── first-ui-component.md
│   └── advanced/
│       └── plugin-development.md
├── how-to/
│   ├── cli/
│   │   ├── add-commands.md
│   │   └── custom-validation.md
│   └── ui/
│       ├── create-themes.md
│       └── integrate-frameworks.md
├── reference/
│   ├── api/
│   │   ├── cli/
│   │   └── ui/
│   └── configuration/
│       ├── cli-config.md
│       └── ui-config.md
└── explanation/
    ├── architecture/
    │   ├── monorepo-structure.md
    │   └── package-design.md
    └── concepts/
        ├── functional-programming.md
        └── result-types.md
```

## Writing Style Guidelines

### General Rules

1. **User-focused**: Write from the user's perspective, not the system's
2. **Active voice**: "Configure the CLI" not "The CLI can be configured"
3. **Present tense**: "This function returns" not "This function will return"
4. **Clarity over cleverness**: Simple, direct language

### Per Quadrant

**Tutorials**:

- Encouraging, supportive tone
- "We will build..." / "You will create..."
- Acknowledge the learning process

**How-To Guides**:

- Direct, efficient tone
- Imperative mood: "Run this command"
- Assume competence

**Reference**:

- Neutral, technical tone
- Consistent terminology
- Precise and complete

**Explanation**:

- Conversational but professional
- "Let's explore..." / "Consider..."
- Connect ideas

## Quality Checklist

Before submitting documentation:

- [ ] Frontmatter includes correct `type`
- [ ] Content matches the declared type
- [ ] Prerequisites are clearly stated
- [ ] Related links are provided
- [ ] Examples compile and run
- [ ] No mixed content types
- [ ] Follows style guidelines
- [ ] Reviewed for technical accuracy

## Examples from Trailhead

### Good Tutorial Example

```markdown
---
type: tutorial
title: Build Your First CLI Application
description: Create a working CLI tool in 15 minutes
prerequisites:
  - Node.js 18+ installed
  - Basic JavaScript knowledge
related:
  - /docs/reference/api/cli
  - /docs/how-to/cli/add-commands
---

# Build Your First CLI Application

In this tutorial, you'll build a simple greeting CLI application...
```

### Good How-To Example

```markdown
---
type: how-to
title: How to Add Custom Validation Rules
description: Add custom validation logic to your CLI commands
prerequisites:
  - @esteban-url/cli installed
  - Familiarity with Result types
related:
  - /docs/reference/api/validation
  - /docs/explanation/validation-design
---

# How to Add Custom Validation Rules

To add custom validation to your CLI commands...
```

## File Scope and Exclusions

### Files Subject to Diátaxis Standards

- All `.md` files in `/docs/` directories
- All `.md` files in `packages/*/docs/` directories
- User-facing technical documentation

### Files Exempt from Diátaxis Standards

- `README.md` - Project/package entry points with mixed content
- `CONTRIBUTING.md` - Process documentation for contributors
- `CHANGELOG.md` - Version history logs
- `CLAUDE.md` - AI assistant instructions
- `LICENSE.md` - Legal documents
- `SECURITY.md` - Security policy documentation
- `CODE_OF_CONDUCT.md` - Community guidelines

**Rationale**: These files serve specific ecosystem roles requiring mixed content or non-technical formats that don't fit Diátaxis categories.

## Enforcement

Documentation standards are enforced through:

1. **Automated Checks**: Vale and markdownlint validate style and structure
2. **CI Integration**: PRs fail if documentation doesn't meet standards
3. **Review Process**: Documentation changes require explicit review
4. **Coverage Reports**: Track documentation completeness per package

## Getting Help

- Use `pnpm docs:new` to create documentation from templates
- Run `pnpm docs:validate` to check your documentation
- See [Writing Guide](./writing-guide.md) for quick reference
- Ask in #documentation channel for guidance

Remember: Good documentation serves the user's needs, not the system's structure.
