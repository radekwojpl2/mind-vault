---
tags: [pattern, migrations, database, expand-contract, zero-downtime, blue-green]
---

# Expand/Contract

## What It Is

A three-phase schema migration strategy for making breaking database changes without downtime when multiple application versions are live against the same database simultaneously — during a rolling deploy, a blue-green cutover, or a canary release.

The core constraint: every schema state must be readable and writable by both the old and new application version at the same time.

## When to Use

- Blue-green or canary deployments where old and new code share one database during the cutover window
- Rolling deploys across multiple instances where not all nodes update simultaneously
- Any schema change that would be a breaking change if applied in a single migration (rename, type change, NOT NULL addition, constraint addition)

## When NOT to Use

- Single-instance apps with a maintenance window — a direct migration is simpler
- Schema changes where both versions never run simultaneously (e.g., a new table with no old references)

## The Three Phases

Each phase ships as a separate deploy. The database always has a schema that both the retiring and incoming versions can work with.

| Phase | Operation | Old version | New version |
|---|---|---|---|
| **Expand** | Add new column/table (nullable) | Ignores new column | Reads and writes new column |
| **Migrate** | Backfill data; both columns live | Writes to old column | Writes to new column |
| **Contract** | Drop old column/table | (retired) | Writes to new column only |

The expand and migrate phases can sometimes be combined into one deploy if the backfill is safe to run inline.

## Safe vs Unsafe Operations

**Always safe in one step:**
- `AddColumn` with `nullable: true` — old version ignores it
- `AddTable` — old version never references it
- `DropColumn` / `DropTable` — only after old version is fully retired

**Require expand/contract (unsafe in one step):**
- `RenameColumn` — old version still references the old name
- `AddColumn NOT NULL` without a server default — old version can't insert
- `AlterColumn` to an incompatible type — type mismatch across versions
- `AddUniqueConstraint` on an existing column — existing rows may violate it
- `DropTable` while old version still queries it

**Conditional:**
- `CREATE INDEX` — safe, but without `CONCURRENTLY` it locks the table during migration

## Example: Renaming a Column

**Step 1 — Expand:** add the new column, nullable

```sql
ALTER TABLE orders ADD COLUMN customer_name VARCHAR;
```

New version writes to `customer_name`. Old version still writes to `client_name`.

**Step 2 — Backfill:** copy existing data, both columns live

```sql
UPDATE orders SET customer_name = client_name WHERE customer_name IS NULL;
```

Old version still writes to `client_name`. New version reads `customer_name` (backfilled for existing rows).

**Step 3 — Contract:** drop the old column after old version is retired

```sql
ALTER TABLE orders DROP COLUMN client_name;
```

## Trade-offs

| | |
|---|---|
| **Pro** | Zero downtime — no maintenance window needed |
| **Pro** | Rollback is safe at any phase — old code still works |
| **Con** | A single breaking change becomes 2-3 deploys |
| **Con** | Both columns exist simultaneously; application code must handle both during the migrate phase |
| **Con** | Data backfill on large tables can be slow; may need batching |

## Real-World Example

- [[projects/Blue-Green-Deployment/Patterns/Expand-Contract]] — EF Core implementation renaming `Notes` → `Description` across three migrations, with an AI CI gate enforcing the rules
