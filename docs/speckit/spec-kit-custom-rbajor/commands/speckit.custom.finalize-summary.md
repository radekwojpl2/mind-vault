---
description: "Summarize the current feature and save it to the mind-vault knowledge base"
---

# Finalize: Summarize Work to the Knowledge Base

Summarize the current feature's work and persist it to the second brain at
`D:\git\mind-vault` so the vault stays the authoritative record of decisions
(see Constitution Principle I: Vault-Sourced Knowledge).

## Inputs

- The current feature directory under `specs/<###-feature-name>/` (resolve from the
  active feature branch, or the most recently modified `specs/*` directory).
- The project constitution at `.specify/memory/constitution.md`.

## Execution

1. **Locate the current feature.** Determine `<feature-name>` from the active feature
   branch (e.g. `001-foo` → `foo`) or, if unavailable, the most recently modified
   directory under `specs/`. Read its `spec.md`, `plan.md`, and `tasks.md` if present.

2. **Gather the work performed.** Inspect what changed for this feature: completed
   tasks in `tasks.md`, the plan's Technical Context and Structure Decision, and the
   relevant code/test changes (use `git diff` / `git log` for the feature branch when
   Git is available).

3. **Read the constitution / project principles.** Load
   `.specify/memory/constitution.md` and note any principles relevant to the work so
   compliance and deviations can be reported in the summary.

4. **Produce a structured summary** containing:
   - **Feature name and goal**
   - **Key decisions made and why**
   - **Architecture patterns used** (modules, layers, interfaces)
   - **Integration test coverage added**
   - **Deviations from the constitution and the reason**
   - **Open questions or follow-up tasks**

5. **Resolve the target project.** Map the feature to the project it belongs to
   under `D:\git\mind-vault\docs\projects\<Project>\` (e.g. `LinkStack`,
   `Blue-Green-Deployment`, `Sentry-POC`). Match against the existing project
   folders; if none matches, ask the user which project this feature belongs to
   rather than guessing. Do not create a new top-level `projects` directory at the
   vault root — summaries live under `docs\projects\`.

6. **Save the summary** to
   `D:\git\mind-vault\docs\projects\<Project>\<feature-name>-summary.md`.
   The summary must conform to OKF: start with a `---` frontmatter block carrying a
   non-empty `type` (e.g. `type: Summary`) and `tags`. Overwrite an existing summary
   for the same feature (it is the latest authoritative snapshot).

7. **Append a log entry.** Add a one-line entry, newest first, to the project's
   `D:\git\mind-vault\docs\projects\<Project>\log.md` with today's date and the
   feature name, e.g.:

   ```text
   - 2026-06-29 — <feature-name>: <one-line goal>
   ```

   Create `log.md` (OKF `type: Log`) if it does not exist.

8. **Confirm what was saved and where.** Report the absolute path of the summary
   file written and the log line appended.

## Summary Template

```markdown
---
type: Summary
tags: [summary, <project>, <feature-name>]
---

# <feature-name> — Summary

**Date**: <YYYY-MM-DD>
**Feature**: <###-feature-name>

## Goal
<what this feature set out to achieve>

## Key Decisions
- <decision> — <why>

## Architecture Patterns
- Modules: <...>
- Layers: <...>
- Interfaces: <...>

## Integration Test Coverage
- <ModuleName.IntegrationTests project / scenarios added>

## Constitution Deviations
- <deviation> — <reason>  (or "None")

## Open Questions / Follow-ups
- <item>
```

## Graceful Degradation

- If the mind-vault path `D:\git\mind-vault` does not exist, warn the user and stop
  rather than writing the summary elsewhere — the vault is the single source of truth.
- If no feature directory can be resolved, ask the user which feature to summarize.
- If the feature cannot be matched to an existing project under `docs\projects\`,
  ask the user which project it belongs to rather than guessing.
- If Git is unavailable, build the summary from the spec/plan/tasks documents alone.
