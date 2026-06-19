---
type: Guide
tags: [testing, test-data, builders, fixtures, integration-tests]
---

# Test Data Builders

## What They Are

A **Test Data Builder** is a fluent class that constructs valid domain objects for tests with sensible defaults. Instead of duplicating object construction in every test, you call a builder and only override what matters for a specific scenario.

## The Problem They Solve

Without builders, tests repeat boilerplate:

```csharp
// Repeated in every test that needs a group
var group = new LinkGroup
{
    Id = Guid.NewGuid(),
    Name = "Test Group",
    UserId = "user-1",
    TenantId = "tenant-1",
    CreatedAt = DateTime.UtcNow
};
```

Change `LinkGroup`'s constructor and every test breaks.

## Implementation

### Basic builder

```csharp
public class OrderBuilder
{
    private CustomerId _customerId = CustomerId.Create("default-customer");
    private List<OrderLine> _lines = [new OrderLine(ProductId.Create(Guid.NewGuid()), 1)];
    private OrderStatus _status = OrderStatus.Pending;

    public OrderBuilder WithCustomer(string customerId)
    {
        _customerId = CustomerId.Create(customerId);
        return this;
    }

    public OrderBuilder WithLines(params OrderLine[] lines)
    {
        _lines = [..lines];
        return this;
    }

    public OrderBuilder WithStatus(OrderStatus status)
    {
        _status = status;
        return this;
    }

    public Order Build() => Order.Reconstitute(_customerId, _lines, _status);
}
```

### Usage

```csharp
// Test only cares about the customer — everything else is default
var order = new OrderBuilder()
    .WithCustomer("alice")
    .Build();

// Test cares about the status
var cancelled = new OrderBuilder()
    .WithStatus(OrderStatus.Cancelled)
    .Build();
```

### Seeder (persists to the database)

For integration tests, pair the builder with a seeder that saves to the DbContext:

```csharp
public class OrderSeeder(AppDbContext db)
{
    public async Task<Order> SeedOrderAsync(
        string customerId = "default-customer",
        Action<OrderBuilder>? configure = null)
    {
        var builder = new OrderBuilder().WithCustomer(customerId);
        configure?.Invoke(builder);

        var order = builder.Build();
        await db.Orders.AddAsync(order);
        await db.SaveChangesAsync();
        return order;
    }

    public async Task<Order> SeedCancelledOrderAsync(string customerId = "default-customer")
        => await SeedOrderAsync(customerId, b => b.WithStatus(OrderStatus.Cancelled));
}
```

Usage in tests:

```csharp
public class CancelOrderTests(AppFactory factory) : IntegrationTestBase(factory)
{
    [Fact]
    public async Task CancelOrder_AlreadyCancelled_Returns400()
    {
        var order = await Seeder.SeedCancelledOrderAsync("user-1");

        var response = await Client.DeleteAsync($"/api/orders/{order.Id}");

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
```

## Defaults Strategy

Builders should produce a **valid** object with no configuration. The defaults should satisfy all domain rules so that a test can build `new OrderBuilder().Build()` and get something that passes validation. Only make a test override what is actually relevant to its assertion.

```csharp
// Bad default — forces every test to provide a customer
private CustomerId _customerId = null!;

// Good default — valid and ignorable unless the test cares
private CustomerId _customerId = CustomerId.Create("test-customer-default");
```

## Unique IDs

For tests that need distinct records, generate unique defaults:

```csharp
private readonly CustomerId _customerId =
    CustomerId.Create($"customer-{Guid.NewGuid():N}");
```

## Building Graphs

For entities with relationships, chain builders or accept sub-builders:

```csharp
public class OrderBuilder
{
    private readonly List<OrderLineBuilder> _lineBuilders = [new OrderLineBuilder()];

    public OrderBuilder WithLine(Action<OrderLineBuilder> configure)
    {
        var b = new OrderLineBuilder();
        configure(b);
        _lineBuilders.Add(b);
        return this;
    }

    public Order Build()
    {
        var lines = _lineBuilders.Select(b => b.Build()).ToList();
        return Order.Create(_customerId, lines);
    }
}

// Usage
var order = new OrderBuilder()
    .WithLine(l => l.WithProduct("prod-1").WithQuantity(3))
    .WithLine(l => l.WithProduct("prod-2").WithQuantity(1))
    .Build();
```

## Trade-offs

| Pro | Con |
|-----|-----|
| Tests only specify what matters | Builder class to maintain per aggregate |
| Defaults survive domain model changes | Builders can drift out of sync with domain |
| Readable, intention-revealing tests | Slight overhead for simple cases |

## Real-World Example

- [[projects/LinkStack/Architecture]] — `LinkGroupBuilder`, `LinksTestDataSeeder` used in integration tests to seed groups and shares with specific permissions
