---
type: Reference
title: LinkStack — Constitution
description: "LinkStack's SpecKit constitution (v1.1.5): six non-negotiable principles, stack standards and conventions"
tags: [linkstack, constitution, speckit, principles, governance]
status: stable
confidence: high
source: [https://github.com/radekwojpl2/LinkStack/blob/master/docs/.specify/memory/constitution.md]
updated: 2026-10-28
---

# LinkStack — Constitution

A distillation of `docs/.specify/memory/constitution.md` in the LinkStack repo: **v1.1.5**, ratified 2026-05-08, last amended 2026-05-09. It overrides every other LinkStack practice, and all SpecKit work is checked against it ([[Spec-Driven-Development]]). The repo file is the source of truth; re-read it if its version has moved past 1.1.5.

## Principles

| # | Principle | The rule in one line | Vault detail |
|---|---|---|---|
| I | **Modular Boundaries** (non-negotiable) | Talk to other modules only via `{Module}.Public.Client` (interfaces and primitive DTOs) or integration events. No cross-module Domain/Application/Infrastructure references, no cross-module FKs | [[LinkStack-Architecture]], [[Modular-Monolith]] |
| II | **CQRS + Specification** (non-negotiable) | Commands change state, queries read. All DB queries use `Libs.Query.Specification`, with no ad-hoc LINQ or N+1. Handlers only orchestrate (load → domain method → UoW → publish); logic lives in aggregates and value objects | [[CQRS]], [[Specification]] |
| III | **Value objects inside, primitives at edges** | Every domain concept is a value object validated with `Check.Rule(IBusinessRule)`. HTTP, event and Public.Client payloads use primitives only; VOs are built at the endpoint | [[LinkStack-Value-Objects]], [[Business-Rules]] |
| IV | **Transactional outbox for all events** | Events are published only inside the Unit of Work commit (MassTransit EF outbox). Delivery is at-least-once, so **all consumers must be idempotent** | [[Outbox]] |
| V | **Integration-first testing** | Real PostgreSQL via Testcontainers; the DB is never mocked. Every feature needs integration tests. Unit tests only for pure domain logic | [[Integration-Tests]], [[Testcontainers]] |
| VI | **Spec-driven development with BDD** | Every feature starts with `/speckit-specify`. Acceptance criteria are Given/When/Then. The full flow is mandatory: constitution → specify → clarify → plan → tasks → implement | [[Spec-Driven-Development]] |

### Principle V by work type

| Work type | Required tests |
|---|---|
| `new-feature`, `enhancement` | Integration tests **plus** SpecFlow `.feature` scenarios in `Modules/{Module}/tests/LinkStack.{Module}.BehaviourTests/` (NUnit, Respawn, FluentAssertions, dedicated `WebApplicationFactory`) ([[BDD-Tests]]) |
| `refactoring` | Existing integration and unit tests must pass. New scenarios only if the change adds user-visible behaviour |
| `bug-fix` | Before writing the fix: (1) a **reproduction test** that asserts the buggy behaviour and passes; (2) a **correct-behaviour test** that fails. After the fix, the second test passes, and the first must be deleted or updated |

**Final gate (non-negotiable):** `dotnet build LinkStack.sln --no-restore`, then `dotnet test` with no `--filter`. Building only the API project, or running a filtered test set, doesn't count.

## Stack Standards

- One `DbContext` and one schema per module (`users`, `links`, `analytics`, `imports`), with independent migration chains.
- PostgreSQL shared instance; JSONB for semi-structured data; GIN full-text indexes.
- MassTransit + RabbitMQ (CloudAMQP in production); each module registers its own consumers.
- Auth0 issues RS256 JWTs, validated via JWKS. No custom authentication ([[Authentication]]).
- Minimal APIs only: one small class per endpoint with `MapEndpoint()`, delegating straight to MediatR. **MVC controllers are forbidden.**
- One repository per aggregate root (interface in Domain).
- Table Modules for complex reads: DTOs only, `AsNoTracking()`, a single joined query.
- Exceptions map to Problem Details: `NotFound` → 404, `BadRequest`/`BrokenBusinessRule` → 400, `Conflict` → 409, `Unauthorized` → **401** ([[Error-Handling]]).

## Conventions

- **DI:** all of a module's registrations live in one file, `{Module}ModuleExtensions.cs` in Infrastructure ([[Module-Self-Registration]]).
- **Feature folders:** command and handler in one file, at `Application.Write/{Feature}/{ActionEntity}/{ActionEntity}Command.cs` ([[Vertical-Slices]]).
- **Naming:** `{Action}{Entity}Command` / `Handler` / `Endpoint`, `Get{Entity}Query`.
- **API input:** plain request classes with `[Required]`/`[MaxLength]`. Never accept value objects as input.
- **Releases:** conventional commits drive semver. `feat:` bumps minor, `fix:` bumps patch, `feat!:` bumps major (all three deploy); `chore:`/`docs:` don't release.
- **Deploy:** multi-stage Alpine Docker image to DigitalOcean App Platform, through GitHub Actions on every push to `master`, gated by integration tests.

## Governance

Amendments update both the constitution and LinkStack's `CLAUDE.md`. Versions are semver: MAJOR for removing or redefining a principle, MINOR for a new or materially expanded principle, PATCH for wording. Compliance is checked on every feature before implementation starts.

## Known Tension with In-Flight Work

These would need a constitution amendment, or the work has to change ([[LinkStack-Board]]):
- **PR #38** replaces Table Modules and Specifications with a Dapper read side. That conflicts with Principle II ("all DB queries MUST use the Specification pattern") and the Table Module standard.
- **SpecKit tasks #11–#21** move endpoint mapping into each module's Web project (`<Module>WebExtensions`), which departs from the "all registrations in one `{Module}ModuleExtensions.cs` in Infrastructure" convention.
- **PRs #37/#40** add a .NET Aspire AppHost and Azure Container Apps deployment, while the constitution still names DigitalOcean App Platform.
