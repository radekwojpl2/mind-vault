---
type: Index
title: Mind Vault
description: "Root entry point — start here to find any note in the vault"
tags: [index, root]
---

# Mind Vault

Personal engineering knowledge base with two zones: a **work reference** that agents read before coding in the owner's repos, and a **learning** record. Built and maintained mostly by agents; Obsidian is the reader. See [[Vault-Purpose]].

## Start Here

1. [[Global]] — who owns this vault, the machine, repos, tools and standing principles. Read this first.
2. Pick the section below that matches the question, open its index, follow `[[links]]`.
3. For a project question, read the project index, then its `<Project>-Context` (big picture) and `<Project>-Board` (what's done, in progress, planned) before diving into modules.
4. Check each note's `status`, `confidence` and `updated` ([[Vault-Profile]]) before relying on it.

## Work Reference

| Section | Index | Holds | Look here when… |
|---|---|---|---|
| Projects | see below | Per-project context, board, architecture, modules, project-specific patterns, specs | the question names a project |
| Patterns | [[Patterns.index]] | Project-agnostic, copy-paste-ready engineering patterns | you need the generic version of a pattern |
| Testing | [[Testing.index]] | Test strategy and test-type guides | writing or reviewing tests |
| Documentation | [[Documentation.index]] | Docs standards: ADRs, arc42, coding guidelines, investigations | writing docs or decisions |
| DB | [[DB.index]] | PostgreSQL tooling, AI read-only user, query protocol | querying or tuning a database |

## Learning

| Section | Index | Holds | Look here when… |
|---|---|---|---|
| Learning | [[Learning.index]] | Course lesson notes (MEGA.dev, …) and research / PoC findings | the question is about something learned, a course, or an experiment |
| Writing | [[Writing.index]] | Drafts and ideas for posts | blog / article work |

## System

| Section | Index | Holds | Look here when… |
|---|---|---|---|
| Inbox | [[Inbox.index]] | Raw captures waiting to be triaged — the single entry point for new knowledge | adding anything new to the vault |
| Context | [[Context.index]] | Owner, environment, repos, principles, vault purpose and structure | you need to know *where* something lives or *how* things are done here |
| OKF | [[OKF.index]] | Open Knowledge Format spec and this vault's profile | creating or validating notes |
| SpecKit | [[speckit.index]] | Spec-driven development workflow and extensions | running `/speckit-*` commands |

## Projects

- [[LinkStack.index]] — .NET 8 modular monolith for personal and team link collections (primary project)
- [[Blue-Green-Deployment.index]] — zero-downtime deployments on Azure Container Apps with AI migration review
- [[Sentry-POC.index]] — full-stack Sentry observability across .NET 8 and Next.js

## Conventions

- Every note has YAML frontmatter with a non-empty `type` — see [[Spec]].
- Note names are unique across the vault, so `[[Name]]` always resolves without a path.
- Each section has a `<Section>.index.md` (listing) and a `log.md` (history, newest first).
