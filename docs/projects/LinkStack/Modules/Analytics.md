---
tags: [linkstack, module, analytics, masstransit, events]
---

# Analytics Module

**Schema:** `analytics` | **Namespace:** `LinkStack.Analytics.*`

Passively consumes integration events from the Links module and records them as `AnalyticsEvent` rows. Exposes read-only reporting endpoints. Produces no integration events of its own.

## Projects

| Project | Layer |
|---------|-------|
| `LinkStack.Analytics.Domain` | Domain — `AnalyticsEvent` aggregate |
| `LinkStack.Analytics.Infrastructure` | Infrastructure — EF Core, MassTransit consumers, query handlers |
| `LinkStack.Analytics.Web` | Web — reporting endpoints |

> No separate Application project — query handlers live in Infrastructure alongside consumers.

## Domain Entity

### AnalyticsEvent
Fields: `EventType` (string), `UserId`, `TenantId`, `EntityId` (the link/group ID), `Payload` (JSON blob of the original event), `OccurredAt`.

Created via `AnalyticsEvent.Create(...)` factory. Immutable once created.

## Event Consumers

Each Links integration event has a dedicated consumer:

| Consumer | Listens to |
|----------|-----------|
| `LinkCreatedEventConsumer` | `LinkCreatedEvent` |
| `LinkUpdatedEventConsumer` | `LinkUpdatedEvent` |
| `LinkRemovedEventConsumer` | `LinkRemovedEvent` |
| `GroupCreatedEventConsumer` | `GroupCreatedEvent` |
| `GroupUpdatedEventConsumer` | `GroupUpdatedEvent` |
| `GroupRemovedEventConsumer` | `GroupRemovedEvent` |

Each consumer also has a `ConsumerDefinition` that sets the endpoint name, prefetch count, and concurrency limit for that queue.

## Reporting Endpoints

Endpoints organized by query type:

| Folder | Purpose |
|--------|---------|
| `Activities/` | Daily activity, user overview |
| `Admin/` | Tenant-wide event views, user activity (admin-only) |
| `EventsSummary/` | Aggregated activity summary |
| `Groups/` | Events scoped to a link group |
| `Links/` | Events scoped to a single link |

## Architecture Notes

Analytics is a pure **subscriber** — it never writes back to the Links or Users databases. If the Analytics database is unavailable, event processing is deferred by MassTransit (retries + dead-letter queue) without affecting the producing modules.

Tenant isolation via EF query filters applies here too. Admin endpoints call `IgnoreQueryFilters()` to see cross-tenant data.

## Related

- [[Architecture]] — event-driven cross-module communication
- [[Outbox]] — how events are reliably delivered to consumers
- [[Tenant-Isolation]] — query filters
- [[Links]] — the module that produces all consumed events
