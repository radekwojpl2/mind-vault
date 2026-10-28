---
type: Index
title: Mind Vault
description: "Root entry point — start here to find any note in the vault"
tags: [index, root]
---

# Mind Vault

Personal engineering knowledge base: reusable patterns, per-project documentation, and the tooling around them. Built and maintained mostly by agents; Obsidian is the reader.

## Start Here

1. [[Global]] — who owns this vault, the machine, repos, tools and standing principles. Read this first.
2. Pick the section below that matches the question, open its index, follow `[[links]]`.
3. For a project question, read the project index **and** its big-picture notes before diving into modules.

## Sections

| Section | Index | Holds | Look here when… |
|---|---|---|---|
| Context | [[Context.index]] | Global context: owner, environment, repos, principles | you need to know *where* something lives or *how* things are done here |
| Patterns | [[Patterns.index]] | Project-agnostic, copy-paste-ready engineering patterns | you need the generic version of a pattern |
| Projects | see below | Per-project architecture, modules, project-specific pattern use, specs | the question names a project |
| Testing | [[Testing.index]] | Test strategy and test-type guides | writing or reviewing tests |
| Documentation | [[Documentation.index]] | Docs standards: ADRs, arc42, coding guidelines, investigations | writing docs or decisions |
| DB | [[DB.index]] | PostgreSQL tooling, AI read-only user, query protocol | querying or tuning a database |
| OKF | [[OKF.index]] | Open Knowledge Format spec — the format every note follows | creating or validating notes |
| SpecKit | [[speckit.index]] | Spec-driven development workflow and extensions | running `/speckit-*` commands |
| Writing | [[Writing.index]] | Drafts and ideas for posts | blog / article work |

## Projects

- [[LinkStack.index]] — .NET 8 modular monolith for personal and team link collections (primary project)
- [[Blue-Green-Deployment.index]] — zero-downtime deployments on Azure Container Apps with AI migration review
- [[Sentry-POC.index]] — full-stack Sentry observability across .NET 8 and Next.js

## Conventions

- Every note has YAML frontmatter with a non-empty `type` — see [[Spec]].
- Note names are unique across the vault, so `[[Name]]` always resolves without a path.
- Each section has a `<Section>.index.md` (listing) and a `log.md` (history, newest first).
