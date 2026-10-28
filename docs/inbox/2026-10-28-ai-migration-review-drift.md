---
type: Capture
tags: [inbox, blue-green-deployment, ai, ci-cd, drift]
status: draft
confidence: low
source: [https://github.com/radekwojpl2/blue-green-deployment-poc/blob/main/scripts/check-migrations.sh]
updated: 2026-10-28
---

Drift found by the first `patterns` skill test (2026-10-28) and checked in `scripts/check-migrations.sh`: [[AI-Migration-Review]] doesn't match the script.

- Model: the note shows `claude-opus-4-5`; the script uses `claude-sonnet-4-6`.
- Output format: the note says `Issues:` / `Fixes:`; the script requires `ISSUES:` / `FIX:`.
- Missing from the note: on a push, the script diffs only against `HEAD~1` (line 24), so a multi-commit push skips migrations in the earlier commits. PRs diff against `origin/<base>`.
- Related: [[Pipelines]] describes the Test step as if tests run, but the repo has no test project, so `dotnet test` tests nothing.

Triage: fix [[AI-Migration-Review]] and [[Pipelines]]. Consider adding the `HEAD~1` gap as a rule in [[AI-CI-Gate]].
