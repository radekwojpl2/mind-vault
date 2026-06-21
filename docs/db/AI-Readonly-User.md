---
tags: [db, postgresql, mcp, ai-tooling, setup]
---

# AI Readonly PostgreSQL User

A read-only PostgreSQL role for giving AI agents (Claude Code MCP, scripts) safe SQL access — `SELECT` only, no writes, no schema changes.

## What It Creates

- User `ai_readonly` with `CONNECTION LIMIT 5`, no superuser/createdb/createrole
- `CONNECT` on the target database
- `USAGE` on `public` schema
- `SELECT` on all existing and future tables and sequences in `public`
- `CREATE` on `public` schema explicitly revoked

## Setup

Edit the three variables at the top of the script, then run as a superuser:

```bash
psql -U postgres -d YOUR_DATABASE -f docs/db/create_readonly_user.sql
```

The script is idempotent — re-running it skips user creation if the role already exists.

## Script

`[[create_readonly_user]]`

## Revoking Access

**Temporary — block login without dropping the role:**

```sql
ALTER USER ai_readonly WITH NOLOGIN;
-- restore with:
ALTER USER ai_readonly WITH LOGIN;
```

**Permanent — remove the role entirely:**

```sql
-- 1. Revoke all privileges
REVOKE ALL ON ALL TABLES    IN SCHEMA public FROM ai_readonly;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM ai_readonly;
REVOKE USAGE ON SCHEMA public FROM ai_readonly;
REVOKE CONNECT ON DATABASE demo FROM ai_readonly;

-- 2. Remove default privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE SELECT ON TABLES    FROM ai_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE SELECT ON SEQUENCES FROM ai_readonly;

-- 3. Drop the role
DROP USER ai_readonly;
```

PostgreSQL will refuse `DROP USER` if any grants remain — revoke everything first.

Verify no grants are left before dropping:

```sql
SELECT grantee, table_schema, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE grantee = 'ai_readonly';
```

## Notes

- Default privileges (`ALTER DEFAULT PRIVILEGES`) cover tables created *after* the script runs — no need to re-run after migrations
- To add more schemas, add `GRANT USAGE ON SCHEMA <name> TO ai_readonly` and mirror the `SELECT` and default-privilege grants
- To verify grants: the script prints a `role_table_grants` summary at the end
