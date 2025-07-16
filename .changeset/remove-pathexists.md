---
'@esteban-url/trailhead-cli': major
---

**BREAKING CHANGE**: Remove pathExists() method from filesystem interface

The custom `pathExists()` method has been removed from the FileSystem interface. Use the native `access()` method instead:

**Before:**

```typescript
const exists = await fs.pathExists('/some/path')
if (exists) {
  // path exists
}
```

**After:**

```typescript
const result = await fs.access('/some/path')
if (result.success) {
  // path exists
}
```

This change aligns the filesystem API with native Node.js patterns and provides consistent Result-based error handling across all filesystem operations.
