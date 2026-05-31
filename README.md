# Mind Vault

Personal Obsidian knowledge vault — engineering patterns and project documentation.

## Structure

```
docs/
  patterns/        — project-agnostic, copy-paste-ready engineering patterns
  projects/        — per-project documentation
  testing/         — testing strategy and patterns
  documentation/   — docs standards (ADRs, arc42, coding guidelines)
```

## Patterns

| Category | Patterns |
|----------|----------|
| Domain | Value Objects, Business Rule Engine, Specification |
| Application | CQRS/MediatR, Typed Exceptions, Current User Service |
| Infrastructure | Transactional Outbox, EF Core Global Query Filters |
| Architecture | Modular Monolith, Vertical Slices, Module Self-Registration |
| Deployment | Blue-Green Deployment, Expand-Contract, AI CI Gate |

## Projects Documented

- **LinkStack** — .NET 8 modular monolith (ASP.NET Core, PostgreSQL, MassTransit, Auth0)
- **Blue-Green-Deployment** — zero-downtime deployment pipeline
- **Sentry-POC** — error tracking integration proof of concept

## Usage

Open the `docs/` folder as an Obsidian vault. Internal links use `[[WikiLink]]` syntax.
