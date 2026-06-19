---
type: Pattern
tags: [linkstack, pattern, error-handling, exceptions, problem-details]
---

# Error Handling

Errors propagate as typed exceptions. A central middleware catches all exceptions and converts them to RFC 7807 Problem Details responses. No `Result<T>` wrapper pattern is used.

## Exception Hierarchy

All application exceptions extend `ApplicationExceptionBase`:

```
ApplicationExceptionBase
├── NotFoundException       → HTTP 404
├── UnauthorizedException   → HTTP 403
├── BadRequestException     → HTTP 400
├── ValidationException     → HTTP 400 (includes field-level errors)
└── ConflictException       → HTTP 409
```

Each exception carries:
- `ErrorCode` (string constant from `ErrorCodes` class)
- `StatusCode` (HTTP status)
- Optional `Extensions` dictionary for extra context

`BrokenBusinessRuleException` (from `Libs.BusinessRuleEngine`) is handled separately → HTTP 400 with the rule's message.

## ErrorCodes

All error code strings are constants in a central class so consumers can match on them:

```
AUTH_*         — authentication / authorization errors
USER_REG_*     — user registration errors
LINK_*         — link and group errors
SHARE_*        — sharing permission errors
FRIEND_*       — friend request errors
```

Example usage in a handler:

```csharp
var group = await repo.GetByIdAsync(groupId, ct)
    ?? throw new NotFoundException(
        $"Link group {groupId} not found",
        ErrorCodes.LINK_GROUP_NOT_FOUND);

if (!group.CanUserEdit(userId))
    throw new UnauthorizedException(
        "Insufficient permissions",
        ErrorCodes.SHARE_UNAUTHORIZED);
```

## Exception Handling Middleware

`ExceptionHandlingMiddleware` wraps the entire request pipeline. It:

1. Logs the exception with trace ID
2. Selects the correct Problem Details factory by exception type
3. Serialises to `application/problem+json`
4. Sets the HTTP status code

```csharp
IProblemDetailsFactory factory = exception switch
{
    ValidationException         => validationFactory,
    BrokenBusinessRuleException => ruleFactory,
    ApplicationExceptionBase    => appExFactory,
    _                           => serverErrorFactory,
};
```

## Problem Details Format (RFC 7807)

All error responses share the same shape:

```json
{
  "type": "https://...",
  "title": "Not Found",
  "status": 404,
  "detail": "Link group abc123 not found",
  "errorCode": "LINK_GROUP_NOT_FOUND",
  "traceId": "00-abc..."
}
```

`ValidationException` adds a `errors` object with per-field messages.

## What NOT to Do

- Do not throw raw `Exception` or `InvalidOperationException` for expected domain errors.
- Do not catch exceptions in handlers — let the middleware handle it.
- Do not return `null` from endpoints to signal "not found" — throw `NotFoundException`.

## Related

- [[Business-Rules]] — BrokenBusinessRuleException maps to 400
- [[CQRS]] — exceptions bubble up through MediatR pipeline automatically
- [[Architecture]] — BuildingBlocks.Application owns the exception types
