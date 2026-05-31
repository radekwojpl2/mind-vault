---
tags: [linkstack, pattern, multi-tenancy, ef-core, security]
---

# Tenant Isolation

Every module stores a `TenantId` on all aggregate roots. EF Core **global query filters** enforce tenant boundaries automatically — no handler needs to remember to filter.

## How It Works

Each `DbContext` resolves the current tenant from `ICurrentUserService` and configures query filters at model-build time:

```csharp
public class LinksDbContext(DbContextOptions<LinksDbContext> options, ICurrentUserService currentUser)
    : DbContext(options)
{
    private string? TenantId
    {
        get
        {
            try { return currentUser.Context.TenantId.Value; }
            catch { return null; }
        }
    }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        builder.HasDefaultSchema("links");
        // ...
        builder.Entity<Link>().HasQueryFilter(e => e.TenantId == TenantId);
        builder.Entity<LinkGroup>().HasQueryFilter(e => e.TenantId == TenantId);
        builder.Entity<LinkGroupShare>().HasQueryFilter(e => e.TenantId == TenantId);
        builder.Entity<LinkTag>().HasQueryFilter(e => e.TenantId == TenantId);
    }
}
```

Every `SELECT` against these entities automatically appends `WHERE tenant_id = '<current>'`.

## Schema-per-Module Isolation

Beyond row-level tenant isolation, each module uses its own PostgreSQL schema:

| Module | Schema |
|--------|--------|
| Users | `users` |
| Links | `links` |
| Analytics | `analytics` |

No cross-module foreign keys. Each DbContext sets `HasDefaultSchema(...)` and runs independent EF Core migrations.

## Bypassing the Filter (Admin Operations)

Use `IgnoreQueryFilters()` explicitly when intentionally reading across tenants:

```csharp
var link = await context.Links
    .IgnoreQueryFilters()
    .FirstOrDefaultAsync(l => l.Id == id, ct);
```

Admin endpoints in the Analytics module do this to show tenant-wide activity.

## TenantId in Auth0 Context

`TenantId` maps to the Auth0 `org_id` claim. For personal (B2C) accounts without an organization, the tenant is the user's own Auth0 sub. `ICurrentUserService.Context.TenantId` abstracts this — handlers never parse JWTs directly.

## Related

- [[Architecture]] — module boundaries, no cross-module FK rule
- [[Users]] — Auth0 integration, org_id claim mapping
- [[Analytics]] — admin queries that use IgnoreQueryFilters
