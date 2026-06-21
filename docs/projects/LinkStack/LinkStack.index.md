---
type: Index
tags: [linkstack, index, dotnet, modular-monolith]
---

# LinkStack

A **.NET 8 modular monolith** for managing personal and team link collections. Single deployable binary with hard module boundaries, async event-driven communication, and multi-tenant data isolation.

**Stack:** ASP.NET Core 8 · PostgreSQL 16 · MassTransit + RabbitMQ · Auth0 · EF Core · MediatR

---

## Architecture

- [[Architecture]] — layer structure, module map, cross-module communication rules, startup sequence

---

## Modules

- [[Users]] — people, organisations, friend requests, subscriptions, Auth0 integration
- [[Links]] — links, groups, sharing, tags, AI tag suggestions
- [[Analytics]] — event consumption, activity tracking, reporting

---

## Patterns

- [[Value-Objects]] — type-safe domain primitives, factory validation, structural equality
- [[Business-Rules]] — `IBusinessRule` / `Check.Rule` / `BrokenBusinessRuleException`
- [[CQRS]] — MediatR commands vs queries, Table Modules, Specification pattern
- [[Outbox]] — MassTransit EF outbox, guaranteed event delivery, deduplication
- [[Tenant-Isolation]] — EF query filters, schema-per-module, `IgnoreQueryFilters` for admin
- [[Error-Handling]] — typed exception hierarchy, ErrorCodes, RFC 7807 Problem Details

---

## Security

- [[Authentication]] — JWT validation, Auth0 claims mapping, identity context, authorization strategy, test tokens

---

## Operations

- [[Dev-Setup]] — Docker dev environment, build, tests, migrations, config keys
