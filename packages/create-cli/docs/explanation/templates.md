---
type: explanation
title: 'Understanding the Template System'
description: 'Deep dive into how the template system works and why it is designed this way'
related:
  - ../reference/templates.md
  - ../how-to/customize-templates.md
  - ../reference/schema.md
---

# Understanding the Template System

This document explains the design decisions, architecture, and philosophy behind the @esteban-url/create-cli template system.

## Design Philosophy

### Modular Architecture

The template system is built around the concept of **feature modules** rather than monolithic templates. This design decision stems from several key insights:

1. **Composability**: Projects have different needs. A library might need testing but not CI/CD, while a production CLI needs everything.

2. **Maintainability**: Changes to one feature (like testing setup) don't require updating multiple template variants.

3. **Extensibility**: New features can be added as modules without modifying existing templates.

4. **User Choice**: Developers can pick exactly what they need, avoiding bloat.

### Why Handlebars?

We chose Handlebars as our template engine for several reasons:

- **Simplicity**: Logic-less templates keep complexity in the code, not in templates
- **Familiarity**: Widely used in the JavaScript ecosystem
- **Safety**: No arbitrary code execution in templates
- **Extensibility**: Custom helpers for specific needs
- **Performance**: Compiled templates with caching

## Architecture Overview

### Template Processing Pipeline

```
User Input → Configuration → Module Selection → Template Compilation → Post-Processing → File Generation
```

Each stage serves a specific purpose:

1. **User Input**: Gathered through CLI args, prompts, or config files
2. **Configuration**: Validated and normalized into ProjectConfig
3. **Module Selection**: Features determine which modules to include
4. **Template Compilation**: Handlebars processes templates with context
5. **Post-Processing**: Code formatting for consistency
6. **File Generation**: Writing files with proper permissions

### Module System

Modules are self-contained units of functionality:

```typescript
interface FeatureModule {
  name: string // Identifier
  description: string // Human-readable purpose
  dependencies: string[] // Required modules
  conflicts: string[] // Incompatible modules
  files: TemplateFile[] // Templates to process
  packageDependencies?: string[] // npm packages needed
  scripts?: Record<string, string> // package.json scripts
}
```

This structure enables:

- **Dependency Resolution**: Automatically include required modules
- **Conflict Detection**: Prevent incompatible combinations
- **Package Management**: Track npm dependencies per feature
- **Script Composition**: Build up package.json scripts

## Key Design Decisions

### Post-Generation Formatting

Templates are intentionally kept unformatted. Formatting happens after generation using Prettier. This approach:

1. **Avoids Mixed Syntax Issues**: Handlebars expressions break JavaScript parsers
2. **Ensures Consistency**: Output always matches project style
3. **Simplifies Templates**: No need to maintain perfect formatting
4. **Handles Edge Cases**: Complex conditional sections format correctly

### File Naming Conventions

Special naming handles system limitations:

- `DOT_gitignore` → `.gitignore` (npm ignores dotfiles)
- `_gitignore` → `.gitignore` (static files)
- `.hbs` extension for templates
- No extension for static files

### Variable Scoping

Template variables are carefully scoped:

- **Global Variables**: Available everywhere (projectName, packageManager)
- **Feature Flags**: Boolean checks for conditional content
- **Computed Variables**: Derived from configuration
- **No User-Defined Variables**: Prevents complexity and security issues

## Template Composition

### How Modules Combine

When multiple modules are selected:

1. **Dependency Resolution**

   ```
   testing → automatically includes config
   validation → standalone
   docs → standalone
   ```

2. **File Merging**
   - No duplicate files (later modules override)
   - Shared directories merge naturally
   - Scripts combine (last wins for conflicts)

3. **Package Dependencies**
   - Deduplicated automatically
   - Version conflicts resolved by latest

### Example Composition

User selects: `core + testing + docs`

Result includes:

- Core CLI structure
- Testing framework (Vitest)
- Config module (auto-added dependency)
- Documentation structure
- Combined package.json scripts

## Performance Considerations

### Template Caching

Compiled templates are cached using LRU strategy:

- **Cache Size**: 100 templates
- **Cache Key**: File path + content hash
- **Invalidation**: File modification time
- **Memory Management**: Automatic eviction

### Optimization Strategies

1. **Lazy Loading**: Templates loaded only when needed
2. **Parallel Processing**: Multiple files processed concurrently
3. **Stream Processing**: Large files handled efficiently
4. **Minimal I/O**: Batch file operations

## Security Model

### Template Safety

Templates cannot:

- Execute arbitrary code
- Access system beyond provided context
- Modify files outside project directory
- Include external files dynamically

### Input Validation

All inputs are validated:

- Project names follow npm conventions
- Paths are sanitized and validated
- Template variables are typed and checked
- File permissions are controlled

## Evolution and Extensibility

### Adding New Features

The module system makes adding features straightforward:

1. Create module directory
2. Add templates
3. Define module metadata
4. Update schema if needed

### Version Migration

Templates can evolve without breaking:

- Old projects continue working
- New features are additive
- Breaking changes are avoided
- Migration guides provided

## Common Patterns

### Conditional Content

```handlebars
{{#if features.testing}}
  // Testing-specific content
{{/if}}
```

Used for optional features without creating variants.

### Platform-Specific Code

```handlebars
{{#if (eq process.platform 'win32')}}
  // Windows-specific
{{else}}
  // Unix-specific
{{/if}}
```

Handles cross-platform differences.

### Dynamic Lists

```handlebars
"dependencies": {
{{#each dependencies}}
  "{{@key}}": "{{this}}"{{#unless @last}},{{/unless}}
{{/each}}
}
```

Builds dynamic JSON structures.

## Limitations and Trade-offs

### Current Limitations

1. **No Custom Variables**: Users can't define arbitrary variables
2. **No Template Inheritance**: Each module is independent
3. **Limited Logic**: Handlebars is logic-less by design
4. **Static Analysis**: Can't analyze user's existing code

### Design Trade-offs

These limitations are intentional:

- **Simplicity over Flexibility**: Easy to understand and maintain
- **Safety over Power**: Prevents security issues
- **Convention over Configuration**: Opinionated defaults
- **Speed over Customization**: Fast generation

## Future Considerations

### Potential Enhancements

1. **Plugin System**: Allow external template modules
2. **Template Marketplace**: Share community templates
3. **Smart Defaults**: Detect project context
4. **Interactive Mode**: Real-time preview

### Maintaining Backward Compatibility

Future changes will:

- Preserve existing module interfaces
- Add new capabilities via new modules
- Deprecate gradually with migration paths
- Version templates if breaking changes needed

## Conclusion

The template system balances several competing concerns:

- Power vs Simplicity
- Flexibility vs Safety
- Performance vs Features
- Convention vs Configuration

By choosing a modular, composition-based approach with safe templating, we provide a system that's both powerful enough for complex projects and simple enough for quick starts. The architecture supports growth without sacrificing the core principles that make it reliable and maintainable.
