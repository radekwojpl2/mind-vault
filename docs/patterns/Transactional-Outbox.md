---
tags: [pattern, outbox, messaging, reliability, masstransit, ef-core]
---

# Transactional Outbox

## What It Is

The **Transactional Outbox** pattern guarantees that a domain change and its integration event are committed atomically. The event is written to an `OutboxMessage` table in the **same database transaction** as the domain change, then a background process delivers it to the message broker.

This eliminates the "dual-write" problem: without an outbox, if your app writes to the DB then crashes before publishing to the broker, the event is lost.

## When to Use

- You publish integration events after a write operation
- Losing an event would cause data inconsistency across services or modules
- "At-least-once" delivery is acceptable (idempotent consumers handle duplicates)

## When NOT to Use

- You don't have integration events
- You're already using a saga / process manager that handles retries
- Your broker supports transactions (rare; Kafka with EOS is an exception)

## How It Works

```
Handler
  1. Modify domain state (e.g. create Order)
  2. Write OutboxMessage row (event payload)
  ── SaveChangesAsync ──▶ single DB transaction commits both
  3. Return response to caller

Background service (separate thread / hosted service)
  4. Poll OutboxMessage for undelivered rows
  5. Publish to message broker (RabbitMQ, etc.)
  6. Mark row as delivered
```

If the app crashes between step 3 and step 5, the outbox row survives and will be processed on restart.

## Implementation with MassTransit (EF Core)

MassTransit provides a first-class EF outbox. This is the recommended approach for .NET projects using MassTransit.

### 1. Register the outbox per DbContext

```csharp
services.AddMassTransit(x =>
{
    x.AddEntityFrameworkOutbox<AppDbContext>(o =>
    {
        o.UsePostgres();           // or UseSqlServer(), UseSqlite()
        o.UseBusOutbox();
        o.DuplicateDetectionWindow = TimeSpan.FromMinutes(30);
        o.QueryMessageLimit = 100;
        o.QueryDelay = TimeSpan.FromSeconds(1);
    });

    x.UsingRabbitMq((ctx, cfg) =>
    {
        cfg.Host("rabbitmq://localhost");
        cfg.ConfigureEndpoints(ctx);
    });
});
```

### 2. Add outbox tables to the DbContext

```csharp
protected override void OnModelCreating(ModelBuilder builder)
{
    // your entities...
    builder.AddOutboxStateEntity();
    builder.AddOutboxMessageEntity();
}
```

### 3. Generate and run the migration

```bash
dotnet ef migrations add AddOutbox
dotnet ef database update
```

### 4. Publish inside a handler (unchanged from normal publishing)

```csharp
public async Task<Guid> Handle(CreateOrderCommand cmd, CancellationToken ct)
{
    var order = Order.Create(cmd.CustomerId, cmd.Lines);
    await _orders.AddAsync(order, ct);

    await _publishEndpoint.Publish(new OrderCreatedEvent(
        order.Id, cmd.CustomerId, DateTime.UtcNow), ct);

    await _unitOfWork.SaveChangesAsync(ct);  // commits order + outbox row
    return order.Id;
}
```

The outbox intercepts `Publish` and routes it to the DB instead of the broker directly. The broker delivery happens asynchronously after the commit.

## Implementation without MassTransit

If you're not using MassTransit, implement manually:

```csharp
// OutboxMessage entity
public class OutboxMessage
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Type { get; set; } = null!;
    public string Payload { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ProcessedAt { get; set; }
}

// Writing in the same transaction
var message = new OutboxMessage
{
    Type = nameof(OrderCreatedEvent),
    Payload = JsonSerializer.Serialize(new OrderCreatedEvent(...))
};
db.OutboxMessages.Add(message);
await db.SaveChangesAsync(ct);  // atomic with domain change

// Background processor (IHostedService)
public class OutboxProcessor(IServiceScopeFactory factory) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            using var scope = factory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var bus = scope.ServiceProvider.GetRequiredService<IBus>();

            var pending = await db.OutboxMessages
                .Where(m => m.ProcessedAt == null)
                .OrderBy(m => m.CreatedAt)
                .Take(50)
                .ToListAsync(ct);

            foreach (var msg in pending)
            {
                await PublishAsync(bus, msg, ct);
                msg.ProcessedAt = DateTime.UtcNow;
            }

            await db.SaveChangesAsync(ct);
            await Task.Delay(TimeSpan.FromSeconds(1), ct);
        }
    }
}
```

## Idempotent Consumers

The outbox guarantees **at-least-once** delivery — duplicates are possible on retry. Consumers must be idempotent:

```csharp
public async Task Consume(ConsumeContext<OrderCreatedEvent> context)
{
    var alreadyProcessed = await db.ProcessedEvents
        .AnyAsync(e => e.EventId == context.MessageId);
    if (alreadyProcessed) return;

    // process...

    db.ProcessedEvents.Add(new ProcessedEvent { EventId = context.MessageId!.Value });
    await db.SaveChangesAsync(context.CancellationToken);
}
```

## Trade-offs

| Pro | Con |
|-----|-----|
| Zero event loss — DB transaction is the guarantee | Adds two outbox tables per DbContext |
| Works with any message broker | Slight delay before broker delivery |
| Retry is free — outbox row persists until delivered | Consumers must be idempotent |

## Real-World Example

- [[projects/LinkStack/Patterns/Outbox]] — MassTransit EF outbox in `LinksDbContext`, used by all link/group command handlers
