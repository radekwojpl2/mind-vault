# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Repository Is

An **Obsidian knowledge vault** — a collection of technical documentation written in Markdown. There is no code, no build system, and no test suite. All content lives under `docs/`.

The vault is opened in Obsidian (config at `docs/.obsidian/`). The `.gitignore` excludes workspace and cache files but tracks plugin settings and configuration.

## Where to Start

Read `docs/index.md` (root map of every section) and `docs/context/Global.md` (owner, machine, repos, tooling, standing principles) before answering questions from the vault. For a project, read its `<Project>.index.md` first.

## Content Structure

```
docs/
  index.md         — root entry point, links every section
  inbox/           — single entry point: raw captures waiting for triage
  context/         — global context (owner, environment, repos, principles, vault purpose/structure)
  patterns/        — project-agnostic, copy-paste-ready engineering patterns
  projects/        — per-project documentation (LinkStack, Blue-Green-Deployment, Sentry-POC)
    <Project>/
      <Project>.index.md        — index note
      <Project>-Architecture.md — structure, layer map, key constraints
      Modules/                  — per-module notes
      Patterns/                 — project-specific pattern applications
      Spec-Kit/                 — SpecKit feature summaries
  testing/         — testing strategy and patterns
  documentation/   — docs standards (ADRs, arc42, coding guidelines)
  db/              — PostgreSQL tooling, AI readonly user setup, query protocol
  okf/             — Open Knowledge Format spec reference
  speckit/         — SpecKit / spec-driven development notes and extensions
  learning/        — course lesson notes (<Course>/) and research / PoC findings (research/)
  writing/         — drafts and ideas for posts
```

## Knowledge Format

All notes in this vault follow the **Open Knowledge Format (OKF) v0.1** spec. Every new file must conform to it. See [[Spec]] (`docs/okf/Spec.md`) for the full reference.

Key rules:
- Every `.md` file (except `index.md` and `log.md`) must have a YAML frontmatter block with a non-empty `type` field
- Concept notes (everything except `*.index.md` and `log.md`) also carry `status`, `confidence`, `source` and `updated` — see [[Vault-Profile]] (`docs/okf/Vault-Profile.md`). On a meaningful edit, bump `updated`; mark drift with `status: outdated`
- `*.index.md` — directory listing; this vault gives it `type: Index` frontmatter (see README)
- `log.md` — chronological change history, newest entry first, dates in `YYYY-MM-DD`
- Cross-links use Obsidian wiki-link syntax `[[NoteTitle]]` (bundle-relative, stable across moves)
- Note file names must be unique across the vault so `[[NoteTitle]]` never needs a path — prefix a project-specific note with the project name when a generic note of the same name exists (e.g. `LinkStack-Architecture`)
- No Markdown content outside `docs/` other than `README.md` and `CLAUDE.md`

## Authoring Conventions

- **Frontmatter:** every note starts with `---\ntype: <Type>\ntags: [...]\n---` (`type` is required, e.g. Pattern, Guide, Module, Index, Log); concept notes add `status`, `confidence`, `source`, `updated` after `tags` — see [[Vault-Profile]]
- **Internal links:** use Obsidian wiki-link syntax `[[NoteTitle]]` — never Markdown `[text](path.md)` links for cross-note references
- **Note structure:** pick the type and its usual sections from `docs/okf/Note-Types.md` — guidance, not a rigid template
- **Index notes** (e.g. `Patterns.index.md`, `LinkStack.index.md`) list child notes as `[[WikiLinks]]` grouped by category; they do not duplicate content from child notes

## Working with the Vault

- Use the **`knowledge` skill** (`.claude/skills/knowledge/SKILL.md`) for answering from the vault, capturing, inbox triage, adding/updating notes and maintenance. It replaces the old `/new-pattern` command.
- Run `node scripts/validate-vault.js` before every commit — it checks frontmatter, profile fields, unique names, broken links, orphans and log order. The pre-commit hook in `.githooks/` runs it automatically (enable once per clone: `git config core.hooksPath .githooks`), and the `Validate vault` GitHub Action runs it on every PR and push to `main`.
- Scheduled maintenance is a **Claude Code routine** ("mind-vault daily sync": daily board sync and inbox triage, full maintenance on Mondays) — see `docs/context/Vault-Automation.md`. The repo is **public** (owner's decision): never put secrets or private-repo source code in notes.
- Agents change the vault **only through PRs** (branch → small commits → PR; stack PRs on unmerged work). Never push to `main`.

## Primary Project Documented: LinkStack

.NET 8 modular monolith — ASP.NET Core 8, PostgreSQL 16, MassTransit + RabbitMQ, Auth0, EF Core, MediatR.

Key architectural rules captured in the docs:
- Modules share a runtime but own separate DB schemas; no cross-module foreign keys
- Cross-module communication is async via integration events + transactional outbox (preferred) or sync via a module's `Public.Client` project (only allowed cross-module reference)
- Vertical-slice folder organisation: one folder per use-case, not per type
- No business logic in Web endpoints; no raw `Exception`; no direct EF entity mutation
- Integration tests use Testcontainers (real PostgreSQL + RabbitMQ) — never mock the database

See `docs/projects/LinkStack/LinkStack-Architecture.md` for the full layer map and constraints.

## Git Commits

- Do **not** add `Co-Authored-By: Claude` trailers to commit messages
- Before committing, update the `log.md` in every section that was modified

## DB Query Protocol

When the user types a message starting with `DB:`:

1. Read `.claude/settings.local.json` → `db.connections[db.default]`
2. Tell the user: "Connecting to **`<database>`** on **`<environment>`**. Proceed?"
3. Wait for explicit approval before running anything
4. Use whatever tool is available to run the query (MCP, docker exec, psql, etc.) and return the results
