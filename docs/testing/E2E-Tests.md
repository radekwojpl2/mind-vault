---
tags: [testing, e2e, end-to-end, aspnetcore]
---

# End-to-End (E2E) Tests

## What They Are

E2E tests exercise the system from the outermost boundary — typically through the real HTTP API — with all services running together. Unlike integration tests that isolate one module, E2E tests verify that the full system works as a whole: authentication, all modules, the message bus, and the database together.

## Integration Tests vs E2E Tests

| | Integration Tests | E2E Tests |
|--|--|--|
| Scope | One module | Full system |
| Infrastructure | Real DB, mocked/replaced auth | Real everything |
| Speed | Fast (seconds) | Slower (tens of seconds) |
| Isolation | Per-test DB reset | Shared state, careful ordering |
| Purpose | Verify module behaviour | Verify the system works as shipped |

E2E tests should be fewer in number. They catch wiring problems that integration tests miss (e.g. a module's DI registration silently broken, or a RabbitMQ exchange misconfigured).

## When to Write E2E Tests

- Cross-module user journeys (create link → analytics event recorded)
- Authentication and authorization end-to-end
- API contract verification (response shapes, status codes)
- Happy-path smoke tests for each major feature area

## Structure

### Factory — full stack

```csharp
public class ApiE2ETestFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly PostgreSqlContainer _db = new PostgreSqlBuilder()
        .WithImage("postgres:16-alpine")
        .Build();

    private readonly RabbitMqContainer _rabbit = new RabbitMqBuilder()
        .WithImage("rabbitmq:3.13-alpine")
        .Build();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureAppConfiguration((_, cfg) =>
        {
            cfg.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = _db.GetConnectionString(),
                ["RabbitMQ:Host"]     = _rabbit.Hostname,
                ["RabbitMQ:Port"]     = _rabbit.GetMappedPublicPort(5672).ToString(),
                ["RabbitMQ:Username"] = "guest",
                ["RabbitMQ:Password"] = "guest",
            });
        });

        // Only replace auth — everything else is real
        builder.ConfigureServices(services =>
            services.PostConfigure<JwtBearerOptions>(
                JwtBearerDefaults.AuthenticationScheme, opts =>
                {
                    opts.Authority = null;
                    opts.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = false,
                        ValidateAudience = false,
                        ValidateLifetime = false,
                        IssuerSigningKey = new SymmetricSecurityKey(
                            Encoding.UTF8.GetBytes(TestJwtGenerator.Secret))
                    };
                }));
    }

    public async Task InitializeAsync()
    {
        await Task.WhenAll(_db.StartAsync(), _rabbit.StartAsync());
        using var scope = Services.CreateScope();
        // Migrate all modules
        await scope.ServiceProvider.GetRequiredService<UsersDbContext>().Database.MigrateAsync();
        await scope.ServiceProvider.GetRequiredService<LinksDbContext>().Database.MigrateAsync();
        await scope.ServiceProvider.GetRequiredService<AnalyticsDbContext>().Database.MigrateAsync();
    }

    public new async Task DisposeAsync() =>
        await Task.WhenAll(_db.StopAsync(), _rabbit.StopAsync());
}
```

### E2E test — cross-module journey

```csharp
[Collection("E2E")]
public class LinkAnalyticsJourneyTests(ApiE2ETestFactory factory) : IClassFixture<ApiE2ETestFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task CreateLink_EventuallyRecordedInAnalytics()
    {
        // Arrange
        var token = TestJwtGenerator.Generate("user-1", orgId: "org-1");
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", token);

        // Act — create a link
        var createResp = await _client.PostAsJsonAsync("/api/links", new
        {
            Url = "https://example.com",
            Title = "Example",
            GroupId = someGroupId
        });
        createResp.EnsureSuccessStatusCode();
        var link = await createResp.Content.ReadFromJsonAsync<CreateLinkResponse>();

        // Assert — eventually appears in analytics
        await WaitForAsync(async () =>
        {
            var analyticsResp = await _client.GetAsync($"/api/analytics/links/{link!.Id}");
            return analyticsResp.IsSuccessStatusCode;
        });
    }
}
```

## Tips

**Keep E2E tests small in number.** Cover journeys, not every edge case — that's integration test territory.

**One shared factory per suite.** Starting containers is slow; share them across the E2E collection.

**Don't reset data between E2E tests.** Use unique IDs / unique user accounts per test so tests don't collide without needing a full truncate.

**Async assertions need polling.** Events go through the message bus; assert with `WaitForAsync` not immediate checks.

## Project Naming

```
LinkStack.Api.E2ETests/
  Journeys/
    LinkAnalyticsJourneyTests.cs
    UserFriendJourneyTests.cs
  Infrastructure/
    ApiE2ETestFactory.cs
    TestJwtGenerator.cs
```

## Related

- [[Integration-Tests]] — faster, scoped to one module
- [[Testcontainers]] — container setup for DB and RabbitMQ
- [[ASP-NET-Core-API-Testing]] — WebApplicationFactory details
