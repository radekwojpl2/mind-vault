---
type: Capture
tags: [inbox, db, docker, postgresql]
status: draft
confidence: low
source: [https://github.com/radekwojpl2/mind-vault/tree/main/docker]
updated: 2026-10-28
---

Gap found by vault test run 1 (Q7). Nothing in the vault explains how to start the local demo database or what it contains.

Raw facts from `docker/`:
- `docker-compose.yml`: image `postgres:16-alpine`, container `pg_multitenant_demo`
- `init/01`–`09`: schemas (`01_schemas.sql`), tables in `public`, `tenants`, `reporting`, `config`, seeds for `public` and tenants alpha and beta, and `09_readonly_user.sql`
- `09_readonly_user.sql` says it grants read-only "across all schemas". [[AI-Readonly-User]] and [[create_readonly_user]] describe grants on `public` only. Check which is true.

Triage: add a `Demo-Database` guide to `db/` (start or stop, schemas, sample tables, how [[DB-Query-Protocol]] connects). Fix the grant scope in [[AI-Readonly-User]].
