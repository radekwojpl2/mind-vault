# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Repository Is

An **Obsidian knowledge vault** — a collection of technical documentation written in Markdown. There is no code, no build system, and no test suite. All content lives under `docs/`.

The vault is opened in Obsidian (config at `docs/.obsidian/`). The `.gitignore` excludes workspace and cache files but tracks plugin settings and configuration.

## Content Structure

```
docs/
  patterns/        — project-agnostic, copy-paste-ready engineering patterns
  projects/        — per-project documentation (LinkStack, Blue-Green-Deployment, Sentry-POC)
    <Project>/
      <Project>.md          — index note
      Architecture.md       — structure, layer map, key constraints
      Modules/              — per-module notes
      Patterns/             — project-specific pattern applications
```

## Authoring Conventions

- **Frontmatter:** every note starts with `---\ntags: [...]\n---`
- **Internal links:** use Obsidian wiki-link syntax `[[NoteTitle]]` — never Markdown `[text](path.md)` links for cross-note references
- **Note structure:** what the pattern/concept is → when to use it → minimal implementation → trade-offs
- **Index notes** (e.g. `Patterns.md`, `LinkStack.md`) list child notes as `[[WikiLinks]]` grouped by category; they do not duplicate content from child notes

## Primary Project Documented: LinkStack

.NET 8 modular monolith — ASP.NET Core 8, PostgreSQL 16, MassTransit + RabbitMQ, Auth0, EF Core, MediatR.

Key architectural rules captured in the docs:
- Modules share a runtime but own separate DB schemas; no cross-module foreign keys
- Cross-module communication is async via integration events + transactional outbox (preferred) or sync via a module's `Public.Client` project (only allowed cross-module reference)
- Vertical-slice folder organisation: one folder per use-case, not per type
- No business logic in Web endpoints; no raw `Exception`; no direct EF entity mutation
- Integration tests use Testcontainers (real PostgreSQL + RabbitMQ) — never mock the database

See `docs/projects/LinkStack/Architecture.md` for the full layer map and constraints.
