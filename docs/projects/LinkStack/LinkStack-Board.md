---
type: Board
title: LinkStack — Board
description: "Implemented, active, planned and archived LinkStack work, with links to specs, PRs and issues"
tags: [linkstack, board, kanban, roadmap, status]
---

# LinkStack — Board

Where LinkStack work stands. Items link to the vault note, spec, PR or issue that holds the detail. PR and issue numbers refer to `radekwojpl2/LinkStack`. Snapshot from 2026-10-28; release history is in the repo's `CHANGELOG.md`.

## Active

- [ ] **Bookmarks import/export, Aspire, Dapper read side, Azure deploy.** Stacked PRs #34 → #41, open since 2026-09-29; #33 combines all of them.
	- #34 Netscape bookmark format reader/writer · #35 export groups/links as a Chrome bookmark file · #36 import Chrome bookmarks into groups and links
	- #37 .NET Aspire AppHost and service defaults · #41 AppHost cleanup (per-resource extensions, drop Uptime Kuma)
	- #38 replace Table Modules and Specifications with a Dapper read side → will outdate [[CQRS]] and the read side of [[Links]]
	- #39 Structurizr workspaces and user-settings spec update
	- #40 deploy to Azure Container Apps (reference: [[Blue-Green-Deployment-Context]])
- [ ] **Move endpoint mapping into Web projects.** SpecKit tasks #11–#21: create `<Module>WebExtensions` in Links, Users and Analytics Web, then drop the Web references from Infrastructure. Will change [[LinkStack-Architecture]].

## Planned

- [ ] **007 URL shortener with custom domains.** Spec drafted and clarified; next step is `/speckit-plan`. See [[url-shortener-custom-domains]].
- [ ] **Document the Imports module** (MassTransit saga). Missing from the vault.
- [ ] **Document LinkStackPortal** (frontend). Missing from the vault.

## Implemented

- **v1.7.0 (2026-05-17)**: clearer error for get-link-by-id (spec `003-fix-link-error-msg`); SpecKit finalize skill with a BDD coverage check
- **v1.6.0 (2026-05-09)**: persisted user settings (jsonb) with SpecFlow tests; Links module refactored to value objects (spec `001-refactor-links`, see [[LinkStack-Value-Objects]])
- **v1.5.0 (2026-05-06)**: group colour and icon; event details per link and group; new analytics endpoint; "friends since" on org members
- **v1.1.0–v1.3.0 (2026-04-19/20)**: CI/CD with semantic-release, Docker registry, code analysis, guidelines review workflow
- **v1.0.0 and earlier**: modules [[Users]], [[Links]], [[Analytics]]; Auth0 webhook provisioning ([[Authentication]]); tenant support ([[Tenant-Isolation]]); AI tag suggestions; read/write split with Specification pattern ([[CQRS]]); exception middleware ([[Error-Handling]]); Chrome extension with two-way sync; health checks

## Archived

- **Sentry in LinkStack.** Added and then removed in v1.4.0 (2026-04-22). The working setup lives in [[Sentry-POC.index]].
