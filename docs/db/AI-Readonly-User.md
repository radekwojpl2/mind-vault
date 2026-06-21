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

## Notes

- Default privileges (`ALTER DEFAULT PRIVILEGES`) cover tables created *after* the script runs — no need to re-run after migrations
- To add more schemas, add `GRANT USAGE ON SCHEMA <name> TO ai_readonly` and mirror the `SELECT` and default-privilege grants
- To verify grants: the script prints a `role_table_grants` summary at the end
