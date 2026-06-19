---
type: Pattern
tags: [pattern, architecture, modular-monolith, modules, dotnet]
---

# Modular Monolith

## What It Is

A **Modular Monolith** is a single deployable unit where the codebase is divided into modules with **hard boundaries** — enforced by project references, not just folders or namespaces. Modules communicate asynchronously via events or synchronously via narrow public interfaces. No module touches another module's database or internal types.

It offers the organisational clarity of microservices without the operational overhead.

## When to Use

- The team is small-to-medium and microservices would add deployment/ops overhead without benefit
- The domain has clear vertical boundaries but the services don't need to scale independently
- You want the option to extract modules to services later, without a big-bang rewrite
- You need strong transactional consistency within a module but accept eventual consistency across modules

## When NOT to Use

- Individual parts of the system need drastically different scaling characteristics right now
- Teams are large enough that independent deployment per module provides real velocity gains
- The domain doesn't decompose cleanly — forced module boundaries cause more friction than they solve

## Module Structure

Each module is a vertical slice through the stack:

```
Modules/
  Orders/
    Orders.Domain/           ← entities, value objects, repository interfaces
    Orders.Application/      ← MediatR handlers (commands + queries)
    Orders.Infrastructure/   ← EF Core, repositories, consumers, migrations
    Orders.Web/              ← Minimal API endpoints
    Orders.IntegrationEvents/← event contracts (public — other modules may reference this)
    Orders.Public.Client/    ← sync query interface (public — other modules may reference this)
```

**Dependency direction:** `Web → Application → Domain ← Infrastructure`

## The Three Module Communication Rules

### 1. No cross-module database access

Each module owns its schema. No module queries another module's tables. If Orders needs Customer data, it either:
- Has a local copy (denormalised from a past event), or
- Calls the `Customers.Public.Client` interface synchronously

### 2. Async communication via integration events

For loosely coupled cross-module workflows, publish an event and let consumers react:

```
Orders publishes OrderCreatedEvent
  → Inventory.OrderCreatedEventConsumer reduces stock
  → Notifications.OrderCreatedEventConsumer sends confirmation email
```

Orders doesn't know who consumes its events. Adding a new consumer doesn't require touching Orders.

### 3. Sync communication via Public.Client only

When Orders needs to query Customer data synchronously (e.g. to validate a customer exists before creating an order), it uses `ICustomerPublicClient` from `Customers.Public.Client`:

```csharp
// Orders.Application depends on this interface
public interface ICustomerPublicClient
{
    Task<CustomerDto?> GetByIdAsync(CustomerId id, CancellationToken ct);
}

// Customers.Infrastructure implements it
public class CustomerPublicClient(CustomersDbContext db) : ICustomerPublicClient { ... }
```

The implementation is registered when the Customers module is added. Orders.Application has **no reference** to Customers.Infrastructure.

## Project Reference Rules

```
✅ Orders.Application → Customers.Public.Client
✅ Orders.Application → Orders.Domain
✅ Orders.Infrastructure → Orders.Domain
❌ Orders.Application → Customers.Domain
❌ Orders.Application → Customers.Infrastructure
❌ Orders.Infrastructure → Customers.Infrastructure
```

Enforced by .NET project references — the solution won't compile if someone adds a forbidden reference.

## Database Isolation

Use a separate schema per module in a shared database (simple) or separate databases per module (more operational overhead):

```csharp
// Shared DB, separate schemas
builder.HasDefaultSchema("orders");   // in OrdersDbContext
builder.HasDefaultSchema("inventory");// in InventoryDbContext
```

Separate schemas mean:
- Independent EF Core migrations per module
- No accidental cross-module JOIN in production
- Easy to move a module to its own DB later (no data entanglements)

## Extracting to Microservices

The modular monolith is a stepping stone. When a module needs to be extracted:

1. The module's `IntegrationEvents` project becomes a shared NuGet package
2. The module's `Public.Client` is re-implemented as an HTTP/gRPC client
3. The module's `Infrastructure` gets its own host + database
4. Event consumers switch from in-process MassTransit to a real queue

The module's `Domain` and `Application` code moves unchanged.

## Skeleton

```
Solution/
  Api/
    Program.cs              ← thin composition root
  Modules/
    Orders/
      Orders.Domain/
      Orders.Application/
      Orders.Infrastructure/
      Orders.Web/
      Orders.IntegrationEvents/
      Orders.Public.Client/
    Inventory/
      ...
  BuildingBlocks/
    BuildingBlocks.Domain/       ← ValueObject, shared IDs
    BuildingBlocks.Application/  ← exception types, shared interfaces
    BuildingBlocks.Infrastructure/← auth middleware, exception handling
```

## Trade-offs

| Pro | Con |
|-----|-----|
| Single deployment — no distributed systems complexity | Monolith still scales as one unit |
| Hard boundaries enforced by the compiler | Requires discipline to maintain boundary rules |
| Extraction to microservices is incremental | Shared DB creates a deployment coupling point |
| Full ACID transactions within a module | Eventual consistency across modules needs careful design |

## Real-World Example

- [[projects/LinkStack/Architecture]] — Users / Links / Analytics modules, project reference rules, `Users.Public.Client` pattern
