---
tags: [linkstack, architecture, dotnet, modular-monolith, clean-architecture]
---

# Architecture

LinkStack is a **.NET 8 modular monolith** — a single deployable binary with hard module boundaries enforced by project references. Modules share a runtime and a PostgreSQL instance but own separate schemas and never reference each other's internal projects.

## Layer Structure (per module)

```
Web              ← Minimal API endpoints (MapEndpoint convention)
 ↓
Application      ← MediatR commands & queries (handlers)
 ↓
Domain           ← Entities, value objects, repository interfaces, business rules
 ↑
Infrastructure   ← EF Core DbContext, repositories, MassTransit consumers, migrations
```

**Dependency rule:** `Web → Application → Domain ← Infrastructure`

Infrastructure implements Domain interfaces. Domain never depends on Infrastructure. The Application layer depends on Domain interfaces only — it is never aware of EF Core or MassTransit.

## Module Map

| Module | Schema | Responsibility |
|--------|--------|---------------|
| `Users` | `users` | People, organisations, friend requests, subscriptions/tiers |
| `Links` | `links` | Links, groups, sharing, tags, AI tagging |
| `Analytics` | `analytics` | Consumes link events, tracks activity |
| `Imports` | `imports` | Bulk import via MassTransit saga *(undocumented)* |

## Cross-Module Communication

### Async (preferred) — Integration Events

```
Links.Application
    → IEventPublisher.PublishAsync(LinkCreatedEvent)
        → stored in Links.OutboxMessage (same DB transaction)
            → MassTransit delivers to RabbitMQ
                → Analytics.LinkCreatedEventConsumer persists AnalyticsEvent
```

No module reads another module's database. If Analytics is down, the outbox holds the events until it recovers.

### Sync (rare) — Public Client

When a module needs to query another module synchronously, it uses the `Public.Client` interface:

```
Links.Application → IUserPublicClient (from Users.Public.Client)
```

`Users.Public.Client` is the **only** Users project that non-Users modules may reference. They must never reference `Users.Domain`, `Users.Application`, or `Users.Infrastructure`.

## Shared Building Blocks

```
BuildingBlocks.Domain          — ValueObject base, UserId, TenantId
BuildingBlocks.Application     — Exception types, ErrorCodes, ICurrentUserService,
                                  IEventPublisher, IEmailSender, IObservabilityService
BuildingBlocks.Infrastructure  — Auth middleware, ExceptionHandlingMiddleware,
                                  CurrentUserService, ObservabilityService (Sentry)

Libs.BusinessRuleEngine        — IBusinessRule, Check.Rule, BrokenBusinessRuleException
Libs.EmailSender               — SMTP wrapper
Libs.AiAgent.Client            — Anthropic managed-agent client (AI tag suggestions)
Query.Specification            — SpecificationBase<T>, And/Or/Not combinators
```

## Infrastructure Services

| Service | Role |
|---------|------|
| PostgreSQL 16 | Primary datastore, one schema per module |
| RabbitMQ 3.13 | Message broker for integration events |
| Auth0 | Authentication, JWT issuance, org management, user provisioning |
| Sentry | Error tracking and distributed tracing |

## Startup Sequence

`Program.cs` orchestrates everything:

1. Register BuildingBlocks infrastructure (auth, exception handling, observability)
2. Register each module (`AddUsersModule`, `AddLinksModule`, `AddAnalyticsModule`)
3. Register MassTransit + RabbitMQ (collects bus configurations from each module)
4. Build and configure middleware pipeline
5. `app.ApplyMigrations()` — runs all pending EF Core migrations on startup
6. Map module endpoints (`MapUsersEndpoints`, `MapLinksEndpoints`, `MapAnalyticsEndpoints`)

## Testing Strategy

- **Unit tests** — pure domain logic, value objects, business rules (no DB)
- **Integration tests** — full HTTP stack with Testcontainers (real PostgreSQL + RabbitMQ)
- **Behaviour tests** — BDD with SpecFlow, feature-level scenarios
- **E2E tests** — full API surface via `LinkStack.Api.E2ETests`

Never mock the database. Integration tests use Testcontainers to spin up real PostgreSQL and RabbitMQ instances per test run.

## Folder Organisation (Vertical Slices)

Within each layer, folders are organised by **feature/use-case**, not by type. Every use-case gets a named folder at both the Web and Application layers:

```
Links.Web/
  Links/
    CreateLink/
      CreateLinkEndpoint.cs
      CreateLinkRequest.cs
    GetLinkById/
      GetLinkByIdEndpoint.cs
    UpdateLink/
      UpdateLinkEndpoint.cs
      UpdateLinkRequest.cs

Links.Application.Write/
  Links/
    CreateLink/
      CreateLinkCommand.cs    ← command record + handler in same file
    UpdateLink/
      UpdateLinkCommand.cs
```

The folder name is the use-case name. Finding or adding a feature means navigating to one folder, not three. The pattern is applied consistently across Users, Links, and Analytics modules.

See [[Vertical-Slices]] for the project-agnostic guide.

## Key Constraints

- No cross-module foreign keys in the database
- No business logic in Web layer endpoints
- No raw `Exception` — use typed exceptions (`NotFoundException`, etc.)
- No direct EF entity mutation — always go through aggregate methods
- Tenant isolation enforced by EF query filters on every DbSet

## Related Patterns

- [[Value-Objects]] — type-safe domain primitives
- [[Business-Rules]] — domain invariant validation
- [[CQRS]] — command/query separation via MediatR
- [[Outbox]] — reliable async event delivery
- [[Tenant-Isolation]] — multi-tenant data isolation
- [[Error-Handling]] — typed exceptions + Problem Details

## Related Modules

- [[Users]] — identity, subscriptions, friend graph
- [[Links]] — core link management
- [[Analytics]] — event consumption and reporting
