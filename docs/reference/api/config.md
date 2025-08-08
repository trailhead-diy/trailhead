---
type: reference
sidebar: true
---

[**Trailhead API Documentation v1.0.0**](README.md)

---

[Trailhead API Documentation](README.md) / @esteban-url/config

# @esteban-url/config

## Interfaces

### ArrayFieldBuilder\<T\>

Array field builder providing fluent API for array configuration fields.

Supports length constraints, item validation, and array-specific validations
like non-empty requirements.

#### Type Parameters

##### T

`T`

The type of items in the array

#### Properties

##### build()

> `readonly` **build**: () => `ZodType`\<`undefined` \| `T`[]\>

###### Returns

`ZodType`\<`undefined` \| `T`[]\>

##### default()

> `readonly` **default**: (`defaultValue`) => [`ArrayFieldBuilder`](#arrayfieldbuilder)\<`T`\>

###### Parameters

###### defaultValue

`T`[]

###### Returns

[`ArrayFieldBuilder`](#arrayfieldbuilder)\<`T`\>

##### description()

> `readonly` **description**: (`description`) => [`ArrayFieldBuilder`](#arrayfieldbuilder)\<`T`\>

###### Parameters

###### description

`string`

###### Returns

[`ArrayFieldBuilder`](#arrayfieldbuilder)\<`T`\>

##### examples()

> `readonly` **examples**: (...`examples`) => [`ArrayFieldBuilder`](#arrayfieldbuilder)\<`T`\>

###### Parameters

###### examples

...`T`[][]

###### Returns

[`ArrayFieldBuilder`](#arrayfieldbuilder)\<`T`\>

##### length()

> `readonly` **length**: (`length`, `message?`) => [`ArrayFieldBuilder`](#arrayfieldbuilder)\<`T`\>

###### Parameters

###### length

`number`

###### message?

`string`

###### Returns

[`ArrayFieldBuilder`](#arrayfieldbuilder)\<`T`\>

##### maxLength()

> `readonly` **maxLength**: (`max`, `message?`) => [`ArrayFieldBuilder`](#arrayfieldbuilder)\<`T`\>

###### Parameters

###### max

`number`

###### message?

`string`

###### Returns

[`ArrayFieldBuilder`](#arrayfieldbuilder)\<`T`\>

##### minLength()

> `readonly` **minLength**: (`min`, `message?`) => [`ArrayFieldBuilder`](#arrayfieldbuilder)\<`T`\>

###### Parameters

###### min

`number`

###### message?

`string`

###### Returns

[`ArrayFieldBuilder`](#arrayfieldbuilder)\<`T`\>

##### nonempty()

> `readonly` **nonempty**: (`message?`) => [`ArrayFieldBuilder`](#arrayfieldbuilder)\<`T`\>

###### Parameters

###### message?

`string`

###### Returns

[`ArrayFieldBuilder`](#arrayfieldbuilder)\<`T`\>

##### optional()

> `readonly` **optional**: () => [`ArrayFieldBuilder`](#arrayfieldbuilder)\<`T`\>

###### Returns

[`ArrayFieldBuilder`](#arrayfieldbuilder)\<`T`\>

---

### BooleanFieldBuilder

Boolean field builder providing fluent API for boolean configuration fields.

Supports optional flags, default values, and examples for documentation.

#### Properties

##### build()

> `readonly` **build**: () => `ZodType`\<`undefined` \| `boolean`\>

###### Returns

`ZodType`\<`undefined` \| `boolean`\>

##### default()

> `readonly` **default**: (`defaultValue`) => [`BooleanFieldBuilder`](#booleanfieldbuilder)

###### Parameters

###### defaultValue

`boolean`

###### Returns

[`BooleanFieldBuilder`](#booleanfieldbuilder)

##### description()

> `readonly` **description**: (`description`) => [`BooleanFieldBuilder`](#booleanfieldbuilder)

###### Parameters

###### description

`string`

###### Returns

[`BooleanFieldBuilder`](#booleanfieldbuilder)

##### examples()

> `readonly` **examples**: (...`examples`) => [`BooleanFieldBuilder`](#booleanfieldbuilder)

###### Parameters

###### examples

...`boolean`[]

###### Returns

[`BooleanFieldBuilder`](#booleanfieldbuilder)

##### optional()

> `readonly` **optional**: () => [`BooleanFieldBuilder`](#booleanfieldbuilder)

###### Returns

[`BooleanFieldBuilder`](#booleanfieldbuilder)

---

### CLILoaderOptions

CLI loader options interface for configuring command-line argument loading.

Provides options for controlling how command-line arguments are processed
including prefixes, separators, type parsing, and argument aliases.

#### Properties

##### aliases?

> `readonly` `optional` **aliases**: `Record`\<`string`, `string`\>

##### parseBooleans?

> `readonly` `optional` **parseBooleans**: `boolean`

##### parseNumbers?

> `readonly` `optional` **parseNumbers**: `boolean`

##### prefix?

> `readonly` `optional` **prefix**: `string`

##### separator?

> `readonly` `optional` **separator**: `string`

---

### ConfigChange

Configuration change interface describing individual configuration changes.

Provides detailed information about what changed including the path,
old and new values, and the source that triggered the change.

#### Properties

##### newValue

> `readonly` **newValue**: `unknown`

##### oldValue

> `readonly` **oldValue**: `unknown`

##### path

> `readonly` **path**: `string`

##### source

> `readonly` **source**: [`ConfigSource`](#configsource)

---

### ConfigDefinition\<T\>

Configuration definition interface defining the structure and behavior of configuration.

Specifies sources to load from, validation rules, transformation logic,
and metadata for a complete configuration system setup.

#### Type Parameters

##### T

`T` = `Record`\<`string`, `unknown`\>

The type of configuration data this definition describes

#### Properties

##### defaults?

> `readonly` `optional` **defaults**: [`Partial`](https://www.typescriptlang.org/docs/handbook/utility-types.html#partialtype)\<`T`\>

##### description?

> `readonly` `optional` **description**: `string`

##### name

> `readonly` **name**: `string`

##### schema?

> `readonly` `optional` **schema**: `unknown`

##### sources

> `readonly` **sources**: readonly [`ConfigSource`](#configsource)[]

##### transformers?

> `readonly` `optional` **transformers**: readonly [`ConfigTransformer`](#configtransformer)\<`T`\>[]

##### validators?

> `readonly` `optional` **validators**: readonly [`ConfigValidator`](#configvalidator)\<`T`\>[]

##### version?

> `readonly` `optional` **version**: `string`

---

### ConfigLoader

Configuration loader interface for implementing source-specific loaders.

Defines the contract for loaders that can fetch configuration data from
specific source types with optional change watching capabilities.

#### Properties

##### load()

> `readonly` **load**: (`source`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`ConfigResult`](#configresult)\<`Record`\<`string`, `unknown`\>\>\>

###### Parameters

###### source

[`ConfigSource`](#configsource)

###### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`ConfigResult`](#configresult)\<`Record`\<`string`, `unknown`\>\>\>

##### supports()

> `readonly` **supports**: (`source`) => `boolean`

###### Parameters

###### source

[`ConfigSource`](#configsource)

###### Returns

`boolean`

##### watch()?

> `readonly` `optional` **watch**: (`source`, `callback`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`ConfigResult`](#configresult)\<[`ConfigWatcher`](#configwatcher)\>\>

###### Parameters

###### source

[`ConfigSource`](#configsource)

###### callback

[`ConfigWatchCallback`](#configwatchcallback)

###### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`ConfigResult`](#configresult)\<[`ConfigWatcher`](#configwatcher)\>\>

---

### ConfigManager\<T\>

Configuration manager interface providing lifecycle management for configuration.

Manages the complete lifecycle of configuration including loading, watching,
validation, and providing access to configuration values with type safety.

#### Type Parameters

##### T

`T` = `Record`\<`string`, `unknown`\>

The type of configuration data being managed

#### Properties

##### definition

> `readonly` **definition**: [`ConfigDefinition`](#configdefinition)\<`T`\>

##### get()

> `readonly` **get**: \<`K`\>(`key`) => `undefined` \| `T`\[`K`\]

###### Type Parameters

###### K

`K` _extends_ `string` \| `number` \| `symbol`

###### Parameters

###### key

`K`

###### Returns

`undefined` \| `T`\[`K`\]

##### getMetadata()

> `readonly` **getMetadata**: () => `undefined` \| [`ConfigMetadata`](#configmetadata)

###### Returns

`undefined` \| [`ConfigMetadata`](#configmetadata)

##### getState()

> `readonly` **getState**: () => `undefined` \| [`ConfigState`](#configstate)\<`T`\>

###### Returns

`undefined` \| [`ConfigState`](#configstate)\<`T`\>

##### has()

> `readonly` **has**: (`key`) => `boolean`

###### Parameters

###### key

keyof `T`

###### Returns

`boolean`

##### load()

> `readonly` **load**: () => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`ConfigResult`](#configresult)\<[`ConfigState`](#configstate)\<`T`\>\>\>

###### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`ConfigResult`](#configresult)\<[`ConfigState`](#configstate)\<`T`\>\>\>

##### reload()

> `readonly` **reload**: () => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`ConfigResult`](#configresult)\<[`ConfigState`](#configstate)\<`T`\>\>\>

###### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`ConfigResult`](#configresult)\<[`ConfigState`](#configstate)\<`T`\>\>\>

##### set()

> `readonly` **set**: \<`K`\>(`key`, `value`) => [`ConfigResult`](#configresult)\<`void`\>

###### Type Parameters

###### K

`K` _extends_ `string` \| `number` \| `symbol`

###### Parameters

###### key

`K`

###### value

`T`\[`K`\]

###### Returns

[`ConfigResult`](#configresult)\<`void`\>

##### validate()

> `readonly` **validate**: () => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`ConfigResult`](#configresult)\<`void`\>\>

###### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`ConfigResult`](#configresult)\<`void`\>\>

##### watch()

> `readonly` **watch**: (`callback`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`ConfigResult`](#configresult)\<[`ConfigWatcher`](#configwatcher)[]\>\>

###### Parameters

###### callback

[`ConfigChangeCallback`](#configchangecallback)\<`T`\>

###### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`ConfigResult`](#configresult)\<[`ConfigWatcher`](#configwatcher)[]\>\>

---

### ConfigMetadata

Configuration metadata interface containing information about the loading process.

Provides timing, validation results, and other metadata about how the
configuration was loaded and processed.

#### Properties

##### checksum?

> `readonly` `optional` **checksum**: `string`

##### loadTime

> `readonly` **loadTime**: `number`

##### sourceCount

> `readonly` **sourceCount**: `number`

##### transformationErrors

> `readonly` **transformationErrors**: readonly [`CoreError`](@esteban-url.cli.md#coreerror)[]

##### valid

> `readonly` **valid**: `boolean`

##### validationErrors

> `readonly` **validationErrors**: readonly [`CoreError`](@esteban-url.cli.md#coreerror)[]

##### version?

> `readonly` `optional` **version**: `string`

---

### ConfigOperations

Configuration operations interface providing the main API for configuration management.

Defines the core operations for creating managers, loading configuration,
watching for changes, and performing validation and transformation.

#### Properties

##### create()

> `readonly` **create**: \<`T`\>(`definition`) => [`ConfigResult`](#configresult)\<[`ConfigManager`](#configmanager)\<`T`\>\>

###### Type Parameters

###### T

`T`

###### Parameters

###### definition

[`ConfigDefinition`](#configdefinition)\<`T`\>

###### Returns

[`ConfigResult`](#configresult)\<[`ConfigManager`](#configmanager)\<`T`\>\>

##### load()

> `readonly` **load**: \<`T`\>(`definition`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`ConfigResult`](#configresult)\<[`ConfigState`](#configstate)\<`T`\>\>\>

###### Type Parameters

###### T

`T`

###### Parameters

###### definition

[`ConfigDefinition`](#configdefinition)\<`T`\>

###### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`ConfigResult`](#configresult)\<[`ConfigState`](#configstate)\<`T`\>\>\>

##### transform()

> `readonly` **transform**: \<`T`\>(`config`, `transformers`) => [`ConfigResult`](#configresult)\<`T`\>

###### Type Parameters

###### T

`T`

###### Parameters

###### config

`Record`\<`string`, `unknown`\>

###### transformers

readonly [`ConfigTransformer`](#configtransformer)\<`T`\>[]

###### Returns

[`ConfigResult`](#configresult)\<`T`\>

##### validate()

> `readonly` **validate**: \<`T`\>(`config`, `schema`) => [`ConfigResult`](#configresult)\<`void`\>

###### Type Parameters

###### T

`T`

###### Parameters

###### config

`T`

###### schema

`ConfigSchema`\<`T`\>

###### Returns

[`ConfigResult`](#configresult)\<`void`\>

##### watch()

> `readonly` **watch**: \<`T`\>(`definition`, `callback`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`ConfigResult`](#configresult)\<[`ConfigWatcher`](#configwatcher)[]\>\>

###### Type Parameters

###### T

`T`

###### Parameters

###### definition

[`ConfigDefinition`](#configdefinition)\<`T`\>

###### callback

[`ConfigChangeCallback`](#configchangecallback)\<`T`\>

###### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`ConfigResult`](#configresult)\<[`ConfigWatcher`](#configwatcher)[]\>\>

---

### ConfigProperty

Configuration property interface defining validation rules for individual fields.

Specifies type constraints, validation rules, default values, and
transformation logic for configuration properties.

#### Properties

##### default?

> `readonly` `optional` **default**: `unknown`

##### description?

> `readonly` `optional` **description**: `string`

##### enum?

> `readonly` `optional` **enum**: readonly `unknown`[]

##### items?

> `readonly` `optional` **items**: [`ConfigProperty`](#configproperty)

##### maximum?

> `readonly` `optional` **maximum**: `number`

##### maxLength?

> `readonly` `optional` **maxLength**: `number`

##### minimum?

> `readonly` `optional` **minimum**: `number`

##### minLength?

> `readonly` `optional` **minLength**: `number`

##### pattern?

> `readonly` `optional` **pattern**: `string`

##### properties?

> `readonly` `optional` **properties**: `Record`\<`string`, [`ConfigProperty`](#configproperty)\>

##### required?

> `readonly` `optional` **required**: `boolean`

##### transform()?

> `readonly` `optional` **transform**: (`value`) => `unknown`

###### Parameters

###### value

`unknown`

###### Returns

`unknown`

##### type

> `readonly` **type**: [`ConfigPropertyType`](#configpropertytype-1)

##### validate()?

> `readonly` `optional` **validate**: (`value`) => `boolean`

###### Parameters

###### value

`unknown`

###### Returns

`boolean`

---

### ConfigSchema\<T\>

Zod-powered configuration schema with metadata and validation options.

Provides enhanced schema definition with name, description, versioning,
and strict mode configuration for comprehensive configuration management.

#### Type Parameters

##### T

`T` = `Record`\<`string`, `unknown`\>

#### Properties

##### description?

> `readonly` `optional` **description**: `string`

##### name?

> `readonly` `optional` **name**: `string`

##### strict?

> `readonly` `optional` **strict**: `boolean`

##### version?

> `readonly` `optional` **version**: `string`

##### zodSchema

> `readonly` **zodSchema**: `ZodType`\<`T`\>

---

### ConfigSource

Configuration source interface defining where configuration data comes from.

Describes a single source of configuration data with loading options,
priority for merging, and optional features like watching for changes.

#### Properties

##### data?

> `readonly` `optional` **data**: `Record`\<`string`, `unknown`\>

##### env?

> `readonly` `optional` **env**: `string`

##### optional?

> `readonly` `optional` **optional**: `boolean`

##### path?

> `readonly` `optional` **path**: `string`

##### priority

> `readonly` **priority**: `number`

##### type

> `readonly` **type**: [`ConfigSourceType`](#configsourcetype-1)

##### watch?

> `readonly` `optional` **watch**: `boolean`

---

### ConfigState\<T\>

Configuration state interface representing loaded and processed configuration.

Contains the complete state of a configuration including raw data,
processed values, source information, and metadata about the loading process.

#### Type Parameters

##### T

`T` = `Record`\<`string`, `unknown`\>

The type of the resolved configuration data

#### Properties

##### definition

> `readonly` **definition**: [`ConfigDefinition`](#configdefinition)\<`T`\>

##### metadata

> `readonly` **metadata**: [`ConfigMetadata`](#configmetadata)

##### raw

> `readonly` **raw**: `Record`\<`string`, `unknown`\>

##### resolved

> `readonly` **resolved**: `T`

##### sources

> `readonly` **sources**: readonly [`ResolvedSource`](#resolvedsource)[]

---

### ConfigTransformer\<T\>

Configuration transformer interface for modifying configuration data.

Defines transformers that can modify configuration data during the loading
process, such as environment variable expansion or format conversion.

#### Type Parameters

##### T

`T` = `Record`\<`string`, `unknown`\>

The type of configuration data after transformation

#### Properties

##### name

> `readonly` **name**: `string`

##### priority?

> `readonly` `optional` **priority**: `number`

##### transform()

> `readonly` **transform**: (`config`) => [`ConfigResult`](#configresult)\<`T`\>

###### Parameters

###### config

`Record`\<`string`, `unknown`\>

###### Returns

[`ConfigResult`](#configresult)\<`T`\>

---

### ConfigValidator\<T\>

Configuration validator interface for custom validation logic.

Defines validators that can perform complex business logic validation
beyond basic schema validation, such as connectivity checks or
environment-specific constraints.

#### Type Parameters

##### T

`T` = `Record`\<`string`, `unknown`\>

The type of configuration data being validated

#### Properties

##### name

> `readonly` **name**: `string`

##### priority?

> `readonly` `optional` **priority**: `number`

##### schema?

> `readonly` `optional` **schema**: `unknown`

##### validate()

> `readonly` **validate**: (`config`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`ConfigResult`](#configresult)\<`T`\>\>

###### Parameters

###### config

`unknown`

###### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`ConfigResult`](#configresult)\<`T`\>\>

---

### ConfigWatcher

Configuration watcher interface for managing ongoing configuration monitoring.

Represents an active watch operation on a configuration source with
the ability to stop watching when no longer needed.

#### Properties

##### source

> `readonly` **source**: [`ConfigSource`](#configsource)

##### stop()

> `readonly` **stop**: () => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`ConfigResult`](#configresult)\<`void`\>\>

###### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`ConfigResult`](#configresult)\<`void`\>\>

---

### EnvLoaderOptions

Environment loader options interface for configuring environment variable loading.

Provides options for controlling how environment variables are processed
including prefixes, separators, and type parsing behavior.

#### Properties

##### allowEmpty?

> `readonly` `optional` **allowEmpty**: `boolean`

##### parseBooleans?

> `readonly` `optional` **parseBooleans**: `boolean`

##### parseNumbers?

> `readonly` `optional` **parseNumbers**: `boolean`

##### prefix?

> `readonly` `optional` **prefix**: `string`

##### separator?

> `readonly` `optional` **separator**: `string`

---

### FieldBuilder\<T\>

Generic field builder interface for all configuration field types.

Provides common functionality like descriptions, optional flags,
default values, and examples that apply to all field types.

#### Type Parameters

##### T

`T`

The type of value this field validates

#### Properties

##### build()

> `readonly` **build**: () => `ZodType`\<`undefined` \| `T`\>

###### Returns

`ZodType`\<`undefined` \| `T`\>

##### default()

> `readonly` **default**: (`defaultValue`) => [`FieldBuilder`](#fieldbuilder)\<`T`\>

###### Parameters

###### defaultValue

`T`

###### Returns

[`FieldBuilder`](#fieldbuilder)\<`T`\>

##### description()

> `readonly` **description**: (`description`) => [`FieldBuilder`](#fieldbuilder)\<`T`\>

###### Parameters

###### description

`string`

###### Returns

[`FieldBuilder`](#fieldbuilder)\<`T`\>

##### examples()

> `readonly` **examples**: (...`examples`) => [`FieldBuilder`](#fieldbuilder)\<`T`\>

###### Parameters

###### examples

...`T`[]

###### Returns

[`FieldBuilder`](#fieldbuilder)\<`T`\>

##### optional()

> `readonly` **optional**: () => [`FieldBuilder`](#fieldbuilder)\<`T`\>

###### Returns

[`FieldBuilder`](#fieldbuilder)\<`T`\>

---

### FileLoaderOptions

File loader options interface for configuring file-based configuration loading.

Provides options for controlling how configuration files are loaded including
encoding, size limits, and allowed file extensions.

#### Properties

##### allowedExtensions?

> `readonly` `optional` **allowedExtensions**: readonly `string`[]

##### encoding?

> `readonly` `optional` **encoding**: `BufferEncoding`

##### maxSize?

> `readonly` `optional` **maxSize**: `number`

---

### LoaderOperations

Loader operations interface for managing configuration source loaders.

Provides registration and management capabilities for loaders that can
fetch configuration data from various source types.

#### Properties

##### getLoader()

> `readonly` **getLoader**: (`source`) => `undefined` \| [`ConfigLoader`](#configloader)

###### Parameters

###### source

[`ConfigSource`](#configsource)

###### Returns

`undefined` \| [`ConfigLoader`](#configloader)

##### load()

> `readonly` **load**: (`source`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`ConfigResult`](#configresult)\<`Record`\<`string`, `unknown`\>\>\>

###### Parameters

###### source

[`ConfigSource`](#configsource)

###### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`ConfigResult`](#configresult)\<`Record`\<`string`, `unknown`\>\>\>

##### register()

> `readonly` **register**: (`loader`) => `void`

###### Parameters

###### loader

[`ConfigLoader`](#configloader)

###### Returns

`void`

##### unregister()

> `readonly` **unregister**: (`type`) => `void`

###### Parameters

###### type

[`ConfigSourceType`](#configsourcetype-1)

###### Returns

`void`

---

### NumberFieldBuilder

Number field builder providing fluent API for numeric configuration fields.

Supports validation rules like min/max values, integer constraints,
positive/negative checks, and mathematical validations.

#### Example

```typescript
const portField = number()
  .description('Server port')
  .min(1, 'Port must be positive')
  .max(65535, 'Port must be valid')
  .default(3000)
  .build()
```

#### Properties

##### build()

> `readonly` **build**: () => `ZodType`\<`undefined` \| `number`\>

###### Returns

`ZodType`\<`undefined` \| `number`\>

##### default()

> `readonly` **default**: (`defaultValue`) => [`NumberFieldBuilder`](#numberfieldbuilder)

###### Parameters

###### defaultValue

`number`

###### Returns

[`NumberFieldBuilder`](#numberfieldbuilder)

##### description()

> `readonly` **description**: (`description`) => [`NumberFieldBuilder`](#numberfieldbuilder)

###### Parameters

###### description

`string`

###### Returns

[`NumberFieldBuilder`](#numberfieldbuilder)

##### enum()

> `readonly` **enum**: \<`T`\>(...`values`) => [`FieldBuilder`](#fieldbuilder)\<`T`\[`number`\]\>

###### Type Parameters

###### T

`T` _extends_ readonly \[`number`, `number`\]

###### Parameters

###### values

...`T`

###### Returns

[`FieldBuilder`](#fieldbuilder)\<`T`\[`number`\]\>

##### examples()

> `readonly` **examples**: (...`examples`) => [`NumberFieldBuilder`](#numberfieldbuilder)

###### Parameters

###### examples

...`number`[]

###### Returns

[`NumberFieldBuilder`](#numberfieldbuilder)

##### finite()

> `readonly` **finite**: (`message?`) => [`NumberFieldBuilder`](#numberfieldbuilder)

###### Parameters

###### message?

`string`

###### Returns

[`NumberFieldBuilder`](#numberfieldbuilder)

##### int()

> `readonly` **int**: (`message?`) => [`NumberFieldBuilder`](#numberfieldbuilder)

###### Parameters

###### message?

`string`

###### Returns

[`NumberFieldBuilder`](#numberfieldbuilder)

##### max()

> `readonly` **max**: (`max`, `message?`) => [`NumberFieldBuilder`](#numberfieldbuilder)

###### Parameters

###### max

`number`

###### message?

`string`

###### Returns

[`NumberFieldBuilder`](#numberfieldbuilder)

##### min()

> `readonly` **min**: (`min`, `message?`) => [`NumberFieldBuilder`](#numberfieldbuilder)

###### Parameters

###### min

`number`

###### message?

`string`

###### Returns

[`NumberFieldBuilder`](#numberfieldbuilder)

##### multipleOf()

> `readonly` **multipleOf**: (`divisor`, `message?`) => [`NumberFieldBuilder`](#numberfieldbuilder)

###### Parameters

###### divisor

`number`

###### message?

`string`

###### Returns

[`NumberFieldBuilder`](#numberfieldbuilder)

##### negative()

> `readonly` **negative**: (`message?`) => [`NumberFieldBuilder`](#numberfieldbuilder)

###### Parameters

###### message?

`string`

###### Returns

[`NumberFieldBuilder`](#numberfieldbuilder)

##### nonNegative()

> `readonly` **nonNegative**: (`message?`) => [`NumberFieldBuilder`](#numberfieldbuilder)

###### Parameters

###### message?

`string`

###### Returns

[`NumberFieldBuilder`](#numberfieldbuilder)

##### nonPositive()

> `readonly` **nonPositive**: (`message?`) => [`NumberFieldBuilder`](#numberfieldbuilder)

###### Parameters

###### message?

`string`

###### Returns

[`NumberFieldBuilder`](#numberfieldbuilder)

##### optional()

> `readonly` **optional**: () => [`NumberFieldBuilder`](#numberfieldbuilder)

###### Returns

[`NumberFieldBuilder`](#numberfieldbuilder)

##### positive()

> `readonly` **positive**: (`message?`) => [`NumberFieldBuilder`](#numberfieldbuilder)

###### Parameters

###### message?

`string`

###### Returns

[`NumberFieldBuilder`](#numberfieldbuilder)

##### range()

> `readonly` **range**: (`min`, `max`) => [`NumberFieldBuilder`](#numberfieldbuilder)

###### Parameters

###### min

`number`

###### max

`number`

###### Returns

[`NumberFieldBuilder`](#numberfieldbuilder)

---

### ObjectFieldBuilder\<T\>

Object field builder providing fluent API for object configuration fields.

Supports nested object validation with strict mode, passthrough,
and strip options for handling unknown properties.

#### Type Parameters

##### T

`T`

The type of the object structure

#### Properties

##### build()

> `readonly` **build**: () => `ZodType`\<`undefined` \| `T`\>

###### Returns

`ZodType`\<`undefined` \| `T`\>

##### default()

> `readonly` **default**: (`defaultValue`) => [`ObjectFieldBuilder`](#objectfieldbuilder)\<`T`\>

###### Parameters

###### defaultValue

`T`

###### Returns

[`ObjectFieldBuilder`](#objectfieldbuilder)\<`T`\>

##### description()

> `readonly` **description**: (`description`) => [`ObjectFieldBuilder`](#objectfieldbuilder)\<`T`\>

###### Parameters

###### description

`string`

###### Returns

[`ObjectFieldBuilder`](#objectfieldbuilder)\<`T`\>

##### examples()

> `readonly` **examples**: (...`examples`) => [`ObjectFieldBuilder`](#objectfieldbuilder)\<`T`\>

###### Parameters

###### examples

...`T`[]

###### Returns

[`ObjectFieldBuilder`](#objectfieldbuilder)\<`T`\>

##### optional()

> `readonly` **optional**: () => [`ObjectFieldBuilder`](#objectfieldbuilder)\<`T`\>

###### Returns

[`ObjectFieldBuilder`](#objectfieldbuilder)\<`T`\>

##### passthrough()

> `readonly` **passthrough**: () => [`ObjectFieldBuilder`](#objectfieldbuilder)\<`T`\>

###### Returns

[`ObjectFieldBuilder`](#objectfieldbuilder)\<`T`\>

##### strict()

> `readonly` **strict**: () => [`ObjectFieldBuilder`](#objectfieldbuilder)\<`T`\>

###### Returns

[`ObjectFieldBuilder`](#objectfieldbuilder)\<`T`\>

##### strip()

> `readonly` **strip**: () => [`ObjectFieldBuilder`](#objectfieldbuilder)\<`T`\>

###### Returns

[`ObjectFieldBuilder`](#objectfieldbuilder)\<`T`\>

---

### ResolvedSource

Resolved source interface representing the result of loading from a configuration source.

Contains the loaded data, timing information, and any errors that occurred
during the loading process from a specific configuration source.

#### Properties

##### data

> `readonly` **data**: `Record`\<`string`, `unknown`\>

##### error?

> `readonly` `optional` **error**: [`CoreError`](@esteban-url.cli.md#coreerror)

##### loadTime

> `readonly` **loadTime**: `number`

##### source

> `readonly` **source**: [`ConfigSource`](#configsource)

---

### SchemaBuilder\<T\>

Schema builder interface providing fluent API for configuration schema construction.

Allows chaining of metadata and options to build comprehensive configuration schemas
with proper documentation and validation rules.

#### Type Parameters

##### T

`T`

The type of configuration data this schema validates

#### Properties

##### build()

> `readonly` **build**: () => [`ConfigSchema`](#configschema)\<`T`\>

###### Returns

[`ConfigSchema`](#configschema)\<`T`\>

##### description()

> `readonly` **description**: (`description`) => [`SchemaBuilder`](#schemabuilder)\<`T`\>

###### Parameters

###### description

`string`

###### Returns

[`SchemaBuilder`](#schemabuilder)\<`T`\>

##### name()

> `readonly` **name**: (`name`) => [`SchemaBuilder`](#schemabuilder)\<`T`\>

###### Parameters

###### name

`string`

###### Returns

[`SchemaBuilder`](#schemabuilder)\<`T`\>

##### strict()

> `readonly` **strict**: (`strict?`) => [`SchemaBuilder`](#schemabuilder)\<`T`\>

###### Parameters

###### strict?

`boolean`

###### Returns

[`SchemaBuilder`](#schemabuilder)\<`T`\>

##### version()

> `readonly` **version**: (`version`) => [`SchemaBuilder`](#schemabuilder)\<`T`\>

###### Parameters

###### version

`string`

###### Returns

[`SchemaBuilder`](#schemabuilder)\<`T`\>

---

### StringFieldBuilder

String field builder providing fluent API for string configuration fields.

Supports validation rules like pattern matching, length constraints,
format validation (email, URL, UUID), and string transformations.

#### Example

```typescript
const hostField = string()
  .description('Server hostname')
  .default('localhost')
  .pattern(/^[a-zA-Z0-9.-]+$/, 'Invalid hostname format')
  .build()
```

#### Properties

##### build()

> `readonly` **build**: () => `ZodType`\<`undefined` \| `string`\>

###### Returns

`ZodType`\<`undefined` \| `string`\>

##### default()

> `readonly` **default**: (`defaultValue`) => [`StringFieldBuilder`](#stringfieldbuilder)

###### Parameters

###### defaultValue

`string`

###### Returns

[`StringFieldBuilder`](#stringfieldbuilder)

##### description()

> `readonly` **description**: (`description`) => [`StringFieldBuilder`](#stringfieldbuilder)

###### Parameters

###### description

`string`

###### Returns

[`StringFieldBuilder`](#stringfieldbuilder)

##### email()

> `readonly` **email**: (`message?`) => [`StringFieldBuilder`](#stringfieldbuilder)

###### Parameters

###### message?

`string`

###### Returns

[`StringFieldBuilder`](#stringfieldbuilder)

##### enum()

> `readonly` **enum**: \<`T`\>(...`values`) => [`FieldBuilder`](#fieldbuilder)\<`T`\[`number`\]\>

###### Type Parameters

###### T

`T` _extends_ readonly \[`string`, `string`\]

###### Parameters

###### values

...`T`

###### Returns

[`FieldBuilder`](#fieldbuilder)\<`T`\[`number`\]\>

##### examples()

> `readonly` **examples**: (...`examples`) => [`StringFieldBuilder`](#stringfieldbuilder)

###### Parameters

###### examples

...`string`[]

###### Returns

[`StringFieldBuilder`](#stringfieldbuilder)

##### length()

> `readonly` **length**: (`min`, `max`) => [`StringFieldBuilder`](#stringfieldbuilder)

###### Parameters

###### min

`number`

###### max

`number`

###### Returns

[`StringFieldBuilder`](#stringfieldbuilder)

##### maxLength()

> `readonly` **maxLength**: (`max`, `message?`) => [`StringFieldBuilder`](#stringfieldbuilder)

###### Parameters

###### max

`number`

###### message?

`string`

###### Returns

[`StringFieldBuilder`](#stringfieldbuilder)

##### minLength()

> `readonly` **minLength**: (`min`, `message?`) => [`StringFieldBuilder`](#stringfieldbuilder)

###### Parameters

###### min

`number`

###### message?

`string`

###### Returns

[`StringFieldBuilder`](#stringfieldbuilder)

##### optional()

> `readonly` **optional**: () => [`StringFieldBuilder`](#stringfieldbuilder)

###### Returns

[`StringFieldBuilder`](#stringfieldbuilder)

##### pattern()

> `readonly` **pattern**: (`pattern`, `message?`) => [`StringFieldBuilder`](#stringfieldbuilder)

###### Parameters

###### pattern

`RegExp`

###### message?

`string`

###### Returns

[`StringFieldBuilder`](#stringfieldbuilder)

##### toLowerCase()

> `readonly` **toLowerCase**: () => [`StringFieldBuilder`](#stringfieldbuilder)

###### Returns

[`StringFieldBuilder`](#stringfieldbuilder)

##### toUpperCase()

> `readonly` **toUpperCase**: () => [`StringFieldBuilder`](#stringfieldbuilder)

###### Returns

[`StringFieldBuilder`](#stringfieldbuilder)

##### trim()

> `readonly` **trim**: () => [`StringFieldBuilder`](#stringfieldbuilder)

###### Returns

[`StringFieldBuilder`](#stringfieldbuilder)

##### url()

> `readonly` **url**: (`message?`) => [`StringFieldBuilder`](#stringfieldbuilder)

###### Parameters

###### message?

`string`

###### Returns

[`StringFieldBuilder`](#stringfieldbuilder)

##### uuid()

> `readonly` **uuid**: (`message?`) => [`StringFieldBuilder`](#stringfieldbuilder)

###### Parameters

###### message?

`string`

###### Returns

[`StringFieldBuilder`](#stringfieldbuilder)

---

### TransformerOperations

Transformer operations interface for managing configuration transformers.

Provides registration and management capabilities for transformers that
can modify configuration data during the loading process.

#### Properties

##### register()

> `readonly` **register**: \<`T`\>(`transformer`) => `void`

###### Type Parameters

###### T

`T`

###### Parameters

###### transformer

[`ConfigTransformer`](#configtransformer)\<`T`\>

###### Returns

`void`

##### transform()

> `readonly` **transform**: \<`T`\>(`config`, `transformers`) => [`ConfigResult`](#configresult)\<`T`\>

###### Type Parameters

###### T

`T`

###### Parameters

###### config

`Record`\<`string`, `unknown`\>

###### transformers

readonly [`ConfigTransformer`](#configtransformer)\<`T`\>[]

###### Returns

[`ConfigResult`](#configresult)\<`T`\>

##### unregister()

> `readonly` **unregister**: (`name`) => `void`

###### Parameters

###### name

`string`

###### Returns

`void`

---

### ValidationContext

#### Properties

##### cause?

> `readonly` `optional` **cause**: `Error` \| [`CoreError`](@esteban-url.cli.md#coreerror)

##### constraints?

> `readonly` `optional` **constraints**: `Record`\<`string`, `unknown`\>

##### examples?

> `readonly` `optional` **examples**: readonly `unknown`[]

##### expectedType

> `readonly` **expectedType**: `string`

##### field

> `readonly` **field**: `string`

##### fixCommand?

> `readonly` `optional` **fixCommand**: `string`

##### learnMoreUrl?

> `readonly` `optional` **learnMoreUrl**: `string`

##### path?

> `readonly` `optional` **path**: readonly `string`[]

##### rule?

> `readonly` `optional` **rule**: `string`

##### suggestion

> `readonly` **suggestion**: `string`

##### value

> `readonly` **value**: `unknown`

---

### ValidationError

#### Extends

- `ValidationError`

#### Properties

##### cause?

> `readonly` `optional` **cause**: `unknown`

Original error that caused this error

###### Inherited from

`BaseValidationError.cause`

##### code

> `readonly` **code**: `string`

Unique error code for programmatic handling (e.g., 'INVALID_INPUT', 'TIMEOUT')

###### Inherited from

`BaseValidationError.code`

##### component

> `readonly` **component**: `string`

Component where the error occurred

###### Inherited from

`BaseValidationError.component`

##### constraints?

> `readonly` `optional` **constraints**: `Record`\<`string`, `unknown`\>

###### Inherited from

`BaseValidationError.constraints`

##### context?

> `readonly` `optional` **context**: `Record`\<`string`, `unknown`\>

Additional context data for debugging

###### Inherited from

`BaseValidationError.context`

##### data?

> `readonly` `optional` **data**: `Record`\<`string`, `unknown`\>

##### details?

> `readonly` `optional` **details**: `string`

Additional error details for debugging

###### Inherited from

`BaseValidationError.details`

##### examples

> `readonly` **examples**: readonly `unknown`[]

##### expectedType

> `readonly` **expectedType**: `string`

##### field?

> `readonly` `optional` **field**: `string`

###### Inherited from

`BaseValidationError.field`

##### fixCommand?

> `readonly` `optional` **fixCommand**: `string`

##### learnMoreUrl?

> `readonly` `optional` **learnMoreUrl**: `string`

##### message

> `readonly` **message**: `string`

Human-readable error message

###### Inherited from

`BaseValidationError.message`

##### operation

> `readonly` **operation**: `string`

Operation that was being performed when error occurred

###### Inherited from

`BaseValidationError.operation`

##### path

> `readonly` **path**: readonly `string`[]

##### recoverable

> `readonly` **recoverable**: `boolean`

Whether the error is recoverable through retry or user action

###### Inherited from

`BaseValidationError.recoverable`

##### severity

> `readonly` **severity**: `"low"` \| `"medium"` \| `"high"` \| `"critical"`

Error severity level for prioritization

###### Inherited from

`BaseValidationError.severity`

##### suggestion

> `readonly` **suggestion**: `string`

Helpful suggestion for error recovery

###### Overrides

`BaseValidationError.suggestion`

##### timestamp

> `readonly` **timestamp**: `Date`

When the error occurred

###### Inherited from

`BaseValidationError.timestamp`

##### type

> `readonly` **type**: `"VALIDATION_ERROR"`

Error type for categorization (e.g., 'ValidationError', 'NetworkError')

###### Inherited from

`BaseValidationError.type`

##### value?

> `readonly` `optional` **value**: `unknown`

###### Inherited from

`BaseValidationError.value`

---

### ValidatorOperations

Validator operations interface for managing configuration validators.

Provides registration and management capabilities for custom validators
that perform business logic validation beyond schema validation.

#### Properties

##### getRegisteredValidators()

> `readonly` **getRegisteredValidators**: () => readonly `string`[]

###### Returns

readonly `string`[]

##### hasValidator()

> `readonly` **hasValidator**: (`name`) => `boolean`

###### Parameters

###### name

`string`

###### Returns

`boolean`

##### register()

> `readonly` **register**: \<`T`\>(`validator`) => `void`

###### Type Parameters

###### T

`T`

###### Parameters

###### validator

[`ConfigValidator`](#configvalidator)\<`T`\>

###### Returns

`void`

##### unregister()

> `readonly` **unregister**: (`name`) => `void`

###### Parameters

###### name

`string`

###### Returns

`void`

##### validate()

> `readonly` **validate**: \<`T`\>(`config`, `validators`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<`Result`\<`void`, [`CoreError`](@esteban-url.cli.md#coreerror)\>\>

###### Type Parameters

###### T

`T`

###### Parameters

###### config

`T`

###### validators

readonly [`ConfigValidator`](#configvalidator)\<`T`\>[]

###### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<`Result`\<`void`, [`CoreError`](@esteban-url.cli.md#coreerror)\>\>

##### validateSchema()

> `readonly` **validateSchema**: \<`T`\>(`config`, `schema`) => `Result`\<`void`, [`CoreError`](@esteban-url.cli.md#coreerror)\>

###### Type Parameters

###### T

`T`

###### Parameters

###### config

`T`

###### schema

`unknown`

###### Returns

`Result`\<`void`, [`CoreError`](@esteban-url.cli.md#coreerror)\>

## Type Aliases

### ConfigChangeCallback()\<T\>

> **ConfigChangeCallback**\<`T`\> = (`newConfig`, `oldConfig`, `changes`) => `void`

Configuration change callback type for handling configuration updates.

Called when configuration changes are detected during watching with
the new configuration, previous configuration, and detailed change information.

#### Type Parameters

##### T

`T` = `Record`\<`string`, `unknown`\>

The type of configuration data

#### Parameters

##### newConfig

`T`

##### oldConfig

`T`

##### changes

readonly [`ConfigChange`](#configchange)[]

#### Returns

`void`

---

### ConfigPath\<T\>

> **ConfigPath**\<`T`\> = `T` _extends_ `object` ? \{ readonly \[K in keyof T\]: K extends string ? T\[K\] extends object ? \`$\{K\}\` \| \`$\{K\}.$\{ConfigPath\<T\[K\]\>\}\` : \`$\{K\}\` : never \}\[keyof `T`\] : `never`

Configuration path type utility for generating dot-notation paths.

Creates a union of string literals representing all possible dot-notation
paths through an object type, useful for type-safe property access.

#### Type Parameters

##### T

`T`

The type to generate paths for

#### Example

```typescript
type ServerConfig = { server: { host: string; port: number } }
type Paths = ConfigPath<ServerConfig> // 'server' | 'server.host' | 'server.port'
```

---

### ConfigPropertyType

> **ConfigPropertyType** = `"string"` \| `"number"` \| `"boolean"` \| `"array"` \| `"object"` \| `"null"`

Configuration property types supported by the validation system.

Defines the basic types that configuration properties can be validated as.

---

### ConfigResult\<T\>

> **ConfigResult**\<`T`\> = `Result`\<`T`, [`CoreError`](@esteban-url.cli.md#coreerror)\>

#### Type Parameters

##### T

`T`

---

### ConfigSourceType

> **ConfigSourceType** = `"file"` \| `"env"` \| `"cli"` \| `"object"` \| `"remote"` \| `"vault"`

Configuration source types supported by the system.

Defines the available source types for loading configuration data
from various locations and formats.

---

### ConfigWatchCallback()

> **ConfigWatchCallback** = (`data`, `error?`) => `void`

Configuration watch callback type for handling configuration changes.

Called when a watched configuration source detects changes with the new
data or any error that occurred during the reload process.

#### Parameters

##### data

`Record`\<`string`, `unknown`\>

##### error?

[`CoreError`](@esteban-url.cli.md#coreerror)

#### Returns

`void`

---

### DeepPartial\<T\>

> **DeepPartial**\<`T`\> = `{ readonly [P in keyof T]?: T[P] extends (infer U)[] ? DeepPartial<U>[] : T[P] extends readonly (infer U)[] ? readonly DeepPartial<U>[] : T[P] extends object ? DeepPartial<T[P]> : T[P] }`

Deep partial type utility for making all properties optional recursively.

Creates a type where all properties of T and nested objects are optional,
useful for configuration defaults and partial updates.

#### Type Parameters

##### T

`T`

The type to make deeply partial

## Functions

### array()

> **array**\<`T`\>(`elementSchema`): [`ArrayFieldBuilder`](#arrayfieldbuilder)\<`T`\>

Creates an array field builder for configuration schemas.

Provides a fluent API for building array configuration fields with
length constraints, item validation, and array-specific validations.

#### Type Parameters

##### T

`T`

#### Parameters

##### elementSchema

`ZodType`\<`T`\>

Zod schema for validating array elements

#### Returns

[`ArrayFieldBuilder`](#arrayfieldbuilder)\<`T`\>

Array field builder with validation methods

#### Example

```typescript
const tagsField = zodArray(z.string())
  .description('Configuration tags')
  .minLength(1, 'At least one tag required')
  .maxLength(10, 'Maximum 10 tags allowed')
  .default(['prod'])
  .build()
```

---

### boolean()

> **boolean**(): [`BooleanFieldBuilder`](#booleanfieldbuilder)

Creates a boolean field builder for configuration schemas.

Provides a fluent API for building boolean configuration fields with
optional flags, default values, and documentation examples.

#### Returns

[`BooleanFieldBuilder`](#booleanfieldbuilder)

Boolean field builder with validation methods

#### Example

```typescript
const debugField = zodBoolean()
  .description('Enable debug logging')
  .default(false)
  .examples(true, false)
  .build()
```

---

### createConfigManager()

> **createConfigManager**\<`T`\>(`definition`, `deps`): [`ConfigManager`](#configmanager)\<`T`\>

Creates a configuration manager instance for managing configuration lifecycle.

The manager provides methods for loading, watching, validating, and accessing
configuration values with automatic change detection and error handling.
It maintains internal state and provides a clean API for configuration management.

#### Type Parameters

##### T

`T`

#### Parameters

##### definition

[`ConfigDefinition`](#configdefinition)\<`T`\>

Configuration definition including sources, schema, and validation rules

##### deps

`ManagerDependencies`

Required dependencies for loader, validator, and transformer operations

#### Returns

[`ConfigManager`](#configmanager)\<`T`\>

Configuration manager instance with full lifecycle management

#### Example

```typescript
const manager = createConfigManager(
  {
    name: 'api-config',
    sources: [
      { type: 'env', env: 'API_', priority: 1 },
      { type: 'file', path: './api.json', priority: 2, optional: true },
    ],
    schema: apiConfigSchema,
    validators: [connectivityValidator],
  },
  {
    loaderOps: createLoaderOperations(),
    validatorOps: createValidatorOperations(),
    transformerOps: createTransformerOperations(),
  }
)

// Load configuration
const state = await manager.load()
if (state.isOk()) {
  const apiUrl = manager.get('url')
  const timeout = manager.get('timeout')
}

// Watch for changes
await manager.watch((newConfig, oldConfig, changes) => {
  console.log('Configuration changed:', changes)
})
```

#### See

- [ConfigManager](#configmanager) - Manager interface definition
- [ConfigDefinition](#configdefinition) - Definition structure and options
- ManagerDependencies - Required dependencies

---

### createConfigOperations()

> **createConfigOperations**(): `ConfigOperations`

Creates configuration operations with integrated loader, validator, and transformer operations.

This is the main factory function for creating a complete configuration management system.
It provides a unified API for all configuration operations with proper error handling,
validation, and type safety.

#### Returns

`ConfigOperations`

Complete configuration operations interface

#### Example

```typescript
const ops = createConfigOperations()

// Create a configuration manager
const managerResult = ops.create({
  name: 'app-config',
  sources: [
    { type: 'env', env: 'APP_', priority: 1 },
    { type: 'file', path: './config.json', priority: 2, optional: true },
  ],
  schema: myConfigSchema,
})

if (managerResult.isOk()) {
  const manager = managerResult.value
  const state = await manager.load()
}
```

#### See

- [ConfigOperations](#configoperations) - Operations interface definition
- [ConfigDefinition](#configdefinition) - Configuration definition structure

---

### createLoaderOperations()

> **createLoaderOperations**(): [`LoaderOperations`](#loaderoperations)

Creates loader operations for managing configuration source loaders.

Provides a registry system for configuration loaders that can fetch data
from various sources like files, environment variables, CLI arguments,
remote APIs, and more. Includes built-in loaders for common source types.

#### Returns

[`LoaderOperations`](#loaderoperations)

Loader operations interface with registration and loading capabilities

#### Example

```typescript
const loaderOps = createLoaderOperations()

// Register a custom loader
const s3Loader: ConfigLoader = {
  load: async (source) => {
    const data = await s3.getObject({ Bucket: 'config', Key: source.path })
    return ok(JSON.parse(data.Body.toString()))
  },
  supports: (source) => source.type === 's3',
}
loaderOps.register(s3Loader)

// Load configuration
const result = await loaderOps.load({
  type: 's3',
  path: 'production/config.json',
  priority: 1,
})
```

#### See

- [LoaderOperations](#loaderoperations) - Operations interface definition
- [ConfigLoader](#configloader) - Loader interface for custom implementations

---

### createSchema()

> **createSchema**\<`T`\>(`zodSchema`): [`SchemaBuilder`](#schemabuilder)\<`T`\>

Creates a schema builder for fluent configuration schema construction.

Provides a chainable API for building configuration schemas with metadata,
validation options, and proper type safety.

#### Type Parameters

##### T

`T`

#### Parameters

##### zodSchema

`ZodType`\<`T`\>

Base Zod schema to build upon

#### Returns

[`SchemaBuilder`](#schemabuilder)\<`T`\>

Schema builder with fluent API

#### Example

```typescript
const schema = createZodSchemaBuilder(z.object({ port: z.number() }))
  .name('server-config')
  .description('Server configuration schema')
  .version('1.0.0')
  .strict()
  .build()
```

---

### createTransformerOperations()

> **createTransformerOperations**(): [`TransformerOperations`](#transformeroperations)

Creates transformer operations for managing configuration transformers.

Provides a registry system for configuration transformers that can modify
and normalize configuration data during the loading process. Transformers
are applied in priority order and can perform operations like environment
variable expansion, format conversion, and data normalization.

#### Returns

[`TransformerOperations`](#transformeroperations)

Transformer operations interface with registration and transformation capabilities

#### Example

```typescript
const transformerOps = createTransformerOperations()

// Register a custom transformer
const envExpansionTransformer: ConfigTransformer<any> = {
  name: 'environment-expansion',
  priority: 1,
  transform: (config) => {
    // Expand ${ENV_VAR} placeholders
    const expanded = JSON.parse(
      JSON.stringify(config).replace(/\$\{([^}]+)\}/g, (_, varName) => process.env[varName] || '')
    )
    return ok(expanded)
  },
}

transformerOps.register(envExpansionTransformer)

// Transform configuration
const result = transformerOps.transform(rawConfig, [envExpansionTransformer])
```

#### See

- [TransformerOperations](#transformeroperations) - Operations interface definition
- [ConfigTransformer](#configtransformer) - Transformer interface for custom implementations

---

### createValidationError()

> **createValidationError**(`context`): [`ValidationError`](#validationerror)

Creates a configuration validation error with detailed context.

#### Parameters

##### context

[`ValidationContext`](#validationcontext)

#### Returns

[`ValidationError`](#validationerror)

Configuration validation error

#### Example

```typescript
const error = createValidationError({
  field: 'port',
  value: -1,
  expectedType: 'positive number',
  suggestion: 'Use a port between 1 and 65535',
})
```

---

### createValidatorOperations()

> **createValidatorOperations**(): `ValidatorOperations`

Creates validator operations for managing configuration validators.

Provides a registry system for custom validators that can perform complex
business logic validation beyond what schema validation provides. Useful for
environment-specific validation, connectivity checks, and custom constraints.

#### Returns

`ValidatorOperations`

Validator operations interface with registration and validation capabilities

#### Example

```typescript
const validatorOps = createValidatorOperations()

// Register a custom validator
const dbConnectivityValidator: ConfigValidator<DatabaseConfig> = {
  name: 'database-connectivity',
  validate: async (config) => {
    try {
      await testDatabaseConnection(config.host, config.port)
      return ok(config)
    } catch (error) {
      return err(
        createValidationError({
          field: 'database',
          value: config,
          expectedType: 'valid database configuration',
          suggestion: 'Check database host and port are accessible',
        })
      )
    }
  },
}

validatorOps.register(dbConnectivityValidator)

// Validate configuration
const result = await validatorOps.validate(config, [dbConnectivityValidator])
```

#### See

- [ValidatorOperations](#validatoroperations) - Operations interface definition
- [ConfigValidator](#configvalidator) - Validator interface for custom implementations

---

### createZodSchema()

> **createZodSchema**\<`T`\>(`shape`): [`SchemaBuilder`](#schemabuilder)\<`$InferObjectOutput`\<\{ -readonly \[P in string \| number \| symbol\]: T\[P\] \}, \{ \}\>\>

Creates a Zod schema builder from an object shape definition.

Convenience function for quickly creating configuration schemas
from object definitions with proper type inference.

#### Type Parameters

##### T

`T` _extends_ [`Readonly`](https://www.typescriptlang.org/docs/handbook/utility-types.html#readonlytype)\<\{\[`k`: `string`\]: `$ZodType`\<`unknown`, `unknown`, `$ZodTypeInternals`\<`unknown`, `unknown`\>\>; \}\>

#### Parameters

##### shape

`T`

Object shape with Zod schema definitions

#### Returns

[`SchemaBuilder`](#schemabuilder)\<`$InferObjectOutput`\<\{ -readonly \[P in string \| number \| symbol\]: T\[P\] \}, \{ \}\>\>

Schema builder for fluent configuration

#### Example

```typescript
const schema = createZodSchema({
  port: z.number().min(1).max(65535),
  host: z.string().default('localhost'),
})
  .name('server-config')
  .build()
```

---

### defineSchema()

> **defineSchema**\<`_T`\>(): `object`

Defines a Zod-powered configuration schema with type safety and validation.

Creates a schema definition API that allows building complex configuration
schemas with proper type inference and validation rules.

#### Type Parameters

##### \_T

`_T` _extends_ `Record`\<`string`, `unknown`\>

#### Returns

`object`

Schema definition object with object builder

##### object()

> **object**: \<`K`\>(`shape`) => [`SchemaBuilder`](#schemabuilder)\<`Record`\<`string`, `unknown`\>\>

###### Type Parameters

###### K

`K` _extends_ `Record`\<`string`, `any`\>

###### Parameters

###### shape

`K`

###### Returns

[`SchemaBuilder`](#schemabuilder)\<`Record`\<`string`, `unknown`\>\>

#### Example

```typescript
const schema = defineZodConfigSchema().object({
  port: number().min(1).max(65535).default(3000),
  host: string().default('localhost'),
  debug: boolean().default(false),
})
```

---

### enhanceZodError()

> **enhanceZodError**(`zodError`, `schemaName?`, `schema?`): [`CoreError`](@esteban-url.cli.md#coreerror)

Enhances Zod validation errors with additional context and formatting.

#### Parameters

##### zodError

`ZodError`

Original Zod validation error

##### schemaName?

`string`

##### schema?

`ZodType`\<`unknown`, `unknown`, `$ZodTypeInternals`\<`unknown`, `unknown`\>\>

#### Returns

[`CoreError`](@esteban-url.cli.md#coreerror)

Enhanced validation error with better messaging

---

### formatValidationError()

> **formatValidationError**(`error`, `options?`): `string`

Formats a validation error for display to users.

#### Parameters

##### error

[`ValidationError`](#validationerror)

Validation error to format

##### options?

`FormatterOptions`

Formatting options

#### Returns

`string`

Formatted error message

#### Example

```typescript
const formatted = formatValidationError(error, { colors: true })
console.error(formatted)
```

---

### formatValidationErrors()

> **formatValidationErrors**(`errors`, `options?`): `string`

Formats multiple validation errors for display to users.

#### Parameters

##### errors

readonly [`ValidationError`](#validationerror)[]

Array of validation errors to format

##### options?

`FormatterOptions`

Formatting options

#### Returns

`string`

Formatted error messages

---

### number()

> **number**(): [`NumberFieldBuilder`](#numberfieldbuilder)

Creates a number field builder for configuration schemas.

Provides a fluent API for building numeric configuration fields with
range validation, type constraints, and mathematical validations.

#### Returns

[`NumberFieldBuilder`](#numberfieldbuilder)

Number field builder with validation methods

#### Example

```typescript
const timeoutField = zodNumber()
  .description('Request timeout in milliseconds')
  .min(100, 'Timeout must be at least 100ms')
  .max(30000, 'Timeout cannot exceed 30 seconds')
  .int('Timeout must be a whole number')
  .default(5000)
  .build()
```

---

### object()

> **object**\<`T`\>(`shape`): [`ObjectFieldBuilder`](#objectfieldbuilder)\<`any`\>

Creates an object field builder for configuration schemas.

Provides a fluent API for building object configuration fields with
nested validation, strict mode options, and property handling controls.

#### Type Parameters

##### T

`T` _extends_ `Record`\<`string`, `any`\>

#### Parameters

##### shape

`T`

Object shape definition with field builders or Zod schemas

#### Returns

[`ObjectFieldBuilder`](#objectfieldbuilder)\<`any`\>

Object field builder with validation methods

#### Example

```typescript
const serverConfigField = zodObject({
  host: string().default('localhost'),
  port: number().min(1).max(65535).default(3000),
  ssl: boolean().default(false),
})
  .description('Server configuration object')
  .strict()
  .build()
```

---

### string()

> **string**(): [`StringFieldBuilder`](#stringfieldbuilder)

Creates a string field builder for configuration schemas.

Provides a fluent API for building string configuration fields with
validation rules, format checking, and transformations.

#### Returns

[`StringFieldBuilder`](#stringfieldbuilder)

String field builder with validation methods

#### Example

```typescript
const apiKeyField = zodString()
  .description('API authentication key')
  .minLength(32, 'API key must be at least 32 characters')
  .pattern(/^[a-zA-Z0-9]+$/, 'API key must be alphanumeric')
  .build()
```

---

### validate()

> **validate**\<`T`\>(`data`, `schema`): `ConfigResult`\<`T`\>

Validates configuration data against a Zod schema synchronously.

Provides comprehensive validation with enhanced error reporting
and proper type inference from the schema.

#### Type Parameters

##### T

`T`

#### Parameters

##### data

`unknown`

Configuration data to validate

##### schema

[`ConfigSchema`](#configschema)\<`T`\>

Zod configuration schema to validate against

#### Returns

`ConfigResult`\<`T`\>

Result with validated data or detailed validation errors

#### Example

```typescript
const result = validateWithZodSchema(configData, serverSchema)
if (result.isOk()) {
  console.log('Valid config:', result.value)
} else {
  console.error('Validation failed:', result.error)
}
```

---

### validateAsync()

> **validateAsync**\<`T`\>(`data`, `schema`): [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<`ConfigResult`\<`T`\>\>

Validates configuration data against a Zod schema asynchronously.

Provides comprehensive async validation with enhanced error reporting
for schemas that include async refinements or transformations.

#### Type Parameters

##### T

`T`

#### Parameters

##### data

`unknown`

Configuration data to validate

##### schema

[`ConfigSchema`](#configschema)\<`T`\>

Zod configuration schema to validate against

#### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<`ConfigResult`\<`T`\>\>

Promise resolving to Result with validated data or detailed validation errors
