---
type: Playbook
title: pg_stat_statements — Query Statistics Extension
description: How to enable and query pg_stat_statements to see what queries each user has run.
tags: [db, postgresql, observability, audit, performance]
---

# pg_stat_statements

A built-in PostgreSQL extension that tracks aggregated execution statistics for every query pattern. Useful for answering "what queries did this user run?" and "which queries are slowest?"

## What It Gives You

- Query text (literals normalized to `$1`, `$2`, …)
- Call count, total/mean execution time, rows returned
- Grouped per user (`userid`) and per database (`dbid`)

**Does not give you:** timestamps, per-execution history, or actual parameter values.

## Enabling

Two steps are required — the extension install and the preload setting — both need a superuser.

**1. Set `shared_preload_libraries` and restart**

```sql
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
```

Then restart PostgreSQL (or the container):

```bash
docker restart <container_name>
```

**2. Create the extension**

```sql
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
```

Verify it's active:

```sql
SHOW shared_preload_libraries;
SELECT name, installed_version FROM pg_available_extensions WHERE name = 'pg_stat_statements';
```

`installed_version` should be non-empty (e.g. `1.10`).

## Querying

**Queries for a specific user:**

```sql
SELECT query, calls, total_exec_time::numeric(10,2) AS total_ms, mean_exec_time::numeric(10,2) AS mean_ms, rows
FROM pg_stat_statements
WHERE userid = (SELECT oid FROM pg_roles WHERE rolname = 'ai_readonly')
ORDER BY calls DESC;
```

**All users at once:**

```sql
SELECT rolname, query, calls
FROM pg_stat_statements
JOIN pg_roles ON pg_roles.oid = pg_stat_statements.userid
ORDER BY rolname, calls DESC;
```

## Limitations

- **No timestamps** — you cannot tell when a query ran, only how many times
- **Aggregated** — 100 executions of the same query pattern appear as one row with `calls = 100`
- **Resets on restart** — stats are lost when PostgreSQL restarts (or when `pg_stat_statements_reset()` is called)
- **Read by superuser** — `ai_readonly` cannot query `pg_stat_statements`; use a superuser to inspect it

## See Also

- [[AI-Readonly-User]] — the read-only role this extension is used to audit
