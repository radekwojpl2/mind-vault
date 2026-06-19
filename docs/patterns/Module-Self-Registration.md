---
type: Pattern
tags: [pattern, di, dependency-injection, modules, dotnet, architecture]
---

# Module Self-Registration

## What It Is

Each logical module owns an `AddXxxModule(IServiceCollection, IConfiguration)` extension method that registers all of its own dependencies. `Program.cs` calls one method per module and knows nothing about what's inside. Modules are self-contained registration units.

## When to Use

- A project has 2+ distinct feature areas with separate concerns
- You want `Program.cs` to be a short, readable composition root
- You want a module to be movable (to a different project, or extracted to a microservice) without touching other modules' registration

## When NOT to Use

- A small project where all services fit comfortably in one `Program.cs` — the extra method adds no value
- A framework that already handles module discovery automatically (e.g. Orchard Core, Modular MVC)

## Implementation

### 1. Module extension method

Each module defines its own extension method, typically in its Infrastructure or Web project:

```csharp
// OrdersModule/OrdersModuleExtensions.cs
public static class OrdersModuleExtensions
{
    public static IServiceCollection AddOrdersModule(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string not configured");

        // Database
        services.AddDbContext<OrdersDbContext>(opts =>
            opts.UseNpgsql(connectionString));

        // Repositories
        services.AddScoped<IOrderRepository, OrderRepository>();

        // Unit of work
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        // MediatR handlers in this module's assembly
        services.AddMediatR(cfg =>
            cfg.RegisterServicesFromAssembly(typeof(OrdersModuleExtensions).Assembly));

        // External clients this module depends on
        services.AddHttpClient<IPaymentClient, PaymentClient>(client =>
            client.BaseAddress = new Uri(configuration["Payments:BaseUrl"]!));

        return services;
    }

    public static IEndpointRouteBuilder MapOrdersEndpoints(
        this IEndpointRouteBuilder app)
    {
        app.MapOrderEndpoints();
        app.MapOrderItemEndpoints();
        return app;
    }
}
```

### 2. Program.cs stays thin

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOrdersModule(builder.Configuration);
builder.Services.AddInventoryModule(builder.Configuration);
builder.Services.AddCustomersModule(builder.Configuration);
builder.Services.AddSharedInfrastructure(builder.Configuration); // auth, CORS, etc.

var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();
app.UseExceptionHandling();

app.MapOrdersEndpoints();
app.MapInventoryEndpoints();
app.MapCustomersEndpoints();

app.Run();
```

### 3. Endpoint registration inside the module

Group endpoint mapping by resource, keeping each endpoint in its own small class:

```csharp
// OrdersModule/Web/OrderEndpoints.cs
public static class OrderEndpoints
{
    public static IEndpointRouteBuilder MapOrderEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/orders", CreateOrder).RequireAuthorization();
        app.MapGet("/api/orders/{id:guid}", GetOrder).RequireAuthorization();
        app.MapDelete("/api/orders/{id:guid}", CancelOrder).RequireAuthorization();
        return app;
    }

    private static async Task<IResult> CreateOrder(...) { ... }
    private static async Task<IResult> GetOrder(...) { ... }
    private static async Task<IResult> CancelOrder(...) { ... }
}
```

## Testing

Each module's extension method can be used directly in a test `WebApplicationFactory`:

```csharp
public class OrdersTestWebAppFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            // Replace real DB with test container
            services.RemoveAll<DbContextOptions<OrdersDbContext>>();
            services.AddDbContext<OrdersDbContext>(opts =>
                opts.UseNpgsql(_testConnectionString));
        });
    }
}
```

## Variant: MassTransit bus configuration

When using MassTransit, modules can each contribute their consumers without `Program.cs` knowing:

```csharp
// In AddOrdersModule
services.AddSingleton<Action<IBusRegistrationConfigurator>>(
    cfg => cfg.AddConsumersFromNamespaceContaining<OrdersModuleExtensions>());

// In Program.cs / shared infrastructure
services.AddMassTransit(x =>
{
    // Collect all module contributions
    var moduleConfigs = services
        .BuildServiceProvider()
        .GetServices<Action<IBusRegistrationConfigurator>>();

    foreach (var configure in moduleConfigs)
        configure(x);

    x.UsingRabbitMq(...);
});
```

## Trade-offs

| Pro | Con |
|-----|-----|
| `Program.cs` is a readable composition root | One more file per module |
| Moving or extracting a module doesn't touch other modules | Circular dependencies between modules become visible |
| Module owns its own DI — no surprise coupling | Easy to accidentally register the wrong lifetime |

## Real-World Example

- [[projects/LinkStack/Architecture]] — `AddUsersModule`, `AddLinksModule`, `AddAnalyticsModule` each self-register everything their module needs
