# Project Generator Example

## 🏗️ Coming Soon (Self-Generating)

```typescript
const projectGenerator = {
  generate: async (type: string) => {
    if (type === 'documentation') {
      return err(new Error('Stack overflow: Generator generating generator docs'))
    }
    return ok('Coming soon!')
  }
}
```

### What This Generator Will Generate

- Projects that generate other projects
- Boilerplate so good it writes itself
- Templates that are actually maintainable
- Scaffolding that won't collapse
- Code that codes code (meta enough?)

### Recursive Documentation

```typescript
const generateDocs = async () => {
  // First, we need a project generator
  const generator = await generateProjectGenerator()
  
  // Then use it to generate documentation
  const docs = await generator.generate('docs')
  
  // But wait, how did we generate the generator?
  throw new Error('Inception exceeded maximum depth')
}
```

### Planned Template Types

1. **CLI Application** - Generate CLIs that generate CLIs
2. **Web API** - RESTful, GraphQL, or RESTless
3. **Library** - For when you need to share your `utils` folder
4. **Monorepo** - Because one repo isn't enough
5. **This Documentation** - Very meta

### Generator Philosophy

```typescript
interface GeneratorConfig {
  complexity: 'simple' | 'enterprise' | 'job-security'
  patterns: ['factory', 'singleton', 'factory-that-makes-singletons']
  overEngineering: boolean // always true
}
```

### Actual Scaffolding Pattern

```typescript
const scaffold = async (template: string, context: CommandContext) => {
  const templatePath = `templates/${template}`
  const files = await context.fs.readdir(templatePath)
  
  // Copy with variable substitution
  for (const file of files) {
    const content = await context.fs.readFile(`${templatePath}/${file}`)
    const processed = content.replace(/{{(\w+)}}/g, (_, key) => {
      return context.variables[key] || ''
    })
    await context.fs.writeFile(file, processed)
  }
  
  return ok({ filesCreated: files.length })
}
```

### Coming Soon Features

- AI-powered boilerplate (it writes what you were thinking)
- Quantum templates (exist in all states until observed)
- Blockchain-verified scaffolding (because why not)
- Templates that update themselves
- Negative boilerplate (removes code you don't need)

---

*"Give a developer a template, and they'll code for a day. Teach them to generate templates, and they'll never code again."*

Need a project generator now? `pnpm create vite` and pretend this doesn't exist yet!