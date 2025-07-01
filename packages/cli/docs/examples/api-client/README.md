# API Client Example

## 🌐 Coming Soon (Waiting for 200 OK)

```typescript
async function fetchDocs() {
  const response = await fetch("/api/examples/api-client");
  if (response.status === 404) {
    return { error: "Docs not found, but you found this!" };
  }
  // Eternal optimism
  return { status: "coming_soon", retryAfter: 86400 };
}
```

### What This Example Will Cover

- Building RESTful API clients that actually REST
- Authentication that doesn't make you cry
- Retry logic smarter than "try again"
- Rate limiting that respects the server
- Error handling for all 500 ways things can go wrong

### Preview of Coming Attractions

```typescript
const apiCommand = createCommand({
  name: "api",
  description: "Call APIs like a pro",
  subcommands: [
    createCommand({
      name: "get",
      description: "GET request (revolutionary, we know)",
      action: async (options, context) => {
        // TODO: Implement after we figure out
        // if fetch or axios is more functional
        return err(new Error("HTTP 501 Not Implemented"));
      },
    }),
  ],
});
```

### Planned Features

1. **Smart Retries** - Exponential backoff with jitter
2. **Request Caching** - Because the same request twice should be free
3. **Response Validation** - Trust but verify
4. **Middleware Pipeline** - Auth, logging, telemetry, kitchen sink
5. **Type-Safe Clients** - Generated from OpenAPI specs

### HTTP Status Codes for This Doc

- `102 Processing` - We're thinking about it
- `425 Too Early` - Check back later
- `418 I'm a teapot` - This doc is still brewing

### Actual Useful Pattern

```typescript
// Wrap fetch in Result type
const safeFetch = async (url: string): Promise<Result<Response>> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return err(new Error(`HTTP ${response.status}`));
    }
    return ok(response);
  } catch (error) {
    return err(error as Error);
  }
};
```

---

_"The best API client is the one that hasn't been written yet, because it has no bugs."_ - Wise Developer

Need an API client now? There's probably an SDK for that!
