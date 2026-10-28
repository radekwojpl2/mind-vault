---
type: Capture
tags: [inbox, patterns, migrations, expand-contract]
status: draft
confidence: low
source: [conversation]
updated: 2026-10-28
---

Gap found by the first `patterns` skill test (2026-10-28): [[Expand-Contract]] has no **catch-up backfill**.

In a blue-green deploy, migrations run before the new slot exists. The old slot keeps writing until cutover, so rows written between the backfill and cutover miss the new column. The fix is to re-run the idempotent backfill (`... WHERE new IS NULL`) in the next deploy, before the contract step.

Triage: add this as a rule in [[Expand-Contract]] (and its blue-green application) once confirmed against a real case.
