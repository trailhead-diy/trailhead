**@esteban-url/config**

---

# @repo/config

> Type-safe configuration management with validation and documentation generation

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-blue.svg)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-18.0+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/esteban-url/trailhead/blob/main/LICENSE)

## Features

- Result-based configuration loading and validation
- Schema definition with builder pattern
- Multiple configuration sources (files, env, CLI)
- Documentation generation from schemas
- Type-safe with full TypeScript support
- Testing utilities

## Installation

```bash
pnpm add @repo/config
# or
npm install @repo/config
```

## Quick Start

```typescript
import { defineConfigSchema, createConfigOperations } from '@repo/config'

// Define schema
const schema = defineConfigSchema()
  .object({
    app: {
      name: { type: 'string', required: true },
      port: { type: 'number', default: 3000 },
      debug: { type: 'boolean', default: false },
    },
  })
  .build()

// Load configuration
const configOps = createConfigOperations()
const result = await configOps.load({
  name: 'app-config',
  schema,
  sources: [
    { type: 'file', path: './config.json', priority: 1 },
    { type: 'env', priority: 2 },
  ],
})

if (result.isOk()) {
  const config = result.value.resolved
  console.log('Loaded:', config.app.name)
}
```

## API Reference

### Schema Definition

```typescript
import { defineConfigSchema, string, number, boolean } from '@repo/config'

const schema = defineConfigSchema()
  .object({
    // Define your schema structure
  })
  .strict(true)
  .build()
```

### Configuration Loading

```typescript
import { createConfigOperations } from '@repo/config'

const configOps = createConfigOperations()
await configOps.load(definition)
await configOps.validate(data, schema)
```

### Documentation Generation

```typescript
import { generateConfigDocs, generateMarkdown } from '@repo/config/docs'

const docs = await generateConfigDocs(schema)
const markdown = await generateMarkdown(docs)
```

## Related Packages

- **@repo/core** - Result types and functional utilities
- **@repo/fs** - File system operations
- **@repo/validation** - Data validation

## Documentation

- [Tutorials](_media/config-getting-started.md)
  - [Getting Started with Config](../../docs/tutorials/config-getting-started)
- [How-to Guides](_media/README.md)
  - [Define Configuration Schemas](../../docs/how-to/define-schemas)
  - [Generate Documentation](../../docs/how-to/generate-config-docs)
- [Explanations](_media/README-1.md)
  - [Configuration Sources](../../docs/explanation/config-sources)
- [API Reference](./docs/reference/api)

## License

MIT © [Esteban URL](https://github.com/esteban-url)

## Interfaces

### ConfigSchema\<T\>

#### Type Parameters

| Type Parameter | Default type                                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------------------ |
| `T`            | [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `unknown`\> |

#### Properties

| Property                                | Modifier   | Type                                                |
| --------------------------------------- | ---------- | --------------------------------------------------- |
| <a id="name"></a> `name?`               | `readonly` | `string`                                            |
| <a id="description"></a> `description?` | `readonly` | `string`                                            |
| <a id="version"></a> `version?`         | `readonly` | `string`                                            |
| <a id="zodschema"></a> `zodSchema`      | `readonly` | [`ZodType`](https://zod.dev/?id=basic-usage)\<`T`\> |
| <a id="strict"></a> `strict?`           | `readonly` | `boolean`                                           |

---

### SchemaBuilder\<T\>

#### Type Parameters

| Type Parameter |
| -------------- |
| `T`            |

#### Properties

| Property                                 | Modifier   | Type                                                        |
| ---------------------------------------- | ---------- | ----------------------------------------------------------- |
| <a id="name-1"></a> `name`               | `readonly` | (`name`) => [`SchemaBuilder`](#schemabuilder)\<`T`\>        |
| <a id="description-1"></a> `description` | `readonly` | (`description`) => [`SchemaBuilder`](#schemabuilder)\<`T`\> |
| <a id="version-1"></a> `version`         | `readonly` | (`version`) => [`SchemaBuilder`](#schemabuilder)\<`T`\>     |
| <a id="strict-1"></a> `strict`           | `readonly` | (`strict?`) => [`SchemaBuilder`](#schemabuilder)\<`T`\>     |
| <a id="build"></a> `build`               | `readonly` | () => [`ConfigSchema`](#configschema)\<`T`\>                |

---

### StringFieldBuilder

#### Properties

| Property                                 | Modifier   | Type                                                                          |
| ---------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| <a id="description-2"></a> `description` | `readonly` | (`description`) => [`StringFieldBuilder`](#stringfieldbuilder)                |
| <a id="optional"></a> `optional`         | `readonly` | () => [`StringFieldBuilder`](#stringfieldbuilder)                             |
| <a id="default"></a> `default`           | `readonly` | (`defaultValue`) => [`StringFieldBuilder`](#stringfieldbuilder)               |
| <a id="examples"></a> `examples`         | `readonly` | (...`examples`) => [`StringFieldBuilder`](#stringfieldbuilder)                |
| <a id="enum"></a> `enum`                 | `readonly` | \<`T`\>(...`values`) => [`FieldBuilder`](#fieldbuilder)\<`T`\[`number`\]\>    |
| <a id="pattern"></a> `pattern`           | `readonly` | (`pattern`, `message?`) => [`StringFieldBuilder`](#stringfieldbuilder)        |
| <a id="minlength"></a> `minLength`       | `readonly` | (`min`, `message?`) => [`StringFieldBuilder`](#stringfieldbuilder)            |
| <a id="maxlength"></a> `maxLength`       | `readonly` | (`max`, `message?`) => [`StringFieldBuilder`](#stringfieldbuilder)            |
| <a id="length"></a> `length`             | `readonly` | (`min`, `max`) => [`StringFieldBuilder`](#stringfieldbuilder)                 |
| <a id="email"></a> `email`               | `readonly` | (`message?`) => [`StringFieldBuilder`](#stringfieldbuilder)                   |
| <a id="url"></a> `url`                   | `readonly` | (`message?`) => [`StringFieldBuilder`](#stringfieldbuilder)                   |
| <a id="uuid"></a> `uuid`                 | `readonly` | (`message?`) => [`StringFieldBuilder`](#stringfieldbuilder)                   |
| <a id="trim"></a> `trim`                 | `readonly` | () => [`StringFieldBuilder`](#stringfieldbuilder)                             |
| <a id="tolowercase"></a> `toLowerCase`   | `readonly` | () => [`StringFieldBuilder`](#stringfieldbuilder)                             |
| <a id="touppercase"></a> `toUpperCase`   | `readonly` | () => [`StringFieldBuilder`](#stringfieldbuilder)                             |
| <a id="build-1"></a> `build`             | `readonly` | () => [`ZodType`](https://zod.dev/?id=basic-usage)\<`undefined` \| `string`\> |

---

### NumberFieldBuilder

#### Properties

| Property                                 | Modifier   | Type                                                                          |
| ---------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| <a id="description-3"></a> `description` | `readonly` | (`description`) => [`NumberFieldBuilder`](#numberfieldbuilder)                |
| <a id="optional-1"></a> `optional`       | `readonly` | () => [`NumberFieldBuilder`](#numberfieldbuilder)                             |
| <a id="default-1"></a> `default`         | `readonly` | (`defaultValue`) => [`NumberFieldBuilder`](#numberfieldbuilder)               |
| <a id="examples-1"></a> `examples`       | `readonly` | (...`examples`) => [`NumberFieldBuilder`](#numberfieldbuilder)                |
| <a id="enum-1"></a> `enum`               | `readonly` | \<`T`\>(...`values`) => [`FieldBuilder`](#fieldbuilder)\<`T`\[`number`\]\>    |
| <a id="min"></a> `min`                   | `readonly` | (`min`, `message?`) => [`NumberFieldBuilder`](#numberfieldbuilder)            |
| <a id="max"></a> `max`                   | `readonly` | (`max`, `message?`) => [`NumberFieldBuilder`](#numberfieldbuilder)            |
| <a id="range"></a> `range`               | `readonly` | (`min`, `max`) => [`NumberFieldBuilder`](#numberfieldbuilder)                 |
| <a id="int"></a> `int`                   | `readonly` | (`message?`) => [`NumberFieldBuilder`](#numberfieldbuilder)                   |
| <a id="positive"></a> `positive`         | `readonly` | (`message?`) => [`NumberFieldBuilder`](#numberfieldbuilder)                   |
| <a id="negative"></a> `negative`         | `readonly` | (`message?`) => [`NumberFieldBuilder`](#numberfieldbuilder)                   |
| <a id="nonnegative"></a> `nonNegative`   | `readonly` | (`message?`) => [`NumberFieldBuilder`](#numberfieldbuilder)                   |
| <a id="nonpositive"></a> `nonPositive`   | `readonly` | (`message?`) => [`NumberFieldBuilder`](#numberfieldbuilder)                   |
| <a id="finite"></a> `finite`             | `readonly` | (`message?`) => [`NumberFieldBuilder`](#numberfieldbuilder)                   |
| <a id="multipleof"></a> `multipleOf`     | `readonly` | (`divisor`, `message?`) => [`NumberFieldBuilder`](#numberfieldbuilder)        |
| <a id="build-2"></a> `build`             | `readonly` | () => [`ZodType`](https://zod.dev/?id=basic-usage)\<`undefined` \| `number`\> |

---

### BooleanFieldBuilder

#### Properties

| Property                                 | Modifier   | Type                                                                           |
| ---------------------------------------- | ---------- | ------------------------------------------------------------------------------ |
| <a id="description-4"></a> `description` | `readonly` | (`description`) => [`BooleanFieldBuilder`](#booleanfieldbuilder)               |
| <a id="optional-2"></a> `optional`       | `readonly` | () => [`BooleanFieldBuilder`](#booleanfieldbuilder)                            |
| <a id="default-2"></a> `default`         | `readonly` | (`defaultValue`) => [`BooleanFieldBuilder`](#booleanfieldbuilder)              |
| <a id="examples-2"></a> `examples`       | `readonly` | (...`examples`) => [`BooleanFieldBuilder`](#booleanfieldbuilder)               |
| <a id="build-3"></a> `build`             | `readonly` | () => [`ZodType`](https://zod.dev/?id=basic-usage)\<`undefined` \| `boolean`\> |

---

### ArrayFieldBuilder\<T\>

#### Type Parameters

| Type Parameter |
| -------------- |
| `T`            |

#### Properties

| Property                                 | Modifier   | Type                                                                       |
| ---------------------------------------- | ---------- | -------------------------------------------------------------------------- |
| <a id="description-5"></a> `description` | `readonly` | (`description`) => [`ArrayFieldBuilder`](#arrayfieldbuilder)\<`T`\>        |
| <a id="optional-3"></a> `optional`       | `readonly` | () => [`ArrayFieldBuilder`](#arrayfieldbuilder)\<`T`\>                     |
| <a id="default-3"></a> `default`         | `readonly` | (`defaultValue`) => [`ArrayFieldBuilder`](#arrayfieldbuilder)\<`T`\>       |
| <a id="examples-3"></a> `examples`       | `readonly` | (...`examples`) => [`ArrayFieldBuilder`](#arrayfieldbuilder)\<`T`\>        |
| <a id="minlength-1"></a> `minLength`     | `readonly` | (`min`, `message?`) => [`ArrayFieldBuilder`](#arrayfieldbuilder)\<`T`\>    |
| <a id="maxlength-1"></a> `maxLength`     | `readonly` | (`max`, `message?`) => [`ArrayFieldBuilder`](#arrayfieldbuilder)\<`T`\>    |
| <a id="length-1"></a> `length`           | `readonly` | (`length`, `message?`) => [`ArrayFieldBuilder`](#arrayfieldbuilder)\<`T`\> |
| <a id="nonempty"></a> `nonempty`         | `readonly` | (`message?`) => [`ArrayFieldBuilder`](#arrayfieldbuilder)\<`T`\>           |
| <a id="build-4"></a> `build`             | `readonly` | () => [`ZodType`](https://zod.dev/?id=basic-usage)\<`undefined` \| `T`[]\> |

---

### ObjectFieldBuilder\<T\>

#### Type Parameters

| Type Parameter |
| -------------- |
| `T`            |

#### Properties

| Property                                 | Modifier   | Type                                                                     |
| ---------------------------------------- | ---------- | ------------------------------------------------------------------------ |
| <a id="description-6"></a> `description` | `readonly` | (`description`) => [`ObjectFieldBuilder`](#objectfieldbuilder)\<`T`\>    |
| <a id="optional-4"></a> `optional`       | `readonly` | () => [`ObjectFieldBuilder`](#objectfieldbuilder)\<`T`\>                 |
| <a id="default-4"></a> `default`         | `readonly` | (`defaultValue`) => [`ObjectFieldBuilder`](#objectfieldbuilder)\<`T`\>   |
| <a id="examples-4"></a> `examples`       | `readonly` | (...`examples`) => [`ObjectFieldBuilder`](#objectfieldbuilder)\<`T`\>    |
| <a id="strict-2"></a> `strict`           | `readonly` | () => [`ObjectFieldBuilder`](#objectfieldbuilder)\<`T`\>                 |
| <a id="passthrough"></a> `passthrough`   | `readonly` | () => [`ObjectFieldBuilder`](#objectfieldbuilder)\<`T`\>                 |
| <a id="strip"></a> `strip`               | `readonly` | () => [`ObjectFieldBuilder`](#objectfieldbuilder)\<`T`\>                 |
| <a id="build-5"></a> `build`             | `readonly` | () => [`ZodType`](https://zod.dev/?id=basic-usage)\<`undefined` \| `T`\> |

---

### FieldBuilder\<T\>

#### Type Parameters

| Type Parameter |
| -------------- |
| `T`            |

#### Properties

| Property                                 | Modifier   | Type                                                                     |
| ---------------------------------------- | ---------- | ------------------------------------------------------------------------ |
| <a id="description-7"></a> `description` | `readonly` | (`description`) => [`FieldBuilder`](#fieldbuilder)\<`T`\>                |
| <a id="optional-5"></a> `optional`       | `readonly` | () => [`FieldBuilder`](#fieldbuilder)\<`T`\>                             |
| <a id="default-5"></a> `default`         | `readonly` | (`defaultValue`) => [`FieldBuilder`](#fieldbuilder)\<`T`\>               |
| <a id="examples-5"></a> `examples`       | `readonly` | (...`examples`) => [`FieldBuilder`](#fieldbuilder)\<`T`\>                |
| <a id="build-6"></a> `build`             | `readonly` | () => [`ZodType`](https://zod.dev/?id=basic-usage)\<`undefined` \| `T`\> |

---

### ConfigDocs

#### Properties

| Property                                  | Modifier   | Type                                                       |
| ----------------------------------------- | ---------- | ---------------------------------------------------------- |
| <a id="title"></a> `title`                | `readonly` | `string`                                                   |
| <a id="description-8"></a> `description?` | `readonly` | `string`                                                   |
| <a id="version-2"></a> `version?`         | `readonly` | `string`                                                   |
| <a id="generatedat"></a> `generatedAt`    | `readonly` | `string`                                                   |
| <a id="sections"></a> `sections`          | `readonly` | readonly [`DocumentationSection`](#documentationsection)[] |
| <a id="metadata"></a> `metadata`          | `readonly` | [`DocsMetadata`](#docsmetadata)                            |
| <a id="schema"></a> `schema`              | `readonly` | [`JsonSchema`](#jsonschema)                                |

---

### DocumentationSection

#### Properties

| Property                                  | Modifier   | Type                                                   |
| ----------------------------------------- | ---------- | ------------------------------------------------------ |
| <a id="title-1"></a> `title`              | `readonly` | `string`                                               |
| <a id="description-9"></a> `description?` | `readonly` | `string`                                               |
| <a id="fields"></a> `fields`              | `readonly` | readonly [`FieldDocumentation`](#fielddocumentation)[] |
| <a id="examples-6"></a> `examples?`       | `readonly` | readonly [`ExampleConfig`](#exampleconfig)[]           |

---

### FieldDocumentation

#### Properties

| Property                                   | Modifier   | Type                                    |
| ------------------------------------------ | ---------- | --------------------------------------- |
| <a id="name-2"></a> `name`                 | `readonly` | `string`                                |
| <a id="type"></a> `type`                   | `readonly` | `string`                                |
| <a id="description-10"></a> `description?` | `readonly` | `string`                                |
| <a id="required"></a> `required`           | `readonly` | `boolean`                               |
| <a id="defaultvalue"></a> `defaultValue?`  | `readonly` | `unknown`                               |
| <a id="examples-7"></a> `examples`         | `readonly` | readonly `unknown`[]                    |
| <a id="constraints"></a> `constraints?`    | `readonly` | [`FieldConstraints`](#fieldconstraints) |
| <a id="validation"></a> `validation?`      | `readonly` | [`ValidationInfo`](#validationinfo)     |
| <a id="path"></a> `path`                   | `readonly` | readonly `string`[]                     |
| <a id="zodtype"></a> `zodType`             | `readonly` | `string`                                |

---

### FieldConstraints

#### Properties

| Property                                | Modifier   | Type                 |
| --------------------------------------- | ---------- | -------------------- |
| <a id="enum-2"></a> `enum?`             | `readonly` | readonly `unknown`[] |
| <a id="pattern-1"></a> `pattern?`       | `readonly` | `string`             |
| <a id="minimum"></a> `minimum?`         | `readonly` | `number`             |
| <a id="maximum"></a> `maximum?`         | `readonly` | `number`             |
| <a id="minlength-2"></a> `minLength?`   | `readonly` | `number`             |
| <a id="maxlength-2"></a> `maxLength?`   | `readonly` | `number`             |
| <a id="format"></a> `format?`           | `readonly` | `string`             |
| <a id="multipleof-1"></a> `multipleOf?` | `readonly` | `number`             |
| <a id="inclusive"></a> `inclusive?`     | `readonly` | `object`             |
| `inclusive.min?`                        | `readonly` | `boolean`            |
| `inclusive.max?`                        | `readonly` | `boolean`            |

---

### ValidationInfo

#### Properties

| Property                                        | Modifier   | Type                |
| ----------------------------------------------- | ---------- | ------------------- |
| <a id="rules"></a> `rules`                      | `readonly` | readonly `string`[] |
| <a id="errormessage"></a> `errorMessage?`       | `readonly` | `string`            |
| <a id="customvalidator"></a> `customValidator?` | `readonly` | `string`            |
| <a id="transforms"></a> `transforms?`           | `readonly` | readonly `string`[] |

---

### ExampleConfig

#### Properties

| Property                                   | Modifier   | Type                                                                                                               |
| ------------------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------ |
| <a id="title-2"></a> `title`               | `readonly` | `string`                                                                                                           |
| <a id="description-11"></a> `description?` | `readonly` | `string`                                                                                                           |
| <a id="config"></a> `config`               | `readonly` | [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `unknown`\> |
| <a id="valid"></a> `valid`                 | `readonly` | `boolean`                                                                                                          |
| <a id="usecase"></a> `useCase?`            | `readonly` | `string`                                                                                                           |
| <a id="errors"></a> `errors?`              | `readonly` | readonly `string`[]                                                                                                |

---

### DocsMetadata

#### Properties

| Property                                             | Modifier   | Type     |
| ---------------------------------------------------- | ---------- | -------- |
| <a id="fieldcount"></a> `fieldCount`                 | `readonly` | `number` |
| <a id="requiredfieldcount"></a> `requiredFieldCount` | `readonly` | `number` |
| <a id="optionalfieldcount"></a> `optionalFieldCount` | `readonly` | `number` |
| <a id="nestedobjectcount"></a> `nestedObjectCount`   | `readonly` | `number` |
| <a id="arrayfieldcount"></a> `arrayFieldCount`       | `readonly` | `number` |
| <a id="enumfieldcount"></a> `enumFieldCount`         | `readonly` | `number` |
| <a id="schemaversion"></a> `schemaVersion?`          | `readonly` | `string` |
| <a id="generator"></a> `generator`                   | `readonly` | `string` |
| <a id="generatorversion"></a> `generatorVersion`     | `readonly` | `string` |
| <a id="zodversion"></a> `zodVersion`                 | `readonly` | `string` |

---

### DocsGeneratorOptions

#### Properties

| Property                                              | Modifier   | Type                                 |
| ----------------------------------------------------- | ---------- | ------------------------------------ |
| <a id="title-3"></a> `title?`                         | `readonly` | `string`                             |
| <a id="includeexamples"></a> `includeExamples?`       | `readonly` | `boolean`                            |
| <a id="includeconstraints"></a> `includeConstraints?` | `readonly` | `boolean`                            |
| <a id="includevalidation"></a> `includeValidation?`   | `readonly` | `boolean`                            |
| <a id="includejsonschema"></a> `includeJsonSchema?`   | `readonly` | `boolean`                            |
| <a id="format-1"></a> `format?`                       | `readonly` | `"markdown"` \| `"json"` \| `"html"` |
| <a id="template"></a> `template?`                     | `readonly` | `string`                             |
| <a id="outputpath"></a> `outputPath?`                 | `readonly` | `string`                             |
| <a id="maxdepth"></a> `maxDepth?`                     | `readonly` | `number`                             |

---

### JsonSchema

#### Properties

| Property                                                  | Modifier   | Type                                                                                                                                                 |
| --------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="schema-1"></a> `$schema`                           | `readonly` | `string`                                                                                                                                             |
| <a id="type-1"></a> `type`                                | `readonly` | `string`                                                                                                                                             |
| <a id="title-4"></a> `title?`                             | `readonly` | `string`                                                                                                                                             |
| <a id="description-12"></a> `description?`                | `readonly` | `string`                                                                                                                                             |
| <a id="properties"></a> `properties?`                     | `readonly` | [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, [`JsonSchemaProperty`](#jsonschemaproperty)\> |
| <a id="required-1"></a> `required?`                       | `readonly` | readonly `string`[]                                                                                                                                  |
| <a id="additionalproperties"></a> `additionalProperties?` | `readonly` | `boolean`                                                                                                                                            |
| <a id="definitions"></a> `definitions?`                   | `readonly` | [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, [`JsonSchemaProperty`](#jsonschemaproperty)\> |

---

### JsonSchemaProperty

#### Properties

| Property                                                    | Modifier   | Type                                                                                                                                                 |
| ----------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="type-2"></a> `type?`                                 | `readonly` | `string` \| readonly `string`[]                                                                                                                      |
| <a id="description-13"></a> `description?`                  | `readonly` | `string`                                                                                                                                             |
| <a id="default-6"></a> `default?`                           | `readonly` | `unknown`                                                                                                                                            |
| <a id="examples-8"></a> `examples?`                         | `readonly` | readonly `unknown`[]                                                                                                                                 |
| <a id="enum-3"></a> `enum?`                                 | `readonly` | readonly `unknown`[]                                                                                                                                 |
| <a id="const"></a> `const?`                                 | `readonly` | `unknown`                                                                                                                                            |
| <a id="pattern-2"></a> `pattern?`                           | `readonly` | `string`                                                                                                                                             |
| <a id="format-2"></a> `format?`                             | `readonly` | `string`                                                                                                                                             |
| <a id="minimum-1"></a> `minimum?`                           | `readonly` | `number`                                                                                                                                             |
| <a id="maximum-1"></a> `maximum?`                           | `readonly` | `number`                                                                                                                                             |
| <a id="exclusiveminimum"></a> `exclusiveMinimum?`           | `readonly` | `number`                                                                                                                                             |
| <a id="exclusivemaximum"></a> `exclusiveMaximum?`           | `readonly` | `number`                                                                                                                                             |
| <a id="multipleof-2"></a> `multipleOf?`                     | `readonly` | `number`                                                                                                                                             |
| <a id="minlength-3"></a> `minLength?`                       | `readonly` | `number`                                                                                                                                             |
| <a id="maxlength-3"></a> `maxLength?`                       | `readonly` | `number`                                                                                                                                             |
| <a id="minitems"></a> `minItems?`                           | `readonly` | `number`                                                                                                                                             |
| <a id="maxitems"></a> `maxItems?`                           | `readonly` | `number`                                                                                                                                             |
| <a id="uniqueitems"></a> `uniqueItems?`                     | `readonly` | `boolean`                                                                                                                                            |
| <a id="items"></a> `items?`                                 | `readonly` | [`JsonSchemaProperty`](#jsonschemaproperty)                                                                                                          |
| <a id="properties-1"></a> `properties?`                     | `readonly` | [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, [`JsonSchemaProperty`](#jsonschemaproperty)\> |
| <a id="additionalproperties-1"></a> `additionalProperties?` | `readonly` | `boolean` \| [`JsonSchemaProperty`](#jsonschemaproperty)                                                                                             |
| <a id="required-2"></a> `required?`                         | `readonly` | readonly `string`[]                                                                                                                                  |
| <a id="oneof"></a> `oneOf?`                                 | `readonly` | readonly [`JsonSchemaProperty`](#jsonschemaproperty)[]                                                                                               |
| <a id="anyof"></a> `anyOf?`                                 | `readonly` | readonly [`JsonSchemaProperty`](#jsonschemaproperty)[]                                                                                               |
| <a id="allof"></a> `allOf?`                                 | `readonly` | readonly [`JsonSchemaProperty`](#jsonschemaproperty)[]                                                                                               |
| <a id="not"></a> `not?`                                     | `readonly` | [`JsonSchemaProperty`](#jsonschemaproperty)                                                                                                          |
| <a id="ref"></a> `$ref?`                                    | `readonly` | `string`                                                                                                                                             |

---

### ConfigDefinition\<T\>

#### Type Parameters

| Type Parameter | Default type                                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------------------ |
| `T`            | [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `unknown`\> |

#### Properties

| Property                                   | Modifier   | Type                                                                                            |
| ------------------------------------------ | ---------- | ----------------------------------------------------------------------------------------------- |
| <a id="name-3"></a> `name`                 | `readonly` | `string`                                                                                        |
| <a id="version-3"></a> `version?`          | `readonly` | `string`                                                                                        |
| <a id="description-14"></a> `description?` | `readonly` | `string`                                                                                        |
| <a id="schema-2"></a> `schema?`            | `readonly` | `unknown`                                                                                       |
| <a id="sources"></a> `sources`             | `readonly` | readonly [`ConfigSource`](#configsource)[]                                                      |
| <a id="defaults"></a> `defaults?`          | `readonly` | [`Partial`](https://www.typescriptlang.org/docs/handbook/utility-types.html#partialtype)\<`T`\> |
| <a id="transformers"></a> `transformers?`  | `readonly` | readonly [`ConfigTransformer`](#configtransformer)\<`T`\>[]                                     |
| <a id="validators"></a> `validators?`      | `readonly` | readonly [`ConfigValidator`](#configvalidator)\<`T`\>[]                                         |

---

### ConfigSource

#### Properties

| Property                            | Modifier   | Type                                                                                                               |
| ----------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------ |
| <a id="type-3"></a> `type`          | `readonly` | [`ConfigSourceType`](#configsourcetype-1)                                                                          |
| <a id="path-1"></a> `path?`         | `readonly` | `string`                                                                                                           |
| <a id="data"></a> `data?`           | `readonly` | [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `unknown`\> |
| <a id="priority"></a> `priority`    | `readonly` | `number`                                                                                                           |
| <a id="optional-6"></a> `optional?` | `readonly` | `boolean`                                                                                                          |
| <a id="watch"></a> `watch?`         | `readonly` | `boolean`                                                                                                          |
| <a id="env"></a> `env?`             | `readonly` | `string`                                                                                                           |

---

### ConfigProperty

#### Properties

| Property                                   | Modifier   | Type                                                                                                                                         |
| ------------------------------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="type-4"></a> `type`                 | `readonly` | [`ConfigPropertyType`](#configpropertytype-1)                                                                                                |
| <a id="description-15"></a> `description?` | `readonly` | `string`                                                                                                                                     |
| <a id="default-7"></a> `default?`          | `readonly` | `unknown`                                                                                                                                    |
| <a id="required-3"></a> `required?`        | `readonly` | `boolean`                                                                                                                                    |
| <a id="enum-4"></a> `enum?`                | `readonly` | readonly `unknown`[]                                                                                                                         |
| <a id="pattern-3"></a> `pattern?`          | `readonly` | `string`                                                                                                                                     |
| <a id="minimum-2"></a> `minimum?`          | `readonly` | `number`                                                                                                                                     |
| <a id="maximum-2"></a> `maximum?`          | `readonly` | `number`                                                                                                                                     |
| <a id="minlength-4"></a> `minLength?`      | `readonly` | `number`                                                                                                                                     |
| <a id="maxlength-4"></a> `maxLength?`      | `readonly` | `number`                                                                                                                                     |
| <a id="items-1"></a> `items?`              | `readonly` | [`ConfigProperty`](#configproperty)                                                                                                          |
| <a id="properties-2"></a> `properties?`    | `readonly` | [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, [`ConfigProperty`](#configproperty)\> |
| <a id="transform"></a> `transform?`        | `readonly` | (`value`) => `unknown`                                                                                                                       |
| <a id="validate-3"></a> `validate?`        | `readonly` | (`value`) => `boolean`                                                                                                                       |

---

### ConfigState\<T\>

#### Type Parameters

| Type Parameter | Default type                                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------------------ |
| `T`            | [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `unknown`\> |

#### Properties

| Property                             | Modifier   | Type                                                                                                               |
| ------------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------ |
| <a id="definition"></a> `definition` | `readonly` | [`ConfigDefinition`](#configdefinition)\<`T`\>                                                                     |
| <a id="raw"></a> `raw`               | `readonly` | [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `unknown`\> |
| <a id="resolved"></a> `resolved`     | `readonly` | `T`                                                                                                                |
| <a id="sources-1"></a> `sources`     | `readonly` | readonly [`ResolvedSource`](#resolvedsource)[]                                                                     |
| <a id="metadata-1"></a> `metadata`   | `readonly` | [`ConfigMetadata`](#configmetadata)                                                                                |

---

### ResolvedSource

#### Properties

| Property                         | Modifier   | Type                                                                                                               |
| -------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------ |
| <a id="source"></a> `source`     | `readonly` | [`ConfigSource`](#configsource)                                                                                    |
| <a id="data-1"></a> `data`       | `readonly` | [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `unknown`\> |
| <a id="loadtime"></a> `loadTime` | `readonly` | `number`                                                                                                           |
| <a id="error"></a> `error?`      | `readonly` | `CoreError`                                                                                                        |

---

### ConfigMetadata

#### Properties

| Property                                                 | Modifier   | Type                   |
| -------------------------------------------------------- | ---------- | ---------------------- |
| <a id="loadtime-1"></a> `loadTime`                       | `readonly` | `number`               |
| <a id="sourcecount"></a> `sourceCount`                   | `readonly` | `number`               |
| <a id="valid-1"></a> `valid`                             | `readonly` | `boolean`              |
| <a id="validationerrors"></a> `validationErrors`         | `readonly` | readonly `CoreError`[] |
| <a id="transformationerrors"></a> `transformationErrors` | `readonly` | readonly `CoreError`[] |
| <a id="version-4"></a> `version?`                        | `readonly` | `string`               |
| <a id="checksum"></a> `checksum?`                        | `readonly` | `string`               |

---

### ConfigLoader

#### Properties

| Property                         | Modifier   | Type                                                                                                                                                                                                                                                                         |
| -------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="load"></a> `load`         | `readonly` | (`source`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`ConfigResult`](#configresult)\<[`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `unknown`\>\>\> |
| <a id="watch-1"></a> `watch?`    | `readonly` | (`source`, `callback`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`ConfigResult`](#configresult)\<[`ConfigWatcher`](#configwatcher)\>\>                                                                      |
| <a id="supports"></a> `supports` | `readonly` | (`source`) => `boolean`                                                                                                                                                                                                                                                      |

---

### ConfigWatcher

#### Properties

| Property                       | Modifier   | Type                                                                                                                                                     |
| ------------------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="source-1"></a> `source` | `readonly` | [`ConfigSource`](#configsource)                                                                                                                          |
| <a id="stop"></a> `stop`       | `readonly` | () => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`ConfigResult`](#configresult)\<`void`\>\> |

---

### ConfigTransformer\<T\>

#### Type Parameters

| Type Parameter | Default type                                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------------------ |
| `T`            | [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `unknown`\> |

#### Properties

| Property                             | Modifier   | Type                                                 |
| ------------------------------------ | ---------- | ---------------------------------------------------- |
| <a id="name-4"></a> `name`           | `readonly` | `string`                                             |
| <a id="transform-1"></a> `transform` | `readonly` | (`config`) => [`ConfigResult`](#configresult)\<`T`\> |
| <a id="priority-1"></a> `priority?`  | `readonly` | `number`                                             |

---

### ConfigValidator\<T\>

#### Type Parameters

| Type Parameter | Default type                                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------------------ |
| `T`            | [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `unknown`\> |

#### Properties

| Property                            | Modifier   | Type                                                                                                                                                          |
| ----------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="name-5"></a> `name`          | `readonly` | `string`                                                                                                                                                      |
| <a id="schema-3"></a> `schema?`     | `readonly` | `unknown`                                                                                                                                                     |
| <a id="validate-4"></a> `validate`  | `readonly` | (`config`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`ConfigResult`](#configresult)\<`T`\>\> |
| <a id="priority-2"></a> `priority?` | `readonly` | `number`                                                                                                                                                      |

---

### ConfigOperations

#### Properties

| Property                             | Modifier   | Type                                                                                                                                                                                                                 |
| ------------------------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="create"></a> `create`         | `readonly` | \<`T`\>(`definition`) => [`ConfigResult`](#configresult)\<[`ConfigManager`](#configmanager)\<`T`\>\>                                                                                                                 |
| <a id="load-1"></a> `load`           | `readonly` | \<`T`\>(`definition`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`ConfigResult`](#configresult)\<[`ConfigState`](#configstate)\<`T`\>\>\>            |
| <a id="watch-2"></a> `watch`         | `readonly` | \<`T`\>(`definition`, `callback`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`ConfigResult`](#configresult)\<[`ConfigWatcher`](#configwatcher)[]\>\> |
| <a id="validate-5"></a> `validate`   | `readonly` | \<`T`\>(`config`, `schema`) => [`ConfigResult`](#configresult)\<`void`\>                                                                                                                                             |
| <a id="transform-2"></a> `transform` | `readonly` | \<`T`\>(`config`, `transformers`) => [`ConfigResult`](#configresult)\<`T`\>                                                                                                                                          |

---

### LoaderOperations

#### Properties

| Property                             | Modifier   | Type                                                                                                                                                                                                                                                                         |
| ------------------------------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="register"></a> `register`     | `readonly` | (`loader`) => `void`                                                                                                                                                                                                                                                         |
| <a id="unregister"></a> `unregister` | `readonly` | (`type`) => `void`                                                                                                                                                                                                                                                           |
| <a id="getloader"></a> `getLoader`   | `readonly` | (`source`) => `undefined` \| [`ConfigLoader`](#configloader)                                                                                                                                                                                                                 |
| <a id="load-2"></a> `load`           | `readonly` | (`source`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`ConfigResult`](#configresult)\<[`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `unknown`\>\>\> |

---

### ValidatorOperations

#### Properties

| Property                                                       | Modifier   | Type                                                                                                                                                                                                                           |
| -------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| <a id="register-1"></a> `register`                             | `readonly` | \<`T`\>(`validator`) => `void`                                                                                                                                                                                                 |
| <a id="unregister-1"></a> `unregister`                         | `readonly` | (`name`) => `void`                                                                                                                                                                                                             |
| <a id="validate-6"></a> `validate`                             | `readonly` | \<`T`\>(`config`, `validators`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`Result`](https://github.com/supermacro/neverthrow#result)\<`void`, `CoreError`\>\> |
| <a id="validateschema"></a> `validateSchema`                   | `readonly` | \<`T`\>(`config`, `schema`) => [`Result`](https://github.com/supermacro/neverthrow#result)\<`void`, `CoreError`\>                                                                                                              |
| <a id="getregisteredvalidators"></a> `getRegisteredValidators` | `readonly` | () => readonly `string`[]                                                                                                                                                                                                      |
| <a id="hasvalidator"></a> `hasValidator`                       | `readonly` | (`name`) => `boolean`                                                                                                                                                                                                          |

---

### TransformerOperations

#### Properties

| Property                               | Modifier   | Type                                                                        |
| -------------------------------------- | ---------- | --------------------------------------------------------------------------- |
| <a id="register-2"></a> `register`     | `readonly` | \<`T`\>(`transformer`) => `void`                                            |
| <a id="unregister-2"></a> `unregister` | `readonly` | (`name`) => `void`                                                          |
| <a id="transform-3"></a> `transform`   | `readonly` | \<`T`\>(`config`, `transformers`) => [`ConfigResult`](#configresult)\<`T`\> |

---

### ConfigManager\<T\>

#### Type Parameters

| Type Parameter | Default type                                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------------------ |
| `T`            | [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `unknown`\> |

#### Properties

| Property                               | Modifier   | Type                                                                                                                                                                                            |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="definition-1"></a> `definition` | `readonly` | [`ConfigDefinition`](#configdefinition)\<`T`\>                                                                                                                                                  |
| <a id="load-3"></a> `load`             | `readonly` | () => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`ConfigResult`](#configresult)\<[`ConfigState`](#configstate)\<`T`\>\>\>          |
| <a id="reload"></a> `reload`           | `readonly` | () => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`ConfigResult`](#configresult)\<[`ConfigState`](#configstate)\<`T`\>\>\>          |
| <a id="get"></a> `get`                 | `readonly` | \<`K`\>(`key`) => `undefined` \| `T`\[`K`\]                                                                                                                                                     |
| <a id="set"></a> `set`                 | `readonly` | \<`K`\>(`key`, `value`) => [`ConfigResult`](#configresult)\<`void`\>                                                                                                                            |
| <a id="has"></a> `has`                 | `readonly` | (`key`) => `boolean`                                                                                                                                                                            |
| <a id="watch-3"></a> `watch`           | `readonly` | (`callback`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`ConfigResult`](#configresult)\<[`ConfigWatcher`](#configwatcher)[]\>\> |
| <a id="validate-7"></a> `validate`     | `readonly` | () => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`ConfigResult`](#configresult)\<`void`\>\>                                        |
| <a id="getstate"></a> `getState`       | `readonly` | () => `undefined` \| [`ConfigState`](#configstate)\<`T`\>                                                                                                                                       |
| <a id="getmetadata"></a> `getMetadata` | `readonly` | () => `undefined` \| [`ConfigMetadata`](#configmetadata)                                                                                                                                        |

---

### ConfigChange

#### Properties

| Property                         | Modifier   | Type                            |
| -------------------------------- | ---------- | ------------------------------- |
| <a id="path-2"></a> `path`       | `readonly` | `string`                        |
| <a id="oldvalue"></a> `oldValue` | `readonly` | `unknown`                       |
| <a id="newvalue"></a> `newValue` | `readonly` | `unknown`                       |
| <a id="source-2"></a> `source`   | `readonly` | [`ConfigSource`](#configsource) |

---

### FileLoaderOptions

#### Properties

| Property                                            | Modifier   | Type                |
| --------------------------------------------------- | ---------- | ------------------- |
| <a id="encoding"></a> `encoding?`                   | `readonly` | `BufferEncoding`    |
| <a id="maxsize"></a> `maxSize?`                     | `readonly` | `number`            |
| <a id="allowedextensions"></a> `allowedExtensions?` | `readonly` | readonly `string`[] |

---

### EnvLoaderOptions

#### Properties

| Property                                    | Modifier   | Type      |
| ------------------------------------------- | ---------- | --------- |
| <a id="prefix"></a> `prefix?`               | `readonly` | `string`  |
| <a id="separator"></a> `separator?`         | `readonly` | `string`  |
| <a id="parsenumbers"></a> `parseNumbers?`   | `readonly` | `boolean` |
| <a id="parsebooleans"></a> `parseBooleans?` | `readonly` | `boolean` |
| <a id="allowempty"></a> `allowEmpty?`       | `readonly` | `boolean` |

---

### CLILoaderOptions

#### Properties

| Property                                      | Modifier   | Type                                                                                                              |
| --------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------- |
| <a id="prefix-1"></a> `prefix?`               | `readonly` | `string`                                                                                                          |
| <a id="separator-1"></a> `separator?`         | `readonly` | `string`                                                                                                          |
| <a id="parsenumbers-1"></a> `parseNumbers?`   | `readonly` | `boolean`                                                                                                         |
| <a id="parsebooleans-1"></a> `parseBooleans?` | `readonly` | `boolean`                                                                                                         |
| <a id="aliases"></a> `aliases?`               | `readonly` | [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `string`\> |

---

### ValidationError

#### Extends

- `ValidationError`

#### Properties

| Property                                  | Modifier   | Type                                                                                                               | Overrides                        | Inherited from                    |
| ----------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------- | --------------------------------- |
| <a id="suggestion"></a> `suggestion`      | `readonly` | `string`                                                                                                           | `BaseValidationError.suggestion` | -                                 |
| <a id="examples-9"></a> `examples`        | `readonly` | readonly `unknown`[]                                                                                               | -                                | -                                 |
| <a id="fixcommand"></a> `fixCommand?`     | `readonly` | `string`                                                                                                           | -                                | -                                 |
| <a id="learnmoreurl"></a> `learnMoreUrl?` | `readonly` | `string`                                                                                                           | -                                | -                                 |
| <a id="expectedtype"></a> `expectedType`  | `readonly` | `string`                                                                                                           | -                                | -                                 |
| <a id="path-3"></a> `path`                | `readonly` | readonly `string`[]                                                                                                | -                                | -                                 |
| <a id="data-2"></a> `data?`               | `readonly` | [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `unknown`\> | -                                | -                                 |
| <a id="code"></a> `code`                  | `readonly` | `string`                                                                                                           | -                                | `BaseValidationError.code`        |
| <a id="message"></a> `message`            | `readonly` | `string`                                                                                                           | -                                | `BaseValidationError.message`     |
| <a id="details"></a> `details?`           | `readonly` | `string`                                                                                                           | -                                | `BaseValidationError.details`     |
| <a id="cause"></a> `cause?`               | `readonly` | `unknown`                                                                                                          | -                                | `BaseValidationError.cause`       |
| <a id="recoverable"></a> `recoverable`    | `readonly` | `boolean`                                                                                                          | -                                | `BaseValidationError.recoverable` |
| <a id="context"></a> `context?`           | `readonly` | [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `unknown`\> | -                                | `BaseValidationError.context`     |
| <a id="component"></a> `component`        | `readonly` | `string`                                                                                                           | -                                | `BaseValidationError.component`   |
| <a id="operation"></a> `operation`        | `readonly` | `string`                                                                                                           | -                                | `BaseValidationError.operation`   |
| <a id="timestamp"></a> `timestamp`        | `readonly` | `Date`                                                                                                             | -                                | `BaseValidationError.timestamp`   |
| <a id="severity"></a> `severity`          | `readonly` | `"low"` \| `"medium"` \| `"high"` \| `"critical"`                                                                  | -                                | `BaseValidationError.severity`    |
| <a id="type-5"></a> `type`                | `readonly` | `"VALIDATION_ERROR"`                                                                                               | -                                | `BaseValidationError.type`        |
| <a id="field"></a> `field?`               | `readonly` | `string`                                                                                                           | -                                | `BaseValidationError.field`       |
| <a id="value"></a> `value?`               | `readonly` | `unknown`                                                                                                          | -                                | `BaseValidationError.value`       |
| <a id="constraints-1"></a> `constraints?` | `readonly` | [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `unknown`\> | -                                | `BaseValidationError.constraints` |

---

### ValidationContext

#### Properties

| Property                                    | Modifier   | Type                                                                                                               |
| ------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------ |
| <a id="field-1"></a> `field`                | `readonly` | `string`                                                                                                           |
| <a id="value-1"></a> `value`                | `readonly` | `unknown`                                                                                                          |
| <a id="expectedtype-1"></a> `expectedType`  | `readonly` | `string`                                                                                                           |
| <a id="suggestion-1"></a> `suggestion`      | `readonly` | `string`                                                                                                           |
| <a id="examples-10"></a> `examples?`        | `readonly` | readonly `unknown`[]                                                                                               |
| <a id="path-4"></a> `path?`                 | `readonly` | readonly `string`[]                                                                                                |
| <a id="rule"></a> `rule?`                   | `readonly` | `string`                                                                                                           |
| <a id="constraints-2"></a> `constraints?`   | `readonly` | [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `unknown`\> |
| <a id="cause-1"></a> `cause?`               | `readonly` | `CoreError` \| `Error`                                                                                             |
| <a id="fixcommand-1"></a> `fixCommand?`     | `readonly` | `string`                                                                                                           |
| <a id="learnmoreurl-1"></a> `learnMoreUrl?` | `readonly` | `string`                                                                                                           |

## Type Aliases

### ConfigResult\<T\>

> **ConfigResult**\<`T`\> = [`Result`](https://github.com/supermacro/neverthrow#result)\<`T`, `CoreError`\>

#### Type Parameters

| Type Parameter |
| -------------- |
| `T`            |

---

### ConfigSourceType

> **ConfigSourceType** = `"file"` \| `"env"` \| `"cli"` \| `"object"` \| `"remote"` \| `"vault"`

---

### ConfigPropertyType

> **ConfigPropertyType** = `"string"` \| `"number"` \| `"boolean"` \| `"array"` \| `"object"` \| `"null"`

---

### ConfigWatchCallback()

> **ConfigWatchCallback** = (`data`, `error?`) => `void`

#### Parameters

| Parameter | Type                                                                                                               |
| --------- | ------------------------------------------------------------------------------------------------------------------ |
| `data`    | [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `unknown`\> |
| `error?`  | `CoreError`                                                                                                        |

#### Returns

`void`

---

### ConfigChangeCallback()\<T\>

> **ConfigChangeCallback**\<`T`\> = (`newConfig`, `oldConfig`, `changes`) => `void`

#### Type Parameters

| Type Parameter | Default type                                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------------------ |
| `T`            | [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `unknown`\> |

#### Parameters

| Parameter   | Type                                       |
| ----------- | ------------------------------------------ |
| `newConfig` | `T`                                        |
| `oldConfig` | `T`                                        |
| `changes`   | readonly [`ConfigChange`](#configchange)[] |

#### Returns

`void`

---

### DeepPartial\<T\>

> **DeepPartial**\<`T`\> = `{ readonly [P in keyof T]?: T[P] extends (infer U)[] ? DeepPartial<U>[] : T[P] extends readonly (infer U)[] ? readonly DeepPartial<U>[] : T[P] extends object ? DeepPartial<T[P]> : T[P] }`

#### Type Parameters

| Type Parameter |
| -------------- |
| `T`            |

---

### ConfigPath\<T\>

> **ConfigPath**\<`T`\> = `T` _extends_ `object` ? \{ readonly \[K in keyof T\]: K extends string ? T\[K\] extends object ? \`$\{K\}\` \| \`$\{K\}.$\{ConfigPath\<T\[K\]\>\}\` : \`$\{K\}\` : never \}\[keyof `T`\] : `never`

#### Type Parameters

| Type Parameter |
| -------------- |
| `T`            |

## Functions

### createConfigManager()

> **createConfigManager**\<`T`\>(`definition`, `deps`): [`ConfigManager`](#configmanager)\<`T`\>

#### Type Parameters

| Type Parameter |
| -------------- |
| `T`            |

#### Parameters

| Parameter    | Type                                           |
| ------------ | ---------------------------------------------- |
| `definition` | [`ConfigDefinition`](#configdefinition)\<`T`\> |
| `deps`       | `ManagerDependencies`                          |

#### Returns

[`ConfigManager`](#configmanager)\<`T`\>

---

### createConfigOperations()

> **createConfigOperations**(): `ConfigOperations`

#### Returns

`ConfigOperations`

---

### defineSchema()

> **defineSchema**\<`_T`\>(): `object`

#### Type Parameters

| Type Parameter                                                                                                                    |
| --------------------------------------------------------------------------------------------------------------------------------- |
| `_T` _extends_ [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `unknown`\> |

#### Returns

`object`

| Name       | Type                                                                                                                                                                        |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `object()` | \<`K`\>(`shape`) => [`SchemaBuilder`](#schemabuilder)\<[`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `unknown`\>\> |

---

### createSchema()

> **createSchema**\<`T`\>(`zodSchema`): [`SchemaBuilder`](#schemabuilder)\<`T`\>

#### Type Parameters

| Type Parameter |
| -------------- |
| `T`            |

#### Parameters

| Parameter   | Type                                                |
| ----------- | --------------------------------------------------- |
| `zodSchema` | [`ZodType`](https://zod.dev/?id=basic-usage)\<`T`\> |

#### Returns

[`SchemaBuilder`](#schemabuilder)\<`T`\>

---

### string()

> **string**(): [`StringFieldBuilder`](#stringfieldbuilder)

#### Returns

[`StringFieldBuilder`](#stringfieldbuilder)

---

### number()

> **number**(): [`NumberFieldBuilder`](#numberfieldbuilder)

#### Returns

[`NumberFieldBuilder`](#numberfieldbuilder)

---

### boolean()

> **boolean**(): [`BooleanFieldBuilder`](#booleanfieldbuilder)

#### Returns

[`BooleanFieldBuilder`](#booleanfieldbuilder)

---

### array()

> **array**\<`T`\>(`elementSchema`): [`ArrayFieldBuilder`](#arrayfieldbuilder)\<`T`\>

#### Type Parameters

| Type Parameter |
| -------------- |
| `T`            |

#### Parameters

| Parameter       | Type                                                |
| --------------- | --------------------------------------------------- |
| `elementSchema` | [`ZodType`](https://zod.dev/?id=basic-usage)\<`T`\> |

#### Returns

[`ArrayFieldBuilder`](#arrayfieldbuilder)\<`T`\>

---

### object()

> **object**\<`T`\>(`shape`): [`ObjectFieldBuilder`](#objectfieldbuilder)\<`any`\>

#### Type Parameters

| Type Parameter                                                                                                               |
| ---------------------------------------------------------------------------------------------------------------------------- |
| `T` _extends_ [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `any`\> |

#### Parameters

| Parameter | Type |
| --------- | ---- |
| `shape`   | `T`  |

#### Returns

[`ObjectFieldBuilder`](#objectfieldbuilder)\<`any`\>

---

### validate()

> **validate**\<`T`\>(`data`, `schema`): `ConfigResult`\<`T`\>

#### Type Parameters

| Type Parameter |
| -------------- |
| `T`            |

#### Parameters

| Parameter | Type                                   |
| --------- | -------------------------------------- |
| `data`    | `unknown`                              |
| `schema`  | [`ConfigSchema`](#configschema)\<`T`\> |

#### Returns

`ConfigResult`\<`T`\>

---

### validateAsync()

> **validateAsync**\<`T`\>(`data`, `schema`): [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<`ConfigResult`\<`T`\>\>

#### Type Parameters

| Type Parameter |
| -------------- |
| `T`            |

#### Parameters

| Parameter | Type                                   |
| --------- | -------------------------------------- |
| `data`    | `unknown`                              |
| `schema`  | [`ConfigSchema`](#configschema)\<`T`\> |

#### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<`ConfigResult`\<`T`\>\>

---

### createZodSchema()

> **createZodSchema**\<`T`\>(`shape`): [`SchemaBuilder`](#schemabuilder)\<`$InferObjectOutput`\<\{ -readonly \[P in string \| number \| symbol\]: T\[P\] \}, \{ \}\>\>

#### Type Parameters

| Type Parameter                                                                                                                                                                                                       |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `T` _extends_ [`Readonly`](https://www.typescriptlang.org/docs/handbook/utility-types.html#readonlytype)\<\{\[`k`: `string`\]: `$ZodType`\<`unknown`, `unknown`, `$ZodTypeInternals`\<`unknown`, `unknown`\>\>; \}\> |

#### Parameters

| Parameter | Type |
| --------- | ---- |
| `shape`   | `T`  |

#### Returns

[`SchemaBuilder`](#schemabuilder)\<`$InferObjectOutput`\<\{ -readonly \[P in string \| number \| symbol\]: T\[P\] \}, \{ \}\>\>

---

### generateDocs()

> **generateDocs**\<`T`\>(`schema`, `options`): [`Result`](https://github.com/supermacro/neverthrow#result)\<[`ConfigDocs`](#configdocs), `CoreError`\>

#### Type Parameters

| Type Parameter |
| -------------- |
| `T`            |

#### Parameters

| Parameter | Type                                            |
| --------- | ----------------------------------------------- |
| `schema`  | [`ConfigSchema`](#configschema)\<`T`\>          |
| `options` | [`DocsGeneratorOptions`](#docsgeneratoroptions) |

#### Returns

[`Result`](https://github.com/supermacro/neverthrow#result)\<[`ConfigDocs`](#configdocs), `CoreError`\>

---

### generateJsonSchema()

> **generateJsonSchema**(`zodSchema`, `title?`, `description?`): [`JsonSchema`](#jsonschema)

#### Parameters

| Parameter      | Type                                         |
| -------------- | -------------------------------------------- |
| `zodSchema`    | [`ZodType`](https://zod.dev/?id=basic-usage) |
| `title?`       | `string`                                     |
| `description?` | `string`                                     |

#### Returns

[`JsonSchema`](#jsonschema)

---

### createLoaderOperations()

> **createLoaderOperations**(): [`LoaderOperations`](#loaderoperations)

#### Returns

[`LoaderOperations`](#loaderoperations)

---

### createTransformerOperations()

> **createTransformerOperations**(): [`TransformerOperations`](#transformeroperations)

#### Returns

[`TransformerOperations`](#transformeroperations)

---

### createValidationError()

> **createValidationError**(`context`): [`ValidationError`](#validationerror)

#### Parameters

| Parameter | Type                                      |
| --------- | ----------------------------------------- |
| `context` | [`ValidationContext`](#validationcontext) |

#### Returns

[`ValidationError`](#validationerror)

---

### enhanceZodError()

> **enhanceZodError**(`zodError`, `schemaName?`, `schema?`): `CoreError`

#### Parameters

| Parameter     | Type                                                                                                              |
| ------------- | ----------------------------------------------------------------------------------------------------------------- |
| `zodError`    | [`ZodError`](https://zod.dev/?id=error-handling)                                                                  |
| `schemaName?` | `string`                                                                                                          |
| `schema?`     | [`ZodType`](https://zod.dev/?id=basic-usage)\<`unknown`, `unknown`, `$ZodTypeInternals`\<`unknown`, `unknown`\>\> |

#### Returns

`CoreError`

---

### formatValidationError()

> **formatValidationError**(`error`, `options?`): `string`

#### Parameters

| Parameter  | Type                                  |
| ---------- | ------------------------------------- |
| `error`    | [`ValidationError`](#validationerror) |
| `options?` | `FormatterOptions`                    |

#### Returns

`string`

---

### formatValidationErrors()

> **formatValidationErrors**(`errors`, `options?`): `string`

#### Parameters

| Parameter  | Type                                             |
| ---------- | ------------------------------------------------ |
| `errors`   | readonly [`ValidationError`](#validationerror)[] |
| `options?` | `FormatterOptions`                               |

#### Returns

`string`

---

### createValidatorOperations()

> **createValidatorOperations**(): `ValidatorOperations`

#### Returns

`ValidatorOperations`
