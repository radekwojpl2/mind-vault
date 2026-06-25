# Mind Vault

Personal Obsidian knowledge vault — engineering patterns and project documentation.

## Structure

```
docs/
  patterns/        — project-agnostic, copy-paste-ready engineering patterns
  projects/        — per-project documentation
  testing/         — testing strategy and patterns
  documentation/   — docs standards (ADRs, arc42, coding guidelines)
  db/              — PostgreSQL tooling, AI readonly user setup, query protocol
  okf/             — Open Knowledge Format spec reference
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

## Open Knowledge Format (OKF)

All notes follow [OKF v0.1](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md) — a minimal spec for human- and agent-readable knowledge bundles.

**Conformance rules:**

- Every `.md` file (except `index.md` and `log.md`) must have a YAML frontmatter block with a non-empty `type` field
- `log.md` — chronological change history, newest entry first, dates in `YYYY-MM-DD`
- `index.md` / `*.index.md` — directory listing only

**How this vault adapts OKF:**

| OKF Spec | This vault |
|---|---|
| `index.md` reserved, no frontmatter | `<Name>.index.md` with `type: Index` frontmatter — allows named, linkable index per section |
| Cross-links via `[text](path.md)` | Obsidian wiki-links `[[NoteTitle]]` — stable across moves, render as graph edges in Obsidian |
| `timestamp` recommended | Not used |
| `title` / `description` recommended | Used selectively |

## Usage

Open the `docs/` folder as an Obsidian vault. Internal links use `[[WikiLink]]` syntax.
