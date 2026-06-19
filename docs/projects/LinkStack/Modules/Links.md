---
type: Module
tags: [linkstack, module, links, cqrs, events]
---

# Links Module

**Schema:** `links` | **Namespace:** `LinkStack.Links.*`

Manages links, link groups, sharing, tags, and AI-assisted tag suggestions. The Application layer is split into separate Read and Write projects — the only module with this split.

## Projects

| Project | Layer |
|---------|-------|
| `LinkStack.Links.Domain` | Domain — entities, value objects, repository interfaces |
| `LinkStack.Links.Application.Write` | Application (Commands) — state-changing operations |
| `LinkStack.Links.Application.Read` | Application (Queries) — read operations via Table Modules |
| `LinkStack.Links.Infrastructure` | Infrastructure — EF Core, repositories, MassTransit outbox |
| `LinkStack.Links.Web` | Web — Minimal API endpoints |
| `LinkStack.Links.IntegrationEvents` | Event contracts published to the bus |

## Domain Entities

### Link
Core aggregate. Fields: `Url`, `Title`, `Description`, `Order`, `GroupId`, `UserId`, `TenantId`, `IsFavorite`, `Tags[]`, `CreatedAt`, `UpdatedAt`.

Created via factory method `Link.Create(...)` which validates all inputs. Mutations are explicit methods: `Update()`, `MoveToGroup()`, `UpdateOrder()`, `ToggleFavorite()`, `SetTags()`.

### LinkGroup
Container for links. Has `Name`, `Color`, `Icon`, `UserId`, `TenantId`. Owns the permission model:

```
Owner        → Manage (implicit)
LinkGroupShare → View | Edit | Manage (explicit grant)
```

Authorization methods on the aggregate:
- `CanUserView(userId)` — owner or any share
- `CanUserEdit(userId)` — owner or Edit/Manage share
- `CanUserManage(userId)` — owner or Manage share

### LinkGroupShare
Explicit permission grant: a `UserId` + `SharePermission` (View/Edit/Manage) tied to a `LinkGroup`.

### LinkTag
Many-to-many between `Link` and tag names. Tags are normalized (lowercase, deduplicated) at creation.

## Integration Events

Published after every write operation via `IEventPublisher`:

| Event | Trigger |
|-------|---------|
| `LinkCreatedEvent` | Link.Create |
| `LinkUpdatedEvent` | link.Update |
| `LinkRemovedEvent` | link deleted |
| `GroupCreatedEvent` | LinkGroup.Create |
| `GroupUpdatedEvent` | group.Update |
| `GroupRemovedEvent` | group deleted |

All events are durably stored via the MassTransit outbox before the response is returned. See [[Outbox]].

## AI Tagging

`AiAgent.Client` calls an Anthropic-managed agent (`claude-*`) to suggest tags for a link. Configured via `TagsSuggestion:Endpoint` and `TagsSuggestion:AccessKey`. Suggestions are presented to the user; the user confirms before tags are persisted.

## Query Pattern

Read handlers use `ILinkTableModule` / `ILinkGroupTableModule` with composable `SpecificationBase<T>` predicates rather than raw repository calls. See [[CQRS]] for the Table Module + Specification pattern.

## Related

- [[Architecture]] — dependency flow
- [[CQRS]] — Commands vs Queries, Table Module, Specification pattern
- [[Outbox]] — guaranteed event delivery
- [[Tenant-Isolation]] — EF query filters per tenant
- [[Value-Objects]] — Url, LinkTitle, Description, TagName, etc.
