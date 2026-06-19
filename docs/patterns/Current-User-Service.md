---
type: Pattern
tags: [pattern, authentication, identity, di, aspnetcore]
---

# Current User Service

## What It Is

A scoped service that resolves the authenticated user's identity from `HttpContext` and exposes it as a typed, injectable abstraction. Handlers and domain services depend on the interface — they never touch `IHttpContextAccessor` or parse claims directly.

## When to Use

- Multiple handlers need the current user's ID or tenant ID
- You want claim parsing in one place, not duplicated across handlers
- You want handlers to be unit-testable without mocking `HttpContext`

## When NOT to Use

- Only one endpoint needs the user ID — injecting `ICurrentUserService` for a single spot is fine, but you could also just read the claim in the endpoint itself

## Implementation

### 1. Interface (Application layer)

```csharp
public interface ICurrentUserService
{
    UserId UserId { get; }
    string? TenantId { get; }
    bool IsAuthenticated { get; }
}
```

### 2. Implementation (Infrastructure layer)

```csharp
internal class CurrentUserService(IHttpContextAccessor accessor) : ICurrentUserService
{
    public UserId UserId =>
        UserId.Create(
            accessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new UnauthorizedException("Not authenticated"));

    public string? TenantId =>
        accessor.HttpContext?.User.FindFirstValue("tenant_id");

    public bool IsAuthenticated =>
        accessor.HttpContext?.User.Identity?.IsAuthenticated is true;
}
```

### 3. Registration

```csharp
services.AddHttpContextAccessor();
services.AddScoped<ICurrentUserService, CurrentUserService>();
```

### 4. Usage in a handler

```csharp
public class CreateOrderCommandHandler(
    IOrderRepository orders,
    ICurrentUserService currentUser)
    : IRequestHandler<CreateOrderCommand, Guid>
{
    public async Task<Guid> Handle(CreateOrderCommand cmd, CancellationToken ct)
    {
        var order = Order.Create(
            currentUser.UserId,
            cmd.Lines);

        await orders.AddAsync(order, ct);
        return order.Id;
    }
}
```

### 5. Usage in an endpoint (alternative — read claims directly)

For endpoints that only need the user ID once, reading from `HttpContext` directly is fine:

```csharp
app.MapPost("/api/orders", async (
    CreateOrderRequest req,
    ClaimsPrincipal user,
    ISender sender) =>
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier)!;
    var id = await sender.Send(new CreateOrderCommand(userId, req.Lines));
    return Results.Created($"/orders/{id}", new { id });
});
```

Prefer `ICurrentUserService` when the claim is needed in Application-layer code.

## Unit Testing

Fake the interface — no `HttpContext` needed in tests:

```csharp
public class FakeCurrentUserService : ICurrentUserService
{
    public UserId UserId { get; set; } = UserId.Create("test-user");
    public string? TenantId { get; set; } = "test-tenant";
    public bool IsAuthenticated => true;
}

// In test
var handler = new CreateOrderCommandHandler(
    fakeRepo,
    new FakeCurrentUserService { UserId = UserId.Create("user-123") });
```

## Keeping It Thin

`ICurrentUserService` should only read — it should not call external services or trigger side effects. If you need to load a full user profile, do that in the handler using a repository. The service is just a claims reader.

## Related

- [[CQRS-MediatR]] — handlers inject ICurrentUserService to get the caller's identity
- [[EF-Core-Global-Query-Filters]] — TenantId from ICurrentUserService feeds into DbContext query filters
- [[projects/LinkStack/Authentication]] — LinkStack's full implementation with PersonalContext / OrganizationContext
