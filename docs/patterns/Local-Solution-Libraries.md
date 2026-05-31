---
tags: [pattern, architecture, modular-monolith, libraries, solution-structure]
---

# Local Solution Libraries

## What It Is

Small, self-contained utility libraries that live inside the solution under a `Libs/` folder rather than being published as NuGet packages. Each lib has its own project and test project, no knowledge of the application's modules or BuildingBlocks, and could be extracted to a NuGet package at any time without changing a line of code.

## When to Use

- A utility is small, focused, and reusable across modules — but not cross-cutting enough to belong in BuildingBlocks
- You want NuGet-package isolation discipline (no solution coupling) without the versioning and publishing overhead
- The utility has its own test surface worth exercising independently from any module

## When NOT to Use

- The utility is only used in one module — keep it there
- It's truly cross-cutting infrastructure (exception handling, identity context) — that belongs in BuildingBlocks
- It's large enough to justify a real NuGet package with a proper release cycle

## Implementation

### Folder structure

```
Libs/
├── MyLib/
│   ├── MyLib.csproj          ← no project refs to solution modules
│   └── ...
└── MyLib.Tests/
    ├── MyLib.Tests.csproj    ← refs MyLib only
    └── ...
```

**Rules for the project file:**
- No `<ProjectReference>` to anything in `Modules/` or `BuildingBlocks/`
- Target the same framework as the rest of the solution
- Keep the namespace generic — not tied to the host app name

---

### Example 1 — Business Rule Engine

Enforces named domain invariants without embedding the check logic in entity methods.

```csharp
// Contract
public interface IBusinessRule
{
    string Message { get; }
    bool IsBroken();
}

// Enforcement point
public static class Check
{
    public static void Rule(IBusinessRule rule)
    {
        if (rule.IsBroken())
            throw new BrokenBusinessRuleException(rule);
    }
}

public class BrokenBusinessRuleException(IBusinessRule rule) : Exception(rule.Message)
{
    public IBusinessRule Rule { get; } = rule;
}

// Usage in domain
public class LinkTitleMustBeUnique(IEnumerable<string> existingTitles, string newTitle) : IBusinessRule
{
    public string Message => $"A link with title '{newTitle}' already exists.";
    public bool IsBroken() => existingTitles.Contains(newTitle, StringComparer.OrdinalIgnoreCase);
}

// Call site (in a command handler or entity method)
Check.Rule(new LinkTitleMustBeUnique(existingTitles, command.Title));
```

---

### Example 2 — Composable Query Specification

Encapsulates EF Core query predicates as named, composable objects instead of scattered `.Where()` lambdas.

```csharp
public interface ISpecification<T>
{
    Expression<Func<T, bool>> ToExpression();
    bool IsSatisfiedBy(T entity);
}

public abstract class SpecificationBase<T> : ISpecification<T>
{
    public abstract Expression<Func<T, bool>> ToExpression();

    public bool IsSatisfiedBy(T entity) => ToExpression().Compile()(entity);

    public SpecificationBase<T> And(SpecificationBase<T> other) => new AndSpecification<T>(this, other);
    public SpecificationBase<T> Or(SpecificationBase<T> other) => new OrSpecification<T>(this, other);
    public SpecificationBase<T> Not() => new NotSpecification<T>(this);

    // Implicit cast lets you pass specs directly to EF Core .Where()
    public static implicit operator Expression<Func<T, bool>>(SpecificationBase<T> spec) =>
        spec.ToExpression();
}

// Usage
public class ActiveLinksSpec : SpecificationBase<Link>
{
    public override Expression<Func<Link, bool>> ToExpression() =>
        link => !link.IsDeleted && link.IsActive;
}

// Composing
var spec = new ActiveLinksSpec().And(new OwnedByUserSpec(userId));
var links = await dbContext.Links.Where(spec).ToListAsync();
```

---

### Example 3 — Typed HTTP Client Library

Wraps a third-party HTTP API with an interface + keyed DI registration so modules inject the abstraction.

```csharp
public interface IMyServiceClient
{
    Task<ResponseDto> CallAsync(RequestDto request, CancellationToken ct = default);
}

// Registration — called once from Program.cs with config values
public static IServiceCollection AddMyServiceClient(
    this IServiceCollection services, string serviceKey, string endpoint, string apiKey)
{
    services.AddHttpClient(serviceKey, client =>
    {
        client.BaseAddress = new Uri(endpoint.TrimEnd('/') + "/");
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", apiKey);
    });

    services.AddKeyedSingleton<IMyServiceClient>(serviceKey,
        (sp, _) => new MyServiceHttpClient(sp.GetRequiredService<IHttpClientFactory>(), serviceKey));

    return services;
}
```

## Rules

- **Zero coupling to the host solution** — no references to `Modules/`, `BuildingBlocks/`, or the API project
- **Each lib owns its test project** — the test project references only the lib; no shared fixtures from BuildingBlocks.IntegrationTests
- **Interface + implementation split** — consumers depend on the interface, never the concrete class
- **Single DI extension method** — one `AddXxx()` extension in the lib itself; the host calls it once
- **Generic namespaces** — `Query.Specification`, not `MyApp.Query.Specification` — signals extractability

## Trade-offs

| Pro | Con |
|-----|-----|
| NuGet-level isolation without publishing overhead | More `.csproj` files and solution clutter |
| Each lib is testable in isolation, independent of module test infra | Easy to under-invest — lib grows stale without ownership |
| Clean signal: if a lib needs a module reference, the abstraction is wrong | Naming conventions diverge from app projects without a lint rule |
| Instant extraction path if the lib outgrows the solution | Risk of premature extraction — three-line helpers don't need a project |
