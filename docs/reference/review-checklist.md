---
type: reference
title: 'Documentation Review Checklist'
description: 'Comprehensive checklist for reviewing documentation changes following Diátaxis principles'
related:
  - /docs/reference/documentation-standards
  - /docs/reference/writing-guide.md
  - /docs/reference/templates/
  - /docs/how-to/contributing.md
---

# Documentation Review Checklist

Use this checklist when reviewing documentation changes in the Trailhead monorepo. All documentation must follow [Diátaxis principles](/docs/reference/documentation-standards).

## Pre-Review: Automated Checks

Before manual review, ensure these automated checks pass:

- [ ] **Vale linting**: No style violations (`pnpm docs:lint`)
- [ ] **Markdownlint**: No formatting issues
- [ ] **Link validation**: All links work
- [ ] **Build check**: Documentation builds without errors

**Note**: Standard files (README.md, CONTRIBUTING.md, CLAUDE.md, etc.) are exempt from Diátaxis validation but should still follow general quality standards.

## 1. Content Type Verification

### Frontmatter Check

- [ ] Contains required `type` field (`tutorial`, `how-to`, `reference`, `explanation`)
- [ ] Has descriptive `title`
- [ ] Includes one-line `description`
- [ ] Lists appropriate `prerequisites` (if applicable)
- [ ] Contains relevant `related` links

### Type Consistency

- [ ] **Tutorial**: Learning-oriented, step-by-step, builds something concrete
- [ ] **How-To**: Task-oriented, solves specific problems, assumes knowledge
- [ ] **Reference**: Information-oriented, comprehensive, no instructions
- [ ] **Explanation**: Understanding-oriented, conceptual, discusses design

## 2. Content Quality Review

### General Quality

- [ ] **User-focused**: Written from user's perspective, not system's
- [ ] **Clear purpose**: Reader knows what they'll achieve
- [ ] **Appropriate scope**: Focused on one topic/task
- [ ] **Accurate information**: Technical details are correct
- [ ] **Current content**: No outdated information or deprecated features

### Structure and Organization

- [ ] **Logical flow**: Information presented in sensible order
- [ ] **Clear headings**: Descriptive, follows hierarchy
- [ ] **Scannable**: Uses lists, tables, code blocks appropriately
- [ ] **Complete**: Covers all necessary information for the stated purpose

## 3. Type-Specific Reviews

### For Tutorials

- [ ] **Clear outcome**: States what will be built upfront
- [ ] **Minimal prerequisites**: Only lists essential requirements
- [ ] **Step-by-step**: Each step has clear action and expected result
- [ ] **Single path**: No options or alternatives that confuse learners
- [ ] **Working code**: All examples compile and run
- [ ] **Verification**: Includes way to test/confirm success
- [ ] **Encouraging tone**: Supportive language for learners

**Common Issues**:

- [ ] No explanations in the middle of instructions
- [ ] No reference material mixed in
- [ ] Doesn't assume advanced knowledge

### For How-To Guides

- [ ] **Problem-focused**: Addresses specific user tasks
- [ ] **Solution-oriented**: Gets to the point quickly
- [ ] **Assumes knowledge**: Builds on existing understanding
- [ ] **Practical focus**: Action-oriented, not theoretical
- [ ] **Variations covered**: Addresses common edge cases
- [ ] **Multiple approaches**: Shows alternatives when relevant

**Common Issues**:

- [ ] No tutorial-style learning objectives
- [ ] No lengthy explanations of concepts
- [ ] Doesn't start from absolute basics

### For Reference

- [ ] **Comprehensive**: Covers all features/options
- [ ] **Consistent structure**: Predictable organization
- [ ] **Factual tone**: Neutral, technical language
- [ ] **No instructions**: Pure information, no "how to"
- [ ] **Examples**: Brief code samples for clarity
- [ ] **Cross-references**: Links to related items

**Common Issues**:

- [ ] No tutorial content
- [ ] No task-oriented instructions
- [ ] No explanatory material

### For Explanation

- [ ] **Conceptual focus**: Discusses ideas, not tasks
- [ ] **Context provided**: Background and motivation
- [ ] **Design rationale**: Explains why things work as they do
- [ ] **Trade-offs discussed**: Acknowledges alternatives
- [ ] **Connects ideas**: Shows relationships between concepts

**Common Issues**:

- [ ] No step-by-step instructions
- [ ] No reference lists
- [ ] Doesn't assume user wants to learn concepts

## 4. Technical Review

### Code Quality

- [ ] **Syntax correct**: Code compiles/runs without errors
- [ ] **Best practices**: Follows project coding standards
- [ ] **Security**: No sensitive information exposed
- [ ] **Dependencies**: Uses correct package versions
- [ ] **Imports**: Proper import statements for packages

### Examples and Snippets

- [ ] **Relevant**: Examples match the documentation topic
- [ ] **Complete**: Can be copied and used as-is
- [ ] **Consistent**: Same style across all examples
- [ ] **Tested**: Examples have been verified to work

## 5. Accessibility and Usability

### Readability

- [ ] **Plain language**: Avoids unnecessary jargon
- [ ] **Active voice**: Uses active rather than passive voice
- [ ] **Consistent terminology**: Same terms used throughout
- [ ] **Appropriate length**: Not too long or too short for purpose

### Navigation and Discovery

- [ ] **Clear title**: Accurately describes content
- [ ] **Good description**: Helps users find relevant content
- [ ] **Related links**: Points to complementary documentation
- [ ] **Search keywords**: Uses terms users would search for

### Visual Elements

- [ ] **Code formatting**: Proper syntax highlighting
- [ ] **Tables**: Used appropriately for structured data
- [ ] **Lists**: Break up dense text
- [ ] **Diagrams**: Added when they clarify concepts (explanation docs)

## 6. Integration Review

### Monorepo Consistency

- [ ] **Package standards**: Follows package-specific conventions
- [ ] **Cross-references**: Links work across packages
- [ ] **Version accuracy**: References correct package versions
- [ ] **Terminology**: Consistent with other documentation

### Link Validation

- [ ] **Internal links**: All monorepo links work
- [ ] **External links**: Third-party links are current
- [ ] **Reference links**: API/reference docs are accurate
- [ ] **Example links**: Links to working examples

## 7. Final Review

### Reader Test

- [ ] **Follow instructions**: Can a new person complete the task?
- [ ] **Expected audience**: Matches skill level assumptions
- [ ] **Missing information**: Nothing essential is left out
- [ ] **Unnecessary information**: No irrelevant details

### Maintenance

- [ ] **Update schedule**: Document will stay current
- [ ] **Ownership**: Clear who maintains this content
- [ ] **Dependencies**: Won't break when packages update

## Review Comments Template

Use this template for review feedback:

```markdown
## Documentation Review

**Type**: [tutorial/how-to/reference/explanation]
**Reviewer**: @username

### ✅ Strengths

- [What works well]

### ⚠️ Issues Found

- [ ] **[Category]**: [Specific issue and suggested fix]
- [ ] **[Category]**: [Another issue]

### 📝 Suggestions

- [Optional improvements]

### ✅ Approval Status

- [ ] Approved as-is
- [ ] Approved with minor changes
- [ ] Needs revision
- [ ] Major restructuring required
```

## Quick Decision Guide

**Is this the right content type?**

| If the doc...                      | Should be... |
| ---------------------------------- | ------------ |
| Teaches something new step-by-step | Tutorial     |
| Solves a specific problem          | How-To       |
| Lists functions/options/parameters | Reference    |
| Explains concepts/design/why       | Explanation  |

**Common red flags:**

- Tutorial with multiple solution paths
- How-to that explains basic concepts
- Reference with step-by-step instructions
- Explanation with specific task instructions

## Resources

- [DOCUMENTATION_STANDARDS.md](/docs/reference/documentation-standards) - Complete guidelines
- [WRITING_DOCUMENTATION.md](/docs/reference/writing-guide) - Quick reference
- [Templates](/docs/reference/templates/tutorial-template/) - Starting points for new docs
- `pnpm docs:validate` - Run automated checks
