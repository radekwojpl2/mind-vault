---
tags: [pattern, specification, query, ddd, domain]
---

# Specification Pattern

## What It Is

A **Specification** is a reusable, named predicate that encapsulates a query condition as an object. Specifications can be composed with `And`, `Or`, and `Not` operators to build complex filters without duplicating LINQ expressions.

## When to Use

- The same filter condition appears in multiple query handlers
- Query conditions need to be combined dynamically
- You want named, testable predicates instead of anonymous lambdas
- You want to keep query logic out of repositories

## When NOT to Use

- A query is used in exactly one place and is unlikely to be reused — inline LINQ is simpler
- Performance is critical and you need precise SQL control — specifications add one abstraction layer

## Implementation

### 1. Base class

```csharp
public abstract class SpecificationBase<T>
{
    public abstract Expression<Func<T, bool>> ToExpression();

    public SpecificationBase<T> And(SpecificationBase<T> other)
        => new AndSpecification<T>(this, other);

    public SpecificationBase<T> Or(SpecificationBase<T> other)
        => new OrSpecification<T>(this, other);

    public SpecificationBase<T> Not()
        => new NotSpecification<T>(this);

    public static implicit operator Expression<Func<T, bool>>(SpecificationBase<T> spec)
        => spec.ToExpression();
}
```

### 2. Combinators

```csharp
internal class AndSpecification<T>(
    SpecificationBase<T> left,
    SpecificationBase<T> right) : SpecificationBase<T>
{
    public override Expression<Func<T, bool>> ToExpression()
    {
        var leftExpr = left.ToExpression();
        var rightExpr = right.ToExpression();
        var param = leftExpr.Parameters[0];
        var body = Expression.AndAlso(
            leftExpr.Body,
            Expression.Invoke(rightExpr, param));
        return Expression.Lambda<Func<T, bool>>(body, param);
    }
}

internal class OrSpecification<T>(
    SpecificationBase<T> left,
    SpecificationBase<T> right) : SpecificationBase<T>
{
    public override Expression<Func<T, bool>> ToExpression()
    {
        var leftExpr = left.ToExpression();
        var rightExpr = right.ToExpression();
        var param = leftExpr.Parameters[0];
        var body = Expression.OrElse(
            leftExpr.Body,
            Expression.Invoke(rightExpr, param));
        return Expression.Lambda<Func<T, bool>>(body, param);
    }
}

internal class NotSpecification<T>(SpecificationBase<T> inner) : SpecificationBase<T>
{
    public override Expression<Func<T, bool>> ToExpression()
    {
        var expr = inner.ToExpression();
        return Expression.Lambda<Func<T, bool>>(
            Expression.Not(expr.Body), expr.Parameters[0]);
    }
}
```

### 3. Concrete specifications

```csharp
public class ActiveOrdersSpecification : SpecificationBase<Order>
{
    public override Expression<Func<Order, bool>> ToExpression()
        => o => o.Status != OrderStatus.Cancelled && o.Status != OrderStatus.Completed;
}

public class OrdersByCustomerSpecification : SpecificationBase<Order>
{
    private readonly CustomerId _customerId;
    public OrdersByCustomerSpecification(CustomerId id) => _customerId = id;

    public override Expression<Func<Order, bool>> ToExpression()
        => o => o.CustomerId == _customerId;
}

public class HighValueOrderSpecification : SpecificationBase<Order>
{
    private readonly decimal _threshold;
    public HighValueOrderSpecification(decimal threshold) => _threshold = threshold;

    public override Expression<Func<Order, bool>> ToExpression()
        => o => o.TotalAmount > _threshold;
}
```

### 4. Usage

```csharp
// Simple
var activeOrders = await repo.FindAsync(new ActiveOrdersSpecification());

// Composed
var spec = new OrdersByCustomerSpecification(customerId)
    .And(new ActiveOrdersSpecification());

var orders = await repo.FindAsync(spec);

// Dynamic composition
SpecificationBase<Order> spec = new ActiveOrdersSpecification();
if (onlyHighValue)
    spec = spec.And(new HighValueOrderSpecification(500m));

var results = await repo.FindAsync(spec);
```

### 5. Repository / Table Module integration

```csharp
public class OrderRepository(AppDbContext db) : IOrderRepository
{
    public async Task<IEnumerable<Order>> FindAsync(
        SpecificationBase<Order> spec,
        CancellationToken ct = default)
    {
        return await db.Orders
            .Where(spec.ToExpression())
            .AsNoTracking()
            .ToListAsync(ct);
    }
}
```

## Testing

Specifications are pure — test them without a database:

```csharp
[Fact]
public void ActiveOrders_ExcludesCancelled()
{
    var spec = new ActiveOrdersSpecification();
    var predicate = spec.ToExpression().Compile();

    var cancelled = new Order { Status = OrderStatus.Cancelled };
    var pending = new Order { Status = OrderStatus.Pending };

    Assert.False(predicate(cancelled));
    Assert.True(predicate(pending));
}
```

## Trade-offs

| Pro | Con |
|-----|-----|
| Reusable, named predicates | More boilerplate than inline lambdas |
| Composable without duplicating logic | Expression trees can be tricky to debug |
| Independently unit-testable | EF Core may not translate all expressions |

## Real-World Example

- [[projects/LinkStack/Patterns/CQRS]] — `FriendsOfUserSpecification`, used with `IFriendshipTableModule`
