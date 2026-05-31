---
tags: [linkstack, pattern, ddd, value-object, domain]
---

# Value Objects

Every meaningful domain concept is a value object rather than a primitive. This prevents primitive obsession and centralizes validation.

## Base Class

All value objects extend `ValueObject` from `LinkStack.BuildingBlocks.Domain`:

```csharp
public abstract class ValueObject
{
    protected abstract IEnumerable<object> GetEqualityComponents();

    public override bool Equals(object? obj) { /* structural equality */ }
    public override int GetHashCode() { /* hash from components */ }
    public static bool operator ==(ValueObject? a, ValueObject? b) { ... }
    public static bool operator !=(ValueObject? a, ValueObject? b) { ... }
}
```

Subclasses declare their equality components once; all comparison and hashing flows from that.

## Creation Pattern

Value objects use a **static factory method** (`Create`) — not a public constructor. The factory runs [[Business-Rules]] before constructing the object, so an invalid value can never exist:

```csharp
public sealed class Url : ValueObject
{
    public string Value { get; }
    public const int MaxLength = 2000;

    private Url(string value) => Value = value;

    public static Url Create(string url)
    {
        Check.Rule(new UrlCannotBeEmpty(url));
        Check.Rule(new UrlMustBeWithinMaxLength(url, MaxLength));
        Check.Rule(new UrlMustBeValidFormat(url));
        Check.Rule(new UrlMustUseHttpOrHttpsScheme(url));
        return new Url(url);
    }

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Value;
    }

    public static implicit operator string(Url url) => url.Value;
    public override string ToString() => Value;
}
```

## Implicit Conversions

Most value objects declare `implicit operator` to their underlying type so they compose naturally with EF Core and string comparisons without constant `.Value` unwrapping.

## Examples in the Codebase

| Value Object | Underlying type | Validates |
|-------------|-----------------|-----------|
| `Url` | `string` | Non-empty, max 2000 chars, valid URI, http/https scheme |
| `LinkTitle` | `string` | Non-empty, max length |
| `Description` | `string` | Max length (nullable wrapper) |
| `TagName` | `string` | Non-empty, normalised to lowercase |
| `GroupName` | `string` | Non-empty, max length |
| `LinkOrder` | `int` | Non-negative |
| `LinkId` | `Guid` | Non-empty GUID |
| `LinkGroupId` | `Guid` | Non-empty GUID |
| `UserId` | `string` | Non-empty (Auth0 sub format) |
| `TenantId` | `string` | Non-empty |

Strongly-typed IDs (`LinkId`, `LinkGroupId`) prevent passing a group ID where a link ID is expected.

## EF Core Mapping

EF configurations use value conversions to map value objects to their underlying column type:

```csharp
builder.Property(l => l.Url)
    .HasConversion(url => url.Value, value => Url.Create(value))
    .HasMaxLength(Url.MaxLength);
```

## Related

- [[Business-Rules]] — rules invoked inside `Create` factories
- [[CQRS]] — commands receive value objects, not raw primitives
