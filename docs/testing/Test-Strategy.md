---
type: Guide
tags: [testing, strategy, overview]
---

# Test Strategy

## Philosophy: Integration Tests First

Integration tests are the foundation of this testing strategy — not unit tests. An integration test hits a real HTTP endpoint, talks to a real database, and verifies that the application actually works. A unit test that passes tells you a class behaves correctly in isolation; an integration test tells you the feature ships.

Unit tests fill the gaps: pure domain logic (value objects, business rules, specifications) that is fast to test and expensive to cover through the HTTP layer. But they are supplemental, not the foundation.

```
        /\
       /E2E\              — few, cross-module journeys, full stack
      /------\
     /  BDD   \           — business-readable acceptance scenarios
    /----------\
   /   Unit     \         — pure domain logic only, no I/O
  /--------------\
 / Integration    \       ← the foundation: real DB, real HTTP, real behaviour
/------------------\
```

## Test Types at a Glance

| Type | Scope | Speed | Infra needed | Primary purpose |
|------|-------|-------|-------------|-----------------|
| **Integration** | One module, full HTTP stack | 1–5s | Real DB | **The app actually works** |
| Unit | One class/method | < 1ms | None | Pure domain logic |
| BDD | Feature workflow | 2–10s | Real DB | Living acceptance criteria |
| E2E | Full system | 10–30s | Real DB + broker | Cross-module wiring |

## Decision Guide

**Default to an integration test.** For any feature, the first question is: does the HTTP endpoint work end-to-end against a real database? That is your primary signal.

**Write a unit test when:**
- Logic is pure — [[Value-Objects|value objects]], [[Business-Rule-Engine|business rules]], [[Specification|specifications]]
- The scenario is impractical to cover through HTTP (hundreds of edge-case combinations)
- You want sub-millisecond feedback on isolated logic

**Write a BDD test when:**
- A feature has multiple interacting states that stakeholders care about
- The scenario reads as acceptance criteria and should stay readable over time

**Write an E2E test when:**
- You need to verify a cross-module journey (create link → analytics records it)
- You want a smoke test that the full system boots and critical paths work

**Do NOT write a unit test as a substitute for an integration test.** A unit test that mocks the repository is not evidence the feature works — it is evidence that your mock behaves as you programmed it.

## Core Principles

### 1. Never mock the database
A test that passes against a mock repository can hide missing migrations, wrong column types, and EF Core query translation failures. Use [[Testcontainers]] to run real PostgreSQL.

### 2. Test behaviour, not implementation
Test what the system does, not how it does it. If you can refactor the internals without changing a single test, your tests are well-written.

### 3. One assertion focus per test
Each test should have a clear, singular purpose. A test that checks status, timestamp, and event count simultaneously hides which behaviour broke.

### 4. AAA structure everywhere
Every test: **Arrange** (set up state) → **Act** (run the thing) → **Assert** (check the outcome). No exceptions.

### 5. Tests should be independent
No test should depend on another test running first. Use [[Test-Data-Builders|seeders]] and DB resets to start each test from a clean, known state.

### 6. Integration tests run on every commit
Because integration tests are the foundation, they must be fast enough to run on every commit — not just in nightly CI. Keep the [[Testcontainers]] container shared across tests (one container per collection, not per test) and use table truncation rather than container restarts between tests.

## Test Naming

Name tests to describe what they verify, not what they call:

```
// Bad
public void HandleAsync_Test1()
public void CreateOrder_Works()

// Good
public void CreateOrder_WithValidRequest_PersistsAndReturnsId()
public void CreateOrder_WithoutAuthentication_Returns401()
public void Cancel_AlreadyCancelledOrder_ThrowsBrokenBusinessRule()
```

Pattern: `MethodUnderTest_Scenario_ExpectedOutcome`

## Tooling (.NET)

| Library | Purpose |
|---------|---------|
| `xUnit` | Test runner |
| `FluentAssertions` | Readable assertions |
| `Testcontainers` | Real Docker infra |
| `SpecFlow` | BDD / Gherkin |
| `Respawn` | Fast DB reset between tests |
| `Bogus` | Fake data generation |
| `NSubstitute` / `Moq` | Mocking (use sparingly) |

## Project Structure

```
Modules/Orders/
  LinkStack.Orders.Domain.UnitTests/
  tests/
    LinkStack.Orders.IntegrationTests/
    LinkStack.Orders.BehaviourTests/

LinkStack.Api.E2ETests/
```

## Related Guides

- [[Unit-Tests]] — pure domain logic, no I/O
- [[Integration-Tests]] — full module stack with real DB
- [[BDD-Tests]] — Gherkin scenarios with SpecFlow
- [[E2E-Tests]] — full system, cross-module journeys
- [[Testcontainers]] — real Docker infrastructure in tests
- [[ASP-NET-Core-API-Testing]] — WebApplicationFactory setup
- [[Test-Data-Builders]] — builder pattern for test fixtures
