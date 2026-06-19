---
type: Pattern
tags: [pattern, ddd, domain, value-object, validation]
---

# Value Objects

## What It Is

A **Value Object** is an immutable domain concept defined entirely by its data, not by identity. Two value objects with the same data are equal. They validate their own invariants at construction time — an invalid value can never be created.

Use them to replace primitives (`string`, `int`, `Guid`) with types that carry meaning and enforce rules.

## When to Use

- A concept has validation rules (e.g. a URL must be http/https, an age must be positive)
- Two instances with the same data should be considered equal
- The concept is immutable — once created, it doesn't change
- You want to prevent passing the wrong kind of string/int/guid to a method

## When NOT to Use

- The concept has an identity that persists over time (use an Entity instead)
- The concept has no validation — a plain primitive is fine

## Implementation

### 1. Base class

```csharp
public abstract class ValueObject
{
    protected abstract IEnumerable<object> GetEqualityComponents();

    public override bool Equals(object? obj)
    {
        if (obj is null || obj.GetType() != GetType()) return false;
        return ((ValueObject)obj).GetEqualityComponents()
            .SequenceEqual(GetEqualityComponents());
    }

    public override int GetHashCode() =>
        GetEqualityComponents()
            .Aggregate(1, (hash, obj) => HashCode.Combine(hash, obj?.GetHashCode() ?? 0));

    public static bool operator ==(ValueObject? a, ValueObject? b) =>
        a is null ? b is null : a.Equals(b);

    public static bool operator !=(ValueObject? a, ValueObject? b) => !(a == b);
}
```

### 2. Concrete value object

```csharp
public sealed class EmailAddress : ValueObject
{
    public string Value { get; }
    public const int MaxLength = 320;

    private EmailAddress(string value) => Value = value;

    public static EmailAddress Create(string email)
    {
        if (string.IsNullOrWhiteSpace(email))
            throw new ArgumentException("Email cannot be empty");
        if (email.Length > MaxLength)
            throw new ArgumentException($"Email cannot exceed {MaxLength} characters");
        if (!email.Contains('@'))
            throw new ArgumentException("Email must be a valid address");

        return new EmailAddress(email.ToLowerInvariant());
    }

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Value;
    }

    public static implicit operator string(EmailAddress e) => e.Value;
    public override string ToString() => Value;
}
```

### 3. Strongly-typed IDs

Wrap `Guid` or `string` identifiers so the compiler prevents passing the wrong ID:

```csharp
public sealed class OrderId : ValueObject
{
    public Guid Value { get; }
    private OrderId(Guid value) => Value = value;

    public static OrderId Create(Guid id)
    {
        if (id == Guid.Empty) throw new ArgumentException("OrderId cannot be empty");
        return new OrderId(id);
    }

    public static OrderId NewId() => new(Guid.NewGuid());

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Value;
    }

    public static implicit operator Guid(OrderId id) => id.Value;
}
```

### 4. EF Core mapping

```csharp
builder.Property(o => o.Email)
    .HasConversion(
        e => e.Value,
        v => EmailAddress.Create(v))
    .HasMaxLength(EmailAddress.MaxLength);
```

## Rules

- **Private constructor, static `Create` factory** — the only way to construct the object.
- **Validate in `Create`, throw on invalid** — the object is always in a valid state.
- **Immutable** — all properties have `private set` or are `init`-only.
- **Structural equality** — implement `GetEqualityComponents()`.
- **Implicit conversion** — add `implicit operator` to the underlying type to reduce friction.

## Trade-offs

| Pro | Con |
|-----|-----|
| Invalid state is impossible | More boilerplate than a primitive |
| Validation is co-located with the type | EF Core mapping needs configuration |
| Compiler prevents type confusion | Can feel over-engineered for trivial fields |

## Real-World Example

- [[projects/LinkStack/Patterns/Value-Objects]] — `Url`, `LinkTitle`, `TagName`, `UserId`, `TenantId`
