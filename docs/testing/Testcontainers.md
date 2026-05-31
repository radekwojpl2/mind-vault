---
tags: [testing, testcontainers, docker, integration-tests, infrastructure]
---

# Testcontainers

## What It Is

Testcontainers is a .NET library that starts real Docker containers (PostgreSQL, RabbitMQ, Redis, etc.) programmatically from your test code. Each test run gets a fresh, real instance. No manual setup, no shared state between developers, no "works on my machine" DB drift.

## When to Use

- Integration or E2E tests that need a real database
- Tests that verify message-broker behaviour (consumers, outbox, retries)
- Any test where mocking the infrastructure would reduce confidence

## Prerequisites

Docker Desktop (or Docker Engine) must be running on the test machine and in CI.

## Setup

```xml
<PackageReference Include="Testcontainers.PostgreSql" Version="3.*" />
<PackageReference Include="Testcontainers.RabbitMq" Version="3.*" />
```

## PostgreSQL Container

```csharp
public class PostgresTestContainer : IAsyncLifetime
{
    private readonly PostgreSqlContainer _container = new PostgreSqlBuilder()
        .WithImage("postgres:16-alpine")
        .WithDatabase("testdb")
        .WithUsername("test")
        .WithPassword("test")
        .Build();

    public string ConnectionString => _container.GetConnectionString();

    public Task InitializeAsync() => _container.StartAsync();
    public Task DisposeAsync() => _container.StopAsync();
}
```

## RabbitMQ Container

```csharp
public class RabbitMqTestContainer : IAsyncLifetime
{
    private readonly RabbitMqContainer _container = new RabbitMqBuilder()
        .WithImage("rabbitmq:3.13-alpine")
        .Build();

    public string Host => _container.Hostname;
    public int Port => _container.GetMappedPublicPort(5672);
    public string Username => "guest";
    public string Password => "guest";

    public Task InitializeAsync() => _container.StartAsync();
    public Task DisposeAsync() => _container.StopAsync();
}
```

## Sharing Containers Across Tests (Collection Fixture)

Starting a container per test is slow. Use xUnit's `ICollectionFixture` to start once per test collection:

```csharp
// Start once for the entire collection
public class SharedContainers : IAsyncLifetime
{
    public PostgreSqlContainer Postgres { get; } = new PostgreSqlBuilder()
        .WithImage("postgres:16-alpine")
        .Build();

    public RabbitMqContainer RabbitMq { get; } = new RabbitMqBuilder()
        .WithImage("rabbitmq:3.13-alpine")
        .Build();

    public async Task InitializeAsync()
    {
        await Task.WhenAll(Postgres.StartAsync(), RabbitMq.StartAsync());
    }

    public async Task DisposeAsync()
    {
        await Task.WhenAll(Postgres.StopAsync(), RabbitMq.StopAsync());
    }
}

[CollectionDefinition("Integration")]
public class IntegrationCollection : ICollectionFixture<SharedContainers> { }
```

Wire into `WebApplicationFactory`:

```csharp
public class AppTestFactory(SharedContainers containers)
    : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions<AppDbContext>>();
            services.AddDbContext<AppDbContext>(opts =>
                opts.UseNpgsql(containers.Postgres.GetConnectionString()));
        });
    }
}
```

## Resetting State Between Tests

Don't recreate the container between tests — truncate tables instead:

```csharp
public async Task ResetAsync(AppDbContext db)
{
    // Option 1: Truncate — fast, resets sequences
    await db.Database.ExecuteSqlRawAsync(
        "TRUNCATE orders, order_lines, customers RESTART IDENTITY CASCADE");

    // Option 2: Respawn (nuget: Respawn) — smarter, handles FK ordering automatically
    var respawner = await Respawner.CreateAsync(
        db.Database.GetConnectionString()!,
        new RespawnerOptions { DbAdapter = DbAdapter.Postgres });
    await respawner.ResetAsync(db.Database.GetConnectionString()!);
}
```

## Running in CI

Testcontainers works in any CI environment with Docker available. For GitHub Actions:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '8.x'
      - run: dotnet test --configuration Release
```

No special Docker setup needed — `ubuntu-latest` runners have Docker pre-installed.

## Trade-offs

| Pro | Con |
|-----|-----|
| Real infrastructure — no mock gaps | Requires Docker on every dev machine and CI |
| Containers are isolated per run | Slower startup than in-memory fakes |
| Matches production behaviour exactly | Container pull on first run can be slow |

## Related

- [[Integration-Tests]] — uses Testcontainers for the test DB
- [[E2E-Tests]] — uses Testcontainers for the full stack
