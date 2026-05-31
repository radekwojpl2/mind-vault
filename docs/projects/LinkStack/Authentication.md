---
tags: [linkstack, authentication, authorization, jwt, auth0]
---

# Authentication & Authorization

Auth0 is the identity provider. The app validates Auth0-issued JWTs, provisions users on first login, and enforces authorization manually in handlers.

## JWT Validation

Configured in `Users.Infrastructure` via `AddAuth0Authentication()`:

```
Authority:  https://{Auth0:Domain}/
Audience:   Auth0:Audience  (e.g. https://my-api)
Issuer:     same as authority
Lifetime:   validated, 30s clock skew
```

Config keys in `appsettings.json`:
```json
"Auth0": {
  "Domain": "dev-r62cmvuu.us.auth0.com",
  "Audience": "https://my-api",
  "ClientId": "",
  "ClientSecret": "",
  "WebhookSigningSecret": "<hmac-secret>",
  "RolesClaimKey": "https://link.stack.api.dev.com/roles"
}
```

## Claims Mapping

`OnTokenValidated` in `AuthenticationExtensions.cs` maps Auth0 claims to standard ASP.NET Core claims:

| Auth0 JWT claim | ASP.NET Core claim |
|-----------------|-------------------|
| `sub` | `ClaimTypes.NameIdentifier` |
| `email` | `ClaimTypes.Email` |
| `name` | `ClaimTypes.Name` |
| `org_id` | `"org_id"` (custom) |
| `{RolesClaimKey}[]` | `ClaimTypes.Role` (one per role) |

## Identity Context

`ICurrentUserService` (BuildingBlocks) resolves the current user from `HttpContext`:

```csharp
public interface ICurrentUserService
{
    UserId UserId { get; }
    IdentityContext Context { get; }
}
```

`IdentityContext` models two account types:

| Type | When | TenantId |
|------|------|----------|
| `PersonalContext` | No `org_id` claim | userId |
| `OrganizationContext` | `org_id` claim present | org_id |

Handlers use `currentUser.Context.TenantId` without knowing which type. When a handler requires a specific type it calls:
- `context.MustBePartOfOrganization()` — throws `BadRequestException` if personal
- `context.MustBePersonal()` — throws `BadRequestException` if org

## User Provisioning

`B2CUserProvisioningTransformation` (implements `IClaimsTransformation`) runs on every authenticated request for personal accounts (no `org_id`). It sends a `ProvisionUserCommand` to create the user record and default subscription if they don't exist yet. Failures are swallowed with a warning log — auth is not blocked.

## Authorization

### Endpoint level

All protected endpoints call `.RequireAuthorization()`. No endpoint uses a specific policy except admin routes.

```csharp
app.MapPost("/api/links", CreateLink).RequireAuthorization();
```

### Handler level

Resource-level authorization is manual. Handlers load the aggregate, then call its permission method:

```csharp
var group = await repo.GetByIdAsync(request.GroupId, ct)
    ?? throw new NotFoundException(...);

if (!group.CanUserEdit(request.UserId))
    throw new UnauthorizedException("...", ErrorCodes.SHARE_UNAUTHORIZED);
```

### Query level

Queries filter by UserId/TenantId via specifications so users only see their own data:

```csharp
var spec = new LinkByIdSpecificationBase(linkId)
    .And(new LinksBelongingToUserSpecificationBase(userId));
```

### Roles

One named policy is defined:

```csharp
options.AddPolicy("GlobalAdmin", policy => policy.RequireRole("Global.Admin"));
```

Roles come from the Auth0 custom claim key configured in `RolesClaimKey`.

## Auth0 Webhook

`Auth0WebhookEndpoint.cs` receives lifecycle events from Auth0, verified with HMAC-SHA256 using `Auth0:WebhookSigningSecret`. Events handled:

| Event | Action |
|-------|--------|
| `organization.created` | Creates org record in users schema |
| `organization.member.removed` | Removes membership |
| `provision-user` | Creates user on first login (B2B path) |

## Test Authentication

Integration and behaviour tests generate HS256-signed JWTs locally and bypass Auth0 validation in the test factory:

```csharp
// Generate
var token = JwtTokenGenerator.Generate(
    userId: "auth0|test-user",
    orgId: "org_abc",        // omit for personal account
    roles: ["Global.Admin"]  // omit if no roles needed
);
client.DefaultRequestHeaders.Authorization =
    new AuthenticationHeaderValue("Bearer", token);

// Test factory — disables Auth0 validation
options.TokenValidationParameters = new TokenValidationParameters
{
    ValidateIssuer = false,
    ValidateAudience = false,
    ValidateLifetime = false,
    IssuerSigningKey = new SymmetricSecurityKey(
        Encoding.UTF8.GetBytes(JwtTokenGenerator.SigningSecret))
};
```

## Related

- [[Users]] — `Auth0WebhookEndpoint`, user provisioning, subscription creation
- [[Tenant-Isolation]] — how TenantId from the identity context flows into EF query filters
- [[Error-Handling]] — `UnauthorizedException` / `BadRequestException` thrown by authorization checks
