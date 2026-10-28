---
type: Log
tags: [log, db]
---

# DB — Change Log

## 2026-10-28
> Vault refactor, issue #1 Phase 4 (fixes from vault test run 1)

- Modified: [[AI-Readonly-User]] — removed the dead `.sql` path, made the script link live, pointed to `docker/init/09_readonly_user.sql`

## 2026-10-28
> Vault refactor, issue #1 Phase 3 (metadata backfill)

- Modified: all concept notes — added `status`, `confidence`, `source`, `updated` per [[Vault-Profile]]; `updated` taken from the last content commit (frontmatter-only and link-fix commits ignored)

## 2026-06-25
> Fix OKF conformance: add missing `type: Guide` frontmatter field

Modified: [[AI-Readonly-User]]

## 2026-06-21
> Add revocation instructions to AI readonly user note

Modified: [[AI-Readonly-User]]

> Add pg_stat_statements setup playbook

Added: [[pg-stat-statements]]


> Make DB query protocol tool-agnostic; simplify connection config

Modified: [[DB-Query-Protocol]]

> Add DB section with AI readonly user setup

Added: [[DB.index]], [[AI-Readonly-User]], [[create_readonly_user]], [[DB-Query-Protocol]]
