---
type: Pattern
tags: [pattern, ddd, domain, business-rules, validation]
---

# Business Rule Engine

## What It Is

A lightweight pattern for encoding domain invariants as discrete, named rule objects. Instead of inline `if` guards scattered through aggregate methods, each rule gets its own class with a clear name and message. A single `Check.Rule()` call enforces it.

## When to Use

- Aggregates have non-trivial preconditions before a state transition
- Multiple rules apply and you want each to be independently testable
- Rules need human-readable messages for error responses
- You want validation to live in the domain, not in application-layer `if` chains

## When NOT to Use

- Simple null/range checks on value object creation — a plain `ArgumentException` is fine there
- Cross-cutting infrastructure validation (required fields, length) — use FluentValidation or DataAnnotations at the boundary

## Implementation

### 1. Interface and exception

```csharp
public interface IBusinessRule
{
    string Message { get; }
    bool IsBroken();
}

public class BrokenBusinessRuleException : Exception
{
    public IBusinessRule BrokenRule { get; }

    public BrokenBusinessRuleException(IBusinessRule rule)
        : base(rule.Message)
    {
        BrokenRule = rule;
    }
}
```

### 2. Enforcer

```csharp
public static class Check
{
    public static void Rule(IBusinessRule rule)
    {
        if (rule.IsBroken())
            throw new BrokenBusinessRuleException(rule);
    }
}
```

### 3. Writing a rule

```csharp
public class OrderMustNotBeAlreadyCancelledRule : IBusinessRule
{
    private readonly OrderStatus _status;

    public OrderMustNotBeAlreadyCancelledRule(OrderStatus status)
        => _status = status;

    public string Message => "Cannot cancel an order that is already cancelled";
    public bool IsBroken() => _status == OrderStatus.Cancelled;
}
```

### 4. Using rules in an aggregate

```csharp
public class Order
{
    public OrderId Id { get; private set; }
    public OrderStatus Status { get; private set; }
    public UserId CustomerId { get; private set; }

    public static Order Create(UserId customerId, bool customerIsBlocked)
    {
        Check.Rule(new CustomerMustNotBeBlockedRule(customerIsBlocked));

        return new Order
        {
            Id = OrderId.NewId(),
            CustomerId = customerId,
            Status = OrderStatus.Pending
        };
    }

    public void Cancel(UserId requestingUser)
    {
        Check.Rule(new OrderMustNotBeAlreadyCancelledRule(Status));
        Check.Rule(new OnlyOwnerCanCancelRule(CustomerId, requestingUser));

        Status = OrderStatus.Cancelled;
    }
}
```

## Rules for Rules

- **Pure functions** — rules take only constructor arguments, call no services, do no async work.
- **DB-dependent conditions** are resolved in the Application layer and passed in as booleans (e.g. `bool emailAlreadyTaken`).
- **One rule per invariant** — resist combining rules. One class, one `IsBroken()` check.
- **Named after the invariant** — `CustomerMustNotBeBlockedRule`, not `ValidationRule1`.

## Handling the Exception

Map `BrokenBusinessRuleException` to a `400 Bad Request` in your exception middleware:

```csharp
catch (BrokenBusinessRuleException ex)
{
    context.Response.StatusCode = 400;
    await context.Response.WriteAsJsonAsync(new
    {
        title = "Business rule violation",
        detail = ex.Message,
        status = 400
    });
}
```

## Trade-offs

| Pro | Con |
|-----|-----|
| Each rule is independently unit-testable | More files than inline `if` checks |
| Aggregates read like a specification | Overhead for trivial single-condition guards |
| Rule names document the domain | Async rules require a different approach |

## Real-World Example

- [[projects/LinkStack/Patterns/Business-Rules]] — `CannotBeFriendsWithSelfRule`, `FriendRequestMustBePendingRule`
