---
type: Index
tags: [linkstack, index, dotnet, modular-monolith]
---

# LinkStack

A **.NET 8 modular monolith** for managing personal and team link collections. Single deployable binary with hard module boundaries, async event-driven communication, and multi-tenant data isolation.

**Stack:** ASP.NET Core 8 · PostgreSQL 16 · MassTransit + RabbitMQ · Auth0 · EF Core · MediatR

---

## Start Here

- [[LinkStack-Context]] — purpose, feature map, where the code lives, glossary, known gaps
- [[LinkStack-Board]] — implemented / active / planned / archived work

---

## Architecture

- [[LinkStack-Architecture]] — layer structure, module map, cross-module communication rules, startup sequence

---

## Modules

- [[Users]] — people, organisations, friend requests, subscriptions, Auth0 integration
- [[Links]] — links, groups, sharing, tags, AI tag suggestions
- [[Analytics]] — event consumption, activity tracking, reporting

---

## Patterns

LinkStack's own application of each pattern. The generic version is in brackets. When they differ, the LinkStack note wins for LinkStack questions.

- [[LinkStack-Value-Objects]] — type-safe domain primitives, factory validation, structural equality ([[Value-Objects]])
- [[Business-Rules]] — `IBusinessRule` / `Check.Rule` / `BrokenBusinessRuleException` ([[Business-Rule-Engine]])
- [[CQRS]] — MediatR commands vs queries, Table Modules, Specification pattern ([[CQRS-MediatR]], [[Specification]])
- [[Outbox]] — MassTransit EF outbox, guaranteed event delivery, deduplication ([[Transactional-Outbox]])
- [[Tenant-Isolation]] — EF query filters, schema-per-module, `IgnoreQueryFilters` for admin ([[EF-Core-Global-Query-Filters]])
- [[Error-Handling]] — typed exception hierarchy, ErrorCodes, RFC 7807 Problem Details ([[Typed-Exceptions-Problem-Details]])

---

## Guides

- [[LinkStack-Adding-A-Module]] — checklist: projects, allowed references, schema, registration, tests
- Testing a LinkStack feature: [[Test-Strategy]] → [[Integration-Tests]] / [[BDD-Tests]] (Testcontainers, never mock the database)

---

## Specs

- [[url-shortener-custom-domains]] — 007: short URLs, vanity aliases, premium custom domains (draft)

---

## Security

- [[Authentication]] — JWT validation, Auth0 claims mapping, identity context, authorization strategy, test tokens

---

## Operations

- [[Dev-Setup]] — Docker dev environment, build, tests, migrations, config keys
