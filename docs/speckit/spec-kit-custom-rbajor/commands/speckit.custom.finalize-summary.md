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

6. **Branch the vault.** In `D:\git\mind-vault`, start from an up-to-date `main` and
   create `speckit/<feature-name>`. Vault changes only reach `main` through a PR
   (see the vault's `CLAUDE.md`). Never commit to `main` directly.

7. **Save the summary** to
   `D:\git\mind-vault\docs\projects\<Project>\Spec-Kit\<feature-name>.md`, overwriting
   an existing summary for the same feature (it is the latest authoritative snapshot).
   Frontmatter must follow the vault profile (`docs/okf/Vault-Profile.md`): `type:
   Spec-Summary`, `tags`, `feature`, `status` (`draft` until the feature is implemented,
   then `stable`), `confidence: high` (you just read the spec and code), `source` (the
   project repo URL) and `updated` (today). Note names must be unique across the vault,
   so don't add a `-summary` suffix, and check that no other note has the same name.

8. **Link it.** Under `## Specs` in `docs\projects\<Project>\<Project>.index.md`, add or
   update `- [[<feature-name>]] — <###>: <one-line goal> (<status>)`. Move or add the
   feature on `docs\projects\<Project>\<Project>-Board.md` (Planned → Active →
   Implemented).

9. **Append a log entry** to the project's `docs\projects\<Project>\log.md`, newest
   first, using the vault's heading format:

   ```text
   ## <YYYY-MM-DD>
   - Added: [[<feature-name>]] — <one-line goal>        (or "Modified:" when updating)
   ```

   Create `log.md` (OKF `type: Log`) if it does not exist.

10. **Validate, commit and open a PR.** Run `node scripts/validate-vault.js` in the
    vault (it must print `OK`), commit with no `Co-Authored-By` trailer, then ask the
    user before pushing and opening a PR titled `SpecKit: <feature-name> summary`.

11. **Confirm what was saved and where.** Report the summary path, the index, board and
    log changes, and the PR link (or that it's waiting for the user to approve the push).

## Summary Template

```markdown
---
type: Spec-Summary
tags: [<project>, spec-kit, <module>, feature]
feature: <###-feature-name>
status: <draft | stable>
confidence: high
source: [<project repo URL>]
updated: <YYYY-MM-DD>
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
