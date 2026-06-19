---
type: Pattern
tags: [pattern, cqrs, mediatr, application, commands, queries]
---

# CQRS with MediatR

## What It Is

**Command Query Responsibility Segregation** separates operations that change state (Commands) from operations that read state (Queries). MediatR is the in-process mediator — callers send a message, MediatR routes it to the registered handler. No direct service-to-service calls.

This is a lightweight, in-process CQRS — not the full event-sourced read-model variant.

## When to Use

- You want to decouple callers (controllers, endpoints) from business logic
- Application logic is growing beyond simple CRUD and needs structure
- You want each use case to be independently readable and testable
- You want to add cross-cutting behavior (logging, validation, caching) via pipeline behaviors without changing handlers

## When NOT to Use

- Simple CRUD with no business logic — the abstraction adds overhead for no gain
- A project so small that a service class per feature is sufficient

## Core Concepts

### Command

A command changes state. It should return as little as possible — ideally just an ID or `Unit` (void).

```csharp
// Definition
public record CreateOrderCommand(
    CustomerId CustomerId,
    IEnumerable<OrderLineDto> Lines
) : IRequest<Guid>;

// Handler
public class CreateOrderCommandHandler(
    IOrderRepository orders,
    IUnitOfWork unitOfWork)
    : IRequestHandler<CreateOrderCommand, Guid>
{
    public async Task<Guid> Handle(
        CreateOrderCommand request,
        CancellationToken cancellationToken)
    {
        var order = Order.Create(request.CustomerId, request.Lines);
        await orders.AddAsync(order, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return order.Id;
    }
}
```

### Query

A query reads state. It never mutates anything. It may return rich DTOs directly.

```csharp
// Definition
public record GetOrderQuery(Guid OrderId) : IRequest<OrderDto?>;

// Handler
public class GetOrderQueryHandler(IOrderReadRepository orders)
    : IRequestHandler<GetOrderQuery, OrderDto?>
{
    public async Task<OrderDto?> Handle(
        GetOrderQuery request,
        CancellationToken cancellationToken)
    {
        return await orders.GetDtoByIdAsync(request.OrderId, cancellationToken);
    }
}
```

### Sending from an endpoint

```csharp
app.MapPost("/orders", async (CreateOrderRequest req, ISender sender) =>
{
    var id = await sender.Send(new CreateOrderCommand(
        CustomerId.Create(req.CustomerId),
        req.Lines));
    return Results.Created($"/orders/{id}", new { id });
});

app.MapGet("/orders/{id:guid}", async (Guid id, ISender sender) =>
{
    var order = await sender.Send(new GetOrderQuery(id));
    return order is null ? Results.NotFound() : Results.Ok(order);
});
```

## Pipeline Behaviors

Add cross-cutting concerns without touching handlers:

```csharp
// Logging behavior
public class LoggingBehavior<TRequest, TResponse>(ILogger<LoggingBehavior<TRequest, TResponse>> logger)
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    public async Task<TResponse> Handle(
        TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken ct)
    {
        logger.LogInformation("Handling {Name}", typeof(TRequest).Name);
        var response = await next();
        logger.LogInformation("Handled {Name}", typeof(TRequest).Name);
        return response;
    }
}

// Registration
services.AddMediatR(cfg =>
{
    cfg.RegisterServicesFromAssembly(Assembly.GetExecutingAssembly());
    cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(LoggingBehavior<,>));
});
```

## Handler Responsibility Order (Commands)

Recommended sequence inside a command handler:
1. Observability / logging breadcrumb
2. Load aggregate, check authorization
3. Call domain method (business logic lives here, not in the handler)
4. Persist via repository
5. Publish integration events
6. Commit (`SaveChangesAsync`)

## Project Structure

```
Application/
  Orders/
    Commands/
      CreateOrderCommand.cs        ← record + IRequest<Guid>
      CreateOrderCommandHandler.cs ← IRequestHandler
    Queries/
      GetOrderQuery.cs
      GetOrderQueryHandler.cs
```

For large modules, split into separate projects: `Application.Write` (commands) and `Application.Read` (queries).

## Trade-offs

| Pro | Con |
|-----|-----|
| Each use case is one file, easy to find | Extra indirection for simple operations |
| Pipeline behaviors add cross-cutting cleanly | MediatR is an additional dependency |
| Handlers are easily unit-testable | Can encourage thin handlers that leak logic |

## Real-World Example

- [[projects/LinkStack/Patterns/CQRS]] — `CreateLinkCommand`, `GetGroupQuery`, Table Module queries
