# fix-imports Test Scenarios

Test cases for comparing `scripts/fix-duplicate-imports.sh` vs `scripts-cli fix-imports`.

## Scenario 1: Basic Duplicate Imports
**Setup**: TypeScript file with simple duplicate imports
**Expected**: Removes duplicates, preserves unique imports

### Test File Content:
```typescript
import { debounce } from 'lodash';
import { throttle } from 'lodash';
import { debounce } from 'lodash'; // Duplicate
import { map } from 'lodash';
import { debounce } from 'lodash'; // Another duplicate

export { debounce, throttle, map };
```

### Expected Result:
```typescript
import { debounce, throttle, map } from 'lodash';

export { debounce, throttle, map };
```

## Scenario 2: Mixed Import Styles
**Setup**: File with different import syntaxes
**Expected**: Handles various import patterns correctly

### Test File Content:
```typescript
import React from 'react';
import { useState } from 'react';
import { useEffect } from 'react';
import * as utils from './utils';
import type { User } from './types';
import { User } from './types'; // Duplicate type import
import './styles.css';
import './styles.css'; // Duplicate CSS import
```

### Expected Result:
- Consolidates named imports from same module
- Preserves different import types (default, named, namespace, type, side-effect)
- Removes true duplicates

## Scenario 3: Comments and Strings
**Setup**: File with import-like text in comments/strings
**Expected**: Only processes actual imports, ignores false positives

### Test File Content:
```typescript
// This is not an import: import { fake } from 'fake';
import { real } from 'real';
import { real } from 'real'; // Duplicate
const code = `import { notReal } from 'notReal';`;
/* 
 * import { alsoNotReal } from 'alsoNotReal';
 */
```

### Expected Result:
- Only removes the duplicate `real` import
- Preserves all comments and string content

## Scenario 4: Multiple Files
**Setup**: Directory with multiple files containing duplicates
**Expected**: Processes all matching files

### Test Structure:
```
src/
├── index.ts        # Has duplicates
├── utils.ts        # Has duplicates  
├── types.ts        # No duplicates
└── __tests__/
    └── test.ts     # Has duplicates
```

### Pattern Matching:
- Shell script: Processes single file or uses find
- TypeScript CLI: Uses glob patterns

## Scenario 5: Backup Behavior
**Setup**: Files that will be modified
**Expected**: Creates backup files before modification

### Expected Backup:
- Original file preserved with `.backup` extension
- Modified file has changes applied
- Backup can be used for restoration

## Scenario 6: Error Conditions
**Setup**: Various error scenarios
**Expected**: Appropriate error handling

### Error Cases:
- File doesn't exist
- No read permission
- No write permission
- Invalid file format (binary file)
- Syntax errors in TypeScript

## Files to Compare:
- Modified source files (exact content)
- Backup files created
- Command output messages
- Exit codes
- File modification timestamps
- Directory structure changes