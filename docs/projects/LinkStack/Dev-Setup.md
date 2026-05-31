---
tags: [linkstack, dev-setup, docker, dotnet, operations]
---

# Dev Setup

## Prerequisites

- Docker Desktop (for dev containers and Testcontainers)
- .NET 8 SDK (for running tests outside Docker)

## Start Dev Environment

Hot-reload dev server runs inside Docker using `dotnet watch`:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

- `docker-compose.yml` — production-like stack (PostgreSQL, RabbitMQ, API image)
- `docker-compose.dev.yml` — overrides API service with `Dockerfile.dev` (SDK image + `dotnet watch`)
- `DOTNET_USE_POLLING_FILE_WATCHER=true` is set in the dev compose file (required on Windows for file change detection inside Docker volumes)

On first start, `app.ApplyMigrations()` runs all pending EF Core migrations automatically.

## Build (without Docker)

```bash
dotnet build LinkStack.Api/LinkStack.Api.csproj --no-restore
```

Expected: 0 errors, 2 pre-existing vulnerability advisory warnings (safe to ignore).

## Run Tests

Integration tests require Docker (Testcontainers spins up PostgreSQL + RabbitMQ):

```bash
dotnet test
```

To run a specific test project:

```bash
dotnet test Modules/Links/LinkStack.Links.IntegrationTests
```

## Configuration

Copy `appsettings.json` and set environment-specific secrets via environment variables or `appsettings.Development.json`.

| Key | Purpose |
|-----|---------|
| `ConnectionStrings:DefaultConnection` | PostgreSQL connection string |
| `Auth0:Domain` | Auth0 tenant domain |
| `Auth0:Audience` | Auth0 API audience |
| `Auth0:WebhookSigningSecret` | Validates Auth0 lifecycle webhooks |
| `RabbitMQ:Host` / `Port` / `Username` / `Password` | Message broker |
| `TagsSuggestion:Endpoint` + `AccessKey` | Anthropic managed agent for AI tagging |
| `Sentry:Dsn` | Error tracking |
| `Cors:AllowedOrigins:0` ... | Frontend origins |

## Migrations

Each module has its own EF Core migrations in its Infrastructure project. To add a migration:

```bash
dotnet ef migrations add <MigrationName> \
  --project Modules/<Module>/LinkStack.<Module>.Infrastructure \
  --startup-project LinkStack.Api
```

Migrations run automatically on startup via `MigrationExtensions.cs`.

## Health Checks

`GET /health/live` — liveness probe (used by Docker healthcheck)  
`GET /health/ready` — readiness probe (checks DB and RabbitMQ connectivity)

## Related

- [[Architecture]] — service dependencies
- [[Tenant-Isolation]] — schema-per-module migrations
