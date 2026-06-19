---
type: Guide
tags: [sentry-poc, sentry, observability, distributed-tracing, metrics, nextjs, dotnet]
---

# Sentry Integration

Full-stack Sentry setup across .NET 8 API and Next.js 16. Both services report to separate Sentry projects but share the same distributed trace when the frontend calls the API.

---

## .NET API — Initialization

**Package:** `Sentry.AspNetCore` v6.4.1

```csharp
// Program.cs
builder.WebHost.UseSentry(o =>
{
    o.Dsn = builder.Configuration["Sentry:Dsn"];
    o.TracesSampleRate = 1.0;
    o.Environment = builder.Environment.EnvironmentName;
    o.SendDefaultPii = true;
    o.EnableLogs = true;   // structured Sentry Logs tab
});

// middleware order matters
app.UseCors();
app.UseSentryTracing();   // reads sentry-trace + baggage headers → distributed tracing
app.UseAuthorization();
```

`UseSentry` must be on `WebHost` before `Build()`. `UseSentryTracing()` must come after `UseCors`.

---

## Next.js — Three-Runtime Initialization

Next.js App Router runs code in three runtimes. Each must be initialized separately.

### 1. Browser — `sentry.client.config.ts`

```ts
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_APP_ENV ?? process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,
  debug: process.env.NODE_ENV === "development",
});
```

### 2. Node.js Server — `instrumentation.ts` + `sentry.server.config.ts`

```ts
// instrumentation.ts — Next.js register() convention, called once at server startup
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
}
```

The runtime guard prevents double-init in Edge. `sentry.server.config.ts` mirrors the client config plus `sendDefaultPii: true` and `enableLogs: true`.

### 3. Build plugin — `next.config.ts`

```ts
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  widenClientFileUpload: true,
  sourcemaps: { disable: false },
});
```

Uploads source maps at build time so stack traces point to original TypeScript.

---

## Distributed Tracing

When the browser calls the API, Sentry automatically injects two headers on matching requests:

```
sentry-trace: <trace-id>-<span-id>-<sampled>
baggage:      sentry-environment=...,sentry-public_key=...
```

`app.UseSentryTracing()` reads these and continues the same trace, so frontend spans and backend spans appear under one trace in Sentry Performance.

**Key setting — `tracePropagationTargets`** (set in `instrumentation-client.ts`/`sentry.client.config.ts`):

```ts
tracePropagationTargets: [
  "localhost",                          // any URL containing "localhost"
  /^https:\/\/.*\.ondigitalocean\.app/, // production DO App Platform
]
```

Without this, trace headers are either missing (no linking) or injected on every request including third-party APIs.

---

## Structured Logs

Logs appear in the **Sentry Logs tab** — standalone, always visible, searchable. Not the same as breadcrumbs.

### .NET API

```csharp
SentrySdk.Logger.LogInfo("Fetching messages from database");
SentrySdk.Logger.LogInfo("Messages fetched - count: {0}", messages.Count);
SentrySdk.Logger.LogInfo(log => {
    log.SetAttribute("message.id", message.Id);
}, "Message saved successfully");
SentrySdk.Logger.LogWarning("Error endpoint triggered intentionally");
SentrySdk.Logger.LogError("Exceeded time limit after 5 seconds");
```

`ILogger` integration also auto-forwards to Sentry. Configure minimum levels in `appsettings.json`:

```json
"Logging": {
  "Sentry": {
    "MinimumBreadcrumbLevel": "Information",
    "MinimumEventLevel": "Error"
  }
}
```

### Next.js

```ts
const { logger } = Sentry;
logger.info("Fetching messages from API");
logger.info("Messages loaded", { count: data.length });  // structured attributes
logger.warn("User triggered API error endpoint");
logger.error("Request failed", { status: res.status, error: String(e) });
```

Second argument is a structured attributes object — searchable in Sentry Logs tab.

---

## Breadcrumbs

Trail of events attached to errors/traces — visible when inspecting a specific issue or trace, not standalone.

### .NET API

```csharp
SentrySdk.AddBreadcrumb("Fetching messages from database", category: "db", level: BreadcrumbLevel.Info);
SentrySdk.AddBreadcrumb("Error triggered intentionally", category: "debug", level: BreadcrumbLevel.Warning);
```

### Next.js

```ts
Sentry.addBreadcrumb({ message: "Fetching messages from API", category: "http", level: "info" });
Sentry.addBreadcrumb({ message: "User triggered error endpoint", category: "user", level: "warning" });
```

Common categories: `http`, `db`, `user`, `debug`, `navigation`, `ssr`.

**Logs vs Breadcrumbs:**

| | Logs | Breadcrumbs |
|---|---|---|
| Location | Logs tab — always | Issues / Traces — only on events |
| Standalone | Yes | No |
| Searchable | Yes | No |

---

## Metrics

Three types emitted from both services, visible in Sentry Metrics tab.

| Type | Use for |
|---|---|
| Counter | How many times something happened |
| Distribution | Spread of values (p50/p75/p99) — durations, sizes |
| Gauge | Current value at a point in time |

### .NET API

```csharp
SentrySdk.Metrics.EmitCounter("api_request", 1, [new("endpoint", "GET /echo")]);
SentrySdk.Metrics.EmitCounter("api_error", 1, [new("endpoint", "GET /echo/slow"), new("type", "timeout")]);

var sw = System.Diagnostics.Stopwatch.StartNew();
// ... operation ...
sw.Stop();
SentrySdk.Metrics.EmitDistribution("db_query_duration", sw.ElapsedMilliseconds,
    MeasurementUnit.Duration.Millisecond, [new("operation", "fetch_messages")]);

SentrySdk.Metrics.EmitGauge("messages_in_db", messages.Count, MeasurementUnit.None,
    [new("endpoint", "GET /echo")]);
```

Tags are `KeyValuePair<string, object>` in a collection literal.

### Next.js

```ts
Sentry.metrics.count("message_send_attempt", 1);
Sentry.metrics.count("api_error", 1, { tags: { type: "timeout" } });

const start = performance.now();
const res = await fetch(`${API_URL}/echo`);
const duration = performance.now() - start;
Sentry.metrics.distribution("api_response_time", duration, { unit: "millisecond", tags: { endpoint: "GET /echo" } });

Sentry.metrics.gauge("ssr_message_count", messages.length);
```

**Metrics emitted in this project:**

| Metric | Type | Service | Tags |
|---|---|---|---|
| `api_request` | Counter | API | `endpoint` |
| `api_error` | Counter | API | `endpoint`, `type` |
| `db_query_duration` | Distribution | API | `operation` |
| `messages_in_db` | Gauge | API | `endpoint` |
| `message_saved` | Counter | API | `endpoint` |
| `api_response_time` | Distribution | Web client | `endpoint` |
| `messages_loaded_count` | Distribution | Web client | — |
| `message_send_attempt/success/failure` | Counter | Web client | — |
| `error_trigger` | Counter | Web client | — |
| `slow_failure_attempt/error` | Counter | Web client | — |
| `ssr_render` | Counter | Web server | — |
| `ssr_fetch_duration` | Distribution | Web server | — |
| `ssr_message_count` | Gauge | Web server | — |
| `server_action_error_trigger` | Counter | Web server | — |
| `server_action_slow_attempt` | Counter | Web server | — |
| `server_action_duration` | Distribution | Web server | — |

---

## Server Actions

Server actions are instrumented with `Sentry.withServerActionInstrumentation`:

```ts
// app/server/actions.ts
"use server";
export async function triggerServerActionError() {
  return Sentry.withServerActionInstrumentation("triggerServerActionError", async () => {
    throw new Error("Test server action error — captured by Sentry");
  });
}
```

The wrapper names the action in the Sentry trace (`serverAction/triggerServerActionError`), captures exceptions server-side, and produces a Node.js-runtime error — visually distinct from browser errors in Sentry.

---

## Server Components

Server components call Sentry directly — they run on Node.js:

```ts
// app/server/page.tsx
async function MessageStats() {
  const { logger } = Sentry;
  logger.info("ServerComponent rendering — fetching message stats from API");
  Sentry.metrics.count("ssr_render", 1);

  const start = Date.now();
  const res = await fetch(`${API_URL}/echo`, { cache: "no-store" });
  Sentry.metrics.distribution("ssr_fetch_duration", Date.now() - start, { unit: "millisecond" });
  // ...
  Sentry.captureException(e); // on error
}
```

---

## Common Failure Modes

| Symptom | Cause | Fix |
|---|---|---|
| No client events | `sentry.client.config.ts` not loaded | Ensure it exists and is referenced via `instrumentation-client.ts` in Next.js 15.3+ |
| No server events | Missing `instrumentation.ts` with `register()` | Add it with the nodejs runtime guard |
| Frontend and backend traces not linked | `tracePropagationTargets` missing or wrong | Set to match your API hostname |
| Works locally, not in production | `NEXT_PUBLIC_APP_ENV` not set | Set as build-time env var in deployment |
| Source maps not uploading | `SENTRY_AUTH_TOKEN` missing at build | Set as build-time secret |
| DSN in git | `appsettings.Development.json` committed | Add to `.gitignore` |
