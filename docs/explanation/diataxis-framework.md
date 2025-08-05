---
type: explanation
title: 'Understanding the Diátaxis Documentation Framework'
description: 'Learn why Trailhead uses Diátaxis and how it improves documentation quality'
related:
  - /docs/reference/documentation-standards
  - /docs/reference/writing-guide
  - /docs/README.md
---

# Understanding the Diátaxis Documentation Framework

This document explains why Trailhead uses the Diátaxis framework and how it benefits both documentation writers and users.

## What is Diátaxis?

Diátaxis is a systematic approach to technical documentation authoring developed by Daniele Procida. It recognizes that documentation serves different purposes at different times and organizes content into four distinct categories based on user needs.

## The Four Quadrants

Diátaxis organizes documentation along two axes:

- **Practical vs Theoretical**: Whether users need to do something or understand something
- **Learning vs Working**: Whether users are studying or accomplishing tasks

This creates four quadrants:

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

## Why These Categories Matter

### Tutorials: Learning by Doing

**Purpose**: Help newcomers gain confidence and understanding through guided experience.

**Why it matters**: New users need a safe, structured path to build familiarity. Tutorials provide this by:

- Eliminating decision-making anxiety
- Ensuring early success
- Building conceptual understanding through practice

**Example**: Our CLI tutorial walks through building a complete greeting application, introducing concepts as they're needed.

### How-To Guides: Problem Solving

**Purpose**: Help users accomplish specific tasks.

**Why it matters**: Experienced users have specific goals and need direct solutions. How-to guides provide:

- Multiple approaches to problems
- Practical solutions without excessive theory
- Quick answers for immediate needs

**Example**: "How to Add File Operations" shows various ways to handle files without teaching filesystem theory.

### Reference: Information Lookup

**Purpose**: Provide complete technical descriptions.

**Why it matters**: Users need authoritative information when implementing or debugging. Reference docs provide:

- Complete API specifications
- All parameters and options
- Technical accuracy without tutorial overhead

**Example**: Command API reference lists every option, method, and type without explaining when to use them.

### Explanation: Conceptual Understanding

**Purpose**: Illuminate how and why things work.

**Why it matters**: Users need mental models to make good decisions. Explanations provide:

- Design rationale
- System architecture understanding
- Theoretical foundations

**Example**: This document explains Diátaxis theory rather than how to write documentation.

## Benefits of Separation

### For Users

1. **Find Information Faster**: Clear categories mean users know where to look
2. **Appropriate Depth**: Get detailed theory or quick answers as needed
3. **Learning Path**: Progress from tutorials to references naturally
4. **Context-Appropriate**: Information matches the user's current situation

### for Writers

1. **Clear Purpose**: Each document has one job to do well
2. **Easier Maintenance**: Changes don't cascade across document types
3. **Complete Coverage**: The framework reveals documentation gaps
4. **Quality Focus**: Can optimize each type for its specific purpose

## Common Anti-Patterns

### Mixed Categories

When tutorials include how-to content, they become confusing:

- New users face too many choices
- Experienced users wade through beginner content
- Neither audience is well served

### Missing Quadrants

Projects often lack certain types:

- No tutorials: High barrier to entry
- No how-tos: Users can't accomplish tasks
- No reference: Incomplete information
- No explanation: Poor decision-making

### Wrong Category

Placing content in the wrong category frustrates users:

- Explanations in references slow down lookups
- How-tos in tutorials overwhelm beginners
- Reference material in explanations buries theory

## Implementation in Trailhead

Trailhead implements Diátaxis through:

1. **Directory Structure**: Clear folders for each category
2. **Frontmatter Types**: Documents declare their category
3. **Writing Guidelines**: Templates for each document type
4. **Cross-References**: Related links connect categories
5. **Review Process**: Category compliance checking

## Design Decisions

### Why Strict Separation?

Trailhead enforces strict category separation because:

- Mixed documents serve no audience well
- Clear boundaries improve maintenance
- Users develop intuition about where to find information
- Quality improves when purpose is singular

### Why This Framework?

We chose Diátaxis because it:

- Maps to actual user needs
- Scales with project growth
- Reduces documentation debt
- Improves user satisfaction

## See Also

- [Documentation Standards Reference](../reference/documentation-standards.md)- Implementation rules
- [Writing Guide](../reference/writing-guide.md)- Style and tone guidelines
- [Documentation README](../README.md)- Quick reference for writers
