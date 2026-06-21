---
type: Reference
tags: [db, postgresql, ai-tooling, workflow]
---

# DB Query Protocol

A shorthand for running natural-language database queries through Claude Code against the configured PostgreSQL connection.

## Usage

Prefix any message with `DB:` followed by your question in plain English:

```
DB: How many orders does Alpha Electronics have per status?
DB: Which products have never been ordered?
DB: Show me the top 5 customers by lifetime value in tenant_alpha
DB: What is the total revenue per tenant this month?
```

## What Claude Does

1. Reads the active connection from `.claude/settings.local.json` → `db.connections[db.default]`
2. Announces the target database and environment — e.g. **`demo`** on **`local`**
3. Waits for your explicit approval before touching the database
4. Translates the question into SQL, inspects the schema if needed, and runs the query using whatever tool is available (MCP, docker exec, psql, etc.)
5. Returns results and a plain-English summary

## Connection Config

Connections are stored in `.claude/settings.local.json` (gitignored — local only):

```json
{
  "db": {
    "default": "local",
    "connections": {
      "local": {
        "environment": "local",
        "host": "localhost:5432",
        "database": "demo",
        "user": "ai_readonly",
        "password": "..."
      }
    }
  }
}
```

To add another environment (e.g. staging), add a new key under `connections` and change `default`.

## Safety

The database user is `ai_readonly` — `SELECT` only. `UPDATE`, `INSERT`, and `DELETE` are denied at the PostgreSQL level regardless of what query is generated. See [[AI-Readonly-User]] for the user setup.
