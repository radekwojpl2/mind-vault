---
tags: [pattern, architecture, modular-monolith, shared-kernel, ddd]
---

# Modular Monolith Building Blocks

## What It Is

A shared kernel layer that lives outside all business modules and provides cross-cutting contracts and base types that every module needs. It stops modules from either duplicating infrastructure concerns or coupling to each other to share them.

## When to Use

- Building a modular monolith where multiple modules share the same cross-cutting needs (auth context, typed exceptions, event publishing)
- You want all modules to consume the same exception → HTTP mapping without each wiring it up separately
- You need a stable shared test base (containers, JWT helpers) without duplicating it per module

## When NOT to Use

- A single-module application — the indirection isn't worth it
- Microservices — each service should own its full stack; a shared NuGet package is the equivalent if needed
- When "shared" is just an excuse to avoid thinking about module boundaries — business logic never belongs here

## Implementation

Split into four sub-projects following the same dependency rule as regular modules:

```
YourApp.BuildingBlocks.Domain          ← no external deps
YourApp.BuildingBlocks.Application     ← refs Domain only
YourApp.BuildingBlocks.Infrastructure  ← refs Application + Domain, registers everything
Tests/YourApp.BuildingBlocks.IntegrationTests  ← shared test base
```

**1. Domain — base types and shared value objects**

```csharp
public abstract class ValueObject
{
    protected abstract IEnumerable<object> GetEqualityComponents();

    public override bool Equals(object? obj)
    {
        if (obj == null || obj.GetType() != GetType()) return false;
        return GetEqualityComponents().SequenceEqual(((ValueObject)obj).GetEqualityComponents());
    }

    public override int GetHashCode() =>
        GetEqualityComponents().Select(x => x?.GetHashCode() ?? 0).Aggregate((x, y) => x ^ y);
}
```

**2. Application — interfaces and typed exceptions**

```csharp
// Event publishing contract
public interface IEventPublisher
{
    Task PublishAsync<T>(T @event, CancellationToken cancellationToken = default) where T : class;
}

// Identity context — personal or org, enforced at call site
public abstract class IdentityContext
{
    public UserId UserId { get; }
    protected IdentityContext(UserId userId) => UserId = userId;

    public OrganizationContext MustBePartOfOrganization() =>
        this as OrganizationContext ?? throw new BadRequestException("...", ErrorCodes.ORG_REQUIRED);
}

// Typed exceptions — each carries an error code and HTTP status
public abstract class ApplicationExceptionBase : Exception
{
    public string ErrorCode { get; }
    public int StatusCode { get; }
}
public class NotFoundException(string message, string code) : ApplicationExceptionBase(message, code, 404) { }
public class BadRequestException(string message, string code) : ApplicationExceptionBase(message, code, 400) { }
```

**3. Infrastructure — single registration entry point**

```csharp
public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddBuildingBlocksInfrastructure(
        this IServiceCollection services, IConfiguration configuration)
    {
        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddScoped<IEventPublisher, MassTransitEventPublisher>();
        // ... ProblemDetails factories, email, observability
        return services;
    }

    public static IApplicationBuilder UseExceptionHandling(this IApplicationBuilder app) =>
        app.UseMiddleware<ExceptionHandlingMiddleware>();
}
```

The exception middleware maps typed exceptions to RFC 7807 ProblemDetails using a factory per exception type.

**4. Tests — shared integration test base**

```csharp
public abstract class IntegrationTestBase : IAsyncLifetime
{
    protected readonly HttpClient Client;

    protected IntegrationTestBase(HttpClient client) => Client = client;

    protected void AuthenticateAs(string userId, string? orgId = null, string[]? roles = null)
    {
        var token = JwtTokenGenerator.Generate(userId, orgId, roles);
        Client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
    }

    protected async Task WaitForAsync(Func<Task<bool>> condition, int timeoutSeconds = 30)
    {
        var deadline = DateTime.UtcNow.AddSeconds(timeoutSeconds);
        while (DateTime.UtcNow < deadline)
        {
            if (await condition()) return;
            await Task.Delay(100);
        }
        throw new TimeoutException($"Condition not satisfied within {timeoutSeconds}s.");
    }
}
```

Module test classes inherit this and get HTTP helpers, auth, and async polling for free.

## Rules

- **No business logic** — if it applies to one module, it belongs in that module
- **Modules reference Domain and Application only** — never reference BuildingBlocks.Infrastructure directly; it's wired once at the composition root
- **Infrastructure registered once** — call `AddBuildingBlocksInfrastructure` in `Program.cs`, not in each module's DI registration
- **Interfaces in Application, implementations in Infrastructure** — the inversion is intentional; modules depend on abstractions, not infra packages

## Trade-offs

| Pro | Con |
|-----|-----|
| Eliminates duplicated exception handling and ProblemDetails mapping across modules | Adds a layer of indirection — trivial things require a sub-project reference |
| Modules share a stable test base (containers, JWT generator) without coupling | Changes to base types (e.g. `ValueObject`, `IdentityContext`) ripple to all modules |
| Single place to evolve cross-cutting concerns (observability, auth context) | Risk of gradual bloat — it becomes a grab-bag if discipline slips |
