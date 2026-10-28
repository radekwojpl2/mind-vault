---
type: Context
title: Vault Purpose
description: "What this vault is for, who reads it, what it holds, and the bar it must meet"
tags: [context, purpose, knowledge-management, requirements]
status: stable
confidence: high
source: [author]
updated: 2026-10-28
---

# Vault Purpose

These are the requirements the vault's structure, templates and skill are designed against. The owner set them on 2026-10-28 (issue #1, Phase 4, "Define purpose").

## Purpose

1. **Work reference for agents.** Patterns, project context, architecture and decisions that an agent reads *before* working in one of the owner's repos.
2. **Learning record.** Distilled notes from courses (MEGA.dev and others), research and experiments, linked to the patterns they relate to.

## Readers

| Reader | Where | Implication |
|---|---|---|
| Claude Code in the owner's repos | Local, `D:\git\mind-vault` | Entry points and unique note names so grep and `[[links]]` work |
| The owner | Obsidian | Notes stay readable Markdown; wiki-links render as a graph |
| Cloud / scheduled agents | GitHub `radekwojpl2/mind-vault` | The GitHub copy must be self-contained: no facts that exist only on the local machine without being recorded in [[Global]] |

## Content

| Kind | Home |
|---|---|
| Engineering patterns | `patterns/`, `testing/`, `documentation/`, `db/` |
| Project docs (context, architecture, modules, specs, boards) | `projects/<Project>/` |
| Course and learning notes | `learning/<Course>/`, `learning/research/` |
| Raw captures: links, bookmarks, read-later, PoC findings | `inbox/`. An agent triages them into the vault |
| Writing drafts | `writing/` |

## Rules

- **English everywhere**, so grep and search behave predictably.
- **Agents change the vault only through PRs.** Never push to `main`. The owner merges. This applies to triage and scheduled maintenance too.
- Every note follows [[Vault-Profile]] (`status`, `confidence`, `source`, `updated`).

## Good-Enough Bar

A subagent that is given **only the vault** answers the test questions below. The vault passes when **at least 9 of 10** answers are correct, each cites the notes it used, and none contains hallucinated facts.

### Test questions

1. How do I add a new module to LinkStack, and which project references is it allowed to have?
2. How does a link-created event get from Links to Analytics, and what guarantees it's delivered?
3. How is tenant data isolated in LinkStack, and how does an admin query get around that isolation?
4. In the blue-green POC, how does traffic cut over, and how do DB migrations stay safe while both slots run?
5. What does the AI migration gate block, and where in CI does it run?
6. Which tests should I write for a new LinkStack command handler, and may I mock the database?
7. How do I query the local demo database as an agent, and what am I allowed to run?
8. Where does the URL shortener feature stand, and what's the next step?
9. What should an error response from a LinkStack endpoint look like?
10. What did MEGA S01E03 say about grep versus semantic search, and which one does this vault use? *(This checks the learning zone, answered from [[MEGA-S01E03-Building-Knowledge-Systems]].)*

## Test Runs

### Run 1: 2026-10-28, PASS (10/10)

A fresh general-purpose subagent was given only `docs/` and the skill's retrieval protocol, with no web, other repos or prior context. It answered all 10 questions with a citation for every claim. Spot-checks against the notes found no hallucinated facts.

| Q | Result | Note |
|---|---|---|
| 1 | Correct, but assembled from 6 notes | No "add a module" guide existed → added [[LinkStack-Adding-A-Module]] |
| 2–9 | Correct | Q8 was answered straight from Context → Board; Q7 from the DB index |
| 10 | Correct | Answered from [[MEGA-S01E03-Building-Knowledge-Systems]] |

The friction it reported led to these fixes:
- Contradiction on cross-module references → [[LinkStack-Architecture]] and [[Global]] now allow `IntegrationEvents` (verified on `master`).
- Stale details found while checking `master`: Analytics now has an Application project, Imports is designed but not built, and Sentry is still wired in (off) rather than removed. The Sentry and Imports errors were in the boards and context notes written in this refactor.
- [[Blue-Green-Deployment-Architecture]] contradicted [[Pipelines]] → fixed to match `deploy.yml`.
- Outbox deduplication vs idempotency → clarified in [[Outbox]].
- No path from LinkStack to Testing, and generic vs project pattern pairs → Guides section and generic-pattern links added in [[LinkStack.index]].
- A dead `.sql` path and a code-span link in [[AI-Readonly-User]] → fixed.
- Missing constitution and demo DB docs → captured in the inbox ([[Inbox.index]]).
- Known artefact, not fixed: grepping a test question matches this note first. Keep that in mind when reading future runs.
