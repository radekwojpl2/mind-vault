---
type: Pattern
tags: [pattern, architecture, vertical-slices, folder-structure, feature-organization]
---

# Vertical Slices

## What It Is

**Vertical Slice Architecture** organises code by **feature** (use-case) rather than by **technical layer**. Each use-case gets its own folder containing everything it needs: the HTTP endpoint, request/response DTOs, command or query, and its handler — all co-located and named consistently.

The alternative — grouping all controllers in one folder, all commands in another, all handlers in another — forces you to jump across the codebase to work on a single feature.

## When to Use

- A codebase has many use-cases and jumping across layer folders to work on one feature feels slow
- You want it to be obvious where to add or change a feature without reading a README
- Teams work on features independently and want minimal merge conflicts

## When NOT to Use

- The project is small enough that a single controller file and a single service file is sufficient
- Use-cases are so interconnected that a single slice would need to import half the codebase

## Folder Structure

Organise by feature first, layer second:

```
Modules/Orders/
  Web/
    Orders/
      CreateOrder/
        CreateOrderEndpoint.cs
        CreateOrderRequest.cs
      GetOrderById/
        GetOrderByIdEndpoint.cs
      CancelOrder/
        CancelOrderEndpoint.cs
        CancelOrderRequest.cs
    OrderEndpoints.cs          ← wires up all order endpoints

  Application/
    Orders/
      CreateOrder/
        CreateOrderCommand.cs  ← Command record + Handler in one file
      GetOrderById/
        GetOrderByIdQuery.cs   ← Query record + DTOs + Handler in one file
      CancelOrder/
        CancelOrderCommand.cs
```

Every artifact for `CreateOrder` lives in a `CreateOrder/` folder at its layer. The folder name is the use-case name — it reads like a table of contents.

## Naming Conventions

| Artifact | Name |
|----------|------|
| HTTP endpoint class | `CreateOrderEndpoint` |
| Request DTO | `CreateOrderRequest` |
| Response DTO (if needed) | `CreateOrderResponse` / `OrderDto` |
| MediatR command | `CreateOrderCommand` |
| MediatR query | `GetOrderByIdQuery` |
| Command handler | `CreateOrderCommandHandler` (same file as command) |
| Query handler | `GetOrderByIdQueryHandler` (same file as query) |

Co-locate command and handler in the same file — they change together and are always read together.

## File Examples

### Endpoint + Request (Web layer)

```csharp
// Orders/CreateOrder/CreateOrderEndpoint.cs
public static class CreateOrderEndpoint
{
    public static void MapCreateOrderEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/orders", CreateOrder)
            .RequireAuthorization()
            .WithTags("Orders");
    }

    private static async Task<IResult> CreateOrder(
        [FromBody] CreateOrderRequest request,
        ICurrentUserService currentUser,
        ISender sender)
    {
        var id = await sender.Send(new CreateOrderCommand(
            CustomerId.Create(currentUser.UserId),
            request.Lines.Select(l => new OrderLineDto(l.ProductId, l.Quantity))));

        return Results.Created($"/api/orders/{id}", new { id });
    }
}
```

```csharp
// Orders/CreateOrder/CreateOrderRequest.cs
public record CreateOrderRequest(IEnumerable<OrderLineRequest> Lines);
public record OrderLineRequest(Guid ProductId, int Quantity);
```

### Command + Handler (Application layer)

```csharp
// Orders/CreateOrder/CreateOrderCommand.cs
public record CreateOrderCommand(
    CustomerId CustomerId,
    IEnumerable<OrderLineDto> Lines
) : IRequest<Guid>;

public class CreateOrderCommandHandler(
    IOrderRepository orders,
    IUnitOfWork unitOfWork)
    : IRequestHandler<CreateOrderCommand, Guid>
{
    public async Task<Guid> Handle(CreateOrderCommand cmd, CancellationToken ct)
    {
        var order = Order.Create(cmd.CustomerId, cmd.Lines);
        await orders.AddAsync(order, ct);
        await unitOfWork.SaveChangesAsync(ct);
        return order.Id;
    }
}
```

### Query + DTO + Handler (Application layer)

```csharp
// Orders/GetOrderById/GetOrderByIdQuery.cs
public record GetOrderByIdQuery(Guid OrderId) : IRequest<OrderDto?>;

public record OrderDto(Guid Id, string Status, decimal Total, DateTime CreatedAt);

public class GetOrderByIdQueryHandler(IOrderTableModule orders)
    : IRequestHandler<GetOrderByIdQuery, OrderDto?>
{
    public async Task<OrderDto?> Handle(GetOrderByIdQuery query, CancellationToken ct)
    {
        var order = await orders.FindOneAsync(new OrderByIdSpecification(query.OrderId), ct);
        return order?.ToDto();
    }
}
```

## Composition Root Per Feature Group

Don't scatter `MapXxx()` calls in `Program.cs`. Each feature group has a local composition file:

```csharp
// OrderEndpoints.cs
public static class OrderEndpoints
{
    public static IEndpointRouteBuilder MapOrderEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapCreateOrderEndpoint();
        app.MapGetOrderByIdEndpoint();
        app.MapCancelOrderEndpoint();
        return app;
    }
}
```

Module-level extension calls the feature group:

```csharp
// LinksWebExtensions.cs (module level)
public static IEndpointRouteBuilder MapOrdersModuleEndpoints(this IEndpointRouteBuilder app)
{
    app.MapOrderEndpoints();
    app.MapOrderItemEndpoints();
    return app;
}
```

`Program.cs` calls only the module-level method.

## Relationship to Clean Architecture / CQRS

Vertical slices and Clean Architecture are **orthogonal** — one is about folder organisation, the other about dependency direction. They combine well:

- Layers still exist (Web, Application, Domain, Infrastructure)
- Dependency rules still apply (`Web → Application → Domain ← Infrastructure`)
- Within each layer, folders are organised by feature, not by type

See [[CQRS-MediatR]] for the command/query split that vertical slices typically pair with.

## Trade-offs

| Pro | Con |
|-----|-----|
| Finding or adding a feature takes seconds | Shared DTOs/specs require a home outside feature folders |
| Each feature folder is self-contained and deletable | Tooling (e.g. "show all controllers") needs rethinking |
| Minimal cross-feature merge conflicts | Discipline needed to avoid bloated slice folders |
| Use-case list is visible in the folder tree | New contributors used to layer-first may need adjustment |

## Real-World Example

- [[projects/LinkStack/Architecture]] — every use-case in Links, Users, and Analytics lives in a `UseCaseName/` folder at both the Web and Application layers; e.g. `Links/CreateLink/CreateLinkEndpoint.cs` + `Links/CreateLink/CreateLinkCommand.cs`
