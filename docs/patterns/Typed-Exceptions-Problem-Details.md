---
tags: [pattern, error-handling, exceptions, problem-details, http, api]
---

# Typed Exceptions + Problem Details

## What It Is

A structured approach to API error handling: domain and application errors are thrown as **typed exceptions** (each with an HTTP status and error code), and a single **middleware** catches all of them and converts to **RFC 7807 Problem Details** responses.

No `Result<T>` wrappers, no error-handling boilerplate in every handler. Throw and forget — the middleware handles the rest.

## When to Use

- Building an HTTP API where consumers need machine-readable error codes
- You want consistent error shapes across all endpoints
- Handlers should focus on the happy path; errors are exceptional

## When NOT to Use

- Library code where exceptions are inappropriate (use `Result<T>` instead)
- When the caller must handle a "not found" as a normal flow, not an error

## Implementation

### 1. Exception hierarchy

```csharp
public abstract class AppException : Exception
{
    public string ErrorCode { get; }
    public int StatusCode { get; }

    protected AppException(string message, string errorCode, int statusCode)
        : base(message)
    {
        ErrorCode = errorCode;
        StatusCode = statusCode;
    }
}

public class NotFoundException : AppException
{
    public NotFoundException(string message, string errorCode = "NOT_FOUND")
        : base(message, errorCode, 404) { }
}

public class UnauthorizedException : AppException
{
    public UnauthorizedException(string message, string errorCode = "UNAUTHORIZED")
        : base(message, errorCode, 403) { }
}

public class ConflictException : AppException
{
    public ConflictException(string message, string errorCode = "CONFLICT")
        : base(message, errorCode, 409) { }
}

public class BadRequestException : AppException
{
    public BadRequestException(string message, string errorCode = "BAD_REQUEST")
        : base(message, errorCode, 400) { }
}

public class ValidationException : AppException
{
    public IReadOnlyDictionary<string, string[]> Errors { get; }

    public ValidationException(IDictionary<string, string[]> errors)
        : base("One or more validation errors occurred", "VALIDATION_ERROR", 400)
    {
        Errors = new ReadOnlyDictionary<string, string[]>(errors);
    }
}
```

### 2. Error codes

Centralise error code strings so API consumers can switch on them reliably:

```csharp
public static class ErrorCodes
{
    public const string NOT_FOUND = "NOT_FOUND";
    public const string UNAUTHORIZED = "UNAUTHORIZED";
    public const string CONFLICT = "CONFLICT";

    // Domain-specific
    public const string ORDER_ALREADY_CANCELLED = "ORDER_ALREADY_CANCELLED";
    public const string INSUFFICIENT_STOCK = "INSUFFICIENT_STOCK";
    public const string CUSTOMER_BLOCKED = "CUSTOMER_BLOCKED";
}
```

### 3. Exception handling middleware

```csharp
public class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception. TraceId: {TraceId}", context.TraceIdentifier);
            await HandleAsync(context, ex);
        }
    }

    private static async Task HandleAsync(HttpContext context, Exception exception)
    {
        var (status, title, errorCode, extensions) = exception switch
        {
            ValidationException ve => (400, "Validation failed", ve.ErrorCode,
                (object)new { errors = ve.Errors }),
            AppException ae => (ae.StatusCode, ae.Message, ae.ErrorCode,
                (object?)null),
            _ => (500, "An unexpected error occurred", "INTERNAL_ERROR",
                (object?)null)
        };

        context.Response.StatusCode = status;
        context.Response.ContentType = "application/problem+json";

        var problem = new
        {
            type = $"https://httpstatuses.com/{status}",
            title,
            status,
            detail = exception.Message,
            errorCode,
            traceId = context.TraceIdentifier,
            extensions
        };

        await context.Response.WriteAsJsonAsync(problem);
    }
}
```

### 4. Register middleware

```csharp
// Must be early in the pipeline, before routing
app.UseMiddleware<ExceptionHandlingMiddleware>();
```

Or use the built-in .NET 8 approach:

```csharp
app.UseExceptionHandler(exApp =>
{
    exApp.Run(async context =>
    {
        var feature = context.Features.Get<IExceptionHandlerFeature>();
        if (feature?.Error is AppException ae)
        {
            context.Response.StatusCode = ae.StatusCode;
            await context.Response.WriteAsJsonAsync(new ProblemDetails
            {
                Status = ae.StatusCode,
                Title = ae.Message,
                Extensions = { ["errorCode"] = ae.ErrorCode }
            });
        }
    });
});
```

### 5. Usage in handlers

```csharp
public async Task<OrderDto> Handle(GetOrderQuery query, CancellationToken ct)
{
    var order = await _repo.GetByIdAsync(query.OrderId, ct)
        ?? throw new NotFoundException(
            $"Order {query.OrderId} not found",
            ErrorCodes.NOT_FOUND);

    if (!order.CanBeViewedBy(query.RequestingUserId))
        throw new UnauthorizedException(
            "You do not have access to this order",
            ErrorCodes.UNAUTHORIZED);

    return order.ToDto();
}
```

## Response Shape (RFC 7807)

```json
{
  "type": "https://httpstatuses.com/404",
  "title": "Order abc123 not found",
  "status": 404,
  "detail": "Order abc123 not found",
  "errorCode": "NOT_FOUND",
  "traceId": "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01"
}
```

Validation error (400):

```json
{
  "type": "https://httpstatuses.com/400",
  "title": "Validation failed",
  "status": 400,
  "errorCode": "VALIDATION_ERROR",
  "extensions": {
    "errors": {
      "Email": ["Email is required", "Email must be a valid address"],
      "Amount": ["Amount must be greater than zero"]
    }
  }
}
```

## Trade-offs

| Pro | Con |
|-----|-----|
| Handlers focus on happy path only | Exceptions for flow control is controversial |
| Consistent error shape across all endpoints | Not suitable for library code |
| Machine-readable error codes for clients | Middleware must be registered correctly |

## Real-World Example

- [[projects/LinkStack/Patterns/Error-Handling]] — full exception hierarchy, `ExceptionHandlingMiddleware`, `ErrorCodes`
