---
name: API client Headers typing
description: Generated fetch helpers use Headers.entries(), so the shared client TypeScript config must include DOM iterable types.
---

The generated API client relies on `Headers.entries()` when normalizing response headers. Any package compiling that client must include `dom.iterable` in its TypeScript `lib` list.

**Why:** The workspace's default DOM lib did not expose the iterable Headers methods, causing codegen's chained library typecheck to fail even though Orval generation itself succeeded.

**How to apply:** Keep `dom.iterable` enabled in `lib/api-client-react/tsconfig.json` whenever regenerating API clients.