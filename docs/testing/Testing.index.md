---
type: Index
tags: [index, testing]
---

# Testing

Project-agnostic testing strategy and guides. Covers the full pyramid from unit tests to E2E, with concrete tooling and patterns.

## Start Here

- [[Test-Strategy]] — test pyramid, decision guide (when to write what), core principles, naming conventions, tooling overview

## By Test Type

- [[Unit-Tests]] — pure domain logic, value objects, business rules, specifications; no I/O
- [[Integration-Tests]] — full module stack with real DB; the workhorse of the test suite
- [[BDD-Tests]] — Gherkin feature files with SpecFlow; business-readable acceptance scenarios
- [[E2E-Tests]] — full system cross-module journeys; few but broad

## Infrastructure & Tooling

- [[Testcontainers]] — real PostgreSQL / RabbitMQ in Docker, shared across test collections
- [[ASP-NET-Core-API-Testing]] — WebApplicationFactory, test tokens, replacing services
- [[Test-Data-Builders]] — builder pattern for fixtures; tests only specify what matters
