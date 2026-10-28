---
name: patterns
description: Route design and implementation work to the owner's engineering patterns in the mind-vault knowledge base, then apply their rules. Use it before designing or changing code structure in a .NET / backend repo, e.g. when adding a module, endpoint, command or query handler, entity or value object, business rule, query filter, integration event or consumer, error handling, multi-tenancy, a database migration, a deployment step or a CI gate. Also use it when asked "which pattern…", "how should I structure…" or "follow our patterns".
---

# Patterns: Route Work to the Vault's Engineering Patterns

The owner's patterns live as notes in the **mind-vault** knowledge base, and those notes are the single source of truth. This skill holds no pattern content. It picks the right notes, reads them, and applies them.

- **Vault (local):** `D:\git\mind-vault\docs`
- **Vault (anywhere else, public):** `https://raw.githubusercontent.com/radekwojpl2/mind-vault/main/docs/<path>.md`, or clone `radekwojpl2/mind-vault`
- **Find a note by name:** note names are unique, so `Glob D:/git/mind-vault/docs/**/<Name>.md` returns exactly one file. Online, look the path up in `docs/patterns/Patterns.index.md` or the project's `*.index.md`.

## Procedure

### 1. Work out the project context

Check the current repo's `git remote get-url origin` or folder name:

| Repo | Project notes to read | Binding rules |
|---|---|---|
| `radekwojpl2/LinkStack` | `docs/projects/LinkStack/` | **`LinkStack-Constitution`** plus the repo's own `CLAUDE.md` |
| `radekwojpl2/blue-green-deployment-poc` | `docs/projects/Blue-Green-Deployment/` | the repo's `CLAUDE.md` if present |
| `radekwojpl2/dotnet-nextjs-sentry-poc` | `docs/projects/Sentry-POC/` | the repo's `CLAUDE.md` if present |
| anything else | generic patterns only | the repo's own conventions |

### 2. Route the task

Pick every row that matches the task. Read the **generic** note for the concept, then the **project** note, which overrides the generic one wherever they differ.

| Task | Generic pattern notes | LinkStack / project notes |
|---|---|---|
| Add or change a module, module boundaries, cross-module calls | `Modular-Monolith`, `Modular-Monolith-Building-Blocks`, `Module-Self-Registration` | `LinkStack-Architecture`, `LinkStack-Adding-A-Module` |
| Shared utility code across modules | `Local-Solution-Libraries`, `Modular-Monolith-Building-Blocks` | `LinkStack-Architecture` |
| Folder layout for a feature or use case | `Vertical-Slices` | `LinkStack-Constitution` (feature folders, naming) |
| Command or query handler, MediatR pipeline | `CQRS-MediatR` | `CQRS` |
| Query predicates, read-side filtering | `Specification` | `CQRS` |
| Domain primitive, identifier, validated type | `Value-Objects` | `LinkStack-Value-Objects` |
| Domain invariant or validation rule | `Business-Rule-Engine` | `Business-Rules` |
| Error responses, exceptions, HTTP status codes | `Typed-Exceptions-Problem-Details` | `Error-Handling` |
| Current user, claims, tenant id in handlers | `Current-User-Service` | `Authentication` |
| Multi-tenancy, soft delete, automatic filters | `EF-Core-Global-Query-Filters` | `Tenant-Isolation` |
| Publishing integration events, writing consumers | `Transactional-Outbox` | `Outbox`, plus the consuming module (e.g. `Analytics`) |
| Schema change or migration on a live system | `Expand-Contract` | `Blue-Green-Deployment-Expand-Contract`, `AI-Migration-Review` |
| Zero-downtime deploy, traffic cutover | `Blue-Green-Deployment` | `Blue-Green-Deployment-Architecture`, `Pipelines` |
| An LLM or AI check in CI | `AI-CI-Gate` | `AI-Migration-Review` |
| **Tests for any of the above** | `Test-Strategy`, then `Integration-Tests`, `Unit-Tests`, `Architecture-Tests`, `Testcontainers`, `BDD-Tests` | `LinkStack-Constitution` Principle V |

If no row matches, scan `docs/patterns/Patterns.index.md` for anything close before concluding no pattern applies.

### 3. Read and check trust

Read each selected note. Check its frontmatter:
- `status: outdated` or `draft`: say so. Verify the point in this repo's code before relying on it.
- `confidence: low`: treat it as a hint and verify in code.
- An old `updated` date on a project note: compare it with the code you're about to touch.

### 4. Apply

**Precedence**, highest first:
1. this repo's binding rules (constitution, `CLAUDE.md`)
2. vault project notes
3. vault generic notes

- Follow each note's **Rules**, **When to Use** and **When NOT to Use** sections. Choosing *not* to apply a pattern is a valid outcome. Say why.
- Match the existing code. If the code and a note disagree, keep to the code for consistency, **report the drift**, and don't silently "fix" the code toward the note unless asked.
- Use a note's implementation as a shape to adapt to the repo, not as text to paste. Never copy note text into the repo.

### 5. Report

End design or implementation work with one short line:

> Patterns applied: `Transactional-Outbox` (publish before `SaveChangesAsync`), `Outbox` (LinkStack's MassTransit setup). Not applied: `Specification`, because the query is a single lookup by id.

## Feeding the Vault

From a repo other than mind-vault, **never edit vault notes directly.** Instead:
- **Drift** (a note is wrong or outdated compared with the code), or
- **A new reusable solution** with no pattern yet:

write a capture to `D:\git\mind-vault\docs\inbox\<YYYY-MM-DD>-<slug>.md` in the format described in `docs/inbox/Inbox.index.md`: `type: Capture`, `status: draft`, `confidence: low`, a real `source` (repo plus file or PR), and the raw finding. The vault's daily routine triages it through a PR. Mention the capture in your report.
