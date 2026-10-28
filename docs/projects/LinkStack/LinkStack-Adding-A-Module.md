---
type: Guide
title: LinkStack — Adding a Module
description: "Checklist for adding a new module to LinkStack: projects, allowed references, schema, registration, tests"
tags: [linkstack, guide, modular-monolith, modules, how-to, checklist]
status: stable
confidence: medium
source: [https://github.com/radekwojpl2/LinkStack]
updated: 2026-10-28
---

# LinkStack — Adding a Module

A checklist drawn from the architecture and pattern notes. Each step links to the note that explains it. Use [[Links]] or [[Users]] as the reference implementation.

> **Watch for drift:** SpecKit tasks #11–#21 move endpoint mapping from each module's Infrastructure into its Web project (`<Module>WebExtensions`). Check [[LinkStack-Board]] before copying step 4.

## 1. Create the projects

Under `Modules/<Module>/` ([[LinkStack-Architecture]], [[Modular-Monolith]]):

| Project | Needed when |
|---|---|
| `LinkStack.<Module>.Domain` | always: entities, value objects, repository interfaces, business rules |
| `LinkStack.<Module>.Application` | always: MediatR commands and queries ([[CQRS]]). Split into `.Read`/`.Write` only if the read side is heavy, as in [[Links]] |
| `LinkStack.<Module>.Infrastructure` | always: EF Core DbContext, repositories, MassTransit consumers, migrations |
| `LinkStack.<Module>.Web` | always: Minimal API endpoints, with no business logic |
| `LinkStack.<Module>.IntegrationEvents` | when the module publishes events other modules consume |
| `LinkStack.<Module>.Public.Client` | when other modules need to call it synchronously |
| `tests/LinkStack.<Module>.IntegrationTests` (+ `.ArchTests`, `.BehaviourTests`) | always (step 6) |

Organise folders as vertical slices, one folder per use case ([[Vertical-Slices]]).

## 2. References

**Inside the module:** `Web → Application → Domain ← Infrastructure` ([[LinkStack-Architecture]]).

**To other modules**, only these two are allowed ([[LinkStack-Architecture]]):
- `<Other>.Public.Client`, for synchronous calls
- `<Other>.IntegrationEvents`, for consuming another module's events (e.g. `Analytics.Infrastructure` → `Links.IntegrationEvents`)

Never reference another module's Domain, Application or Infrastructure. From BuildingBlocks, reference Domain and Application only. Infrastructure is registered once at the composition root ([[Modular-Monolith-Building-Blocks]]).

## 3. Database

- Give the module its own schema with `HasDefaultSchema("<module>")` and no cross-module foreign keys ([[Tenant-Isolation]]).
- Give every tenant-owned entity a `TenantId` and a global query filter ([[Tenant-Isolation]], [[EF-Core-Global-Query-Filters]]).
- Add migrations to the module's Infrastructure project. They run on startup ([[Dev-Setup]]):
  ```bash
  dotnet ef migrations add <Name> \
    --project Modules/<Module>/LinkStack.<Module>.Infrastructure \
    --startup-project LinkStack.Api
  ```

## 4. Registration

- `Add<Module>Module(IServiceCollection, IConfiguration)` registers everything the module owns. `Map<Module>Endpoints(...)` maps its endpoints ([[Module-Self-Registration]]).
- Call both from `Program.cs`, in the startup order given in [[LinkStack-Architecture]] ("Startup Sequence").
- If the module has consumers, contribute its MassTransit bus configuration as well ([[Module-Self-Registration]], "Variant: MassTransit bus configuration").

## 5. Cross-module behaviour

- Publish events through the transactional outbox, before `SaveChangesAsync` ([[Outbox]]).
- Make consumers idempotent ([[Transactional-Outbox]]).
- Errors: throw typed exceptions so the middleware returns Problem Details ([[Error-Handling]]).

## 6. Tests

- Integration tests use Testcontainers with real PostgreSQL and RabbitMQ. Never mock the database ([[Integration-Tests]], [[Testcontainers]]).
- Add architecture tests in a `*.ArchTests` project, and add the new module to the existing boundary tests' `[InlineData]` ([[Architecture-Tests]]).
- New features also need SpecFlow BDD scenarios ([[BDD-Tests]]).
- Unit tests cover the pure domain logic only ([[Unit-Tests]]).
