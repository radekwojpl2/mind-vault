---
type: Context
title: Global Context
description: "Owner, machine, repositories, tooling and standing principles that apply to every project"
tags: [context, global, environment, repositories, tooling]
status: stable
confidence: high
source: [environment, https://github.com/radekwojpl2]
updated: 2026-10-28
---

# Global Context

Information that applies beyond any single project. An agent should read this before answering questions about where code lives or how work is done.

## Owner

- **Radek** — GitHub account `radekwojpl2`.
- Primary stack (as documented in this vault): .NET 8 / ASP.NET Core, PostgreSQL, EF Core, MassTransit, Azure. Frontends in Next.js / TypeScript.
- Currently taking the **MEGA.dev** course (local materials in `D:\git\mega-dev`). Lesson S01E03 *Building Knowledge Systems* drives the current vault refactor (mind-vault issue #1).

## Machine

| Item | Value |
|---|---|
| OS | Windows 11 Pro |
| Shells | PowerShell 5.1, Git Bash |
| Repos root | `D:\git` |
| Runtimes | .NET SDKs 9.0, 10.0, 11.0 preview (projects target .NET 8), Node.js 24 — **no Python installed** |
| CLIs | `git`, `gh` (authenticated as `radekwojpl2`), Docker |
| Notes app | Obsidian, vault at `D:\git\mind-vault\docs` (plugins: Dataview, Juggl) |

## Repositories

Projects documented in this vault:

| Project | GitHub | Default branch | Local path | Notes |
|---|---|---|---|---|
| [[LinkStack.index\|LinkStack]] | `radekwojpl2/LinkStack` | `master` | — | Not cloned as a working copy: `D:\git\LinkStack` only holds an uncommitted Next.js app (`link-stack-app`). Read code via `gh` or clone it. |
| LinkStack Portal | `radekwojpl2/LinkStackPortal` | — | — | TypeScript frontend for LinkStack (undocumented) |
| [[Blue-Green-Deployment.index\|Blue-Green-Deployment]] | `radekwojpl2/blue-green-deployment-poc` | `main` | `D:\git\blue-green-deployment-poc` | |
| [[Sentry-POC.index\|Sentry-POC]] | `radekwojpl2/dotnet-nextjs-sentry-poc` | `main` | — | Not cloned locally |
| Mind Vault (this vault) | `radekwojpl2/mind-vault` | `main` | `D:\git\mind-vault` | |

Other local repos under `D:\git` (not yet documented here): `aspire-showcase`, `c4-models-show-case`, `dotnet-background-processing`, `pragmatic-modular-monolith`, `modular-monolith-with-ddd` (upstream: `kgrzybek`), `mini-crm` (`simple-crm`), `GitPeek`, `JsonApiPoc` (`Simple.JsonApi`), `SSE.Api` (`server-side-events-poc`), `self-hosted-llm-poc`, `radekwojpl2.github.io`, plus local-only experiments (`HttpQuery`, `HttpVersioningPoc`, `ODataPoc`, `DeploySmart`, `otel-tests`, `posts`, …).

## Agent Tooling

- **Claude Code** is the primary agent. Project rules live in each repo's `CLAUDE.md`.
- MCP servers in use: `codebase-memory-mcp` (code knowledge graph — use it first for code exploration), `mega-challenge` (MEGA.dev course), `claude-in-chrome` (browser automation), `aspire-showcase`.
- **SpecKit** drives feature work (spec → plan → tasks → implement); see [[Spec-Driven-Development]]. The custom finalize extension writes feature summaries into `docs/projects/<Project>/`.
- Local demo PostgreSQL in `docker/` (git-ignored, so local only) with an `ai_readonly` user — see [[Demo-Database]] and [[DB-Query-Protocol]]. Credentials stay in `.claude/settings.local.json`, never in notes.

## Standing Principles

- **Knowledge lookup order:** this vault first, then the project's source code, then the project's internal docs.
- Integration tests use Testcontainers with real infrastructure — never mock the database ([[Testcontainers]]).
- Modular monolith rules (separate schemas, cross-module references only to `<Module>.Public.Client` (sync) and `<Module>.IntegrationEvents` (async contracts), events via outbox) — see [[Modular-Monolith]].
- Git: never add `Co-Authored-By: Claude` trailers; update the touched sections' `log.md` before committing.
- Outward actions (push, PRs, issues) need explicit approval each time.
