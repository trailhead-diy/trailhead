---
type: reference
title: 'Writing Documentation - Quick Reference'
description: 'Quick reference guide for writing Diátaxis-compliant documentation in Trailhead'
related:
  - /docs/reference/templates/
  - /docs/reference/review-checklist.md
---

# Writing Documentation - Quick Reference

Quick reference for writing documentation that follows Diátaxis principles in the Trailhead monorepo.

## Before You Start

### 1. Choose Your Type

Ask yourself: **What is the user trying to do?**

| User Intent                               | Type            | Template                                                                     |
| ----------------------------------------- | --------------- | ---------------------------------------------------------------------------- |
| "I want to learn by building something"   | **Tutorial**    | [tutorial-template.md](/docs/reference/templates/tutorial-template.md)       |
| "I need to solve a specific problem"      | **How-To**      | [howto-template.md](/docs/reference/templates/howto-template.md)             |
| "I need to look up information"           | **Reference**   | [reference-template.md](/docs/reference/templates/reference-template.md)     |
| "I want to understand how/why this works" | **Explanation** | [explanation-template.md](/docs/reference/templates/explanation-template.md) |

### 2. Quick Type Check

❓ **Still unsure?** Use this decision tree:

```
Is the user learning something brand new?
├─ YES → Tutorial
└─ NO
   ├─ Are they solving a specific problem?
   │  ├─ YES → How-To Guide
   │  └─ NO
   │     ├─ Are they looking up information?
   │     │  ├─ YES → Reference
   │     │  └─ NO → Explanation
```

## Writing Guidelines by Type

### 📚 Tutorials (Learning-Oriented)

**Goal**: Help someone learn by doing

**Structure**:

1. Show the end result upfront
2. List minimal prerequisites
3. Step-by-step instructions
4. Working code at each step
5. Verification/testing section

**Writing Tips**:

- ✅ "You will build a working CLI app"
- ✅ Use encouraging, supportive tone
- ✅ One clear path (no options)
- ❌ Don't explain why things work
- ❌ Don't offer alternatives

**Frontmatter**:

```yaml
---
type: tutorial
title: Build Your First CLI Application
description: Create a working CLI tool in 15 minutes
prerequisites:
  - Node.js 18+ installed
  - Basic JavaScript knowledge
---
```

### 🛠️ How-To Guides (Task-Oriented)

**Goal**: Solve a specific user problem

**Structure**:

1. Brief problem statement
2. Prerequisites (assume knowledge)
3. Solution(s)
4. Common variations
5. Troubleshooting

**Writing Tips**:

- ✅ "To add validation rules, use createRule()"
- ✅ Direct, efficient tone
- ✅ Show multiple approaches
- ❌ Don't start from basics
- ❌ Don't explain concepts in detail

**Frontmatter**:

```yaml
---
type: how-to
title: How to Add Custom Validation Rules
description: Add custom validation logic to CLI commands
prerequisites:
  - @esteban-url/trailhead-cli installed
  - Familiarity with Result types
---
```

### 📖 Reference (Information-Oriented)

**Goal**: Provide comprehensive technical details

**Structure**:

1. Overview table
2. Import instructions
3. Functions/APIs (consistent format)
4. Types/interfaces
5. Examples (brief)

**Writing Tips**:

- ✅ Consistent, predictable structure
- ✅ Complete parameter lists
- ✅ Neutral, technical tone
- ❌ No step-by-step instructions
- ❌ No tutorial content

**Frontmatter**:

```yaml
---
type: reference
title: FileSystem API Reference
description: Complete API reference for FileSystem module
related:
  - /docs/how-to/contributing/file-operations
---
```

### 💡 Explanation (Understanding-Oriented)

**Goal**: Help users understand concepts and design

**Structure**:

1. Conceptual overview
2. Background/motivation
3. Core concepts
4. Design decisions
5. Mental models/analogies

**Writing Tips**:

- ✅ "Result types eliminate exceptions because..."
- ✅ Conversational but professional
- ✅ Discuss trade-offs and alternatives
- ❌ No step-by-step tasks
- ❌ No comprehensive API lists

**Frontmatter**:

```yaml
---
type: explanation
title: Understanding Result Types
description: Why we use Result types for error handling
related:
  - /docs/how-to/contributing/error-handling
  - /docs/reference/api/core
---
```

## Common Mistakes to Avoid

### ❌ Mixed Content Types

**Bad**: A single doc that tries to be tutorial + reference

```markdown
# Getting Started (BAD EXAMPLE)

❌ Build an application step-by-step... [tutorial content mixed in]

## API Reference

❌ Here are all the functions... [reference content mixed in]
```

**Good**: Separate docs for each purpose

```markdown
# Tutorial: Build Your First App

# Reference: Core API Functions
```

### ❌ Wrong Type for Content

| Content                                      | Wrong Type | Right Type  |
| -------------------------------------------- | ---------- | ----------- |
| "Tutorial: Building a todo app step by step" | How-To     | Tutorial    |
| "Here's how the validation system works"     | Tutorial   | Explanation |
| "To configure SSL, edit config.json"         | Reference  | How-To      |
| "`function validate(input: string): Result`" | How-To     | Reference   |

### ❌ Wrong Audience

**Bad**: Tutorial that assumes expert knowledge

```markdown
# Tutorial: Build a CLI (BAD)

Assuming you understand Result monads and functional composition...
```

**Good**: Tutorial for learners

```markdown
# Tutorial: Build Your First CLI

In this tutorial, you'll learn CLI basics by building a working tool...
```

## Quick Creation Commands

```bash
# Create new documentation with templates
pnpm docs:new

# Validate your documentation
pnpm docs:validate

# Check style and formatting
pnpm docs:lint
```

## Writing Style Checklist

### General Style

- [ ] **User-focused**: "You can configure..." not "The system allows..."
- [ ] **Active voice**: "Run the command" not "The command should be run"
- [ ] **Present tense**: "This returns..." not "This will return..."
- [ ] **Clear language**: Avoid jargon, explain when necessary

### Type-Specific Tone

| Type        | Tone                       | Example                                    |
| ----------- | -------------------------- | ------------------------------------------ |
| Tutorial    | Encouraging, supportive    | "Great! You've just created your first..." |
| How-To      | Direct, efficient          | "Run this command to configure..."         |
| Reference   | Neutral, technical         | "Returns a Result containing..."           |
| Explanation | Conversational, thoughtful | "This approach was chosen because..."      |

## Content Length Guidelines

| Type        | Typical Length | When to Split               |
| ----------- | -------------- | --------------------------- |
| Tutorial    | 10-30 min read | Multiple major features     |
| How-To      | 2-10 min read  | Multiple unrelated problems |
| Reference   | Any length     | Different modules/APIs      |
| Explanation | 5-15 min read  | Multiple distinct concepts  |

## Quality Checklist

Before submitting documentation:

- [ ] **Correct frontmatter** with appropriate `type`
- [ ] **Content matches type** (no mixed content)
- [ ] **Clear title** that sets expectations
- [ ] **Prerequisites listed** (if applicable)
- [ ] **Related links** to complementary docs
- [ ] **Examples work** (copy-paste tested)
- [ ] **Passes validation** (`pnpm docs:validate`)

## Need Help?

### Quick Questions

- **"What type is this?"** → See decision tree above
- **"How long should this be?"** → See length guidelines above
- **"What tone should I use?"** → See type-specific tone table above

### Resources

- [Documentation Standards](/docs/reference/documentation-standards.md)- Complete guidelines
- [Review Checklist](/docs/reference/review-checklist.md)- For reviewers
- [Documentation Standards](/docs/reference/documentation-standards.md)- Starting points for each type

### Still Stuck?

1. Look at existing documentation of the same type
2. Use `pnpm docs:new` to start with a template
3. Ask in #documentation channel
4. Reference [Diátaxis framework](https://diataxis.fr/) directly

Remember: **One type per document.** When in doubt, split into multiple focused docs.
