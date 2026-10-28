---
type: Log
tags: [log, context]
---

# Context — Change Log

## 2026-10-28
> Vault refactor, issue #1 Phase 5 (automation)

- Added: [[Vault-Automation]] — weekly maintenance and event-driven update workflows (inert until secrets are set), sender snippet for project repos, safety notes

## 2026-10-28
> Vault refactor, issue #1 Phase 5 (inbox triage)

- Modified: [[Global]] — the `docker/` demo DB is local only; links [[Demo-Database]]

## 2026-10-28
> Vault refactor, issue #1 Phase 5 (validation in CI)

- Added: `Validate vault` GitHub Action (PRs and pushes to `main`) and a `.githooks/pre-commit` hook, both running `scripts/validate-vault.js`

## 2026-10-28
> Vault refactor, issue #1 Phase 4 (test run 1)

- Modified: [[Vault-Purpose]] — recorded test run 1: PASS 10/10, friction and fixes

## 2026-10-28
> Vault refactor, issue #1 Phase 4 (fixes from vault test run 1, checked against LinkStack `master`)

- Modified: [[Global]] — modular-monolith principle now allows `IntegrationEvents` contracts alongside `Public.Client`

## 2026-10-28
> Vault refactor, issue #1 Phase 4 (knowledge skill)

- Added: `knowledge` skill (`.claude/skills/knowledge/SKILL.md`) — answer, capture, triage, add/update, maintenance; replaces `/new-pattern`
- Added: `scripts/validate-vault.js` — frontmatter, profile fields, unique names, links, orphans, log order

## 2026-10-28
> Vault refactor, issue #1 Phase 4 (structure decided)

- Modified: [[Vault-Structure]] — option A chosen by the owner; status stable
- Modified: [[Vault-Purpose]] — content homes filled in (inbox, learning)
- Modified: [[index]] — split into Work reference / Learning / System zones; links Inbox and Learning

## 2026-10-28
> Vault refactor, issue #1 Phase 4 (purpose and structure)

- Added: [[Vault-Purpose]] — requirements from the owner (work reference + learning, readers, content, English-only, PR-only agents, 9/10 test bar and questions)
- Added: [[Vault-Structure]] — options A/B/C compared; recommendation A, decision pending

## 2026-10-28
> Vault refactor, issue #1 Phase 3 (metadata backfill)

- Modified: all concept notes — added `status`, `confidence`, `source`, `updated` per [[Vault-Profile]]; `updated` taken from the last content commit (frontmatter-only and link-fix commits ignored)

## 2026-10-28
* **Modified**: [[index]] — Start Here now points to each project's Context and Board notes.

## 2026-10-28
* **Creation**: Added [[Global]] and [[Context.index]]; created the root [[index]] that links every section (issue #1, Phase 2).
