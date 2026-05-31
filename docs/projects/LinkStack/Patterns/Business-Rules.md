---
tags: [linkstack, pattern, ddd, business-rules, domain]
---

# Business Rules

Domain invariants are encoded as discrete rule objects rather than inline `if` checks. This keeps aggregate methods readable and makes individual rules independently testable.

## Interfaces

```csharp
public interface IBusinessRule
{
    string Message { get; }
    bool IsBroken();
}
```

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

`BrokenBusinessRuleException` carries the rule's `Message`. The central [[Error-Handling]] middleware maps it to a `400 Bad Request` with a structured Problem Details body.

## Usage in Aggregates

Rules are checked inside factory methods and state-transition methods. The object is only created or mutated if all rules pass:

```csharp
public static FriendRequest Create(...)
{
    Check.Rule(new CannotBeFriendsWithSelfRule(requesterId, receiverId));
    Check.Rule(new UsersMustNotAlreadyBeFriendsRule(alreadyFriends));
    Check.Rule(new FriendRequestMustNotAlreadyExistRule(pendingRequestExists));
    return new FriendRequest { ... };
}

public void Accept(UserId respondingUserId)
{
    Check.Rule(new OnlyReceiverCanRespondRule(ReceiverId, respondingUserId));
    Check.Rule(new FriendRequestMustBePendingRule(Status));
    Status = FriendRequestStatus.Accepted;
}
```

## Usage in Value Objects

[[Value-Objects]] also call `Check.Rule(...)` inside their `Create` factories:

```csharp
public static Url Create(string url)
{
    Check.Rule(new UrlCannotBeEmpty(url));
    Check.Rule(new UrlMustBeWithinMaxLength(url, MaxLength));
    Check.Rule(new UrlMustBeValidFormat(url));
    Check.Rule(new UrlMustUseHttpOrHttpsScheme(url));
    return new Url(url);
}
```

## Writing a Rule

```csharp
public class CannotBeFriendsWithSelfRule : IBusinessRule
{
    private readonly UserId _requesterId;
    private readonly UserId _receiverId;

    public CannotBeFriendsWithSelfRule(UserId requesterId, UserId receiverId)
    {
        _requesterId = requesterId;
        _receiverId = receiverId;
    }

    public string Message => "User cannot send a friend request to themselves";
    public bool IsBroken() => _requesterId == _receiverId;
}
```

Rules are pure functions of their inputs — no async, no DB, no side effects. DB-dependent conditions (e.g. "already friends") are resolved in the Application layer and passed as booleans to the aggregate.

## Rule Library Location

| Domain | Rule namespace |
|--------|---------------|
| Users | `LinkStack.Users.Domain.FriendRequests.Rules` |
| Links | `LinkStack.Links.Domain.Links.Rules`, `…Groups.Rules` |
| Value objects | Adjacent to the value object class |

## Related

- [[Value-Objects]] — rules invoked in Create factories
- [[Error-Handling]] — how BrokenBusinessRuleException becomes an HTTP 400
