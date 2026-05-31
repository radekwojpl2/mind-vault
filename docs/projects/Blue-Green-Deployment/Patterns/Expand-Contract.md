---
tags: [blue-green-deployment, pattern, migrations, postgresql, expand-contract]
---

# Expand/Contract — EF Core Implementation

See [[patterns/Expand-Contract]] for the generic pattern.

## Implementation in This POC

A column rename (`Notes` → `Description`) on the `DeploymentLogs` table, spread across three EF Core migrations across three deploys.

**Migration 1 — Expand:** add nullable `Notes` column

```csharp
migrationBuilder.AddColumn<string>(
    name: "Notes",
    table: "DeploymentLogs",
    nullable: true);
```

**Migration 2 — Expand + Backfill:** add `Description`, copy data from `Notes`

```csharp
migrationBuilder.AddColumn<string>(
    name: "Description",
    table: "DeploymentLogs",
    nullable: true);

migrationBuilder.Sql(
    "UPDATE \"DeploymentLogs\" SET \"Description\" = \"Notes\"");
```

Both columns exist simultaneously. Old slot writes `Notes`, new slot writes `Description`. Backfill covers rows written before the new slot deployed.

**Migration 3 — Contract:** drop `Notes` after old slot retired

```csharp
migrationBuilder.DropColumn(
    name: "Notes",
    table: "DeploymentLogs");
```

## Enforcement

[[Blue-Green-Deployment/Patterns/AI-Migration-Review]] blocks unsafe single-step operations (like a bare `RenameColumn`) in CI before they can reach the deploy pipeline.

## Related

- [[Blue-Green-Deployment/Architecture]]
- [[Blue-Green-Deployment/Pipelines]]
