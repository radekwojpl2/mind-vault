---
type: Pattern
tags: [pattern, ef-core, multi-tenancy, security, dotnet]
---

# EF Core Global Query Filters

## What It Is

**Global Query Filters** are LINQ predicates registered on an entity type in `OnModelCreating`. EF Core appends them automatically to every query against that entity — no handler or repository needs to remember to filter. Bypass explicitly with `IgnoreQueryFilters()`.

Primary use cases: **multi-tenancy** (filter by tenant), **soft deletes** (filter out deleted rows).

## When to Use

- Every query against an entity should include the same `WHERE` clause
- You want the filter to be impossible to accidentally forget
- You have multi-tenant data that must be strictly isolated per request

## When NOT to Use

- The filter depends on complex logic that doesn't translate to SQL
- You need different filters in different parts of the app (use explicit `.Where()` instead)
- You're building a reporting/admin layer that always reads across all tenants — the friction of constant `IgnoreQueryFilters()` signals the pattern isn't a good fit

## Multi-Tenancy Implementation

### 1. Resolve the current tenant

```csharp
public interface ICurrentTenantService
{
    string? TenantId { get; }
}

public class CurrentTenantService(IHttpContextAccessor accessor) : ICurrentTenantService
{
    public string? TenantId =>
        accessor.HttpContext?.User.FindFirstValue("tenant_id");
}
```

### 2. Inject into DbContext and configure filters

```csharp
public class AppDbContext(
    DbContextOptions<AppDbContext> options,
    ICurrentTenantService tenant)
    : DbContext(options)
{
    public DbSet<Order> Orders { get; set; }
    public DbSet<Product> Products { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        builder.Entity<Order>()
            .HasQueryFilter(o => o.TenantId == tenant.TenantId);

        builder.Entity<Product>()
            .HasQueryFilter(p => p.TenantId == tenant.TenantId);
    }
}
```

All queries now automatically include `WHERE tenant_id = '<current>'`.

### 3. Register dependencies

```csharp
services.AddHttpContextAccessor();
services.AddScoped<ICurrentTenantService, CurrentTenantService>();
services.AddDbContext<AppDbContext>();
```

## Soft Delete Implementation

```csharp
builder.Entity<Order>()
    .HasQueryFilter(o => !o.IsDeleted);
```

Then soft-delete instead of hard-delete:

```csharp
public void SoftDelete(Order order)
{
    order.IsDeleted = true;
    order.DeletedAt = DateTime.UtcNow;
}
```

## Bypassing the Filter

Use `IgnoreQueryFilters()` deliberately for admin operations, migrations, or cross-tenant lookups:

```csharp
// Admin: read all tenants
var allOrders = await db.Orders
    .IgnoreQueryFilters()
    .ToListAsync(ct);

// Load by ID regardless of tenant (e.g. background job)
var order = await db.Orders
    .IgnoreQueryFilters()
    .FirstOrDefaultAsync(o => o.Id == id, ct);
```

## Combining Filters

Multiple filters on the same entity are AND-ed:

```csharp
builder.Entity<Order>()
    .HasQueryFilter(o => o.TenantId == tenant.TenantId && !o.IsDeleted);
```

## Gotchas

**Navigation properties**: if `Order` has a filter and you navigate from `Customer.Orders`, the filter still applies on the Orders side.

**Migrations**: filters don't affect the schema, only queries. The `TenantId` and `IsDeleted` columns must exist on the table.

**Testing**: in test setups where `ICurrentTenantService` returns `null`, the filter `e.TenantId == null` will match rows with a null tenant. Seed tests with explicit tenant IDs and verify isolation.

**No subquery support**: EF Core translates the filter to a SQL `WHERE` clause. Complex subquery expressions may not translate — keep filters simple.

## Trade-offs

| Pro | Con |
|-----|-----|
| Filter is impossible to forget | Bypassing requires knowing to call IgnoreQueryFilters() |
| Works transparently with navigation properties | Filter is always on — can surprise newcomers |
| Single place to update the filter | Dynamic filters (based on roles) require nullable service |

## Real-World Example

- [[projects/LinkStack/Patterns/Tenant-Isolation]] — `TenantId` query filters on all entities in every module's DbContext
