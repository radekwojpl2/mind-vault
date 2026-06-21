---
type: Script
tags: [db, postgresql, sql, ai-tooling]
---

# create_readonly_user.sql

Creates a read-only PostgreSQL user for the SQL AI agent. Run as a superuser against your target database:

```bash
psql -U postgres -d YOUR_DATABASE -f create_readonly_user.sql
```

Edit the three variables at the top before running.

```sql
\set readonly_user     'ai_readonly'
\set readonly_password 'CHANGE_ME_strong_password_here'
\set target_schema     'public'

-- ── 1. Create role ────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = :'readonly_user') THEN
    EXECUTE format(
      'CREATE USER %I WITH PASSWORD %L CONNECTION LIMIT 5 NOSUPERUSER NOCREATEDB NOCREATEROLE',
      :'readonly_user', :'readonly_password'
    );
    RAISE NOTICE 'User % created.', :'readonly_user';
  ELSE
    RAISE NOTICE 'User % already exists, skipping CREATE.', :'readonly_user';
  END IF;
END
$$;

-- ── 2. Database-level access ──────────────────────────────────────────────────
GRANT CONNECT ON DATABASE CURRENT_CATALOG TO ai_readonly;

-- ── 3. Schema usage ───────────────────────────────────────────────────────────
-- Add more GRANT USAGE lines if you have additional schemas.
GRANT USAGE ON SCHEMA public TO ai_readonly;

-- ── 4. Existing objects ───────────────────────────────────────────────────────
GRANT SELECT ON ALL TABLES    IN SCHEMA public TO ai_readonly;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO ai_readonly;

-- ── 5. Future objects (created after this script runs) ────────────────────────
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES    TO ai_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON SEQUENCES TO ai_readonly;

-- ── 6. Belt-and-suspenders: revoke any write capability ──────────────────────
REVOKE CREATE ON SCHEMA public FROM ai_readonly;

-- ── Verify ────────────────────────────────────────────────────────────────────
SELECT
  grantee,
  table_schema,
  table_name,
  privilege_type
FROM information_schema.role_table_grants
WHERE grantee = 'ai_readonly'
ORDER BY table_schema, table_name;
```
