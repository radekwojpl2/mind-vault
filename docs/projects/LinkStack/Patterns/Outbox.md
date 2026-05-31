---
tags: [linkstack, pattern, outbox, masstransit, messaging, reliability]
---

# Outbox Pattern

Integration events are published via the **MassTransit Entity Framework Outbox**, not directly to RabbitMQ. This guarantees that an event is never lost even if the message broker is unavailable at commit time.

## How It Works

1. A command handler calls `eventPublisher.PublishAsync(event, ct)` before `SaveChangesAsync`.
2. `IEventPublisher` (implemented by `MassTransitEventPublisher`) writes the event to the `OutboxMessage` table in the **same database transaction** as the domain change.
3. `SaveChangesAsync` commits both the domain change and the outbox row atomically.
4. A MassTransit background service reads pending `OutboxMessage` rows and forwards them to RabbitMQ.
5. Once delivered, the row is marked delivered (and eventually cleaned up).

If the API crashes after step 3 but before step 4, the outbox row survives and will be processed on restart.

## Configuration (per module)

Each module that publishes events registers its DbContext with the outbox:

```csharp
x.AddEntityFrameworkOutbox<LinksDbContext>(o =>
{
    o.UsePostgres();
    o.UseBusOutbox();
    o.DuplicateDetectionWindow = TimeSpan.FromMinutes(30);
    o.QueryMessageLimit = 100;
    o.QueryDelay = TimeSpan.FromSeconds(1);
});
```

The outbox tables (`OutboxState`, `OutboxMessage`) are added to the module's EF schema via:

```csharp
builder.AddOutboxStateEntity();
builder.AddOutboxMessageEntity();
```

## Deduplication

`DuplicateDetectionWindow = 30 minutes` — if the same message is submitted twice within 30 minutes (e.g. due to a retry), MassTransit will drop the duplicate before delivery. Message IDs are deterministic per event.

## Relationship to Unit of Work

The Unit of Work pattern (`IUnitOfWork.SaveChangesAsync`) is the commit point. The outbox message is part of that same commit, so there is no window between "domain saved" and "event queued."

## Consumer Side

Consumers in the Analytics module (and potentially other modules in future) subscribe to these events via RabbitMQ. If a consumer fails, MassTransit retries with back-off before routing to a dead-letter queue.

## Related

- [[Architecture]] — cross-module event flow
- [[Analytics]] — primary consumer of Links events
- [[CQRS]] — commands call eventPublisher before SaveChanges
