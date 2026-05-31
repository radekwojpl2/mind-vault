---
tags: [index, patterns]
---

# Patterns

Project-agnostic, copy-paste-ready guidelines. Each note covers what the pattern is, when to use it, a minimal implementation, and trade-offs.

## Domain

- [[Value-Objects]] — immutable domain primitives with built-in validation and structural equality
- [[Business-Rule-Engine]] — `IBusinessRule` / `Check.Rule` for named, testable domain invariants
- [[Specification]] — composable query predicates (`And` / `Or` / `Not`) over `IQueryable`

## Application

- [[CQRS-MediatR]] — command/query separation via MediatR, pipeline behaviors, handler structure
- [[Typed-Exceptions-Problem-Details]] — typed exception hierarchy + RFC 7807 middleware for structured API errors
- [[Current-User-Service]] — typed abstraction over HttpContext claims; keeps handlers free of IHttpContextAccessor

## Infrastructure

- [[Transactional-Outbox]] — atomic domain save + event publish; zero event loss
- [[EF-Core-Global-Query-Filters]] — automatic per-request WHERE clauses (multi-tenancy, soft delete)

## Architecture

- [[Modular-Monolith]] — single deployable with hard module boundaries, event-driven cross-module comms
- [[Modular-Monolith-Building-Blocks]] — shared kernel layer providing cross-cutting contracts, base types, and test infrastructure for a modular monolith
- [[Local-Solution-Libraries]] — self-contained utility libs in a `Libs/` folder; NuGet-level isolation without publishing overhead
- [[Module-Self-Registration]] — each module owns its `AddXxxModule()` extension; `Program.cs` stays thin
- [[Vertical-Slices]] — feature-first folder organisation; one folder per use-case at every layer

## Deployment

- [[Blue-Green-Deployment]] — two live environments, traffic switch at cutover, instant rollback
- [[Expand-Contract]] — safe breaking schema changes across simultaneous application versions
- [[AI-CI-Gate]] — LLM-enforced rules in CI for context-aware checks that static analysis can't express
