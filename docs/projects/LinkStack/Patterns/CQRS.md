---
type: Pattern
tags: [linkstack, pattern, cqrs, mediatr, specification]
---

# CQRS Pattern

The project uses MediatR to separate commands (writes) from queries (reads). There is no strict CQRS read-model split (no separate read database), but the intent is enforced through project structure and naming.

## Commands

Commands change state. They implement `IRequest<T>` where `T` is one of: `Unit`, `Guid`, `bool`, or a minimal DTO — never a domain entity.

```csharp
public record CreateLinkCommand(
    Url Url, LinkTitle Title, LinkGroupId GroupId,
    UserId UserId, TenantId TenantId,
    Description? Description = null,
    IEnumerable<TagName>? Tags = null
) : IRequest<Guid>;
```

Handler responsibilities in order:
1. Observability breadcrumb
2. Authorization (load aggregate, check permission method)
3. Business logic (call domain factory / method)
4. Persist via repository
5. Publish integration event via `IEventPublisher`
6. `unitOfWork.SaveChangesAsync()`

Handlers live in the **Application** project (or `Application.Write` for Links).

## Queries

Queries are read-only. They use **Table Modules** + **Specifications** rather than repository interfaces, so they stay decoupled from domain write paths.

### Table Modules

Each aggregate has a `IXxxTableModule` interface with:
- `FindAsync(spec, ct)` → `IEnumerable<T>`
- `FindOneAsync(spec, ct)` → `T?`
- `CountAsync(spec, ct)` → `int`
- `AnyAsync(spec, ct)` → `bool`

Implementations call `AsNoTracking()` and `IgnoreQueryFilters()` where appropriate, and include necessary navigation properties.

### Specification Pattern

Specifications are composable predicate objects:

```csharp
public abstract class SpecificationBase<T>
{
    public abstract Expression<Func<T, bool>> ToExpression();

    public SpecificationBase<T> And(SpecificationBase<T> other) { ... }
    public SpecificationBase<T> Or(SpecificationBase<T> other) { ... }
    public SpecificationBase<T> Not() { ... }
}
```

Example:

```csharp
public class FriendsOfUserSpecification : SpecificationBase<Friendship>
{
    private readonly UserId _userId;
    public FriendsOfUserSpecification(UserId userId) => _userId = userId;

    public override Expression<Func<Friendship, bool>> ToExpression()
        => f => f.UserId1 == _userId || f.UserId2 == _userId;
}

// Usage
var friends = await _friendshipTableModule.FindAsync(
    new FriendsOfUserSpecification(userId), ct);
```

Specifications are chainable: `new ActiveLinksSpec().And(new InGroupSpec(groupId))`.

## Project Split (Links module only)

The Links module goes further and splits Application into two projects:

| Project | Contains |
|---------|---------|
| `LinkStack.Links.Application.Write` | All commands and their handlers |
| `LinkStack.Links.Application.Read` | All queries, Table Module usage |

Both are registered with MediatR in the module's DI extension method. Other modules use a single `Application` project.

## Endpoint → Handler Flow

Endpoints are thin — they map the HTTP request to a command/query and call `sender.Send()`:

```csharp
private static async Task<IResult> CreateLink(
    [FromBody] CreateLinkRequest request,
    ICurrentUserService currentUser,
    ISender sender)
{
    request.ValidateAndThrow();

    var command = new CreateLinkCommand(
        Url.Create(request.Url),
        LinkTitle.Create(request.Title),
        LinkGroupId.Create(request.GroupId),
        currentUser.UserId,
        currentUser.Context.TenantId);

    var id = await sender.Send(command);
    return Results.Created($"/api/links/{id}", new { id });
}
```

No business logic in the Web layer.

## Related

- [[Architecture]] — layer dependency rules
- [[Value-Objects]] — commands take value objects, not raw primitives
- [[Outbox]] — how commands publish events reliably
- [[Error-Handling]] — exceptions surface through the pipeline automatically
