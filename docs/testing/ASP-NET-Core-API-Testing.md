---
type: Guide
tags: [testing, aspnetcore, webapplicationfactory, integration-tests, api]
---

# ASP.NET Core API Testing

## What It Is

`WebApplicationFactory<TEntryPoint>` starts your full ASP.NET Core application in-process with an in-memory test server. Tests make real HTTP calls through your middleware, routing, and handlers — without actually binding a TCP port.

## Basic Setup

```csharp
public class MyAppFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            // Replace infrastructure with test doubles
        });
    }
}
```

The `Program` type marker tells the factory which assembly to load. For top-level statements, add this to `Program.cs`:

```csharp
// Program.cs (bottom of file, after app.Run())
public partial class Program { }
```

## Replacing the Database

```csharp
services.RemoveAll<DbContextOptions<AppDbContext>>();
services.AddDbContext<AppDbContext>(opts =>
    opts.UseNpgsql(testContainerConnectionString));
```

See [[Testcontainers]] for spinning up real PostgreSQL.

## Replacing Authentication

For JWT-protected APIs, replace Auth0/external JWKS validation with a local symmetric key:

```csharp
services.PostConfigure<JwtBearerOptions>(
    JwtBearerDefaults.AuthenticationScheme, opts =>
    {
        opts.Authority = null;
        opts.MetadataAddress = null!;
        opts.RequireHttpsMetadata = false;
        opts.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer   = false,
            ValidateAudience = false,
            ValidateLifetime = false,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(TestJwtGenerator.Secret))
        };
    });
```

Generate test tokens:

```csharp
public static class TestJwtGenerator
{
    public const string Secret = "test-secret-must-be-at-least-32-chars!!";

    public static string Generate(
        string userId,
        string? orgId = null,
        string[]? roles = null)
    {
        var claims = new List<Claim> { new("sub", userId) };
        if (orgId is not null)   claims.Add(new("org_id", orgId));
        if (roles is not null)   claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));

        var key   = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(Secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(claims: claims, expires: DateTime.UtcNow.AddHours(1), signingCredentials: creds);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
```

## Replacing External HTTP Clients

```csharp
services.RemoveAll<IEmailSender>();
services.AddSingleton<IEmailSender, NullEmailSender>();

// Or with a fake that records calls
var fakeEmail = new FakeEmailSender();
services.AddSingleton<IEmailSender>(fakeEmail);
// Later: fakeEmail.SentMessages.Should().HaveCount(1);
```

## Sharing the Factory (Collection Fixture)

Starting the factory per test is slow. Share it via xUnit collection fixture:

```csharp
[CollectionDefinition("App")]
public class AppCollection : ICollectionFixture<MyAppFactory> { }

[Collection("App")]
public class OrderTests(MyAppFactory factory) : IAsyncLifetime
{
    private readonly HttpClient _client = factory.CreateClient();

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync()
    {
        // Reset DB between tests
        await factory.ResetDatabaseAsync();
    }
}
```

## Making HTTP Calls

```csharp
// POST with JSON body
var response = await _client.PostAsJsonAsync("/api/orders", new
{
    Lines = new[] { new { ProductId = Guid.NewGuid(), Quantity = 1 } }
});

// Assert status
response.StatusCode.Should().Be(HttpStatusCode.Created);

// Deserialise response body
var body = await response.Content.ReadFromJsonAsync<OrderResponse>(
    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

// GET
var getResp = await _client.GetAsync($"/api/orders/{body!.Id}");
getResp.EnsureSuccessStatusCode();
```

## Authenticating Requests

```csharp
private void AuthenticateAs(string userId, string? orgId = null)
{
    var token = TestJwtGenerator.Generate(userId, orgId);
    _client.DefaultRequestHeaders.Authorization =
        new AuthenticationHeaderValue("Bearer", token);
}

private void SignOut()
{
    _client.DefaultRequestHeaders.Authorization = null;
}
```

## Asserting Database State

Inject the DbContext via the factory's service scope to verify persistence:

```csharp
using var scope = factory.Services.CreateScope();
var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

var order = await db.Orders.FindAsync(createdId);
order.Should().NotBeNull();
order!.Status.Should().Be(OrderStatus.Pending);
```

## Full Example

```csharp
[Collection("App")]
public class CreateOrderTests(MyAppFactory factory) : IAsyncLifetime
{
    private readonly HttpClient _client = factory.CreateClient();

    public Task InitializeAsync() => Task.CompletedTask;
    public async Task DisposeAsync() => await factory.ResetDatabaseAsync();

    [Fact]
    public async Task CreateOrder_Authenticated_Returns201()
    {
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer",
                TestJwtGenerator.Generate("user-1"));

        var response = await _client.PostAsJsonAsync("/api/orders", new
        {
            Lines = new[] { new { ProductId = Guid.NewGuid(), Quantity = 2 } }
        });

        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Fact]
    public async Task CreateOrder_Unauthenticated_Returns401()
    {
        var response = await _client.PostAsJsonAsync("/api/orders",
            new { Lines = Array.Empty<object>() });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
```

## Related

- [[Integration-Tests]] — the broader testing approach
- [[Testcontainers]] — real DB inside the factory
- [[BDD-Tests]] — SpecFlow also uses WebApplicationFactory under the hood
