---
type: Log
tags: [log, linkstack]
---

# LinkStack — Change Log

## 2026-10-28
> Vault refactor, issue #1 Phase 4 (fixes from vault test run 1, checked against LinkStack `master`)

- Modified: [[LinkStack-Architecture]] — cross-module references: `Public.Client` (sync) **and** `IntegrationEvents` (async); Imports marked as designed-only
- Modified: [[Analytics]] — `Analytics.Application` project exists; Infrastructure references `Links.IntegrationEvents`
- Modified: [[LinkStack-Context]], [[LinkStack-Board]] — corrected Sentry (still wired via `Sentry.AspNetCore`, off by default) and Imports (designed, not built)

## 2026-10-28
> Vault refactor, issue #1 Phase 3 (metadata backfill)

- Modified: all concept notes — added `status`, `confidence`, `source`, `updated` per [[Vault-Profile]]; `updated` taken from the last content commit (frontmatter-only and link-fix commits ignored)

## 2026-10-28
> Vault refactor, issue #1 Phase 2 (boards)

- Added: [[LinkStack-Board]] — active PRs #34–#41 and tasks #11–#21, planned spec 007, releases v1.0–v1.7, archived Sentry
- Modified: [[LinkStack.index]] — board link

## 2026-10-28
> Vault refactor, issue #1 Phase 2 (project context)

- Added: [[LinkStack-Context]] — purpose, feature map, code location, glossary, known drift (open PRs #34–#41, tasks #11–#21)
- Modified: [[LinkStack.index]] — Start Here section

## 2026-10-28
> Vault refactor, issue #1 Phase 1

- Renamed: `Architecture` → [[LinkStack-Architecture]], `Patterns/Value-Objects` → [[LinkStack-Value-Objects]] (unique names; all links updated)
- Modified: [[url-shortener-custom-domains]] — merged the duplicate root `projects/` summary (302 redirects, test sources, ops prerequisite); listed under Specs in [[LinkStack.index]]

## 2026-06-30
- Added: [[url-shortener-custom-domains]] — short URLs with vanity aliases and premium custom domains (302 redirects, CNAME verification, auto-TLS) for the Links module

## 2026-06-19 · `8ac317f`
> Add OKF type field to all note frontmatter

- Modified: [[LinkStack-Architecture]], [[Authentication]], [[Dev-Setup]], [[LinkStack.index]]
- Modules — Modified: [[Analytics]], [[Links]], [[Users]]
- Patterns — Modified: [[Business-Rules]], [[CQRS]], [[Error-Handling]], [[Outbox]], [[Tenant-Isolation]], [[LinkStack-Value-Objects]]

## 2026-05-31 · `cff31d8`
> Initial commit: Obsidian knowledge vault with engineering patterns and project docs

- Added: [[LinkStack-Architecture]], [[Authentication]], [[Dev-Setup]], [[LinkStack.index]]
- Modules — Added: [[Analytics]], [[Links]], [[Users]]
- Patterns — Added: [[Business-Rules]], [[CQRS]], [[Error-Handling]], [[Outbox]], [[Tenant-Isolation]], [[LinkStack-Value-Objects]]
