---
tags: [testing, unit-tests, tdd, domain]
---

# Unit Tests

## What They Are

Unit tests verify a single class or function in complete isolation — no database, no HTTP, no file system, no external services. They run in milliseconds and give instant feedback.

## Role in the Test Suite

Unit tests are **supplemental**, not the foundation. The default test for a feature is an [[Integration-Tests|integration test]] — real HTTP, real database, real behaviour. Unit tests fill the gaps: pure logic that is fast to verify in isolation and impractical to exhaustively cover through the HTTP layer.

## What to Unit Test

Unit tests are the right tool when the logic under test is **pure** — its output depends only on its inputs, with no side effects:

- **Value objects** — does `Url.Create("not-a-url")` throw? Does equality work?
- **Business rules** — does `CannotBeFriendsWithSelfRule` return `IsBroken() == true` when both IDs are equal?
- **Domain entity methods** — does `Order.Cancel()` change status and set `CancelledAt`?
- **Specifications** — does `ActiveOrdersSpecification` match the right entities?
- **Pure calculation logic** — pricing, discounts, tax calculations

## What NOT to Unit Test

- Repositories, DbContexts, or anything with a DB call — use [[Integration-Tests]]
- HTTP endpoints — use [[ASP-NET-Core-API-Testing]]
- Anything that wires dependencies together — that's integration territory

If you find yourself mocking three collaborators to test one method, consider whether an integration test would be more honest.

## Structure (AAA)

Every test follows **Arrange → Act → Assert**:

```csharp
[Fact]
public void Cancel_WhenPending_SetsStatusToCancelled()
{
    // Arrange
    var order = Order.Create(CustomerId.Create("cust-1"), someLines);

    // Act
    order.Cancel();

    // Assert
    order.Status.Should().Be(OrderStatus.Cancelled);
    order.CancelledAt.Should().NotBeNull();
}
```

## Testing Business Rules

```csharp
[Fact]
public void IsBroken_WhenRequesterAndReceiverAreSame_ReturnsTrue()
{
    var userId = UserId.Create("user-1");
    var rule = new CannotBeFriendsWithSelfRule(userId, userId);

    rule.IsBroken().Should().BeTrue();
}

[Fact]
public void IsBroken_WhenDifferentUsers_ReturnsFalse()
{
    var rule = new CannotBeFriendsWithSelfRule(
        UserId.Create("user-1"),
        UserId.Create("user-2"));

    rule.IsBroken().Should().BeFalse();
}
```

## Testing Value Objects

```csharp
[Fact]
public void Create_WithValidUrl_Succeeds()
{
    var url = Url.Create("https://example.com");
    url.Value.Should().Be("https://example.com");
}

[Theory]
[InlineData("")]
[InlineData("not-a-url")]
[InlineData("ftp://example.com")]
public void Create_WithInvalidUrl_Throws(string input)
{
    var act = () => Url.Create(input);
    act.Should().Throw<ArgumentException>();
}

[Fact]
public void Equality_TwoUrlsWithSameValue_AreEqual()
{
    Url.Create("https://a.com").Should().Be(Url.Create("https://a.com"));
}
```

## Testing Specifications

Specifications are pure predicates — compile the expression and test against in-memory objects:

```csharp
[Fact]
public void ActiveOrders_ExcludesCancelled()
{
    var spec = new ActiveOrdersSpecification();
    var predicate = spec.ToExpression().Compile();

    predicate(new Order { Status = OrderStatus.Cancelled }).Should().BeFalse();
    predicate(new Order { Status = OrderStatus.Pending }).Should().BeTrue();
}
```

## Tooling

| Library | Purpose |
|---------|---------|
| `xUnit` | Test runner |
| `FluentAssertions` | Readable assertions (`Should().Be(...)`) |
| `Moq` / `NSubstitute` | Mocking (use sparingly — only for pure interfaces) |

## Project Naming

```
Modules/Orders/
  LinkStack.Orders.Domain.UnitTests/
    Entities/
      OrderTests.cs
    Rules/
      CannotCancelCompletedOrderRuleTests.cs
    ValueObjects/
      OrderAmountTests.cs
```

## Related

- [[Business-Rule-Engine]] — rules are ideal unit test targets
- [[Value-Objects]] — value objects are ideal unit test targets
- [[Integration-Tests]] — when you need a real database
