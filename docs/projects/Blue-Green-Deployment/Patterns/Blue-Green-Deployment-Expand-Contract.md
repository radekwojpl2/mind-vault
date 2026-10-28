---
type: Pattern
tags: [blue-green-deployment, pattern, migrations, postgresql, expand-contract]
status: stable
confidence: high
source: [https://github.com/radekwojpl2/blue-green-deployment-poc]
updated: 2026-10-28
---

# Expand/Contract — EF Core Implementation

See [[Expand-Contract]] for the generic pattern.

## Implementation in This POC

A column rename (`Notes` → `Description`) on the `DeploymentLogs` table, done as **two EF Core migrations across two deploys** (verified against the repo's `Migrations/` folder and git history, 2026-10-28).

**Starting point:** `20260514114117_AddNotesColumn` (commit `c2b6d51`) had added a nullable `Notes` column as an ordinary feature. It is not part of the rename.

**The unsafe attempt:** commit `b27a607` added a bare `RenameColumn` on purpose, to check that [[AI-Migration-Review]] blocks it. The next commit replaced it with the safe version below.

**Deploy 1: expand + backfill** (`20260514114244_RenameNotesToDescription`, commit `e861c89`)

```csharp
migrationBuilder.AddColumn<string>(
    name: "Description",
    table: "DeploymentLogs",
    type: "text",
    nullable: true);

migrationBuilder.Sql(
    "UPDATE \"DeploymentLogs\" SET \"Description\" = \"Notes\" WHERE \"Description\" IS NULL");
```

The `WHERE "Description" IS NULL` makes the backfill **idempotent**, so it can safely be run again.

**Deploy 2: contract** (`20260514115027_DropNotesColumn`, commit `aa4451d`)

```csharp
migrationBuilder.DropColumn(
    name: "Notes",
    table: "DeploymentLogs");
```

The reviewer rates this `DropColumn` safe because an earlier migration had already added the replacement.

### What the POC doesn't show

- **No dual-write.** The endpoints never set `Notes` or `Description`, so no slot actually wrote either column during the rename. A real feature would write both columns in deploy 1 and read `Description ?? Notes`.
- **No catch-up backfill.** Rows the old slot writes between the deploy-1 migration and the cutover miss the backfill. In a real system, re-run the idempotent backfill before the contract step ([[Expand-Contract]]).
- **No rollback window.** With only two deploys, rolling back after deploy 2 to code that reads `Notes` would break. A third, no-schema-change deploy keeps the rollback safe.

## Enforcement

[[AI-Migration-Review]] blocks unsafe single-step operations (like a bare `RenameColumn`) in CI before they can reach the deploy pipeline.

## Related

- [[Blue-Green-Deployment-Architecture]]
- [[Pipelines]]
