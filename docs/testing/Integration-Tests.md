---
tags: [testing, integration-tests, testcontainers, aspnetcore]
---

# Integration Tests

## What They Are

Integration tests verify that multiple components work together correctly — typically covering the full HTTP stack: endpoint → handler → database → response. They use real infrastructure (real PostgreSQL, real RabbitMQ) rather than mocks.

## What to Integration Test

- **API endpoints** — the full request/response cycle
- **Authorization** — does a user without permission get a 403?
- **Database interactions** — does the data actually persist and get retrieved correctly?
- **Cross-boundary behaviour** — ordering, pagination, filtering, tenant isolation
- **Events** — does a command publish the expected integration event?

## Never Mock the Database

Mocking repositories gives you false confidence. A passing mock-based test can hide:
- Missing migrations
- Wrong column types
- EF Core query translation failures
- Constraint violations

Use [[Testcontainers]] to spin up real PostgreSQL per test run.

## Structure

### WebApplicationFactory

The entry point for ASP.NET Core integration tests:

```csharp
public class OrdersTestWebAppFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly PostgreSqlContainer _db = new PostgreSqlBuilder()
        .WithImage("postgres:16-alpine")
        .Build();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            // Replace real DB with test container
            services.RemoveAll<DbContextOptions<AppDbContext>>();
            services.AddDbContext<AppDbContext>(opts =>
                opts.UseNpgsql(_db.GetConnectionString()));

            // Disable Auth0 validation — use test tokens instead
            services.PostConfigure<JwtBearerOptions>(
                JwtBearerDefaults.AuthenticationScheme, opts =>
                {
                    opts.Authority = null;
                    opts.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = false,
                        ValidateAudience = false,
                        ValidateLifetime = false,
                        IssuerSigningKey = new SymmetricSecurityKey(
                            Encoding.UTF8.GetBytes(TestJwtGenerator.Secret))
                    };
                });
        });
    }

    public async Task InitializeAsync()
    {
        await _db.StartAsync();
        // Apply migrations
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.MigrateAsync();
    }

    public new async Task DisposeAsync() => await _db.StopAsync();
}
```

### Base test class

```csharp
[Collection("Orders")]
public abstract class OrdersIntegrationTestBase : IAsyncLifetime
{
    protected readonly HttpClient Client;
    protected readonly AppDbContext Db;
    private readonly IServiceScope _scope;

    protected OrdersIntegrationTestBase(OrdersTestWebAppFactory factory)
    {
        Client = factory.CreateClient();
        _scope = factory.Services.CreateScope();
        Db = _scope.ServiceProvider.GetRequiredService<AppDbContext>();
    }

    protected void AuthenticateAs(string userId, string? orgId = null)
    {
        var token = TestJwtGenerator.Generate(userId, orgId);
        Client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", token);
    }

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync()
    {
        // Reset DB between tests — truncate tables, don't drop/recreate
        await Db.Database.ExecuteSqlRawAsync(
            "TRUNCATE orders, order_lines RESTART IDENTITY CASCADE");
        _scope.Dispose();
    }
}
```

### Test collection (shared factory across tests)

```csharp
[CollectionDefinition("Orders")]
public class OrdersTestCollection : ICollectionFixture<OrdersTestWebAppFactory> { }
```

The factory starts once per collection, not once per test. Database is truncated between tests (fast), not rebuilt (slow).

### A test

```csharp
public class CreateOrderTests(OrdersTestWebAppFactory factory)
    : OrdersIntegrationTestBase(factory)
{
    [Fact]
    public async Task CreateOrder_WithValidRequest_Returns201AndPersists()
    {
        // Arrange
        AuthenticateAs("user-1");
        var request = new { Lines = new[] { new { ProductId = Guid.NewGuid(), Quantity = 2 } } };

        // Act
        var response = await Client.PostAsJsonAsync("/api/orders", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);

        var body = await response.Content.ReadFromJsonAsync<CreateOrderResponse>();
        body!.Id.Should().NotBeEmpty();

        // Verify persisted
        var inDb = await Db.Orders.FindAsync(body.Id);
        inDb.Should().NotBeNull();
    }

    [Fact]
    public async Task CreateOrder_WithoutAuth_Returns401()
    {
        var response = await Client.PostAsJsonAsync("/api/orders",
            new { Lines = Array.Empty<object>() });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
```

## Async Event Assertions

When a command publishes an event consumed asynchronously, poll with a timeout:

```csharp
[Fact]
public async Task CreateOrder_PublishesOrderCreatedEvent_ConsumedByInventory()
{
    AuthenticateAs("user-1");
    await Client.PostAsJsonAsync("/api/orders", validRequest);

    // Poll until the consumer has processed the event
    await WaitForAsync(async () =>
        await InventoryDb.Reservations.AnyAsync(r => r.OrderId == orderId));
}

protected async Task WaitForAsync(Func<Task<bool>> condition, int timeoutSeconds = 10)
{
    var deadline = DateTime.UtcNow.AddSeconds(timeoutSeconds);
    while (DateTime.UtcNow < deadline)
    {
        if (await condition()) return;
        await Task.Delay(200);
    }
    throw new TimeoutException("Condition not met within timeout");
}
```

## Project Naming

```
Modules/Orders/
  tests/
    LinkStack.Orders.IntegrationTests/
      CreateOrderTests.cs
      CancelOrderTests.cs
      Infrastructure/
        OrdersTestWebAppFactory.cs
        OrdersIntegrationTestBase.cs
        TestJwtGenerator.cs
```

## Related

- [[Testcontainers]] — spinning up real PostgreSQL / RabbitMQ for tests
- [[ASP-NET-Core-API-Testing]] — WebApplicationFactory in depth
- [[Test-Data-Builders]] — seeding test data cleanly
- [[Unit-Tests]] — when you don't need a DB
