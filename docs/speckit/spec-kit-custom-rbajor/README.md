 # Finalize & Knowledge Capture Extension

Summarize completed Spec Kit work and persist it to the **mind-vault** second brain
at `D:\git\mind-vault`, keeping the vault the authoritative record of project
decisions (Constitution Principle I).

## Overview

This extension adds a single command that turns a finished feature into a durable
knowledge-base entry:

- Reads the current feature's `spec.md`, `plan.md`, and `tasks.md`
- Reads the project constitution to report compliance and deviations
- Writes a structured, OKF-conformant summary to
  `D:\git\mind-vault\docs\projects\<Project>\<feature-name>-summary.md`
- Appends a dated one-line entry to that project's
  `D:\git\mind-vault\docs\projects\<Project>\log.md`

## Commands

| Command | Description |
|---------|-------------|
| `speckit.custom.finalize-summary` | Summarize the current feature and save it to the mind-vault knowledge base |

> Invoked as a slash command with dots converted to hyphens:
> `/speckit-custom-finalize-summary`.

## Hooks

| Event | Command | Optional | Description |
|-------|---------|----------|-------------|
| `after_implement` | `speckit.custom.finalize-summary` | Yes | Capture a feature summary in the mind-vault after implementation |

## Summary Contents

Each summary captures:

- Feature name and goal
- Key decisions made and why
- Architecture patterns used (modules, layers, interfaces)
- Integration test coverage added
- Deviations from the constitution and the reason
- Open questions or follow-up tasks

## Configuration

Defaults are declared in `extension.yml`:

```yaml
config:
  defaults:
    vault_path: "D:\\git\\mind-vault"
    projects_subdir: "docs\\projects"
    log_file: "log.md"
```

## Installation

```bash
# Install during development from a local path
specify extension add --dev ./spec-kit-custom-rbajor

# Verify it is registered
specify extension list
```

## Graceful Degradation

- If `D:\git\mind-vault` does not exist, the command warns and stops rather than
  writing the summary elsewhere — the vault is the single source of truth.
- If no feature directory can be resolved, the command asks which feature to summarize.
- If Git is unavailable, the summary is built from the spec/plan/tasks documents alone.
