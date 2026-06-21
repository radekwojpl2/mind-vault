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

## Knowledge Format

All notes in this vault follow the **Open Knowledge Format (OKF) v0.1** spec. Every new file must conform to it. See [[Spec]] (`docs/okf/Spec.md`) for the full reference.

Key rules:
- Every `.md` file (except `index.md` and `log.md`) must have a YAML frontmatter block with a non-empty `type` field
- `index.md` / `*.index.md` — directory listing only, no frontmatter
- `log.md` — chronological change history, newest entry first, dates in `YYYY-MM-DD`
- Cross-links use Obsidian wiki-link syntax `[[NoteTitle]]` (bundle-relative, stable across moves)

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

## Git Commits

- Do **not** add `Co-Authored-By: Claude` trailers to commit messages

## DB Query Protocol

When the user types a message starting with `DB:`:

1. Read `.claude/settings.local.json` → `db.connections[db.default]`
2. Tell the user: "Connecting to **`<database>`** on **`<environment>`** (`<host>`). Proceed?"
3. Wait for explicit approval before running anything
4. Execute the question as a read-only query via `psql <url> -c "<sql>"` and return the results
