---
tags: [sentry-poc, architecture, dotnet, nextjs]
---

# Architecture

## Services

```
web/          Next.js 16 App Router — localhost:3000
api/          .NET 8 ASP.NET Core — localhost:5000
```

Two independent services, each with its own Sentry project and DSN. No shared auth layer — CORS only.

---

## API (.NET 8)

**Stack:** ASP.NET Core 8, EF Core 8, SQLite, Sentry.AspNetCore 6, Swashbuckle

**`api/Program.cs` setup order:**
1. `builder.WebHost.UseSentry(...)` — must be called before `Build()`
2. `AddDbContext<AppDbContext>` — SQLite, `db.Database.EnsureCreated()` at startup
3. `AddCors` — origins from `AllowedOrigins` config key (comma-separated)
4. `app.UseCors()` → `app.UseSentryTracing()` → `app.UseAuthorization()` — tracing must come after CORS

**Data model:** single `Message` entity (`Id`, `Text`, `CreatedAt`), no migrations — `EnsureCreated` only.

**Endpoints:**

| Method | Path | Behaviour |
|---|---|---|
| GET | `/echo` | Returns last 10 messages ordered by `CreatedAt` desc |
| POST | `/echo` | Saves a message, returns the saved entity |
| GET | `/echo/error` | Throws `InvalidOperationException` immediately |
| GET | `/echo/slow` | Delays 5s, then throws `TimeoutException` |

**DSN config:** `appsettings.json` key `Sentry:Dsn`, or env var `Sentry__Dsn` (double-underscore = nested key in .NET).

---

## Web (Next.js 16)

**Stack:** Next.js 16.2, React 19, Tailwind CSS 4, @sentry/nextjs 10

**Output mode:** `standalone` in `next.config.ts` — produces a self-contained Node.js server for containerization.

**Source maps:** `withSentryConfig` wraps the Next.js build and uploads source maps at build time. Requires `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` as build-time env vars.

**Env vars:**

| Variable | Scope | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SENTRY_DSN` | Runtime + Build | DSN for client and server Sentry init |
| `NEXT_PUBLIC_API_URL` | Build | Base URL of the .NET API |
| `NEXT_PUBLIC_APP_ENV` | Build | Environment label sent to Sentry |
| `SENTRY_AUTH_TOKEN` | Build | Source map upload auth |
| `SENTRY_ORG` | Build | Sentry org slug |
| `SENTRY_PROJECT` | Build | Sentry project slug |

---

## CORS

The API reads `AllowedOrigins` from config (default `http://localhost:3000`). In production on DigitalOcean this is set to the deployed web app URL. No credentials in CORS — no auth cookie flow.

---

## Deployment

Targeted at **DigitalOcean App Platform**. Both services deploy from Dockerfiles. The original `.do/app.yaml` was removed from the repo — env vars are configured directly in the App Platform dashboard.

**Production secrets:**

| Service | Variable | Scope |
|---|---|---|
| API | `Sentry__Dsn`, `ASPNETCORE_ENVIRONMENT`, `AllowedOrigins` | Runtime |
| Web | `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_ENV` | Build |
