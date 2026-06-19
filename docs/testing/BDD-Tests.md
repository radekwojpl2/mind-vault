---
type: Guide
tags: [testing, bdd, specflow, gherkin, behaviour]
---

# BDD Tests (SpecFlow)

## What They Are

BDD (Behaviour-Driven Development) tests express acceptance criteria in plain English using Gherkin syntax (`Given / When / Then`). SpecFlow compiles these feature files into executable tests. They sit at roughly the same level as integration tests but are structured around user-observable behaviour, not technical assertions.

## When to Use

- Business-critical user workflows that stakeholders should be able to read and verify
- Features with multiple interacting states (friend requests, order lifecycle, sharing permissions)
- Regression documentation — the feature file is the living spec

## When NOT to Use

- Low-level technical behaviour (validation edge cases, SQL queries) — use unit or integration tests
- Every endpoint — BDD tests are for workflows, not exhaustive coverage

## Structure

```
Module.BehaviourTests/
  Features/
    FriendRequests.feature
    OrderLifecycle.feature
  StepDefinitions/
    FriendRequestSteps.cs
    AuthStepDefinitions.cs     ← shared across features
  Infrastructure/
    TestWebAppFactory.cs
    ScenarioContext.cs          ← holds state across steps
    TestJwtGenerator.cs
```

## Feature File

```gherkin
Feature: Friend Requests

  Scenario: Sending a friend request
    Given I am authenticated as "alice"
    And "bob" exists as a user
    When I send a friend request to "bob"
    Then the request should be in "Pending" state
    And "bob" should have 1 pending friend request

  Scenario: Accepting a friend request
    Given I am authenticated as "alice"
    And "bob" has sent me a friend request
    When I accept the friend request from "bob"
    Then "alice" and "bob" should be friends

  Scenario: Cannot send a friend request to yourself
    Given I am authenticated as "alice"
    When I send a friend request to "alice"
    Then the response status should be 400
```

## Step Definitions

```csharp
[Binding]
public class FriendRequestSteps(ScenarioContext ctx, TestContext testCtx)
{
    [Given(@"I am authenticated as ""(.*)""")]
    public void GivenIAmAuthenticatedAs(string userId)
    {
        testCtx.CurrentUserId = userId;
        var token = TestJwtGenerator.Generate(userId);
        testCtx.Client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", token);
    }

    [When(@"I send a friend request to ""(.*)""")]
    public async Task WhenISendAFriendRequestTo(string receiverId)
    {
        testCtx.LastResponse = await testCtx.Client
            .PostAsJsonAsync("/api/friends/requests", new { ReceiverId = receiverId });
    }

    [Then(@"the request should be in ""(.*)"" state")]
    public async Task ThenTheRequestShouldBeInState(string expectedStatus)
    {
        testCtx.LastResponse!.EnsureSuccessStatusCode();
        var body = await testCtx.LastResponse.Content
            .ReadFromJsonAsync<FriendRequestResponse>();
        body!.Status.Should().Be(expectedStatus);
    }

    [Then(@"the response status should be (.*)")]
    public void ThenTheResponseStatusShouldBe(int statusCode)
    {
        ((int)testCtx.LastResponse!.StatusCode).Should().Be(statusCode);
    }
}
```

## Shared Test Context

Step definitions share state via a context class (injected by SpecFlow's DI):

```csharp
public class TestContext
{
    public string? CurrentUserId { get; set; }
    public HttpClient Client { get; set; } = null!;
    public HttpResponseMessage? LastResponse { get; set; }
}
```

Register with SpecFlow:

```csharp
[Binding]
public class Hooks(TestContext ctx, TestWebAppFactory factory)
{
    [BeforeScenario]
    public void BeforeScenario()
    {
        ctx.Client = factory.CreateClient();
    }

    [AfterScenario]
    public async Task AfterScenario()
    {
        await factory.ResetDatabaseAsync();
    }
}
```

## Auth Step Definitions (reusable across feature files)

Extract authentication steps into a shared binding class so every feature can use them:

```csharp
[Binding]
public class AuthStepDefinitions(TestContext ctx)
{
    [Given(@"I am authenticated as ""(.*)""")]
    public void GivenIAmAuthenticatedAs(string userId)
    {
        ctx.CurrentUserId = userId;
        ctx.Client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", TestJwtGenerator.Generate(userId));
    }

    [Given(@"I am not authenticated")]
    public void GivenIAmNotAuthenticated()
    {
        ctx.CurrentUserId = null;
        ctx.Client.DefaultRequestHeaders.Authorization = null;
    }
}
```

## SpecFlow Setup

```xml
<!-- Module.BehaviourTests.csproj -->
<PackageReference Include="SpecFlow.xUnit" Version="3.*" />
<PackageReference Include="SpecFlow.Microsoft.Extensions.DependencyInjection" Version="2.*" />
```

```csharp
// specflow.json
{
  "stepAssemblies": [
    { "assembly": "Module.BehaviourTests" }
  ]
}
```

## Trade-offs

| Pro | Con |
|-----|-----|
| Feature files are readable by non-developers | Step definition maintenance overhead |
| Living documentation tied to executable tests | Harder to debug than plain xUnit tests |
| Forces behaviour-first thinking | Can become verbose for complex scenarios |

## Related

- [[Integration-Tests]] — lower-level, not Gherkin-based
- [[ASP-NET-Core-API-Testing]] — WebApplicationFactory used by the test factory
- [[Test-Data-Builders]] — seeding data in `Given` steps
