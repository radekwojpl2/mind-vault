---
type: Capture
tags: [inbox, blue-green-deployment, migrations, drift]
status: draft
confidence: low
source: [https://github.com/radekwojpl2/blue-green-deployment-poc]
updated: 2026-10-28
---

Drift found by the first `patterns` skill test (2026-10-28) and checked in the repo: [[Blue-Green-Deployment-Expand-Contract]] doesn't match the code.

- The note says the `Notes` → `Description` rename was "three migrations across three deploys" and labels `AddNotesColumn` as the expand step. In the code, `20260514114117_AddNotesColumn` was the original feature that created `Notes`. The rename was **2 migrations over 2 deploys**: `RenameNotesToDescription` then `DropNotesColumn`.
- The real backfill is `UPDATE "DeploymentLogs" SET "Description" = "Notes" WHERE "Description" IS NULL`. The note's SQL has no `WHERE`.
- The note says "Old slot writes Notes, new slot writes Description". `DeploymentEndpoints.cs` sets neither column, so there was no dual-write.

Triage: correct the note to match the migrations folder and the repo's `docs/migration-use-cases.md`.
