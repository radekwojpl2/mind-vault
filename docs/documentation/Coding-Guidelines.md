---
tags: [documentation, guidelines, conventions, standards, code-review]
---

# Coding Guidelines

## What They Are

Coding guidelines are **prescriptive** documents that define exactly how code must be structured, named, and organised. They are referenced in code reviews as the authority. Unlike architecture docs (which describe the system) or ADRs (which explain decisions), guidelines tell developers: *here is the exact pattern to follow.*

## When to Write One

Write a guideline when:
- A pattern is non-obvious and developers keep making the same wrong choice
- A convention is important enough that code reviews consistently raise it
- You want to stop relitigating the same structural decision in PR comments
- A new team member should be able to produce correct-looking code on day one

Don't write a guideline for obvious things (don't commit secrets, use meaningful names). Guidelines cost maintenance — make them earn their existence.

**Examples that warrant a guideline:**
- How a command handler must be structured (file layout, method order, responsibilities)
- How a new module must register its DI dependencies
- How value objects must be created (factory method, not constructor)
- How integration events must be named and filed

## Structure

A good guideline has four parts:

### 1. The Rule (one sentence)

State the convention unambiguously. This is what gets cited in code reviews.

> *All command handlers must be in the same file as their command record, in the `Application/{Feature}/{UseCaseName}/` folder.*

### 2. Why

Explain the reasoning. Without this, the rule looks arbitrary and developers will ignore it or route around it.

> *Co-locating command and handler means you never need to open two files to understand a use case. The folder name makes the full list of features visible in the file tree.*

### 3. Required Structure (with code)

Show exactly what correct code looks like. If there are naming rules, put them in a table.

```csharp
// Application/Orders/CreateOrder/CreateOrderCommand.cs
namespace MyApp.Orders.Application.Orders.CreateOrder;

public record CreateOrderCommand(CustomerId CustomerId) : IRequest<Guid>;

public class CreateOrderCommandHandler(IOrderRepository orders, IUnitOfWork uow)
    : IRequestHandler<CreateOrderCommand, Guid>
{
    public async Task<Guid> Handle(CreateOrderCommand cmd, CancellationToken ct)
    {
        var order = Order.Create(cmd.CustomerId);
        await orders.AddAsync(order, ct);
        await uow.SaveChangesAsync(ct);
        return order.Id;
    }
}
```

### 4. What NOT to Do

Show the wrong pattern explicitly. Developers learn as much from counter-examples as from examples.

```csharp
// ❌ Wrong — handler in a separate file
// Application/Orders/Commands/CreateOrderCommandHandler.cs

// ❌ Wrong — business logic in the endpoint
app.MapPost("/orders", async (req, db) =>
{
    var order = new Order { ... };  // NO — no factory, no domain logic
    db.Orders.Add(order);
    ...
});
```

## File Naming

```
docs/guidelines/
  G-01-application-feature-organization.md
  G-02-module-di-registration.md
  G-03-value-objects.md
  G-04-integration-events.md
```

Prefix with `G-{NN}` so guidelines are ordered and easily referenced in code reviews ("see G-03").

## Naming Table Convention

For naming rules, a table beats prose:

| Artifact | Pattern | Example |
|----------|---------|---------|
| Command | `{Action}{Entity}Command` | `CreateOrderCommand` |
| Handler | `{Action}{Entity}CommandHandler` | `CreateOrderCommandHandler` |
| Query | `Get{Entity}Query` / `List{Entities}Query` | `GetOrderByIdQuery` |
| Endpoint | `{Action}{Entity}Endpoint` | `CreateOrderEndpoint` |
| Request DTO | `{Action}{Entity}Request` | `CreateOrderRequest` |
| Folder | `{Action}{Entity}/` | `CreateOrder/` |

## Authority and Enforcement

Guidelines need to be *authoritative* to be respected:

1. **Reference a constitution or principles document** — "Per the project constitution, all domain state must be changed through aggregate methods."
2. **Reference in code review** — "This violates G-02. The module must register its own dependencies via `AddOrdersModule()`."
3. **Link from onboarding docs** — new developers read guidelines before writing code
4. **Keep them current** — an outdated guideline that contradicts the actual codebase destroys trust in all guidelines

## Keep Guidelines Focused

One guideline, one topic. "General coding standards" is not a guideline — it's a dumping ground. Each guideline should be short enough (1–2 pages) to be read in 5 minutes.

## Trade-offs

| Pro | Con |
|-----|-----|
| Code reviews cite a document, not an opinion | Guidelines go stale if the codebase evolves without updating them |
| Onboarding is faster — patterns are explicit | Too many guidelines create bureaucracy |
| Stops relitigating the same decisions | Wrong guidelines get followed mechanically even when context has changed |

## Real-World Example

- `docs/guidlines/` in LinkStack — 4 guidelines covering feature folder organisation, module DI registration, value object creation, and module edge patterns. Each is cited in code review via `G-{NN}`.
