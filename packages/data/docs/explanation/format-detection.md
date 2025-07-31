---
type: explanation
title: 'Format Detection System'
description: 'Understanding how automatic format detection works in @repo/data'
related:
  - ../how-to/process-data-files.md
  - ../reference/api.md
  - /docs/explanation/architecture.md
---

# Format Detection System

This document explains how @repo/data automatically detects file formats and why this approach was chosen for the library's design.

## Overview

The format detection system in @repo/data uses multiple detection strategies to identify data file formats automatically. This enables users to process files without explicitly specifying the format, making the API more intuitive and reducing boilerplate code.

## Background

### The Problem

Data processing applications often need to handle multiple file formats (CSV, JSON, Excel). Traditional approaches require users to:

1. Know the format in advance
2. Use different APIs for each format
3. Handle format-specific errors separately
4. Write repetitive detection logic

This creates friction and increases the likelihood of errors.

### Why Automatic Detection?

Automatic detection solves several problems:

- **Simplified API** - One function handles all formats
- **Reduced errors** - No need to guess or hardcode formats
- **Better UX** - Users focus on data processing, not format details
- **Flexibility** - Handle mixed-format directories easily

## Core Concepts

### Detection Strategies

The system uses multiple strategies in order of reliability:

1. **File Extension Analysis** - Fast first-pass detection
2. **Magic Number Detection** - Binary signature analysis
3. **Content Structure Analysis** - Pattern matching on file content
4. **MIME Type Detection** - System-level file type identification

### Confidence Scoring

Each detection method returns a confidence score (0-100):

- **90-100**: High confidence (magic numbers, clear signatures)
- **70-89**: Medium confidence (file extensions, content patterns)
- **50-69**: Low confidence (heuristic analysis)
- **0-49**: Uncertain (multiple possible formats)

### Format Priority

When multiple formats are detected, the system uses priority rules:

1. **Binary formats** (Excel) take precedence over text formats
2. **Structured formats** (JSON) take precedence over delimited formats
3. **Higher confidence** scores win in ties

## Design Decisions

### Decision 1: Multi-Strategy Detection

**Context**: Single detection methods are unreliable

**Options considered**:

1. File extension only - Fast but unreliable
2. Content analysis only - Accurate but slow
3. Magic numbers only - Limited format support
4. Combined approach - Multiple strategies with fallbacks

**Decision**: Combined approach with configurable strategies

**Trade-offs**:

- **Gained**: High accuracy, good performance, format coverage
- **Lost**: Some complexity, slightly slower than single-method

### Decision 2: Confidence-Based Selection

**Context**: Different detection methods have varying reliability

**Decision**: Return confidence scores and use threshold-based selection

**Trade-offs**:

- **Gained**: Transparent decision-making, configurable sensitivity
- **Lost**: Additional complexity in result handling

### Decision 3: Extensible Detection System

**Context**: Need to support new formats over time

**Decision**: Plugin-based architecture with format database

**Trade-offs**:

- **Gained**: Easy format additions, maintainable code
- **Lost**: Initial development complexity

## Implementation Details

### Format Database

The system maintains a database of format information:

```typescript
interface FormatInfo {
  format: SupportedFormat
  extensions: string[]
  mimeTypes: string[]
  magicNumbers?: MagicNumber[]
  contentPatterns?: RegExp[]
  detector?: CustomDetector
}
```

### Detection Process

1. **Extension Check**

   ```typescript
   const extension = path.extname(filePath).toLowerCase()
   const candidates = FORMAT_DATABASE.getByExtension(extension)
   ```

2. **Magic Number Analysis**

   ```typescript
   const buffer = await readFile(filePath)
   const magicResult = detectFromMagicNumbers(buffer)
   ```

3. **Content Pattern Matching**

   ```typescript
   const content = buffer.toString('utf8', 0, 1024) // Sample
   const patterns = getContentPatterns(candidates)
   const matches = patterns.filter((p) => p.test(content))
   ```

4. **Confidence Calculation**
   ```typescript
   const confidence = calculateConfidence({
     extensionMatch: extensionScore,
     magicNumberMatch: magicScore,
     contentMatch: contentScore,
   })
   ```

### Magic Number Detection

Binary signatures for reliable format identification:

```typescript
const MAGIC_NUMBERS = {
  xlsx: [0x50, 0x4b, 0x03, 0x04], // ZIP signature
  pdf: [0x25, 0x50, 0x44, 0x46], // %PDF
  png: [0x89, 0x50, 0x4e, 0x47], // PNG signature
}
```

### Content Pattern Analysis

Regular expressions for text format detection:

```typescript
const CONTENT_PATTERNS = {
  csv: /^[^,\n]*(?:,[^,\n]*)*$/m,
  json: /^\s*[{\[].*[}\]]\s*$/s,
  tsv: /^[^\t\n]*(?:\t[^\t\n]*)*$/m,
}
```

## Usage Patterns

### Basic Auto-Detection

```typescript
import { data } from '@repo/data'

// Automatic format detection
const result = await data.parseAuto('./unknown-file.dat')
if (result.success) {
  console.log(`Detected: ${result.value.metadata.format}`)
}
```

### Manual Detection

```typescript
import { createDetectionOperations } from '@repo/data'

const detector = createDetectionOperations()
const detection = await detector.detectFormat('./file.dat')

if (detection.success) {
  const { format, confidence, details } = detection.value
  console.log(`Format: ${format} (${confidence}% confidence)`)
  console.log('Details:', details)
}
```

### Custom Detection Configuration

```typescript
const detector = createDetectionOperations({
  useMagicNumbers: true,
  useContentAnalysis: true,
  confidenceThreshold: 70,
  maxSampleSize: 2048,
})
```

### Batch Detection

```typescript
async function analyzeDirectory(dirPath: string) {
  const files = await fs.readDir(dirPath)
  const results = []

  for (const file of files.value) {
    const filePath = path.join(dirPath, file)
    const detection = await detector.detectFormat(filePath)

    if (detection.success) {
      results.push({
        file,
        format: detection.value.format,
        confidence: detection.value.confidence,
      })
    }
  }

  return results
}
```

## Error Handling

### Detection Failures

The system gracefully handles detection failures:

```typescript
const result = await data.parseAuto('./ambiguous-file.txt')
if (!result.success) {
  if (result.error.code === 'FORMAT_DETECTION_ERROR') {
    // Try with explicit format
    const csvResult = await data.parseCSV('./ambiguous-file.txt')
    // ... handle CSV parsing
  }
}
```

### Low Confidence Scenarios

```typescript
const detection = await detector.detectFormat('./file.dat')
if (detection.success && detection.value.confidence < 70) {
  console.warn('Low confidence detection, verify format manually')
  // Perhaps prompt user or try multiple parsers
}
```

### Fallback Strategies

```typescript
async function robustParse(filePath: string) {
  // Try auto-detection first
  let result = await data.parseAuto(filePath)
  if (result.success) return result

  // Try common formats as fallback
  const formats = ['csv', 'json', 'xlsx']
  for (const format of formats) {
    try {
      result = await data[`parse${format.toUpperCase()}`](filePath)
      if (result.success) {
        console.log(`Fallback successful with ${format}`)
        return result
      }
    } catch {
      continue
    }
  }

  return err(new Error('All detection and fallback methods failed'))
}
```

## Performance Considerations

### Optimization Strategies

1. **Early Exit** - Stop detection when high confidence is reached
2. **Sample-Based Analysis** - Analyze only first N bytes for content patterns
3. **Caching** - Cache detection results for recently processed files
4. **Lazy Loading** - Load heavy detection libraries only when needed

### Performance Metrics

Typical detection times on standard hardware:

- **File extension**: < 1ms
- **Magic numbers**: 1-5ms
- **Content analysis**: 5-20ms (depending on file size)
- **Full detection**: 10-50ms

### Memory Usage

- **Small files** (< 1MB): Memory usage negligible
- **Large files** (> 10MB): Uses streaming analysis with fixed buffer size
- **Very large files** (> 100MB): Sample-based detection only

## Future Considerations

### Planned Enhancements

- **Machine Learning** - Use ML models for ambiguous cases
- **Custom Formats** - Support for domain-specific formats
- **Performance Optimization** - Parallel detection strategies
- **Metadata Extraction** - Extract format-specific metadata during detection

### Extensibility

The system is designed for easy extension:

```typescript
// Add new format support
FORMAT_DATABASE.register({
  format: 'yaml',
  extensions: ['.yml', '.yaml'],
  mimeTypes: ['application/x-yaml'],
  contentPatterns: [/^[\s]*[a-zA-Z_]+\s*:/m],
  detector: customYamlDetector,
})
```

## Common Misconceptions

❌ **Misconception**: "Detection is always 100% accurate"
✅ **Reality**: Detection uses heuristics and can have false positives/negatives

❌ **Misconception**: "File extension is sufficient for detection"
✅ **Reality**: Extensions can be wrong, missing, or misleading

❌ **Misconception**: "Detection significantly slows down processing"
✅ **Reality**: Detection adds minimal overhead (< 5% in most cases)

❌ **Misconception**: "All files can be automatically detected"
✅ **Reality**: Some formats (especially proprietary ones) may not be detectable

## Best Practices

### When to Use Auto-Detection

**Good use cases**:

- Processing user-uploaded files
- Batch processing mixed-format directories
- Building flexible data pipelines
- Prototyping and development

**Consider explicit formats when**:

- Performance is critical
- Format is guaranteed to be known
- Working with custom/proprietary formats
- Need maximum reliability

### Configuration Recommendations

```typescript
// For high accuracy (slower)
const detector = createDetectionOperations({
  useMagicNumbers: true,
  useContentAnalysis: true,
  confidenceThreshold: 80,
  maxSampleSize: 4096,
})

// For high performance (faster)
const detector = createDetectionOperations({
  useMagicNumbers: true,
  useContentAnalysis: false,
  confidenceThreshold: 60,
  maxSampleSize: 512,
})
```

### Error Recovery

Always provide fallback strategies:

```typescript
async function processWithFallback(filePath: string) {
  // Try auto-detection
  let result = await data.parseAuto(filePath)
  if (result.success) return result

  // Try most likely format based on extension
  const ext = path.extname(filePath)
  if (ext === '.csv') {
    result = await data.parseCSV(filePath)
  } else if (ext === '.json') {
    result = await data.parseJSON(filePath)
  }

  return result
}
```

## Integration Examples

### CLI Application

```typescript
const processCommand = createCommand({
  name: 'process',
  options: [
    { name: 'input', type: 'string', required: true },
    { name: 'format', type: 'string', choices: ['auto', 'csv', 'json', 'xlsx'] },
  ],
  action: async (options, context) => {
    let result

    if (options.format === 'auto' || !options.format) {
      result = await data.parseAuto(options.input)

      if (result.success) {
        context.logger.info(`Detected format: ${result.value.metadata.format}`)
      }
    } else {
      result = await data[`parse${options.format.toUpperCase()}`](options.input)
    }

    if (!result.success) {
      context.logger.error(`Processing failed: ${result.error.message}`)
      return result
    }

    // Process data...
    return ok(undefined)
  },
})
```

### Web API

```typescript
app.post('/upload', upload.single('file'), async (req, res) => {
  const { buffer, originalname } = req.file

  // Detect format from buffer and filename
  const detection = await detector.detectFromBuffer(buffer, { fileName: originalname })

  if (!detection.success) {
    return res.status(400).json({ error: 'Unknown file format' })
  }

  // Process based on detected format
  const result = await processBuffer(buffer, detection.value.format)

  res.json({
    format: detection.value.format,
    confidence: detection.value.confidence,
    data: result.success ? result.value : null,
    error: result.success ? null : result.error.message,
  })
})
```

---

The format detection system balances accuracy, performance, and usability to provide a seamless data processing experience. While not perfect, it handles the majority of common use cases effectively and provides clear feedback when detection is uncertain.
